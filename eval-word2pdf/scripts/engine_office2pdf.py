"""Convert DOCX fixtures with office2pdf-python. Runs inside venv-office2pdf."""

import argparse
import json
import sys
import time
import traceback
from pathlib import Path

from office2pdf import ConvertOptions, convert_path


def convert_one(source, target):
    started = time.perf_counter()
    result = convert_path(source, ConvertOptions(include_warnings=True))
    elapsed = time.perf_counter() - started
    Path(target).write_bytes(result.pdf)
    metrics = result.metrics
    return {
        "ok": True,
        "seconds": round(elapsed, 4),
        "pages": metrics.page_count if metrics else None,
        "warnings": list(result.warning_messages),
        "bytes": len(result.pdf),
        "native_total_seconds": round(metrics.total_duration, 4) if metrics else None,
        "native_parse_seconds": round(metrics.parse_duration, 4) if metrics else None,
        "native_codegen_seconds": round(metrics.codegen_duration, 4) if metrics else None,
        "native_compile_seconds": round(metrics.compile_duration, 4) if metrics else None,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input")
    parser.add_argument("--output")
    parser.add_argument("--batch", help="JSON list of {input, output} pairs")
    args = parser.parse_args()

    payload = {"engine": "office2pdf"}
    try:
        if args.batch:
            jobs = json.loads(Path(args.batch).read_text(encoding="utf-8"))
            entries = []
            batch_started = time.perf_counter()
            for job in jobs:
                entry = {"input": job["input"], "output": job["output"]}
                try:
                    entry.update(convert_one(job["input"], job["output"]))
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
                payload.update(convert_one(args.input, args.output))
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
