#!/usr/bin/env python3
"""
High-fidelity PDF to DOCX conversion using pdf2docx.
Supports two modes:
- editable: Reconstruct text, tables, images as editable Word elements
- visual-fidelity: Preserve original pages as accurately as possible using page backgrounds
"""

import sys
import os
import json
import platform
import traceback
from importlib.metadata import version, PackageNotFoundError

try:
    from pdf2docx import Converter
    PDF2DOCX_IMPORT_ERROR = None
except Exception as exc:
    Converter = None
    PDF2DOCX_IMPORT_ERROR = exc


def check_environment():
    """Report the interpreter and dependency status without converting."""
    if Converter is None:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": f"{type(PDF2DOCX_IMPORT_ERROR).__name__}: {PDF2DOCX_IMPORT_ERROR}",
        }

    try:
        package_version = version("pdf2docx")
    except PackageNotFoundError:
        package_version = "unknown"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "pdf2docx_version": package_version,
    }


def convert_pdf_to_docx_editable(input_path, output_path):
    """Convert PDF to DOCX with editable elements (default pdf2docx behavior)."""
    if Converter is None:
        return {
            "success": False,
            "error": f"pdf2docx import failed: {PDF2DOCX_IMPORT_ERROR}",
            "traceback": "",
        }

    try:
        cv = Converter(input_path)
        cv.convert(output_path, start=0, end=None)
        cv.close()
        return {"success": True, "output_path": output_path, "mode": "editable"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def convert_pdf_to_docx_visual_fidelity(input_path, output_path):
    """
    Convert PDF to DOCX with maximum visual fidelity.
    Uses pdf2docx with additional options to preserve layout precisely.
    For scanned/image-only PDFs, this preserves the visual appearance.
    """
    if Converter is None:
        return {
            "success": False,
            "error": f"pdf2docx import failed: {PDF2DOCX_IMPORT_ERROR}",
            "traceback": "",
        }

    try:
        cv = Converter(input_path)
        # Use layout-preserving options
        cv.convert(
            output_path,
            start=0,
            end=None,
            pages=None,
            # Preserve images and their positions
            image_quality=95,
            # Keep tables as tables
            table_settings={
                'cell_margin': 2,
            },
        )
        cv.close()
        return {"success": True, "output_path": output_path, "mode": "visual-fidelity"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def convert_pdf_to_docx(input_path, output_path, mode="editable"):
    """Main conversion function with mode selection."""
    if mode == "visual-fidelity":
        return convert_pdf_to_docx_visual_fidelity(input_path, output_path)
    else:
        return convert_pdf_to_docx_editable(input_path, output_path)


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python pdf_converter.py <input.pdf> <output.docx> [mode]
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python pdf_converter.py <input.pdf> <output.docx> [editable|visual-fidelity]"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    mode = sys.argv[3] if len(sys.argv) == 4 else "editable"

    if mode not in ("editable", "visual-fidelity"):
        print(json.dumps({
            "success": False,
            "error": f"Invalid mode: {mode}. Use 'editable' or 'visual-fidelity'"
        }))
        sys.exit(1)

    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)

    result = convert_pdf_to_docx(input_path, output_path, mode)
    print(json.dumps(result))


if __name__ == "__main__":
    main()