#!/usr/bin/env python3
"""
PDF to PowerPoint (PPTX) conversion using PyMuPDF (fitz) for extraction
and python-pptx for PPTX generation.

Two modes:
1. Visual Fidelity: Each PDF page rendered as high-res image, set as slide background
2. Editable: Extract text, images, and basic shapes as editable PowerPoint objects
"""

import sys
import os
import json
import platform
import traceback
import tempfile
from importlib.metadata import version, PackageNotFoundError
from io import BytesIO

try:
    import fitz  # PyMuPDF
    PYMUPDF_IMPORT_ERROR = None
except Exception as exc:
    fitz = None
    PYMUPDF_IMPORT_ERROR = exc

try:
    from pptx import Presentation
    from pptx.util import Inches, Pt, Emu, Emu
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
    from pptx.enum.shapes import MSO_SHAPE
    PPTX_IMPORT_ERROR = None
except Exception as exc:
    Presentation = None
    PPTX_IMPORT_ERROR = exc

try:
    from PIL import Image
    PIL_IMPORT_ERROR = None
except Exception as exc:
    Image = None
    PIL_IMPORT_ERROR = exc


def check_environment():
    """Report the interpreter and dependency status without converting."""
    errors = []
    warnings = []

    if fitz is None:
        errors.append(f"PyMuPDF: {type(PYMUPDF_IMPORT_ERROR).__name__}: {PYMUPDF_IMPORT_ERROR}")

    if Presentation is None:
        errors.append(f"python-pptx: {type(PPTX_IMPORT_ERROR).__name__}: {PPTX_IMPORT_ERROR}")

    if Image is None:
        warnings.append(f"PIL: {type(PIL_IMPORT_ERROR).__name__}: {PIL_IMPORT_ERROR} (optional for image handling)")

    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
            "warnings": warnings,
        }

    try:
        pymupdf_version = version("pymupdf")
    except PackageNotFoundError:
        pymupdf_version = "unknown"

    try:
        pptx_version = version("python-pptx")
    except PackageNotFoundError:
        pptx_version = "unknown"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "pymupdf_version": pymupdf_version,
        "pptx_version": pptx_version,
        "warnings": warnings,
    }


def pdf_point_to_emu(points):
    """Convert PDF points (1/72 inch) to EMU (English Metric Units used by python-pptx)."""
    # 1 inch = 72 points = 914400 EMU
    return int(points * 914400 / 72)


def rgb_to_hex(rgb):
    """Convert RGB tuple (0-1 or 0-255) to hex string."""
    if isinstance(rgb, (list, tuple)):
        if max(rgb) <= 1.0:
            rgb = tuple(int(c * 255) for c in rgb)
        return "{:02X}{:02X}{:02X}".format(*rgb[:3])
    return "000000"


def convert_pdf_to_pptx_visual_fidelity(input_path, output_path, dpi=200):
    """
    Mode A: Visual Fidelity
    Each PDF page becomes one slide with the page rendered as a high-res background image.
    Preserves exact visual appearance but content is not editable.
    """
    if fitz is None:
        return {"success": False, "error": f"PyMuPDF import failed: {PYMUPDF_IMPORT_ERROR}", "traceback": ""}

    if Presentation is None:
        return {"success": False, "error": f"python-pptx import failed: {PPTX_IMPORT_ERROR}", "traceback": ""}

    try:
        doc = fitz.open(input_path)
        total_pages = doc.page_count

        if total_pages == 0:
            doc.close()
            return {"success": False, "error": "PDF has no pages", "traceback": ""}

        prs = Presentation()

        # Calculate slide dimensions from first page (all pages should be same aspect ratio)
        first_page = doc[0]
        page_width_pt = first_page.rect.width
        page_height_pt = first_page.rect.height

        # Set slide size to match PDF page dimensions
        prs.slide_width = pdf_point_to_emu(page_width_pt)
        prs.slide_height = pdf_point_to_emu(page_height_pt)

        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)

        for page_num in range(total_pages):
            page = doc[page_num]

            # Render page to high-res image
            pix = page.get_pixmap(matrix=mat, alpha=False)

            # Save to BytesIO buffer to avoid temp file permission issues on Windows
            img_data = pix.tobytes("png")
            img_buffer = BytesIO(img_data)

            # Add blank slide (use blank layout)
            blank_slide_layout = prs.slide_layouts[6]  # Blank layout
            slide = prs.slides.add_slide(blank_slide_layout)

            # Add the page image as background filling the entire slide
            slide.shapes.add_picture(
                img_buffer,
                0, 0,
                width=prs.slide_width,
                height=prs.slide_height
            )

            # Add a subtle note that this is visual fidelity mode
            # (as a small text box in the corner - optional)
            # txBox = slide.shapes.add_textbox(
            #     Inches(0.1), Inches(0.1), Inches(2), Inches(0.3)
            # )
            # tf = txBox.text_frame
            # tf.text = "Visual Fidelity Mode - Not Fully Editable"
            # tf.paragraphs[0].font.size = Pt(8)
            # tf.paragraphs[0].font.color.rgb = RGBColor(128, 128, 128)

        doc.close()
        prs.save(output_path)

        return {
            "success": True,
            "output_path": output_path,
            "slide_count": total_pages,
            "mode": "visual-fidelity",
            "slide_width_pt": page_width_pt,
            "slide_height_pt": page_height_pt,
        }

    except fitz.FileDataError as e:
        return {"success": False, "error": f"Corrupted or invalid PDF: {str(e)}", "traceback": traceback.format_exc()}
    except Exception as e:
        error_msg = str(e)
        if "encrypted" in error_msg.lower() or "permission" in error_msg.lower() or "password" in error_msg.lower():
            return {"success": False, "error": f"PDF is password protected or encrypted: {error_msg}", "traceback": traceback.format_exc()}
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def convert_pdf_to_pptx_editable(input_path, output_path):
    """
    Mode B: Editable PowerPoint
    Extract text, images, and basic elements as editable PPTX objects.
    Best effort reconstruction - may not perfectly match visual fidelity.
    """
    if fitz is None:
        return {"success": False, "error": f"PyMuPDF import failed: {PYMUPDF_IMPORT_ERROR}", "traceback": ""}

    if Presentation is None:
        return {"success": False, "error": f"python-pptx import failed: {PPTX_IMPORT_ERROR}", "traceback": ""}

    try:
        doc = fitz.open(input_path)
        total_pages = doc.page_count

        if total_pages == 0:
            doc.close()
            return {"success": False, "error": "PDF has no pages", "traceback": ""}

        prs = Presentation()

        # Use first page dimensions for slide size
        first_page = doc[0]
        page_width_pt = first_page.rect.width
        page_height_pt = first_page.rect.height

        prs.slide_width = pdf_point_to_emu(page_width_pt)
        prs.slide_height = pdf_point_to_emu(page_height_pt)

        for page_num in range(total_pages):
            page = doc[page_num]

            # Add blank slide
            blank_slide_layout = prs.slide_layouts[6]
            slide = prs.slides.add_slide(blank_slide_layout)

            # Extract text blocks with position and font info
            blocks = page.get_text("dict")["blocks"]

            for block in blocks:
                if block["type"] == 0:  # Text block
                    for line in block["lines"]:
                        for span in line["spans"]:
                            text = span["text"].strip()
                            if not text:
                                continue

                            # Get position (bbox is in PDF points)
                            bbox = span["bbox"]
                            x0, y0, x1, y1 = bbox

                            # Convert to EMU
                            left = pdf_point_to_emu(x0)
                            top = pdf_point_to_emu(y0)
                            width = pdf_point_to_emu(x1 - x0)
                            height = pdf_point_to_emu(y1 - y0)

                            # Add text box
                            txBox = slide.shapes.add_textbox(left, top, width, height)
                            tf = txBox.text_frame
                            tf.word_wrap = True
                            p = tf.paragraphs[0]
                            p.text = text

                            # Apply font properties
                            font_size = span["size"]
                            if font_size > 0:
                                p.font.size = Pt(font_size)

                            # Font color
                            color_val = span["color"]
                            if color_val != 0:
                                r = (color_val >> 16) & 0xFF
                                g = (color_val >> 8) & 0xFF
                                b = color_val & 0xFF
                                p.font.color.rgb = RGBColor(r, g, b)

                            # Bold/italic
                            font_flags = span["flags"]
                            p.font.bold = bool(font_flags & 16)  # Bold flag
                            p.font.italic = bool(font_flags & 2)  # Italic flag

                            # Font name (limited support in python-pptx)
                            font_name = span["font"]
                            if font_name:
                                p.font.name = font_name

                elif block["type"] == 1:  # Image block
                    # Extract images
                    try:
                        image_list = page.get_images(full=True)
                        for img_index, img in enumerate(image_list):
                            xref = img[0]
                            pix = fitz.Pixmap(doc, xref)

                            if pix.n > 4:  # CMYK or similar
                                pix = fitz.Pixmap(fitz.csRGB, pix)

                            # Get image position from block bbox if available
                            # For simplicity, we'll add images at their approximate position
                            bbox = block.get("bbox", [0, 0, 100, 100])
                            x0, y0, x1, y1 = bbox

                            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                                pix.save(tmp.name)
                                tmp_path = tmp.name

                            try:
                                left = pdf_point_to_emu(x0)
                                top = pdf_point_to_emu(y0)
                                width = pdf_point_to_emu(x1 - x0)
                                height = pdf_point_to_emu(y1 - y0)

                                slide.shapes.add_picture(tmp_path, left, top, width, height)
                            finally:
                                try:
                                    os.unlink(tmp_path)
                                except:
                                    pass
                    except Exception:
                        pass  # Skip images that can't be extracted

            # Also extract vector graphics (basic shapes)
            # This is limited - PyMuPDF can extract paths but mapping to PPTX shapes is complex
            # We'll focus on text and images for now

        doc.close()
        prs.save(output_path)

        return {
            "success": True,
            "output_path": output_path,
            "slide_count": total_pages,
            "mode": "editable",
            "slide_width_pt": page_width_pt,
            "slide_height_pt": page_height_pt,
        }

    except fitz.FileDataError as e:
        return {"success": False, "error": f"Corrupted or invalid PDF: {str(e)}", "traceback": traceback.format_exc()}
    except Exception as e:
        error_msg = str(e)
        if "encrypted" in error_msg.lower() or "permission" in error_msg.lower() or "password" in error_msg.lower():
            return {"success": False, "error": f"PDF is password protected or encrypted: {error_msg}", "traceback": traceback.format_exc()}
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def convert_pdf_to_pptx(input_path, output_path, mode="editable", dpi=200):
    """Main conversion function with mode selection."""
    if mode == "visual-fidelity":
        return convert_pdf_to_pptx_visual_fidelity(input_path, output_path, dpi)
    else:
        return convert_pdf_to_pptx_editable(input_path, output_path)


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python pdf_to_pptx.py <input.pdf> <output.pptx> [mode] [dpi]
    if len(sys.argv) < 3 or len(sys.argv) > 5:
        print(json.dumps({
            "success": False,
            "error": "Usage: python pdf_to_pptx.py <input.pdf> <output.pptx> [editable|visual-fidelity] [dpi]"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    mode = sys.argv[3] if len(sys.argv) >= 4 else "editable"
    dpi = int(sys.argv[4]) if len(sys.argv) >= 5 else 200

    if mode not in ("editable", "visual-fidelity"):
        print(json.dumps({
            "success": False,
            "error": f"Invalid mode: {mode}. Use 'editable' or 'visual-fidelity'"
        }))
        sys.exit(1)

    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)

    result = convert_pdf_to_pptx(input_path, output_path, mode, dpi)
    print(json.dumps(result))


if __name__ == "__main__":
    main()