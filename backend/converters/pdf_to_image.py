#!/usr/bin/env python3
"""
PDF to Image (JPG/PNG) conversion using PyMuPDF (fitz).
Called from Node.js backend via subprocess.
No Poppler dependency required.
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

try:
    from PIL import Image
    PIL_IMPORT_ERROR = None
except Exception as exc:
    Image = None
    PIL_IMPORT_ERROR = exc


def check_environment():
    """Report the interpreter and dependency status without converting."""
    errors = []
    
    if fitz is None:
        errors.append(f"PyMuPDF: {type(PYMUPDF_IMPORT_ERROR).__name__}: {PYMUPDF_IMPORT_ERROR}")
    
    if Image is None:
        errors.append(f"PIL: {type(PIL_IMPORT_ERROR).__name__}: {PIL_IMPORT_ERROR}")

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

    try:
        pil_version = version("pillow")
    except PackageNotFoundError:
        pil_version = "unknown"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "pymupdf_version": pymupdf_version,
        "pillow_version": pil_version,
    }


def parse_page_range(page_range, total_pages):
    """
    Parse page range string into 0-based page indices.
    
    Args:
        page_range: 'all', '1', '1-3', '1,3,5'
        total_pages: Total number of pages in PDF
    
    Returns:
        List of 0-based page indices, or None for all pages
    """
    if page_range == 'all':
        return None
    
    pages = []
    for part in page_range.split(','):
        part = part.strip()
        if '-' in part:
            start, end = map(int, part.split('-'))
            if start > end:
                start, end = end, start
            pages.extend(range(max(1, start), min(total_pages, end) + 1))
        else:
            page_num = int(part)
            if 1 <= page_num <= total_pages:
                pages.append(page_num)
    
    # Convert to 0-based and deduplicate
    pages = sorted(set(p - 1 for p in pages))
    return pages if pages else None


def convert_pdf_to_images(input_path, output_dir, output_format, dpi, page_range, quality, grayscale):
    """
    Convert PDF pages to images using PyMuPDF.
    
    Args:
        input_path: Path to input PDF
        output_dir: Directory to save output images
        output_format: 'jpg' or 'png'
        dpi: DPI for rendering (72-600)
        page_range: 'all', '1', '1-3', '1,3,5'
        quality: JPEG quality (1-100)
        grayscale: boolean
    """
    if fitz is None:
        return {
            "success": False,
            "error": f"PyMuPDF import failed: {PYMUPDF_IMPORT_ERROR}",
            "traceback": "",
        }

    if Image is None:
        return {
            "success": False,
            "error": f"PIL import failed: {PIL_IMPORT_ERROR}",
            "traceback": "",
        }

    try:
        # Open PDF
        doc = fitz.open(input_path)
        total_pages = doc.page_count
        
        if total_pages == 0:
            doc.close()
            return {"success": False, "error": "PDF has no pages", "traceback": ""}

        # Parse page range
        page_indices = parse_page_range(page_range, total_pages)
        if page_indices is None:
            page_indices = list(range(total_pages))
        
        # Calculate zoom factor from DPI (72 DPI is default in PyMuPDF)
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        
        saved_files = []
        
        for idx, page_num in enumerate(page_indices):
            page = doc[page_num]
            
            # Render page to pixmap
            pix = page.get_pixmap(matrix=mat, alpha=False)
            
            # Convert to PIL Image
            img_data = pix.tobytes("ppm")
            from io import BytesIO
            image = Image.open(BytesIO(img_data))
            
            # Apply grayscale if requested
            if grayscale:
                image = image.convert('L')
            
            # Prepare filename (1-based page numbering for user)
            filename = f"page_{page_num + 1:03d}.{output_format}"
            filepath = os.path.join(output_dir, filename)
            
            # Save image
            if output_format.lower() == 'jpg':
                # Convert to RGB if needed for JPEG
                if image.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', image.size, (255, 255, 255))
                    if image.mode == 'P':
                        image = image.convert('RGBA')
                    if image.mode in ('RGBA', 'LA'):
                        background.paste(image, mask=image.split()[-1])
                    else:
                        background.paste(image)
                    image = background
                elif image.mode == 'L':
                    # Grayscale JPEG
                    pass
                image.save(filepath, 'JPEG', quality=quality, optimize=True)
            else:
                # PNG - preserve alpha if present
                image.save(filepath, 'PNG', optimize=True)
            
            saved_files.append(filename)
        
        doc.close()
        
        return {
            "success": True,
            "output_dir": output_dir,
            "files": saved_files,
            "page_count": len(saved_files),
            "format": output_format,
            "dpi": dpi,
        }

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

    # Usage: python pdf_to_image.py <input.pdf> <output_dir> <format> <dpi> <pages> <quality> <grayscale>
    if len(sys.argv) != 8:
        print(json.dumps({
            "success": False,
            "error": "Usage: python pdf_to_image.py <input.pdf> <output_dir> <jpg|png> <dpi> <pages> <quality> <grayscale>"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_dir = sys.argv[2]
    output_format = sys.argv[3].lower()
    dpi = int(sys.argv[4])
    page_range = sys.argv[5]
    quality = int(sys.argv[6])
    grayscale = sys.argv[7].lower() == 'true'

    if output_format not in ('jpg', 'png'):
        print(json.dumps({"success": False, "error": "Format must be 'jpg' or 'png'"}))
        sys.exit(1)

    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)

    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    result = convert_pdf_to_images(
        input_path, output_dir, output_format, dpi, page_range, quality, grayscale
    )
    print(json.dumps(result))


if __name__ == "__main__":
    main()