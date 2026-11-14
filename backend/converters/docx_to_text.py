#!/usr/bin/env python3
"""
DOCX to Text conversion using python-docx.
Extracts text from Word documents preserving logical structure.
"""

import sys
import os
import json
import platform
import traceback
from importlib.metadata import version, PackageNotFoundError

try:
    from docx import Document
    from docx.oxml.table import CT_Tbl
    from docx.oxml.text.paragraph import CT_P
    from docx.table import Table
    from docx.text.paragraph import Paragraph
    PYTHON_DOCX_IMPORT_ERROR = None
except Exception as exc:
    Document = None
    PYTHON_DOCX_IMPORT_ERROR = exc


def check_environment():
    """Report the interpreter and dependency status without converting."""
    errors = []

    if Document is None:
        errors.append(f"python-docx: {type(PYTHON_DOCX_IMPORT_ERROR).__name__}: {PYTHON_DOCX_IMPORT_ERROR}")

    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
        }

    try:
        docx_version = version("python-docx")
    except PackageNotFoundError:
        docx_version = "unknown"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "python_docx_version": docx_version,
    }


def extract_text_from_element(element):
    """Extract text from a paragraph or table element."""
    if isinstance(element, Paragraph):
        text = element.text
        if text.strip():
            # Check if it's a heading
            if element.style.name.startswith('Heading'):
                return f"\n{'#' * int(element.style.name[-1]) if element.style.name[-1].isdigit() else 1} {text}\n"
            return text
        return ""
    elif isinstance(element, Table):
        return extract_table_text(element)
    return ""


def extract_table_text(table):
    """Extract text from a table preserving row/column structure."""
    rows_text = []
    for row in table.rows:
        cells_text = []
        for cell in row.cells:
            cell_text = cell.text.replace('\n', ' ').strip()
            cells_text.append(cell_text)
        rows_text.append('\t'.join(cells_text))
    return '\n'.join(rows_text) + '\n'


def convert_docx_to_text(input_path, output_path):
    """
    Main conversion function: extract text from DOCX and write to TXT.
    """
    if Document is None:
        return {
            "success": False,
            "error": f"python-docx import failed: {PYTHON_DOCX_IMPORT_ERROR}",
            "traceback": "",
        }

    try:
        doc = Document(input_path)
        
        all_text = []
        
        # Extract text from document body
        for element in doc.element.body:
            if isinstance(element, CT_P):
                para = Paragraph(element, doc)
                text = extract_text_from_element(para)
                if text:
                    all_text.append(text)
            elif isinstance(element, CT_Tbl):
                table = Table(element, doc)
                text = extract_text_from_element(table)
                if text:
                    all_text.append(text)
        
        # Extract headers and footers
        for section in doc.sections:
            for header in [section.header, section.first_page_header, section.even_page_header]:
                if header:
                    for para in header.paragraphs:
                        text = para.text.strip()
                        if text:
                            all_text.append(f"[Header] {text}")
            
            for footer in [section.footer, section.first_page_footer, section.even_page_footer]:
                if footer:
                    for para in footer.paragraphs:
                        text = para.text.strip()
                        if text:
                            all_text.append(f"[Footer] {text}")
        
        # Write to output file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(filter(None, all_text)))
        
        return {
            "success": True,
            "output_path": output_path,
            "paragraph_count": len(doc.paragraphs),
            "table_count": len(doc.tables),
        }

    except Exception as e:
        error_msg = str(e)
        if "encrypted" in error_msg.lower() or "password" in error_msg.lower():
            return {"success": False, "error": f"Document is password protected: {error_msg}", "traceback": traceback.format_exc()}
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python docx_to_text.py <input.docx> <output.txt>
    if len(sys.argv) != 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: python docx_to_text.py <input.docx> <output.txt>"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)

    result = convert_docx_to_text(input_path, output_path)
    print(json.dumps(result))


if __name__ == "__main__":
    main()