#!/usr/bin/env python3
"""
Image Compression using Pillow, MozJPEG, libvips, oxipng, pngquant.
Supports JPG, PNG, WEBP compression with various quality settings.
"""

import sys
import os
import json
import platform
import traceback
import subprocess
import shutil
from importlib.metadata import version, PackageNotFoundError

try:
    from PIL import Image, ImageOps
    PIL_IMPORT_ERROR = None
except Exception as exc:
    Image = None
    PIL_IMPORT_ERROR = exc

# Check for MozJPEG cjpeg
def check_mozjpeg():
    """Check if MozJPEG cjpeg is available."""
    try:
        result = subprocess.run(['cjpeg', '-version'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return True, result.stdout.strip()
    except Exception:
        pass
    return False, None

# Check for libvips vips
def check_libvips():
    """Check if libvips vips is available."""
    try:
        result = subprocess.run(['vips', '--version'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return True, result.stdout.strip()
    except Exception:
        pass
    return False, None

# Check for oxipng
def check_oxipng():
    """Check if oxipng is available."""
    try:
        result = subprocess.run(['oxipng', '--version'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return True, result.stdout.strip()
    except Exception:
        pass
    return False, None

# Check for pngquant
def check_pngquant():
    """Check if pngquant is available."""
    try:
        result = subprocess.run(['pngquant', '--version'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return True, result.stdout.strip()
    except Exception:
        pass
    return False, None

MOZJPEG_AVAILABLE, MOZJPEG_VERSION = check_mozjpeg()
LIBVIPS_AVAILABLE, LIBVIPS_VERSION = check_libvips()
OXIPNG_AVAILABLE, OXIPNG_VERSION = check_oxipng()
PNGQUANT_AVAILABLE, PNGQUANT_VERSION = check_pngquant()


def check_environment():
    """Report the interpreter and dependency status without converting."""
    errors = []
    warnings = []

    if Image is None:
        errors.append(f"PIL: {type(PIL_IMPORT_ERROR).__name__}: {PIL_IMPORT_ERROR}")

    if not OXIPNG_AVAILABLE:
        warnings.append("oxipng not available - will use Pillow for PNG optimization (less effective)")
    if not PNGQUANT_AVAILABLE:
        warnings.append("pngquant not available - lossy PNG optimization unavailable")
    if not MOZJPEG_AVAILABLE:
        warnings.append("MozJPEG cjpeg not available - will use Pillow for JPEG (less efficient)")
    if not LIBVIPS_AVAILABLE:
        warnings.append("libvips not available - advanced image processing unavailable")

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

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "pillow_version": pil_version,
        "oxipng_available": OXIPNG_AVAILABLE,
        "oxipng_version": OXIPNG_VERSION,
        "pngquant_available": PNGQUANT_AVAILABLE,
        "pngquant_version": PNGQUANT_VERSION,
        "mozjpeg_available": MOZJPEG_AVAILABLE,
        "mozjpeg_version": MOZJPEG_VERSION,
        "libvips_available": LIBVIPS_AVAILABLE,
        "libvips_version": LIBVIPS_VERSION,
        "warnings": warnings,
    }


def get_jpeg_quality_for_level(level):
    """Get JPEG quality for compression level."""
    return {
        'low': 90,
        'recommended': 80,
        'high': 65,
        'custom': None,  # Will be set by user
    }.get(level, 80)


def compress_jpg_mozjpeg(input_path, output_path, quality=80, progressive=True):
    """
    Compress JPG using MozJPEG cjpeg for better compression efficiency.
    """
    if not MOZJPEG_AVAILABLE:
        return {"success": False, "error": "MozJPEG not available", "code": "MISSING_DEPENDENCY"}

    try:
        original_size = os.path.getsize(input_path)

        # Build cjpeg command
        # -quality: 0-100
        # -progressive: enable progressive JPEG
        # -optimize: optimize Huffman tables
        # -outfile: output file
        cmd = ['cjpeg', '-quality', str(quality)]
        if progressive:
            cmd.append('-progressive')
        cmd.extend(['-optimize', '-outfile', output_path, input_path])

        result = subprocess.run(cmd, capture_output=True, timeout=120)

        if result.returncode != 0:
            return {"success": False, "error": f"cjpeg failed: {result.stderr.decode() if result.stderr else 'unknown'}", "traceback": result.stderr.decode() if result.stderr else ""}

        compressed_size = os.path.getsize(output_path)
        return {
            "success": True,
            "output_path": output_path,
            "method": "mozjpeg",
            "original_size": original_size,
            "compressed_size": compressed_size,
            "bytes_saved": original_size - compressed_size,
            "reduction_percent": round((original_size - compressed_size) / original_size * 100, 2),
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "MozJPEG compression timed out", "code": "TIMEOUT"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def compress_jpg_libvips(input_path, output_path, quality=80, progressive=True):
    """
    Compress JPG using libvips for high-performance compression.
    """
    if not LIBVIPS_AVAILABLE:
        return {"success": False, "error": "libvips not available", "code": "MISSING_DEPENDENCY"}

    try:
        original_size = os.path.getsize(input_path)

        # vips jpegsave options:
        # Q: quality (1-100)
        # optimize-coding: optimize Huffman tables
        # interlace: progressive JPEG
        # strip: remove metadata
        cmd = ['vips', 'jpegsave', input_path, output_path,
               f'Q={quality}',
               'optimize-coding=true',
               'strip=true']
        if progressive:
            cmd.append('interlace=true')

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            return {"success": False, "error": f"vips failed: {result.stderr}", "traceback": result.stderr}

        compressed_size = os.path.getsize(output_path)
        return {
            "success": True,
            "output_path": output_path,
            "method": "libvips",
            "original_size": original_size,
            "compressed_size": compressed_size,
            "bytes_saved": original_size - compressed_size,
            "reduction_percent": round((original_size - compressed_size) / original_size * 100, 2),
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "libvips compression timed out", "code": "TIMEOUT"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def compress_jpg_pillow(input_path, output_path, quality=80, optimize=True, progressive=True):
    """
    Compress JPG image using Pillow (fallback).
    """
    try:
        original_size = os.path.getsize(input_path)
        image = Image.open(input_path)

        # Apply EXIF orientation correction
        image = ImageOps.exif_transpose(image)

        # Handle transparency by compositing on white background
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            if image.mode in ('RGBA', 'LA'):
                background.paste(image, mask=image.split()[-1])
            else:
                background.paste(image)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')

        # Save with optimization
        save_kwargs = {
            'format': 'JPEG',
            'quality': quality,
            'optimize': optimize,
        }
        if progressive:
            save_kwargs['progressive'] = True

        image.save(output_path, **save_kwargs)

        compressed_size = os.path.getsize(output_path)
        return {
            "success": True,
            "output_path": output_path,
            "width": image.width,
            "height": image.height,
            "method": "pillow",
            "original_size": original_size,
            "compressed_size": compressed_size,
            "bytes_saved": original_size - compressed_size,
            "reduction_percent": round((original_size - compressed_size) / original_size * 100, 2),
        }

    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def compress_jpg(input_path, output_path, quality=80, optimize=True, progressive=True):
    """
    Compress JPG image using best available encoder.
    Tries MozJPEG -> libvips -> Pillow in order of preference.
    """
    # Try MozJPEG first (best compression efficiency)
    if MOZJPEG_AVAILABLE:
        result = compress_jpg_mozjpeg(input_path, output_path, quality, progressive)
        if result.get('success'):
            return result

    # Try libvips (fast, good compression)
    if LIBVIPS_AVAILABLE:
        result = compress_jpg_libvips(input_path, output_path, quality, progressive)
        if result.get('success'):
            return result

    # Fallback to Pillow
    return compress_jpg_pillow(input_path, output_path, quality, optimize, progressive)


def compress_png_oxipng(input_path, output_path, lossless=True):
    """
    Compress PNG using oxipng for lossless optimization.
    """
    if not OXIPNG_AVAILABLE:
        return {"success": False, "error": "oxipng not available", "code": "MISSING_DEPENDENCY"}

    try:
        original_size = os.path.getsize(input_path)

        # oxipng options:
        # -o 4: optimization level (0-6, 4 is good balance)
        # --strip safe: strip metadata but keep color profile
        # --out: output file
        cmd = ['oxipng', '-o', '4', '--strip', 'safe', '--out', output_path, input_path]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            return {"success": False, "error": f"oxipng failed: {result.stderr}", "traceback": result.stderr}

        compressed_size = os.path.getsize(output_path)
        return {
            "success": True,
            "output_path": output_path,
            "method": "oxipng",
            "lossless": True,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "bytes_saved": original_size - compressed_size,
            "reduction_percent": round((original_size - compressed_size) / original_size * 100, 2),
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "oxipng compression timed out", "code": "TIMEOUT"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def compress_png_pngquant(input_path, output_path, quality=80):
    """
    Compress PNG using pngquant for lossy palette optimization.
    """
    if not PNGQUANT_AVAILABLE:
        return {"success": False, "error": "pngquant not available", "code": "MISSING_DEPENDENCY"}

    try:
        original_size = os.path.getsize(input_path)

        # pngquant options:
        # --quality: min-max quality (e.g., 65-80)
        # --strip: remove metadata
        # --force: overwrite output
        # --output: output file
        # Quality 65-80 is a good range for pngquant
        min_quality = max(10, quality - 15)
        max_quality = quality
        cmd = ['pngquant', '--quality', f'{min_quality}-{max_quality}',
               '--strip', '--force', '--output', output_path, input_path]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            return {"success": False, "error": f"pngquant failed: {result.stderr}", "traceback": result.stderr}

        compressed_size = os.path.getsize(output_path)
        return {
            "success": True,
            "output_path": output_path,
            "method": "pngquant",
            "lossless": False,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "bytes_saved": original_size - compressed_size,
            "reduction_percent": round((original_size - compressed_size) / original_size * 100, 2),
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "pngquant compression timed out", "code": "TIMEOUT"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def compress_png_libvips(input_path, output_path, lossless=True, quality=80):
    """
    Compress PNG using libvips.
    """
    if not LIBVIPS_AVAILABLE:
        return {"success": False, "error": "libvips not available", "code": "MISSING_DEPENDENCY"}

    try:
        original_size = os.path.getsize(input_path)

        # vips pngsave options:
        # compression: 0-9 (9 = best compression)
        # interlace: progressive
        # strip: remove metadata
        # Q: quality for lossy (if not lossless)
        cmd = ['vips', 'pngsave', input_path, output_path,
               'compression=9',
               'strip=true']
        if not lossless:
            cmd.append(f'Q={quality}')

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            return {"success": False, "error": f"vips failed: {result.stderr}", "traceback": result.stderr}

        compressed_size = os.path.getsize(output_path)
        return {
            "success": True,
            "output_path": output_path,
            "method": "libvips",
            "lossless": lossless,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "bytes_saved": original_size - compressed_size,
            "reduction_percent": round((original_size - compressed_size) / original_size * 100, 2),
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "libvips compression timed out", "code": "TIMEOUT"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def compress_png_pillow(input_path, output_path, lossless=True, optimize=True, quality=80):
    """
    Compress PNG image using Pillow (fallback).
    """
    try:
        original_size = os.path.getsize(input_path)
        image = Image.open(input_path)

        # Apply EXIF orientation if present
        if hasattr(image, '_getexif') and image._getexif():
            image = ImageOps.exif_transpose(image)

        if lossless:
            # True lossless - preserve exact pixel data
            image.save(output_path, 'PNG', optimize=optimize, compress_level=9)
        else:
            # Optimized mode - allow palette conversion if beneficial
            if image.mode == 'RGBA':
                try:
                    colors = image.getcolors(maxcolors=256)
                    if colors and len(colors) <= 256:
                        image = image.convert('P', palette=Image.ADAPTIVE, colors=256)
                        image.save(output_path, 'PNG', optimize=optimize, compress_level=9)
                    else:
                        image.save(output_path, 'PNG', optimize=optimize, compress_level=9)
                except Exception:
                    image.save(output_path, 'PNG', optimize=optimize, compress_level=9)
            elif image.mode == 'RGB':
                colors = image.getcolors(maxcolors=256)
                if colors and len(colors) <= 256:
                    image = image.convert('P', palette=Image.ADAPTIVE, colors=256)
                    image.save(output_path, 'PNG', optimize=optimize, compress_level=9)
                else:
                    image.save(output_path, 'PNG', optimize=optimize, compress_level=9)
            else:
                image.save(output_path, 'PNG', optimize=optimize, compress_level=9)

        compressed_size = os.path.getsize(output_path)
        return {
            "success": True,
            "output_path": output_path,
            "width": image.width,
            "height": image.height,
            "method": "pillow",
            "lossless": lossless,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "bytes_saved": original_size - compressed_size,
            "reduction_percent": round((original_size - compressed_size) / original_size * 100, 2),
        }

    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def compress_png(input_path, output_path, lossless=True, optimize=True, quality=80):
    """
    Compress PNG image using best available encoder.
    For lossless: oxipng -> libvips -> Pillow
    For lossy: pngquant -> libvips -> Pillow (palette)
    """
    if lossless:
        # Lossless: oxipng (best) -> libvips -> Pillow
        if OXIPNG_AVAILABLE:
            result = compress_png_oxipng(input_path, output_path)
            if result.get('success'):
                return result

        if LIBVIPS_AVAILABLE:
            result = compress_png_libvips(input_path, output_path, lossless=True)
            if result.get('success'):
                return result

        return compress_png_pillow(input_path, output_path, lossless=True)
    else:
        # Lossy: pngquant (best for palette) -> libvips -> Pillow (palette)
        if PNGQUANT_AVAILABLE:
            result = compress_png_pngquant(input_path, output_path, quality=quality)
            if result.get('success'):
                return result

        if LIBVIPS_AVAILABLE:
            result = compress_png_libvips(input_path, output_path, lossless=False, quality=quality)
            if result.get('success'):
                return result

        return compress_png_pillow(input_path, output_path, lossless=False, quality=quality)


def compress_webp_libvips(input_path, output_path, quality=80, lossless=False, method=6):
    """
    Compress WEBP using libvips.
    """
    if not LIBVIPS_AVAILABLE:
        return {"success": False, "error": "libvips not available", "code": "MISSING_DEPENDENCY"}

    try:
        original_size = os.path.getsize(input_path)

        cmd = ['vips', 'webpsave', input_path, output_path,
               f'Q={quality}',
               'strip=true']
        if lossless:
            cmd.append('lossless=true')
        else:
            cmd.append(f'method={method}')

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            return {"success": False, "error": f"vips failed: {result.stderr}", "traceback": result.stderr}

        compressed_size = os.path.getsize(output_path)
        return {
            "success": True,
            "output_path": output_path,
            "method": "libvips",
            "lossless": lossless,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "bytes_saved": original_size - compressed_size,
            "reduction_percent": round((original_size - compressed_size) / original_size * 100, 2),
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "libvips compression timed out", "code": "TIMEOUT"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def compress_webp_pillow(input_path, output_path, quality=80, lossless=False, method=6):
    """
    Compress WEBP image using Pillow.
    """
    try:
        image = Image.open(input_path)

        # Handle animated WebP - use first frame only for now
        if getattr(image, 'n_frames', 1) > 1:
            image.seek(0)

        # Apply EXIF orientation if present
        if hasattr(image, '_getexif') and image._getexif():
            image = ImageOps.exif_transpose(image)

        original_size = os.path.getsize(input_path)

        save_kwargs = {
            'format': 'WEBP',
            'method': method,
        }

        if lossless:
            save_kwargs['lossless'] = True
        else:
            save_kwargs['quality'] = quality

        image.save(output_path, **save_kwargs)

        compressed_size = os.path.getsize(output_path)
        return {
            "success": True,
            "output_path": output_path,
            "width": image.width,
            "height": image.height,
            "method": "pillow",
            "lossless": lossless,
            "original_size": original_size,
            "compressed_size": compressed_size,
            "bytes_saved": original_size - compressed_size,
            "reduction_percent": round((original_size - compressed_size) / original_size * 100, 2),
        }

    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def compress_webp(input_path, output_path, quality=80, lossless=False, method=6):
    """
    Compress WEBP image using best available encoder.
    libvips -> Pillow
    """
    if LIBVIPS_AVAILABLE:
        result = compress_webp_libvips(input_path, output_path, quality, lossless, method)
        if result.get('success'):
            return result

    return compress_webp_pillow(input_path, output_path, quality, lossless, method)


def get_image_info(input_path):
    """
    Get basic image information.
    """
    try:
        if Image is None:
            return None
        image = Image.open(input_path)
        info = {
            "width": image.width,
            "height": image.height,
            "mode": image.mode,
            "format": image.format,
        }
        if hasattr(image, 'n_frames') and image.n_frames > 1:
            info["frames"] = image.n_frames
            info["animated"] = True
        image.close()
        return info
    except Exception:
        return None


def compress_image(input_path, output_path, input_format, output_format, quality=80, lossless=False, progressive=True, use_oxipng=True):
    """
    Main compression function that routes to appropriate compressor.
    """
    input_format = input_format.lower()
    output_format = output_format.lower()

    # Validate formats
    supported_input = ('jpg', 'jpeg', 'png', 'webp')
    supported_output = ('jpg', 'jpeg', 'png', 'webp')

    if input_format not in supported_input:
        return {"success": False, "error": f"Unsupported input format: {input_format}", "code": "UNSUPPORTED_FORMAT"}

    if output_format not in supported_output:
        return {"success": False, "error": f"Unsupported output format: {output_format}", "code": "UNSUPPORTED_FORMAT"}

    # Validate file exists
    if not os.path.exists(input_path):
        return {"success": False, "error": f"Input file not found: {input_path}", "code": "INVALID_INPUT"}

    # Route to appropriate compressor
    if output_format in ('jpg', 'jpeg'):
        result = compress_jpg(input_path, output_path, quality=quality, progressive=progressive)
    elif output_format == 'png':
        result = compress_png(input_path, output_path, lossless=lossless, quality=quality)
    elif output_format == 'webp':
        result = compress_webp(input_path, output_path, quality=quality, lossless=lossless)
    else:
        return {"success": False, "error": f"Unknown output format: {output_format}", "code": "UNSUPPORTED_FORMAT"}

    if result.get('success'):
        # Add format info
        result['input_format'] = input_format
        result['output_format'] = output_format
        result['quality'] = quality
        result['lossless'] = lossless

        # If output is larger than input, note it
        if 'original_size' in result and 'compressed_size' in result:
            if result['compressed_size'] >= result['original_size']:
                result['warning'] = "Compressed file is not smaller than original"
                result['smaller'] = False
            else:
                result['smaller'] = True

    return result


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    if len(sys.argv) < 5:
        print(json.dumps({
            "success": False,
            "error": "Usage: python image_compressor.py <input> <output> <input_format> <output_format> [quality] [lossless] [progressive] [use_oxipng]"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    input_format = sys.argv[3].lower()
    output_format = sys.argv[4].lower()
    quality = int(sys.argv[5]) if len(sys.argv) >= 6 else 80
    lossless = sys.argv[6].lower() == 'true' if len(sys.argv) >= 7 else False
    progressive = sys.argv[7].lower() == 'true' if len(sys.argv) >= 8 else True
    use_oxipng = sys.argv[8].lower() == 'true' if len(sys.argv) >= 9 else True

    result = compress_image(input_path, output_path, input_format, output_format, quality, lossless, progressive, use_oxipng)
    print(json.dumps(result))


if __name__ == "__main__":
    main()