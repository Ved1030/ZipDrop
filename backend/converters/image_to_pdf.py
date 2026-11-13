#!/usr/bin/env python3
"""
Image to PDF conversion using img2pdf (lossless for JPEG) and PIL.
Supports JPG, PNG, WebP, SVG input.
"""

import sys
import os
import json
import platform
import traceback
from importlib.metadata import version, PackageNotFoundError

try:
    import img2pdf
    IMG2PDF_IMPORT_ERROR = None
except Exception as exc:
    img2pdf = None
    IMG2PDF_IMPORT_ERROR = exc

try:
    from PIL import Image
    PIL_IMPORT_ERROR = None
except Exception as exc:
    Image = None
    PIL_IMPORT_ERROR = exc

try:
    import cairosvg
    CAIROSVG_IMPORT_ERROR = None
except Exception as exc:
    cairosvg = None
    CAIROSVG_IMPORT_ERROR = exc


def check_environment():
    """Report the interpreter and dependency status without converting."""
    errors = []
    warnings = []

    if img2pdf is None:
        errors.append(f"img2pdf: {type(IMG2PDF_IMPORT_ERROR).__name__}: {IMG2PDF_IMPORT_ERROR}")

    if Image is None:
        errors.append(f"PIL: {type(PIL_IMPORT_ERROR).__name__}: {PIL_IMPORT_ERROR}")

    if cairosvg is None:
        warnings.append("cairosvg not available - SVG conversion will be limited")

    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
            "warnings": warnings,
        }

    try:
        img2pdf_version = version("img2pdf")
    except PackageNotFoundError:
        img2pdf_version = "unknown"

    try:
        pil_version = version("pillow")
    except PackageNotFoundError:
        pil_version = "unknown"

    try:
        cairosvg_version = version("cairosvg") if cairosvg else "not installed"
    except PackageNotFoundError:
        cairosvg_version = "not installed"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "img2pdf_version": img2pdf_version,
        "pillow_version": pil_version,
        "cairosvg_version": cairosvg_version,
        "warnings": warnings,
    }


# Page size dimensions in points (1 point = 1/72 inch)
PAGE_SIZES = {
    'A4': (595.28, 841.89),
    'A3': (841.89, 1190.55),
    'A5': (419.53, 595.28),
    'Letter': (612, 792),
    'Legal': (612, 1008),
    'Tabloid': (792, 1224),
}


def convert_svg_to_png(svg_path, output_path):
    """Convert SVG to PNG using cairosvg."""
    if cairosvg is None:
        raise RuntimeError("cairosvg not available for SVG conversion")
    
    cairosvg.svg2png(url=svg_path, write_to=output_path, dpi=300)
    return output_path


def convert_image_to_pdf(input_paths, output_path, page_size_name, orientation, margin):
    """
    Convert one or more images to PDF.
    
    Args:
        input_paths: List of image file paths
        output_path: Output PDF path
        page_size_name: Page size name (A4, Letter, etc.)
        orientation: 'portrait' or 'landscape'
        margin: Margin in points (0 for no margin)
    """
    if img2pdf is None:
        return {
            "success": False,
            "error": f"img2pdf import failed: {IMG2PDF_IMPORT_ERROR}",
            "traceback": "",
        }

    if Image is None:
        return {
            "success": False,
            "error": f"PIL import failed: {PIL_IMPORT_ERROR}",
            "traceback": "",
        }

    try:
        page_size = PAGE_SIZES.get(page_size_name, PAGE_SIZES['A4'])
        if orientation == 'landscape':
            page_size = (page_size[1], page_size[0])

        margin = float(margin)
        layout_fun = img2pdf.get_layout_fun(page_size)

        # Prepare images - convert SVG to PNG if needed
        processed_paths = []
        temp_files = []

        for input_path in input_paths:
            ext = os.path.splitext(input_path)[1].lower()
            
            if ext == '.svg':
                # Convert SVG to PNG first
                png_path = input_path.replace('.svg', '_converted.png')
                convert_svg_to_png(input_path, png_path)
                processed_paths.append(png_path)
                temp_files.append(png_path)
            else:
                # For JPEG, img2pdf can embed losslessly
                # For PNG/WebP, it will re-encode
                processed_paths.append(input_path)

        # Convert to PDF
        with open(output_path, 'wb') as f:
            f.write(img2pdf.convert(
                processed_paths,
                layout_fun=layout_fun,
                border=(margin, margin, margin, margin) if margin > 0 else None,
            ))

        # Cleanup temp SVG conversions
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except Exception:
                pass

        return {"success": True, "output_path": output_path, "page_count": len(input_paths)}

    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python image_to_pdf.py <input1> [input2...] <output.pdf> <page_size> <orientation> <margin>
    if len(sys.argv) < 6:
        print(json.dumps({
            "success": False,
            "error": "Usage: python image_to_pdf.py <input1> [input2...] <output.pdf> <page_size> <orientation> <margin>"
        }))
        sys.exit(1)

    # Last 3 args are output_path, page_size, orientation, margin
    output_path = sys.argv[-4]
    page_size = sys.argv[-3]
    orientation = sys.argv[-2]
    margin = sys.argv[-1]
    
    # All args before those are input paths
    input_paths = sys.argv[1:-4]

    for input_path in input_paths:
        if not os.path.exists(input_path):
            print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
            sys.exit(1)

    result = convert_image_to_pdf(input_paths, output_path, page_size, orientation, margin)
    print(json.dumps(result))


if __name__ == "__main__":
    main()