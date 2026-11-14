#!/usr/bin/env python3
"""
PDF to Text (TXT) conversion using PyMuPDF (fitz) for text extraction.

Features:
- Extract text from all pages
- Preserve reading order
- Preserve paragraph breaks
- Preserve page separation with clear markers
- Support Unicode (including Indian languages)
- Detect scanned PDFs (no extractable text)
"""

import sys
import os
import json
import platform
import traceback
from importlib.metadata import version, PackageNotFoundError

try:
    import fitz  # PyMuPDF
    PYMUPDF_IMPORT_ERROR = None
except Exception as exc:
    fitz = None
    PYMUPDF_IMPORT_ERROR = exc


def check_environment():
    """Report the interpreter and dependency status without converting."""
    errors = []

    if fitz is None:
        errors.append(f"PyMuPDF: {type(PYMUPDF_IMPORT_ERROR).__name__}: {PYMUPDF_IMPORT_ERROR}")

    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
        }

    try:
        pymupdf_version = version("pymupdf")
    except PackageNotFoundError:
        pymupdf_version = "unknown"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "pymupdf_version": pymupdf_version,
    }


def extract_text_from_page(page, page_num, include_page_marker=True):
    """
    Extract text from a single page with proper reading order.
    Returns the extracted text.
    """
    # Use "dict" format to get detailed text blocks with positions
    blocks = page.get_text("dict")["blocks"]

    # Sort blocks by vertical position (top to bottom), then horizontal (left to right)
    # This preserves reading order for multi-column layouts
    text_blocks = []
    for block in blocks:
        if block["type"] == 0:  # Text block
            bbox = block["bbox"]
            # Sort key: (y0, x0) - top to bottom, left to right
            text_blocks.append((bbox[1], bbox[0], block))

    text_blocks.sort(key=lambda x: (x[0], x[1]))

    page_text = []

    if include_page_marker:
        page_text.append(f"--- Page {page_num} ---\n")

    for _, _, block in text_blocks:
        block_text = []
        for line in block["lines"]:
            line_text = []
            for span in line["spans"]:
                text = span["text"]
                if text:
                    line_text.append(text)
            if line_text:
                block_text.append("".join(line_text))

        if block_text:
            # Join lines in block with newlines (preserve paragraph structure)
            paragraph = "\n".join(block_text)
            page_text.append(paragraph)

    return "\n\n".join(page_text)


def extract_text_simple(page):
    """
    Simpler text extraction using PyMuPDF's built-in text extraction.
    Less control over layout but more reliable for simple PDFs.
    """
    return page.get_text("text")


def has_extractable_text(page):
    """Check if page has selectable/extractable text."""
    text = page.get_text("text")
    return text is not None and len(text.strip()) > 0


def convert_pdf_to_text(input_path, output_path, page_separator="--- Page {page_num} ---"):
    """
    Main conversion function: extract text from PDF and write to TXT.
    """
    if fitz is None:
        return {
            "success": False,
            "error": f"PyMuPDF import failed: {PYMUPDF_IMPORT_ERROR}",
            "traceback": "",
        }

    try:
        doc = fitz.open(input_path)
        total_pages = doc.page_count

        if total_pages == 0:
            doc.close()
            return {"success": False, "error": "PDF has no pages", "traceback": ""}

        all_text = []
        scanned_pages = []
        pages_with_text = 0

        for page_num in range(1, total_pages + 1):
            page = doc[page_num - 1]

            # Check if page has extractable text
            if not has_extractable_text(page):
                scanned_pages.append(page_num)
                # Still add page marker but indicate scanned
                all_text.append(page_separator.format(page_num=page_num))
                all_text.append("[No extractable text found - this page may be scanned or image-based]")
                all_text.append("")  # Empty line
                continue

            pages_with_text += 1

            # Extract text with layout preservation
            page_text = extract_text_from_page(page, page_num, include_page_marker=True)
            if page_text.strip():
                all_text.append(page_text)

        doc.close()

        # Join all pages with double newlines for clear separation
        full_text = "\n\n".join(all_text)

        # Write to file
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(full_text)

        # Prepare result
        result = {
            "success": True,
            "output_path": output_path,
            "total_pages": total_pages,
            "pages_with_text": pages_with_text,
            "scanned_pages": scanned_pages,
            "scanned_page_count": len(scanned_pages),
        }

        # Add warning if scanned pages detected
        if scanned_pages:
            result["warning"] = f"PDF contains {len(scanned_pages)} page(s) with no extractable text (pages: {', '.join(map(str, scanned_pages))}). These pages may be scanned and require OCR."

        return result

    except fitz.FileDataError as e:
        return {"success": False, "error": f"Corrupted or invalid PDF: {str(e)}", "traceback": traceback.format_exc()}
    except Exception as e:
        error_msg = str(e)
        if "encrypted" in error_msg.lower() or "permission" in error_msg.lower() or "password" in error_msg.lower():
            return {"success": False, "error": f"PDF is password protected or encrypted: {error_msg}", "traceback": traceback.format_exc()}
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python pdf_to_text.py <input.pdf> <output.txt>
    if len(sys.argv) != 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: python pdf_to_text.py <input.pdf> <output.txt>"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)

    result = convert_pdf_to_text(input_path, output_path)
    print(json.dumps(result))


if __name__ == "__main__":
    main()