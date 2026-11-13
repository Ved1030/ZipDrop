"""Convert DOCX fixtures with word2pdf. Runs inside venv-word2pdf."""

import argparse
import json
import sys
import time
import traceback
from pathlib import Path

import word2pdf


def convert_one(converter, source, target):
    started = time.perf_counter()
    result = word2pdf.convert(source, target) if converter is None else converter.convert(source, target)
    elapsed = time.perf_counter() - started
    warnings = [str(w) for w in getattr(result, "warnings", []) or []]
    return {
        "ok": True,
        "seconds": round(elapsed, 4),
        "pages": getattr(result, "pages", None),
        "warnings": warnings,
        "missing_fonts": [str(f) for f in getattr(result, "missing_fonts", []) or []],
        "bytes": Path(target).stat().st_size,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input")
    parser.add_argument("--output")
    parser.add_argument("--batch", help="JSON list of {input, output} pairs; reuses one Converter")
    args = parser.parse_args()

    payload = {"engine": "word2pdf", "version": getattr(word2pdf, "__version__", "unknown")}
    try:
        if args.batch:
            jobs = json.loads(Path(args.batch).read_text(encoding="utf-8"))
            converter = word2pdf.Converter()
            entries = []
            batch_started = time.perf_counter()
            for job in jobs:
                entry = {"input": job["input"], "output": job["output"]}
                try:
                    entry.update(convert_one(converter, job["input"], job["output"]))
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
                payload.update(convert_one(None, args.input, args.output))
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
