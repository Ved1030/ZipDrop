#!/usr/bin/env python3
"""
RTF to Word (DOCX) conversion using LibreOffice headless.
Uses the existing LibreOffice integration for high-fidelity conversion.
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

    # Check for LibreOffice
    if platform.system() == "Windows":
        lo_cmd = "soffice.exe"
        lo_paths = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        ]
    else:
        lo_cmd = "soffice"
        lo_paths = [
            "/usr/bin/soffice",
            "/usr/bin/libreoffice",
            "/usr/local/bin/soffice",
            "/snap/bin/libreoffice",
            "/opt/libreoffice/program/soffice",
        ]
    
    lo_found = False
    lo_version = None
    
    # Check PATH first
    lo_path = shutil.which(lo_cmd)
    if lo_path:
        lo_found = True
    else:
        for path in lo_paths:
            if os.path.exists(path) and os.access(path, os.X_OK):
                lo_path = path
                lo_found = True
                break
    
    if not lo_found:
        errors.append("LibreOffice not found. Install LibreOffice for RTF to DOCX conversion.")
    else:
        # Get version
        try:
            result = subprocess.run([lo_path, "--version"], capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                lo_version = result.stdout.strip()
        except Exception:
            pass

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
        "libreoffice_path": lo_path,
        "libreoffice_version": lo_version,
        "warnings": warnings,
    }


def convert_rtf_to_docx(input_path, output_path, options=None):
    """
    Main conversion function: convert RTF to DOCX using LibreOffice.
    """
    if options is None:
        options = {}

    # Find LibreOffice
    if platform.system() == "Windows":
        lo_cmd = "soffice.exe"
        lo_paths = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        ]
    else:
        lo_cmd = "soffice"
        lo_paths = [
            "/usr/bin/soffice",
            "/usr/bin/libreoffice",
            "/usr/local/bin/soffice",
            "/snap/bin/libreoffice",
            "/opt/libreoffice/program/soffice",
        ]
    
    lo_path = shutil.which(lo_cmd)
    if not lo_path:
        for path in lo_paths:
            if os.path.exists(path) and os.access(path, os.X_OK):
                lo_path = path
                break
    
    if not lo_path:
        return {
            "success": False,
            "error": "LibreOffice not found. Please install LibreOffice for RTF to DOCX conversion.",
            "code": "MISSING_DEPENDENCY",
            "traceback": "",
        }

    try:
        # Create temp directory for conversion
        import tempfile
        temp_dir = tempfile.mkdtemp(prefix="rtf2docx_")
        
        # Copy input file to temp dir with .rtf extension
        input_filename = os.path.basename(input_path)
        temp_input = os.path.join(temp_dir, input_filename)
        shutil.copy2(input_path, temp_input)
        
        # LibreOffice conversion command
        # --headless: run without UI
        # --convert-to docx: output format
        # --outdir: output directory
        cmd = [
            lo_path,
            "--headless",
            "--nologo",
            "--nodefault",
            "--norestore",
            "--nolockcheck",
            "--convert-to",
            "docx",
            "--outdir",
            temp_dir,
            temp_input,
        ]
        
        # Run conversion with timeout
        timeout = int(options.get('timeout', 120000)) / 1000 if options else 120
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        
        if result.returncode != 0:
            # Clean up temp dir
            shutil.rmtree(temp_dir, ignore_errors=True)
            return {
                "success": False,
                "error": f"LibreOffice conversion failed: {result.stderr}",
                "code": "CONVERSION_FAILED",
                "traceback": "",
            }
        
        # Find output file
        base_name = os.path.splitext(input_filename)[0]
        output_filename = f"{base_name}.docx"
        temp_output = os.path.join(temp_dir, output_filename)
        
        if not os.path.exists(temp_output):
            # Try to find any .docx file in temp dir
            for f in os.listdir(temp_dir):
                if f.endswith('.docx'):
                    temp_output = os.path.join(temp_dir, f)
                    break
        
        if not os.path.exists(temp_output):
            shutil.rmtree(temp_dir, ignore_errors=True)
            return {
                "success": False,
                "error": "Conversion output not found",
                "code": "CONVERSION_FAILED",
                "traceback": "",
            }
        
        # Copy to final destination
        shutil.copy2(temp_output, output_path)
        
        # Clean up
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        # Verify output
        if not os.path.exists(output_path):
            return {"success": False, "error": "Output file was not created", "traceback": ""}
        
        file_size = os.path.getsize(output_path)
        if file_size == 0:
            return {"success": False, "error": "Output file is empty", "traceback": ""}
        
        return {
            "success": True,
            "output_path": output_path,
            "file_size": file_size,
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": f"Conversion timed out after {timeout} seconds",
            "code": "TIMEOUT",
            "traceback": "",
        }
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python rtf_to_docx.py <input.rtf> <output.docx> [options_json]
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python rtf_to_docx.py <input.rtf> <output.docx> [options_json]"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    options = {}

    if len(sys.argv) == 4:
        try:
            options = json.loads(sys.argv[3])
        except json.JSONDecodeError:
            print(json.dumps({"success": False, "error": "Invalid options JSON"}))
            sys.exit(1)

    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)

    result = convert_rtf_to_docx(input_path, output_path, options)
    print(json.dumps(result))


if __name__ == "__main__":
    main()