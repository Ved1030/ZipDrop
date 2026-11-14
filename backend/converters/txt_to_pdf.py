#!/usr/bin/env python3
"""
Text to PDF conversion using ReportLab.
Generates PDF from plain text with configurable formatting options.
"""

import sys
import os
import json
import platform
import traceback
from importlib.metadata import version, PackageNotFoundError

try:
    from reportlab.lib.pagesizes import A4, letter, landscape
    from reportlab.lib.units import inch, mm, cm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
    from reportlab.lib.colors import HexColor
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfbase.pdfmetrics import registerFontFamily
    REPORTLAB_IMPORT_ERROR = None
except Exception as exc:
    REPORTLAB_IMPORT_ERROR = exc

# Try to find DejaVu fonts for Unicode support
DEJAVU_FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-BoldItalic.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Oblique.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-BoldOblique.ttf",
]

# Windows font paths
WINDOWS_FONTS = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/ariali.ttf",
    "C:/Windows/Fonts/arialbi.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
    "C:/Windows/Fonts/tahomabd.ttf",
    "C:/Windows/Fonts/calibri.ttf",
    "C:/Windows/Fonts/calibrib.ttf",
    "C:/Windows/Fonts/calibrii.ttf",
    "C:/Windows/Fonts/calibriz.ttf",
    "C:/Windows/Fonts/seguisym.ttf",
    "C:/Windows/Fonts/seguiemj.ttf",
]


def check_environment():
    """Report the interpreter and dependency status without converting."""
    errors = []
    warnings = []

    if REPORTLAB_IMPORT_ERROR:
        errors.append(f"reportlab: {type(REPORTLAB_IMPORT_ERROR).__name__}: {REPORTLAB_IMPORT_ERROR}")

    # Check for Unicode font availability
    unicode_font_found = False
    for font_path in DEJAVU_FONTS + WINDOWS_FONTS:
        if os.path.exists(font_path):
            unicode_font_found = True
            break

    if not unicode_font_found:
        warnings.append("No Unicode fonts found (DejaVu or Windows fonts). Indian language text may not render correctly.")

    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
            "warnings": warnings,
        }

    try:
        reportlab_version = version("reportlab")
    except PackageNotFoundError:
        reportlab_version = "unknown"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "reportlab_version": reportlab_version,
        "warnings": warnings,
    }


def register_unicode_fonts():
    """Register Unicode-capable fonts with ReportLab."""
    font_families = {}

    # Try DejaVu fonts first (best Unicode support)
    dejavu_paths = {
        "DejaVuSans": None,
        "DejaVuSans-Bold": None,
        "DejaVuSans-Oblique": None,
        "DejaVuSans-BoldOblique": None,
        "DejaVuSerif": None,
        "DejaVuSerif-Bold": None,
        "DejaVuSerif-Italic": None,
        "DejaVuSerif-BoldItalic": None,
        "DejaVuSansMono": None,
        "DejaVuSansMono-Bold": None,
        "DejaVuSansMono-Oblique": None,
        "DejaVuSansMono-BoldOblique": None,
    }

    for font_name in dejavu_paths:
        for base_path in ["/usr/share/fonts/truetype/dejavu/", "C:/Windows/Fonts/"]:
            font_path = os.path.join(base_path, f"{font_name}.ttf")
            if os.path.exists(font_path):
                dejavu_paths[font_name] = font_path
                break

    # Register DejaVu Sans family
    if dejavu_paths["DejaVuSans"] and dejavu_paths["DejaVuSans-Bold"]:
        try:
            pdfmetrics.registerFont(TTFont("DejaVuSans", dejavu_paths["DejaVuSans"]))
            pdfmetrics.registerFont(TTFont("DejaVuSans-Bold", dejavu_paths["DejaVuSans-Bold"]))
            if dejavu_paths["DejaVuSans-Oblique"]:
                pdfmetrics.registerFont(TTFont("DejaVuSans-Oblique", dejavu_paths["DejaVuSans-Oblique"]))
            if dejavu_paths["DejaVuSans-BoldOblique"]:
                pdfmetrics.registerFont(TTFont("DejaVuSans-BoldOblique", dejavu_paths["DejaVuSans-BoldOblique"]))
            
            registerFontFamily(
                "DejaVuSans",
                normal="DejaVuSans",
                bold="DejaVuSans-Bold",
                italic="DejaVuSans-Oblique" if dejavu_paths["DejaVuSans-Oblique"] else "DejaVuSans",
                boldItalic="DejaVuSans-BoldOblique" if dejavu_paths["DejaVuSans-BoldOblique"] else "DejaVuSans-Bold"
            )
            font_families["DejaVuSans"] = True
        except Exception as e:
            pass

    # Register DejaVu Serif family
    if dejavu_paths["DejaVuSerif"] and dejavu_paths["DejaVuSerif-Bold"]:
        try:
            pdfmetrics.registerFont(TTFont("DejaVuSerif", dejavu_paths["DejaVuSerif"]))
            pdfmetrics.registerFont(TTFont("DejaVuSerif-Bold", dejavu_paths["DejaVuSerif-Bold"]))
            if dejavu_paths["DejaVuSerif-Italic"]:
                pdfmetrics.registerFont(TTFont("DejaVuSerif-Italic", dejavu_paths["DejaVuSerif-Italic"]))
            if dejavu_paths["DejaVuSerif-BoldItalic"]:
                pdfmetrics.registerFont(TTFont("DejaVuSerif-BoldItalic", dejavu_paths["DejaVuSerif-BoldItalic"]))
            
            registerFontFamily(
                "DejaVuSerif",
                normal="DejaVuSerif",
                bold="DejaVuSerif-Bold",
                italic="DejaVuSerif-Italic" if dejavu_paths["DejaVuSerif-Italic"] else "DejaVuSerif",
                boldItalic="DejaVuSerif-BoldItalic" if dejavu_paths["DejaVuSerif-BoldItalic"] else "DejaVuSerif-Bold"
            )
            font_families["DejaVuSerif"] = True
        except Exception as e:
            pass

    # Register DejaVu Sans Mono family
    if dejavu_paths["DejaVuSansMono"] and dejavu_paths["DejaVuSansMono-Bold"]:
        try:
            pdfmetrics.registerFont(TTFont("DejaVuSansMono", dejavu_paths["DejaVuSansMono"]))
            pdfmetrics.registerFont(TTFont("DejaVuSansMono-Bold", dejavu_paths["DejaVuSansMono-Bold"]))
            if dejavu_paths["DejaVuSansMono-Oblique"]:
                pdfmetrics.registerFont(TTFont("DejaVuSansMono-Oblique", dejavu_paths["DejaVuSansMono-Oblique"]))
            if dejavu_paths["DejaVuSansMono-BoldOblique"]:
                pdfmetrics.registerFont(TTFont("DejaVuSansMono-BoldOblique", dejavu_paths["DejaVuSansMono-BoldOblique"]))
            
            registerFontFamily(
                "DejaVuSansMono",
                normal="DejaVuSansMono",
                bold="DejaVuSansMono-Bold",
                italic="DejaVuSansMono-Oblique" if dejavu_paths["DejaVuSansMono-Oblique"] else "DejaVuSansMono",
                boldItalic="DejaVuSansMono-BoldOblique" if dejavu_paths["DejaVuSansMono-BoldOblique"] else "DejaVuSansMono-Bold"
            )
            font_families["DejaVuSansMono"] = True
        except Exception as e:
            pass

    # Fallback to Windows fonts if DejaVu not available
    if not font_families:
        windows_font_map = {
            "Arial": ("arial.ttf", "arialbd.ttf", "ariali.ttf", "arialbi.ttf"),
            "Tahoma": ("tahoma.ttf", "tahomabd.ttf", None, None),
            "Calibri": ("calibri.ttf", "calibrib.ttf", "calibrii.ttf", "calibriz.ttf"),
        }
        
        for family_name, (normal, bold, italic, bold_italic) in windows_font_map.items():
            try:
                normal_path = next((p for p in [f"C:/Windows/Fonts/{normal}"] if os.path.exists(p)), None)
                bold_path = next((p for p in [f"C:/Windows/Fonts/{bold}"] if bold and os.path.exists(p)), None)
                italic_path = next((p for p in [f"C:/Windows/Fonts/{italic}"] if italic and os.path.exists(p)), None)
                bi_path = next((p for p in [f"C:/Windows/Fonts/{bold_italic}"] if bold_italic and os.path.exists(p)), None)
                
                if normal_path:
                    pdfmetrics.registerFont(TTFont(family_name, normal_path))
                    if bold_path:
                        pdfmetrics.registerFont(TTFont(f"{family_name}-Bold", bold_path))
                    if italic_path:
                        pdfmetrics.registerFont(TTFont(f"{family_name}-Italic", italic_path))
                    if bi_path:
                        pdfmetrics.registerFont(TTFont(f"{family_name}-BoldItalic", bi_path))
                    
                    registerFontFamily(
                        family_name,
                        normal=family_name,
                        bold=f"{family_name}-Bold" if bold_path else family_name,
                        italic=f"{family_name}-Italic" if italic_path else family_name,
                        boldItalic=f"{family_name}-BoldItalic" if bi_path else (f"{family_name}-Bold" if bold_path else family_name)
                    )
                    font_families[family_name] = True
                    break  # Use first available
            except Exception as e:
                pass

    return font_families


def convert_txt_to_pdf(input_path, output_path, options=None):
    """
    Main conversion function: convert TXT to PDF.
    """
    if REPORTLAB_IMPORT_ERROR:
        return {
            "success": False,
            "error": f"reportlab import failed: {REPORTLAB_IMPORT_ERROR}",
            "traceback": "",
        }

    if options is None:
        options = {}

    try:
        # Read text file with encoding detection
        text_content = None
        encodings = ['utf-8', 'utf-8-sig', 'utf-16', 'latin-1', 'cp1252']
        
        for encoding in encodings:
            try:
                with open(input_path, 'r', encoding=encoding) as f:
                    text_content = f.read()
                break
            except UnicodeDecodeError:
                continue
        
        if text_content is None:
            return {"success": False, "error": "Failed to decode text file with any supported encoding", "traceback": ""}

        # Parse options
        page_size_name = options.get('pageSize', 'A4').upper()
        orientation = options.get('orientation', 'portrait').lower()
        font_size = int(options.get('fontSize', 11))
        font_family = options.get('fontFamily', 'DejaVuSans')
        alignment = options.get('alignment', 'left').lower()
        margins = {
            'top': float(options.get('marginTop', 25.4)),  # mm
            'bottom': float(options.get('marginBottom', 25.4)),
            'left': float(options.get('marginLeft', 25.4)),
            'right': float(options.get('marginRight', 25.4)),
        }
        show_page_numbers = options.get('pageNumbers', False)

        # Page size
        page_sizes = {'A4': A4, 'LETTER': letter}
        page_size = page_sizes.get(page_size_name, A4)
        if orientation == 'landscape':
            page_size = landscape(page_size)

        # Register Unicode fonts
        font_families = register_unicode_fonts()
        
        # Determine which font family to use
        available_families = list(font_families.keys())
        if font_family not in available_families:
            if available_families:
                font_family = available_families[0]
            else:
                font_family = 'Helvetica'  # Built-in fallback

        # Alignment mapping
        align_map = {
            'left': TA_LEFT,
            'center': TA_CENTER,
            'right': TA_RIGHT,
            'justify': TA_JUSTIFY,
        }
        text_align = align_map.get(alignment, TA_LEFT)

        # Create PDF document
        doc = SimpleDocTemplate(
            output_path,
            pagesize=page_size,
            topMargin=margins['top'] * mm,
            bottomMargin=margins['bottom'] * mm,
            leftMargin=margins['left'] * mm,
            rightMargin=margins['right'] * mm,
        )

        # Create styles
        styles = getSampleStyleSheet()
        
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontName=font_family,
            fontSize=font_size,
            leading=font_size * 1.4,
            alignment=text_align,
            spaceAfter=font_size * 0.3,
        )

        # Split text into paragraphs (preserve blank lines)
        paragraphs = text_content.split('\n')
        
        story = []
        
        for i, para_text in enumerate(paragraphs):
            if para_text.strip() == '':
                # Blank line - add a small spacer
                story.append(Spacer(1, font_size * 0.5))
            else:
                # Escape HTML special characters for ReportLab
                escaped_text = para_text.replace('&', '&').replace('<', '<').replace('>', '>')
                # Preserve multiple spaces
                escaped_text = escaped_text.replace('  ', '&nbsp;&nbsp;')
                story.append(Paragraph(escaped_text, body_style))

        # Add page numbers if requested
        if show_page_numbers:
            def add_page_number(canvas, doc):
                page_num = canvas.getPageNumber()
                text = f"Page {page_num}"
                canvas.saveState()
                canvas.setFont('Helvetica', 8)
                canvas.drawCentredString(
                    doc.pagesize[0] / 2,
                    15 * mm,
                    text
                )
                canvas.restoreState()
            
            doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
        else:
            doc.build(story)

        return {
            "success": True,
            "output_path": output_path,
            "page_count": doc.page if hasattr(doc, 'page') else 'unknown',
            "font_family": font_family,
            "font_size": font_size,
        }

    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python txt_to_pdf.py <input.txt> <output.pdf> [options_json]
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python txt_to_pdf.py <input.txt> <output.pdf> [options_json]"
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

    result = convert_txt_to_pdf(input_path, output_path, options)
    print(json.dumps(result))


if __name__ == "__main__":
    main()