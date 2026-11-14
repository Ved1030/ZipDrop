#!/usr/bin/env python3
"""
PDF to PDF/A conversion using Ghostscript.

This script converts PDF documents to PDF/A (archival format) compliance.
Supports PDF/A-2b as the target conformance level.

Requirements:
- Ghostscript must be installed system-wide
- On Render/Nixpacks: add 'ghostscript' to nixPkgs

Note: veraPDF validation would be ideal but requires Java and is not included
in the standard Python environment. The conversion uses Ghostscript's built-in
PDF/A generation capabilities.
"""

import sys
import os
import json
import platform
import traceback
import subprocess
import shutil
from importlib.metadata import version, PackageNotFoundError


def check_environment():
    """Report the interpreter and dependency status without converting."""
    errors = []
    warnings = []

    # Check for Ghostscript
    gs_cmd = "gswin64c" if platform.system() == "Windows" else "gs"
    gs_path = shutil.which(gs_cmd)

    if not gs_path:
        errors.append(f"Ghostscript not found. Install Ghostscript (gs) for PDF/A conversion.")
    else:
        try:
            result = subprocess.run([gs_path, "--version"], capture_output=True, text=True, timeout=10)
            gs_version = result.stdout.strip() if result.returncode == 0 else "unknown"
        except Exception:
            gs_version = "unknown"

    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
            "warnings": warnings,
        }

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "ghostscript_path": gs_path,
        "ghostscript_version": gs_version,
        "warnings": warnings,
    }


def get_gs_command():
    """Get the Ghostscript command for the current platform."""
    if platform.system() == "Windows":
        return "gswin64c"
    return "gs"


def validate_pdfa(output_path):
    """
    Basic validation of PDF/A output.
    Checks for PDF/A identifier in the file.
    """
    try:
        with open(output_path, "rb") as f:
            content = f.read(8192)  # Read first 8KB

        # Check for PDF/A identifier in XMP metadata or catalog
        content_str = content.decode("latin1", errors="ignore")

        # PDF/A-1b: /Subtype /XML /Type /Metadata with PDF/A schema
        # PDF/A-2b/3b: Similar but with different namespace
        has_pdfa_marker = (
            "pdfaid:part" in content_str or
            "pdfa:part" in content_str or
            "PDF/A" in content_str or
            "pdfaExtension" in content_str
        )

        # Also check for basic PDF structure
        is_pdf = content.startswith(b"%PDF-")
        has_eof = b"%%EOF" in content[-1024:]

        return {
            "is_pdf": is_pdf,
            "has_eof": has_eof,
            "has_pdfa_marker": has_pdfa_marker,
            "valid_structure": is_pdf and has_eof,
        }
    except Exception as e:
        return {
            "is_pdf": False,
            "has_eof": False,
            "has_pdfa_marker": False,
            "valid_structure": False,
            "error": str(e),
        }


def convert_pdf_to_pdfa(input_path, output_path, conformance="pdfa-2b", icc_profile=None):
    """
    Convert PDF to PDF/A using Ghostscript.

    Args:
        input_path: Path to input PDF
        output_path: Path to output PDF/A file
        conformance: PDF/A conformance level (pdfa-1b, pdfa-2b, pdfa-3b)
        icc_profile: Optional path to ICC profile for color management

    Returns:
        Dict with success status and details
    """
    gs_cmd = get_gs_command()

    # Check Ghostscript availability
    if not shutil.which(gs_cmd):
        return {
            "success": False,
            "error": "Ghostscript not installed. Please install Ghostscript for PDF/A conversion.",
            "code": "MISSING_DEPENDENCY",
            "traceback": "",
        }

    # Validate conformance level
    valid_conformance = ["pdfa-1b", "pdfa-2b", "pdfa-3b"]
    if conformance not in valid_conformance:
        conformance = "pdfa-2b"  # Default

    # Prepare Ghostscript command
    # Reference: https://www.ghostscript.com/doc/current/Ps2pdf.htm#PDFA
    args = [
        gs_cmd,
        "-dPDFA",
        "-dBATCH",
        "-dNOPAUSE",
        "-dNOOUTERSAVE",
        "-dSAFER",
        f"-sProcessColorModel=DeviceRGB",
        f"-sDEVICE=pdfwrite",
        f"-sPDFACompatibilityPolicy=1",
        f"-sOutputFile={output_path}",
    ]

    # Add conformance-specific options
    if conformance == "pdfa-1b":
        args.extend([
            "-dPDFACompatibilityPolicy=1",
        ])
    elif conformance in ("pdfa-2b", "pdfa-3b"):
        args.extend([
            "-dPDFACompatibilityPolicy=1",
        ])

    # Add ICC profile if provided
    if icc_profile and os.path.exists(icc_profile):
        args.append(f"-sOutputICCProfile={icc_profile}")
    else:
        # Use sRGB as default for PDF/A-2b/3b
        if conformance in ("pdfa-2b", "pdfa-3b"):
            # Ghostscript includes a default sRGB profile
            args.append("-sICCProfile=default_rgb.icc")

    # Add input file
    args.append(input_path)

    try:
        # Run Ghostscript
        result = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
        )

        if result.returncode != 0:
            error_msg = result.stderr or result.stdout or "Ghostscript failed"
            return {
                "success": False,
                "error": f"Ghostscript conversion failed: {error_msg}",
                "code": "CONVERSION_FAILED",
                "traceback": "",
            }

        # Validate output
        if not os.path.exists(output_path):
            return {
                "success": False,
                "error": "Output file was not created",
                "code": "CONVERSION_FAILED",
                "traceback": "",
            }

        # Basic validation
        validation = validate_pdfa(output_path)

        if not validation["valid_structure"]:
            return {
                "success": False,
                "error": "Generated file is not a valid PDF",
                "code": "CONVERSION_FAILED",
                "details": validation,
                "traceback": "",
            }

        return {
            "success": True,
            "output_path": output_path,
            "conformance": conformance,
            "validation": validation,
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "PDF/A conversion timed out (5 minutes)",
            "code": "TIMEOUT",
            "traceback": "",
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Conversion error: {str(e)}",
            "code": "CONVERSION_FAILED",
            "traceback": traceback.format_exc(),
        }


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python pdf_to_pdfa.py <input.pdf> <output.pdf> [conformance]
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python pdf_to_pdfa.py <input.pdf> <output.pdf> [pdfa-1b|pdfa-2b|pdfa-3b]"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    conformance = sys.argv[3].lower() if len(sys.argv) >= 4 else "pdfa-2b"

    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)

    result = convert_pdf_to_pdfa(input_path, output_path, conformance)
    print(json.dumps(result))


if __name__ == "__main__":
    main()