"""Convert DOCX fixtures with headless LibreOffice (baseline). Runs in venv-harness."""

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import traceback
from pathlib import Path

WINDOWS = os.name == "nt"


def find_soffice():
    override = os.environ.get("LIBREOFFICE_PATH")
    candidates = [override] if override else []
    if WINDOWS:
        program_files = os.environ.get("ProgramFiles", r"C:\Program Files")
        program_files_x86 = os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")
        candidates += [
            Path(program_files) / "LibreOffice" / "program" / "soffice.com",
            Path(program_files_x86) / "LibreOffice" / "program" / "soffice.com",
        ]
    else:
        candidates += ["/usr/bin/soffice", "/usr/local/bin/soffice"]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return str(candidate)
    return shutil.which("soffice") or shutil.which("libreoffice")


def convert_one(soffice, source, target):
    source = Path(source).resolve()
    target = Path(target).resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="lo-eval-") as work:
        work_path = Path(work)
        profile = work_path / "profile"
        profile.mkdir()
        outdir = work_path / "out"
        outdir.mkdir()
        profile_url = profile.as_uri()
        command = [
            soffice,
            "--headless",
            "--nologo",
            "--nodefault",
            "--norestore",
            "--nolockcheck",
            f"-env:UserInstallation={profile_url}",
            "--convert-to",
            "pdf",
            "--outdir",
            str(outdir),
            str(source),
        ]
        started = time.perf_counter()
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=300,
        )
        elapsed = time.perf_counter() - started
        produced = outdir / f"{source.stem}.pdf"
        if completed.returncode != 0 or not produced.is_file():
            return {
                "ok": False,
                "seconds": round(elapsed, 4),
                "error": f"exit {completed.returncode}",
                "stdout": completed.stdout[-2000:],
                "stderr": completed.stderr[-2000:],
            }
        shutil.copyfile(produced, target)
        return {
            "ok": True,
            "seconds": round(elapsed, 4),
            "pages": None,
            "warnings": [],
            "bytes": target.stat().st_size,
            "stdout": completed.stdout.strip()[-1000:],
        }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input")
    parser.add_argument("--output")
    parser.add_argument("--batch", help="JSON list of {input, output} pairs")
    args = parser.parse_args()

    soffice = find_soffice()
    payload = {"engine": "libreoffice", "executable": soffice}
    if not soffice:
        payload.update({"ok": False, "error": "LibreOffice executable not found"})
        print("RESULT_JSON:" + json.dumps(payload))
        return 1

    try:
        if args.batch:
            jobs = json.loads(Path(args.batch).read_text(encoding="utf-8"))
            entries = []
            batch_started = time.perf_counter()
            for job in jobs:
                entry = {"input": job["input"], "output": job["output"]}
                try:
                    entry.update(convert_one(soffice, job["input"], job["output"]))
                except Exception as exc:
                    entry.update({"ok": False, "error": f"{type(exc).__name__}: {exc}"})
                entries.append(entry)
            payload.update(
                {
                    "batch": True,
                    "seconds": round(time.perf_counter() - batch_started, 4),
                    "entries": entries,
                    "ok": all(e.get("ok") for e in entries),
                }
            )
        else:
            payload.update({"batch": False, "input": args.input, "output": args.output})
            try:
                payload.update(convert_one(soffice, args.input, args.output))
            except Exception as exc:
                payload.update(
                    {
                        "ok": False,
                        "error": f"{type(exc).__name__}: {exc}",
                        "traceback": traceback.format_exc(),
                    }
                )
    except Exception as exc:
        payload.update(
            {"ok": False, "error": f"{type(exc).__name__}: {exc}", "traceback": traceback.format_exc()}
        )

    print("RESULT_JSON:" + json.dumps(payload, default=str))
    return 0 if payload.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main())
