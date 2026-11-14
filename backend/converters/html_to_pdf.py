#!/usr/bin/env python3
"""
HTML to PDF conversion using Playwright (Chromium).
Renders HTML with full CSS support and converts to PDF.
"""

import sys
import os
import json
import platform
import traceback
import asyncio
import tempfile
from importlib.metadata import version, PackageNotFoundError

try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_IMPORT_ERROR = None
except Exception as exc:
    async_playwright = None
    PLAYWRIGHT_IMPORT_ERROR = exc

# HTML sanitization - remove dangerous elements
DANGEROUS_TAGS = {'script', 'iframe', 'object', 'embed', 'applet', 'form', 'input', 'button', 'link', 'meta'}
DANGEROUS_ATTRS = {'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'href', 'src', 'action', 'formaction', 'formaction'}


def check_environment():
    """Report the interpreter and dependency status without converting."""
    errors = []
    warnings = []

    if PLAYWRIGHT_IMPORT_ERROR:
        errors.append(f"playwright: {type(PLAYWRIGHT_IMPORT_ERROR).__name__}: {PLAYWRIGHT_IMPORT_ERROR}")

    # Check if Chromium is available
    try:
        import subprocess
        result = subprocess.run(['which', 'chromium'] if platform.system() != 'Windows' else ['where', 'chromium'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode != 0:
            warnings.append("Chromium not found in PATH. Playwright will use its bundled browser.")
    except Exception:
        warnings.append("Could not verify Chromium installation.")

    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
            "warnings": warnings,
        }

    try:
        playwright_version = version("playwright")
    except PackageNotFoundError:
        playwright_version = "unknown"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "playwright_version": playwright_version,
        "warnings": warnings,
    }


def sanitize_html(html_content):
    """
    Basic HTML sanitization to remove dangerous elements.
    This is a simple implementation - for production consider using lxml/bleach.
    """
    import re
    
    # Remove script tags and their content
    html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove iframe, object, embed, applet, form tags
    for tag in ['iframe', 'object', 'embed', 'applet', 'form', 'input', 'button', 'link', 'meta']:
        html_content = re.sub(f'<{tag}[^>]*>.*?</{tag}>', '', html_content, flags=re.IGNORECASE | re.DOTALL)
        html_content = re.sub(f'<{tag}[^>]*/?>', '', html_content, flags=re.IGNORECASE)
    
    # Remove dangerous attributes
    for attr in DANGEROUS_ATTRS:
        html_content = re.sub(f'{attr}\\s*=\\s*["\'][^"\']*["\']', '', html_content, flags=re.IGNORECASE)
    
    # Remove javascript: URLs
    html_content = re.sub(r'href\s*=\s*["\']javascript:[^"\']*["\']', 'href="#"', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'src\s*=\s*["\']javascript:[^"\']*["\']', 'src=""', html_content, flags=re.IGNORECASE)
    
    # Remove on* event handlers
    html_content = re.sub(r'on\w+\s*=\s*["\'][^"\']*["\']', '', html_content, flags=re.IGNORECASE)
    
    return html_content


def process_assets(html_content, base_dir):
    """
    Process local assets (images, CSS) referenced in HTML.
    Convert relative paths to file:// URLs or data: URIs.
    """
    import re
    import base64
    import mimetypes
    
    # Find all img src attributes
    img_pattern = r'<img\s+([^>]*src\s*=\s*["\']([^"\']+)["\'][^>]*)>'
    
    def replace_img(match):
        full_attrs = match.group(1)
        src = match.group(2)
        
        # Skip data: URIs and http/https URLs
        if src.startswith('data:') or src.startswith('http://') or src.startswith('https://'):
            return match.group(0)
        
        # Try to find the file
        asset_path = os.path.join(base_dir, src)
        if not os.path.exists(asset_path):
            # Try without base_dir
            asset_path = src
            if not os.path.exists(asset_path):
                return match.group(0)  # Keep original if not found
        
        # Convert to data URI
        try:
            with open(asset_path, 'rb') as f:
                data = f.read()
            mime_type, _ = mimetypes.guess_type(asset_path)
            if not mime_type:
                mime_type = 'application/octet-stream'
            b64 = base64.b64encode(data).decode('ascii')
            data_uri = f'data:{mime_type};base64,{b64}'
            return f'<img {full_attrs.replace(src, data_uri)}>'
        except Exception:
            return match.group(0)
    
    html_content = re.sub(img_pattern, replace_img, html_content, flags=re.IGNORECASE)
    
    # Process CSS link tags - inline them
    css_pattern = r'<link\s+([^>]*rel\s*=\s*["\']stylesheet["\'][^>]*href\s*=\s*["\']([^"\']+)["\'][^>]*)>'
    
    def replace_css(match):
        full_attrs = match.group(1)
        href = match.group(2)
        
        if href.startswith('http://') or href.startswith('https://') or href.startswith('data:'):
            return match.group(0)
        
        css_path = os.path.join(base_dir, href)
        if not os.path.exists(css_path):
            css_path = href
            if not os.path.exists(css_path):
                return match.group(0)
        
        try:
            with open(css_path, 'r', encoding='utf-8') as f:
                css_content = f.read()
            return f'<style>{css_content}</style>'
        except Exception:
            return match.group(0)
    
    html_content = re.sub(css_pattern, replace_css, html_content, flags=re.IGNORECASE)
    
    return html_content


async def convert_html_to_pdf(input_path, output_path, options=None):
    """
    Main conversion function: convert HTML to PDF using Playwright.
    """
    if PLAYWRIGHT_IMPORT_ERROR:
        return {
            "success": False,
            "error": f"playwright import failed: {PLAYWRIGHT_IMPORT_ERROR}",
            "traceback": "",
        }

    if options is None:
        options = {}

    try:
        # Read HTML file
        with open(input_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        # Parse options
        page_size = options.get('pageSize', 'A4').upper()
        orientation = options.get('orientation', 'portrait').lower()
        margins = {
            'top': f"{float(options.get('marginTop', 20))}mm",
            'bottom': f"{float(options.get('marginBottom', 20))}mm",
            'left': f"{float(options.get('marginLeft', 20))}mm",
            'right': f"{float(options.get('marginRight', 20))}mm",
        }
        print_background = options.get('printBackground', True)
        scale = float(options.get('scale', 1.0))
        timeout = int(options.get('timeout', 60000))

        # Sanitize HTML
        html_content = sanitize_html(html_content)

        # Process assets if base directory provided
        base_dir = os.path.dirname(os.path.abspath(input_path))
        html_content = process_assets(html_content, base_dir)

        # Add print CSS for better pagination
        print_css = """
        <style>
        @page {
            margin: 0;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
            a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 0.8em; color: #666; }
        }
        </style>
        """
        # Inject print CSS before closing head tag
        if '</head>' in html_content:
            html_content = html_content.replace('</head>', f'{print_css}</head>')
        else:
            html_content = f'{print_css}{html_content}'

        # Write temporary HTML file for Playwright to load
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as f:
            f.write(html_content)
            temp_html_path = f.name

        try:
            async with async_playwright() as p:
                # Launch browser
                browser = await p.chromium.launch(
                    headless=True,
                    args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                )
                
                context = await browser.new_context()
                page = await context.new_page()
                
                # Set viewport for consistent rendering
                await page.set_viewport_size({"width": 1200, "height": 1600})
                
                # Load the HTML file
                file_url = f'file://{temp_html_path}'
                await page.goto(file_url, wait_until='networkidle', timeout=timeout)
                
                # Wait for images to load
                await page.wait_for_load_state('networkidle')
                
                # Give a moment for any dynamic content
                await page.wait_for_timeout(500)
                
                # Generate PDF
                pdf_options = {
                    "path": output_path,
                    "format": page_size if page_size in ['A4', 'Letter', 'Legal', 'Tabloid', 'A3', 'A5'] else 'A4',
                    "landscape": orientation == 'landscape',
                    "print_background": print_background,
                    "scale": scale,
                    "margin": margins,
                }
                
                await page.pdf(**pdf_options)
                await browser.close()

        finally:
            # Clean up temp HTML file
            try:
                os.unlink(temp_html_path)
            except Exception:
                pass

        # Verify output
        if not os.path.exists(output_path):
            return {"success": False, "error": "PDF output file was not created", "traceback": ""}
        
        file_size = os.path.getsize(output_path)
        if file_size == 0:
            return {"success": False, "error": "PDF output file is empty", "traceback": ""}

        return {
            "success": True,
            "output_path": output_path,
            "file_size": file_size,
            "page_size": page_size,
            "orientation": orientation,
        }

    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python html_to_pdf.py <input.html> <output.pdf> [options_json]
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python html_to_pdf.py <input.html> <output.pdf> [options_json]"
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

    result = asyncio.run(convert_html_to_pdf(input_path, output_path, options))
    print(json.dumps(result))


if __name__ == "__main__":
    main()