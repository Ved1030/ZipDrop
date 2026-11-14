#!/usr/bin/env python3
"""
DOCX to HTML conversion using python-docx.
Converts Word documents to clean, semantic HTML with CSS styling.
Handles images by extracting them and packaging with HTML in a ZIP if needed.
"""

import sys
import os
import json
import platform
import traceback
import base64
import zipfile
import tempfile
import shutil
from importlib.metadata import version, PackageNotFoundError
from io import BytesIO

try:
    from docx import Document
    from docx.oxml.table import CT_Tbl
    from docx.oxml.text.paragraph import CT_P
    from docx.table import Table
    from docx.text.paragraph import Paragraph
    from docx.shared import Inches, Pt, Emu
    from docx.oxml.ns import qn
    PYTHON_DOCX_IMPORT_ERROR = None
except Exception as exc:
    Document = None
    PYTHON_DOCX_IMPORT_ERROR = exc

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

    if Document is None:
        errors.append(f"python-docx: {type(PYTHON_DOCX_IMPORT_ERROR).__name__}: {PYTHON_DOCX_IMPORT_ERROR}")

    if Image is None:
        warnings.append(f"PIL: {type(PIL_IMPORT_ERROR).__name__}: {PIL_IMPORT_ERROR} (image optimization will be limited)")

    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
            "warnings": warnings,
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
        "warnings": warnings,
    }


def rgb_to_hex(rgb):
    """Convert RGB tuple to hex string."""
    if rgb is None:
        return None
    if isinstance(rgb, str):
        return rgb
    r, g, b = rgb
    return f"#{r:02x}{g:02x}{b:02x}"


def get_style_properties(run, paragraph=None):
    """Extract CSS style properties from a run."""
    styles = []
    
    if run.bold:
        styles.append("font-weight: bold")
    if run.italic:
        styles.append("font-style: italic")
    if run.underline:
        styles.append("text-decoration: underline")
    
    if run.font.size:
        styles.append(f"font-size: {run.font.size.pt}pt")
    
    if run.font.name:
        styles.append(f"font-family: '{run.font.name}'")
    
    if run.font.color.rgb:
        styles.append(f"color: {rgb_to_hex(run.font.color.rgb)}")
    
    if run.font.highlight_color:
        highlight_colors = {
            1: "#ffff00", 2: "lime", 3: "cyan", 4: "magenta",
            5: "yellow", 6: "red", 7: "blue", 8: "gray"
        }
        color = highlight_colors.get(run.font.highlight_color)
        if color:
            styles.append(f"background-color: {color}")
    
    return "; ".join(styles)


def get_paragraph_style(paragraph):
    """Extract CSS style properties from a paragraph."""
    styles = []
    
    # Alignment
    alignment_map = {
        0: "left", 1: "center", 2: "right", 3: "justify"
    }
    if paragraph.alignment is not None:
        styles.append(f"text-align: {alignment_map.get(paragraph.alignment, 'left')}")
    
    # Indentation
    if paragraph.paragraph_format.left_indent:
        styles.append(f"margin-left: {paragraph.paragraph_format.left_indent.pt}pt")
    if paragraph.paragraph_format.right_indent:
        styles.append(f"margin-right: {paragraph.paragraph_format.right_indent.pt}pt")
    if paragraph.paragraph_format.first_line_indent:
        styles.append(f"text-indent: {paragraph.paragraph_format.first_line_indent.pt}pt")
    
    # Spacing
    if paragraph.paragraph_format.space_before:
        styles.append(f"margin-top: {paragraph.paragraph_format.space_before.pt}pt")
    if paragraph.paragraph_format.space_after:
        styles.append(f"margin-bottom: {paragraph.paragraph_format.space_after.pt}pt")
    
    # Line spacing
    if paragraph.paragraph_format.line_spacing:
        styles.append(f"line-height: {paragraph.paragraph_format.line_spacing}")
    
    # Background color (shading) - check using XML
    try:
        pPr = paragraph._p.find(qn('w:pPr'))
        if pPr is not None:
            shading = pPr.find(qn('w:shd'))
            if shading is not None and shading.get(qn('w:fill')):
                styles.append(f"background-color: {rgb_to_hex(shading.get(qn('w:fill')))}")
    except:
        pass
    
    return "; ".join(styles)


def extract_images_from_document(doc, assets_dir):
    """Extract images from document and save to assets directory."""
    images = {}
    image_counter = 0
    
    for rel in doc.part.rels.values():
        if "image" in rel.target_ref:
            image_counter += 1
            try:
                image_data = rel.target_part.blob
                content_type = rel.target_part.content_type
                
                # Determine extension
                ext_map = {
                    "image/jpeg": ".jpg",
                    "image/png": ".png",
                    "image/gif": ".gif",
                    "image/bmp": ".bmp",
                    "image/tiff": ".tiff",
                    "image/webp": ".webp",
                }
                ext = ext_map.get(content_type, ".bin")
                filename = f"image_{image_counter}{ext}"
                filepath = os.path.join(assets_dir, filename)
                
                with open(filepath, "wb") as f:
                    f.write(image_data)
                
                images[rel.rId] = {
                    "filename": filename,
                    "filepath": filepath,
                    "content_type": content_type,
                    "data": image_data,
                }
            except Exception as e:
                print(f"Warning: Failed to extract image {rel.rId}: {e}", file=sys.stderr)
    
    return images


def paragraph_to_html(paragraph, images, embed_images=False):
    """Convert a paragraph to HTML."""
    if not paragraph.text.strip():
        # Check if paragraph has only images
        has_image = False
        for run in paragraph.runs:
            for drawing in run._element.xpath('.//w:drawing'):
                has_image = True
                break
        if not has_image:
            return ""
    
    style = get_paragraph_style(paragraph)
    style_attr = f' style="{style}"' if style else ""
    
    # Determine if it's a heading
    tag = "p"
    if paragraph.style.name.startswith('Heading'):
        level = 1
        if paragraph.style.name[-1].isdigit():
            level = int(paragraph.style.name[-1])
        tag = f"h{min(level, 6)}"
    
    html_parts = [f"<{tag}{style_attr}>"]
    
    for run in paragraph.runs:
        run_styles = get_style_properties(run, paragraph)
        run_style_attr = f' style="{run_styles}"' if run_styles else ""
        
        # Check for images in run
        for drawing in run._element.xpath('.//w:drawing'):
            for blip in drawing.xpath('.//a:blip'):
                rId = blip.get(qn('r:embed'))
                if rId in images:
                    img_info = images[rId]
                    if embed_images:
                        b64 = base64.b64encode(img_info["data"]).decode('ascii')
                        src = f"data:{img_info['content_type']};base64,{b64}"
                    else:
                        src = f"assets/{img_info['filename']}"
                    html_parts.append(f'<img src="{src}" alt="" />')
        
        text = run.text
        if text:
            # Escape HTML
            text = text.replace("&", "&").replace("<", "<").replace(">", ">")
            text = text.replace("\n", "<br />")
            if run_style_attr:
                html_parts.append(f'<span{run_style_attr}>{text}</span>')
            else:
                html_parts.append(text)
    
    html_parts.append(f"</{tag}>")
    return "".join(html_parts)


def table_to_html(table, images, embed_images=False):
    """Convert a table to HTML."""
    html_parts = ['<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">']
    
    for i, row in enumerate(table.rows):
        html_parts.append("<tr>")
        for cell in row.cells:
            cell_style = []
            if cell.vertical_alignment:
                valign_map = {0: "top", 1: "middle", 2: "bottom"}
                cell_style.append(f"vertical-align: {valign_map.get(cell.vertical_alignment, 'top')}")
            
            # Check for cell shading
            tc = cell._tc
            tcPr = tc.find(qn('w:tcPr'))
            if tcPr is not None:
                shading = tcPr.find(qn('w:shd'))
                if shading is not None and shading.get(qn('w:fill')):
                    cell_style.append(f"background-color: {rgb_to_hex(shading.get(qn('w:fill')))}")
            
            cell_style_attr = f' style="{"; ".join(cell_style)}"' if cell_style else ""
            
            # Check for merged cells
            grid_span = tcPr.find(qn('w:gridSpan')) if tcPr is not None else None
            col_span = f' colspan="{grid_span.get(qn("w:val"))}"' if grid_span is not None else ""
            
            v_merge = tcPr.find(qn('w:vMerge')) if tcPr is not None else None
            row_span = ""
            if v_merge is not None:
                if v_merge.get(qn('w:val')) == "restart":
                    row_span = ' rowspan="2"'  # Simplified - actual merge detection is complex
            
            html_parts.append(f"<td{cell_style_attr}{col_span}{row_span}>")
            
            # Convert cell paragraphs
            for para in cell.paragraphs:
                html_parts.append(paragraph_to_html(para, images, embed_images))
            
            html_parts.append("</td>")
        html_parts.append("</tr>")
    
    html_parts.append("</table>")
    return "".join(html_parts)


def generate_html_document(doc, images, embed_images=False):
    """Generate complete HTML document."""
    html_parts = [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '<meta charset="UTF-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '<title>Converted Document</title>',
        '<style>',
        'body { font-family: "Calibri", "Arial", sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }',
        'table { border-collapse: collapse; width: 100%; margin: 10px 0; }',
        'td, th { border: 1px solid #ccc; padding: 8px; }',
        'th { background-color: #f2f2f2; font-weight: bold; }',
        'img { max-width: 100%; height: auto; }',
        'h1, h2, h3, h4, h5, h6 { color: #333; }',
        'h1 { font-size: 2em; } h2 { font-size: 1.5em; } h3 { font-size: 1.3em; }',
        '</style>',
        '</head>',
        '<body>',
    ]
    
    # Extract document body content in order
    for element in doc.element.body:
        if isinstance(element, CT_P):
            para = Paragraph(element, doc)
            html_parts.append(paragraph_to_html(para, images, embed_images))
        elif isinstance(element, CT_Tbl):
            table = Table(element, doc)
            html_parts.append(table_to_html(table, images, embed_images))
    
    html_parts.extend([
        '</body>',
        '</html>',
    ])
    
    return "\n".join(html_parts)


def convert_docx_to_html(input_path, output_path, embed_images=False):
    """
    Main conversion function: convert DOCX to HTML.
    If embed_images is False and there are images, create a ZIP file.
    """
    if Document is None:
        return {
            "success": False,
            "error": f"python-docx import failed: {PYTHON_DOCX_IMPORT_ERROR}",
            "traceback": "",
        }

    try:
        doc = Document(input_path)
        
        # Create temp directory for assets
        with tempfile.TemporaryDirectory() as tmpdir:
            assets_dir = os.path.join(tmpdir, "assets")
            os.makedirs(assets_dir, exist_ok=True)
            
            # Extract images
            images = extract_images_from_document(doc, assets_dir)
            has_images = len(images) > 0
            
            # Generate HTML
            html_content = generate_html_document(doc, images, embed_images)
            
            if embed_images or not has_images:
                # Single HTML file with embedded images
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(html_content)
                return {
                    "success": True,
                    "output_path": output_path,
                    "format": "html",
                    "has_images": has_images,
                    "embedded": embed_images,
                }
            else:
                # Create ZIP with HTML and assets
                zip_path = output_path
                with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                    zf.writestr("index.html", html_content)
                    for img_info in images.values():
                        zf.write(img_info["filepath"], f"assets/{img_info['filename']}")
                
                return {
                    "success": True,
                    "output_path": output_path,
                    "format": "zip",
                    "has_images": has_images,
                    "embedded": False,
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

    # Usage: python docx_to_html.py <input.docx> <output.html|output.zip> [embed_images]
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python docx_to_html.py <input.docx> <output.html|output.zip> [embed_images=true|false]"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    embed_images = sys.argv[3].lower() == "true" if len(sys.argv) == 4 else False

    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)

    result = convert_docx_to_html(input_path, output_path, embed_images)
    print(json.dumps(result))


if __name__ == "__main__":
    main()