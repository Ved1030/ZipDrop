#!/usr/bin/env python3
"""
High-fidelity PDF to DOCX conversion using pdf2docx.
Called from Node.js backend via subprocess.
"""

import sys
import os
import json
import traceback
from pdf2docx import Converter

def convert_pdf_to_docx(input_path, output_path):
    """Convert PDF to DOCX with high fidelity layout preservation."""
    try:
        cv = Converter(input_path)
        cv.convert(output_path, start=0, end=None)
        cv.close()
        return {"success": True, "output_path": output_path}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}

def main():
    if len(sys.argv) != 3:
        print(json.dumps({"success": False, "error": "Usage: python convert.py <input.pdf> <output.docx>"}))
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)
    
    result = convert_pdf_to_docx(input_path, output_path)
    print(json.dumps(result))

if __name__ == "__main__":
    main()