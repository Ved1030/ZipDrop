#!/usr/bin/env python3
"""
Image to Image conversion using Pillow and CairoSVG.
Supports: JPG, PNG, WEBP, SVG conversions.
"""

import sys
import os
import json
import platform
import traceback
from importlib.metadata import version, PackageNotFoundError

try:
    from PIL import Image, ImageOps
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

    if Image is None:
        errors.append(f"PIL: {type(PIL_IMPORT_ERROR).__name__}: {PIL_IMPORT_ERROR}")

    if cairosvg is None:
        warnings.append("cairosvg not available - SVG conversion will not work")

    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
            "warnings": warnings,
        }

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
        "pillow_version": pil_version,
        "cairosvg_version": cairosvg_version,
        "warnings": warnings,
    }


def load_image(input_path, input_format, width=None, height=None, background_color=None):
    """
    Load an image from file, handling different formats.
    Returns PIL Image object.
    """
    input_format = input_format.lower()
    
    if input_format == 'svg':
        if cairosvg is None:
            raise RuntimeError("cairosvg not available for SVG conversion")
        # Convert SVG to PNG in memory, then load with PIL
        import io
        
        # Build cairosvg options
        svg_options = {}
        if width:
            svg_options['output_width'] = int(width)
        if height:
            svg_options['output_height'] = int(height)
        if background_color:
            # Parse hex color to RGB
            bg = background_color.lstrip('#')
            if len(bg) == 6:
                svg_options['background_color'] = f"rgb({int(bg[0:2], 16)}, {int(bg[2:4], 16)}, {int(bg[4:6], 16)})"
        
        try:
            png_data = cairosvg.svg2png(url=input_path, dpi=300, **svg_options)
        except Exception as e:
            raise ValueError(f"Invalid or malformed SVG file: {str(e)}")
        image = Image.open(io.BytesIO(png_data))
        return image
    
    elif input_format in ('jpg', 'jpeg', 'png', 'webp'):
        image = Image.open(input_path)
        
        # Resize if dimensions specified (for non-SVG formats)
        if width or height:
            target_width = int(width) if width else image.width
            target_height = int(height) if height else image.height
            
            # If only one dimension specified, calculate the other to preserve aspect ratio
            if width and not height:
                target_height = int(image.height * target_width / image.width)
            elif height and not width:
                target_width = int(image.width * target_height / image.height)
            
            # Resize with high-quality resampling
            image = image.resize((target_width, target_height), Image.Resampling.LANCZOS)
        
        return image
    
    else:
        raise ValueError(f"Unsupported input format: {input_format}")


def save_image(image, output_path, output_format, quality=90, lossless=False, background_color=None):
    """
    Save PIL Image to file in specified format.
    """
    output_format = output_format.lower()
    
    if output_format in ('jpg', 'jpeg'):
        # Handle transparency by compositing on background
        bg_color = (255, 255, 255)  # Default white
        if background_color:
            bg = background_color.lstrip('#')
            if len(bg) == 6:
                bg_color = (int(bg[0:2], 16), int(bg[2:4], 16), int(bg[4:6], 16))
        
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, bg_color)
            if image.mode == 'P':
                image = image.convert('RGBA')
            if image.mode in ('RGBA', 'LA'):
                background.paste(image, mask=image.split()[-1])
            else:
                background.paste(image)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        image.save(output_path, 'JPEG', quality=quality, optimize=True)
    
    elif output_format == 'png':
        # PNG preserves transparency unless background color specified
        if background_color and image.mode in ('RGBA', 'LA', 'P'):
            bg = background_color.lstrip('#')
            if len(bg) == 6:
                bg_color = (int(bg[0:2], 16), int(bg[2:4], 16), int(bg[4:6], 16))
                background = Image.new('RGB', image.size, bg_color)
                if image.mode == 'P':
                    image = image.convert('RGBA')
                if image.mode in ('RGBA', 'LA'):
                    background.paste(image, mask=image.split()[-1])
                else:
                    background.paste(image)
                image = background
        image.save(output_path, 'PNG', optimize=True)
    
    elif output_format == 'webp':
        # WebP supports both lossy and lossless
        if background_color and image.mode in ('RGBA', 'LA', 'P'):
            bg = background_color.lstrip('#')
            if len(bg) == 6:
                bg_color = (int(bg[0:2], 16), int(bg[2:4], 16), int(bg[4:6], 16))
                background = Image.new('RGB', image.size, bg_color)
                if image.mode == 'P':
                    image = image.convert('RGBA')
                if image.mode in ('RGBA', 'LA'):
                    background.paste(image, mask=image.split()[-1])
                else:
                    background.paste(image)
                image = background
        if lossless:
            image.save(output_path, 'WEBP', lossless=True, method=6)
        else:
            image.save(output_path, 'WEBP', quality=quality, method=6)
    
    else:
        raise ValueError(f"Unsupported output format: {output_format}")


def convert_image(input_path, output_path, input_format, output_format, quality=90, lossless=False, width=None, height=None, background_color=None):
    """
    Convert image from one format to another.
    """
    if Image is None:
        return {
            "success": False,
            "error": f"PIL import failed: {PIL_IMPORT_ERROR}",
            "traceback": "",
        }

    try:
        # Load image
        image = load_image(input_path, input_format, width, height, background_color)
        
        # Apply EXIF orientation correction for JPEG
        if input_format in ('jpg', 'jpeg'):
            image = ImageOps.exif_transpose(image)
        
        # Handle animated WebP - use first frame only
        if input_format == 'webp' and getattr(image, 'n_frames', 1) > 1:
            # Seek to first frame
            image.seek(0)
        
        # Save image
        save_image(image, output_path, output_format, quality, lossless, background_color)
        
        return {
            "success": True,
            "output_path": output_path,
            "format": output_format,
            "width": image.width,
            "height": image.height,
            "mode": image.mode,
        }
    
    except ValueError as e:
        # Validation errors (malformed files, unsupported formats, etc.)
        return {"success": False, "error": str(e), "code": "INVALID_INPUT", "traceback": traceback.format_exc()}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python image_to_image.py <input> <output> <input_format> <output_format> [quality] [lossless] [width] [height] [background_color]
    if len(sys.argv) < 5 or len(sys.argv) > 10:
        print(json.dumps({
            "success": False,
            "error": "Usage: python image_to_image.py <input> <output> <input_format> <output_format> [quality] [lossless] [width] [height] [background_color]"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    input_format = sys.argv[3].lower()
    output_format = sys.argv[4].lower()
    quality = int(sys.argv[5]) if len(sys.argv) >= 6 else 90
    lossless = sys.argv[6].lower() == 'true' if len(sys.argv) >= 7 else False
    width = int(sys.argv[7]) if len(sys.argv) >= 8 and sys.argv[7] else None
    height = int(sys.argv[8]) if len(sys.argv) >= 9 and sys.argv[8] else None
    background_color = sys.argv[9] if len(sys.argv) >= 10 and sys.argv[9] else None

    supported_input = ('jpg', 'jpeg', 'png', 'webp', 'svg')
    supported_output = ('jpg', 'jpeg', 'png', 'webp')

    if input_format not in supported_input:
        print(json.dumps({"success": False, "error": f"Unsupported input format: {input_format}"}))
        sys.exit(1)

    if output_format not in supported_output:
        print(json.dumps({"success": False, "error": f"Unsupported output format: {output_format}"}))
        sys.exit(1)

    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)

    result = convert_image(input_path, output_path, input_format, output_format, quality, lossless, width, height, background_color)
    print(json.dumps(result))


if __name__ == "__main__":
    main()