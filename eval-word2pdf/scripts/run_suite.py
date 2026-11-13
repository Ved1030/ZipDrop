"""Orchestrate all three engines, measuring wall time, peak memory and concurrency."""

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import psutil

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures"
RESULTS = ROOT / "results"
OUTPUTS = ROOT / "outputs"
CACHE = ROOT / "cache" / "word2pdf-fonts"

HARNESS_PYTHON = ROOT / "venv-harness" / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
ENGINES = {
    "word2pdf": {
        "python": ROOT / "venv-word2pdf" / ("Scripts/python.exe" if os.name == "nt" else "bin/python"),
        "script": ROOT / "scripts" / "engine_word2pdf.py",
    },
    "office2pdf": {
        "python": ROOT / "venv-office2pdf" / ("Scripts/python.exe" if os.name == "nt" else "bin/python"),
        "script": ROOT / "scripts" / "engine_office2pdf.py",
    },
    "libreoffice": {
        "python": HARNESS_PYTHON,
        "script": ROOT / "scripts" / "engine_libreoffice.py",
    },
}


def process_tree(pid):
    try:
        parent = psutil.Process(pid)
    except psutil.Error:
        return []
    try:
        return [parent] + parent.children(recursive=True)
    except psutil.Error:
        return [parent]


def tree_memory(pid):
    total_rss = 0
    peak_wset = 0
    for proc in process_tree(pid):
        try:
            info = proc.memory_info()
        except psutil.Error:
            continue
        total_rss += info.rss
        peak_wset = max(peak_wset, getattr(info, "peak_wset", info.rss))
    return total_rss, peak_wset


def run_measured(command, env, timeout=300):
    started = time.perf_counter()
    # Temp files, not pipes: Windows anonymous pipes are ~4 KB and large
    # RESULT_JSON payloads would block the child before it can exit.
    with tempfile.TemporaryFile(mode="w+", encoding="utf-8", errors="replace") as out, tempfile.TemporaryFile(
        mode="w+", encoding="utf-8", errors="replace"
    ) as err:
        process = subprocess.Popen(command, stdout=out, stderr=err, env=env)
        peak_rss = 0
        peak_wset = 0
        timed_out = False
        while process.poll() is None:
            rss, wset = tree_memory(process.pid)
            peak_rss = max(peak_rss, rss)
            peak_wset = max(peak_wset, wset)
            if time.perf_counter() - started > timeout:
                timed_out = True
                for proc in process_tree(process.pid):
                    try:
                        proc.kill()
                    except psutil.Error:
                        pass
                break
            time.sleep(0.02)
        process.wait()
        out.seek(0)
        err.seek(0)
        stdout = out.read()
        stderr = err.read()
    wall = time.perf_counter() - started
    return {
        "returncode": process.returncode,
        "wall_seconds": round(wall, 4),
        "peak_rss_mb": round(peak_rss / (1024 * 1024), 1),
        "peak_wset_mb": round(peak_wset / (1024 * 1024), 1),
        "stdout": stdout,
        "stderr": stderr,
        "timed_out": timed_out,
    }


def parse_result(stdout):
    for line in reversed(stdout.splitlines()):
        if line.startswith("RESULT_JSON:"):
            try:
                return json.loads(line[len("RESULT_JSON:"):])
            except json.JSONDecodeError:
                continue
    return None


def engine_env(engine, cache_dir=None):
    env = dict(os.environ)
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUNBUFFERED"] = "1"
    if engine == "word2pdf" and cache_dir is not None:
        env["XDG_CACHE_HOME"] = str(cache_dir)
    return env


def convert(engine, source, target, cache_dir=None, timeout=300):
    spec = ENGINES[engine]
    command = [
        str(spec["python"]),
        str(spec["script"]),
        "--input",
        str(source),
        "--output",
        str(target),
    ]
    measured = run_measured(command, engine_env(engine, cache_dir), timeout=timeout)
    parsed = parse_result(measured["stdout"]) or {}
    return {
        "engine": engine,
        "input": str(source),
        "output": str(target),
        "exit_code": measured["returncode"],
        "wall_seconds": measured["wall_seconds"],
        "peak_rss_mb": measured["peak_rss_mb"],
        "peak_wset_mb": measured["peak_wset_mb"],
        "timed_out": measured["timed_out"],
        "stderr_tail": measured["stderr"].strip()[-1500:],
        **(parsed or {"ok": False, "error": "no RESULT_JSON emitted"}),
    }


def convert_batch(engine, jobs, cache_dir=None, timeout=900):
    spec = ENGINES[engine]
    manifest = RESULTS / f"batch-{engine}.json"
    manifest.parent.mkdir(parents=True, exist_ok=True)
    manifest.write_text(json.dumps(jobs, indent=2), encoding="utf-8")
    command = [
        str(spec["python"]),
        str(spec["script"]),
        "--batch",
        str(manifest),
    ]
    measured = run_measured(command, engine_env(engine, cache_dir), timeout=timeout)
    parsed = parse_result(measured["stdout"]) or {}
    return {
        "engine": engine,
        "exit_code": measured["returncode"],
        "wall_seconds": measured["wall_seconds"],
        "peak_rss_mb": measured["peak_rss_mb"],
        "peak_wset_mb": measured["peak_wset_mb"],
        "timed_out": measured["timed_out"],
        "stderr_tail": measured["stderr"].strip()[-1500:],
        **(parsed or {"ok": False, "error": "no RESULT_JSON emitted"}),
    }


def fixture_list(include_perf=True):
    paths = sorted(FIXTURES.glob("*.docx"))
    if not include_perf:
        paths = [p for p in paths if not p.name.startswith("14_")]
    return paths


def suite_sequential(engines):
    results = {}
    for engine in engines:
        outdir = OUTPUTS / engine
        outdir.mkdir(parents=True, exist_ok=True)
        records = []
        for fixture in fixture_list(include_perf=True):
            target = outdir / f"{fixture.stem}.pdf"
            record = convert(engine, fixture, target)
            records.append(record)
            status = "ok" if record.get("ok") else "FAIL"
            print(
                f"[{engine}] {fixture.name:26s} {status:4s} "
                f"{record['wall_seconds']:7.2f}s {record['peak_rss_mb']:7.1f} MB",
                flush=True,
            )
        results[engine] = records
    return results


def cold_measurements(engines):
    results = {}
    for engine in engines:
        outdir = OUTPUTS / engine
        outdir.mkdir(parents=True, exist_ok=True)
        records = []
        for fixture in [FIXTURES / "01_simple_text.docx", FIXTURES / "14_perf_large.docx"]:
            fresh = ROOT / "cache" / f"cold-{engine}-{fixture.stem}-{int(time.time() * 1000)}"
            fresh.mkdir(parents=True, exist_ok=True)
            record = convert(engine, fixture, outdir / f"{fixture.stem}.pdf", cache_dir=fresh)
            record["cold_cache"] = str(fresh)
            records.append(record)
            print(
                f"[{engine}] COLD {fixture.name:24s} {record['wall_seconds']:7.2f}s "
                f"{record['peak_rss_mb']:7.1f} MB",
                flush=True,
            )
        results[engine] = records
    return results


def warm_batches(engines):
    results = {}
    for engine in engines:
        jobs = [
            {"input": str(f), "output": str(OUTPUTS / engine / f"{f.stem}.pdf")}
            for f in fixture_list(include_perf=True)
        ]
        if engine == "word2pdf":
            CACHE.mkdir(parents=True, exist_ok=True)
            # Warm the font index first, then measure the steady-state batch.
            convert(engine, FIXTURES / "01_simple_text.docx", OUTPUTS / engine / "_warmup.pdf", cache_dir=CACHE)
            record = convert_batch(engine, jobs, cache_dir=CACHE)
        else:
            record = convert_batch(engine, jobs)
        results[engine] = record
        print(
            f"[{engine}] WARM BATCH {record['wall_seconds']:7.2f}s {record['peak_rss_mb']:7.1f} MB "
            f"({len(jobs)} files)",
            flush=True,
        )
    return results


def concurrency(engines, workers=4):
    fixtures = [
        FIXTURES / "02_fonts_sizes.docx",
        FIXTURES / "03_tables_merged.docx",
        FIXTURES / "04_images.docx",
        FIXTURES / "13_kitchen_sink.docx",
    ]
    results = {}
    for engine in engines:
        outdir = OUTPUTS / engine / "concurrent"
        outdir.mkdir(parents=True, exist_ok=True)
        cache_dir = CACHE if engine == "word2pdf" else None
        if engine == "word2pdf":
            CACHE.mkdir(parents=True, exist_ok=True)
            convert(engine, FIXTURES / "01_simple_text.docx", outdir / "_warmup.pdf", cache_dir=CACHE)

        started = time.perf_counter()
        peak_total = [0]

        def tracked(fixture):
            target = outdir / f"{fixture.stem}.pdf"
            spec = ENGINES[engine]
            command = [
                str(spec["python"]),
                str(spec["script"]),
                "--input",
                str(fixture),
                "--output",
                str(target),
            ]
            with tempfile.TemporaryFile(
                mode="w+", encoding="utf-8", errors="replace"
            ) as out, tempfile.TemporaryFile(
                mode="w+", encoding="utf-8", errors="replace"
            ) as err:
                process = subprocess.Popen(command, stdout=out, stderr=err, env=engine_env(engine, cache_dir))
                peak = 0
                while process.poll() is None:
                    rss, _ = tree_memory(process.pid)
                    peak = max(peak, rss)
                    peak_total[0] = max(peak_total[0], rss)
                    time.sleep(0.02)
                process.wait()
                out.seek(0)
                err.seek(0)
                stdout = out.read()
                stderr = err.read()
            parsed = parse_result(stdout) or {"ok": False}
            return {
                "fixture": fixture.name,
                "ok": parsed.get("ok", False),
                "seconds": parsed.get("seconds"),
                "peak_rss_mb": round(peak / (1024 * 1024), 1),
                "error": parsed.get("error"),
                "stderr_tail": stderr.strip()[-500:],
            }

        with ThreadPoolExecutor(max_workers=workers) as pool:
            rows = list(pool.map(tracked, fixtures))
        wall = time.perf_counter() - started
        results[engine] = {
            "workers": workers,
            "wall_seconds": round(wall, 4),
            "peak_total_rss_mb": round(peak_total[0] / (1024 * 1024), 1),
            "rows": rows,
        }
        print(
            f"[{engine}] CONCURRENT x{workers} {wall:7.2f}s total, "
            f"peak {results[engine]['peak_total_rss_mb']:.1f} MB",
            flush=True,
        )
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--engines",
        default="word2pdf,office2pdf,libreoffice",
        help="comma-separated engines",
    )
    parser.add_argument("--skip-sequential", action="store_true")
    parser.add_argument("--skip-cold", action="store_true")
    parser.add_argument("--skip-warm", action="store_true")
    parser.add_argument("--skip-concurrency", action="store_true")
    args = parser.parse_args()
    engines = [e.strip() for e in args.engines.split(",") if e.strip()]
    RESULTS.mkdir(parents=True, exist_ok=True)

    summary = {"generated_at": time.strftime("%Y-%m-%d %H:%M:%S"), "engines": {}}
    if not args.skip_sequential:
        print("== sequential cold-process suite ==", flush=True)
        summary["sequential"] = suite_sequential(engines)
    if not args.skip_cold:
        print("== cold cache measurements ==", flush=True)
        summary["cold"] = cold_measurements(engines)
    if not args.skip_warm:
        print("== warm in-process batch ==", flush=True)
        summary["warm_batch"] = warm_batches(engines)
    if not args.skip_concurrency:
        print("== concurrency ==", flush=True)
        summary["concurrency"] = concurrency(engines)

    results_file = RESULTS / "performance.json"
    existing = {}
    if results_file.exists():
        try:
            existing = json.loads(results_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            existing = {}
    existing.update(summary)
    results_file.write_text(json.dumps(existing, indent=2), encoding="utf-8")
    print(f"wrote {results_file}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
