#!/usr/bin/env python3
"""
PDF Compression using Ghostscript, pikepdf, and qpdf.
Supports multiple compression levels while preserving document structure.
"""

import sys
import os
import json
import platform
import traceback
import subprocess
import tempfile
import shutil
from importlib.metadata import version, PackageNotFoundError

# Check for pikepdf
try:
    import pikepdf
    PIKEPDF_IMPORT_ERROR = None
except Exception as exc:
    pikepdf = None
    PIKEPDF_IMPORT_ERROR = exc

# Check for qpdf command line tool
def check_qpdf():
    """Check if qpdf is available."""
    try:
        result = subprocess.run(['qpdf', '--version'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return True, result.stdout.strip()
    except Exception:
        pass
    return False, None

QPDF_AVAILABLE, QPDF_VERSION = check_qpdf()

# Check for Ghostscript
def check_ghostscript():
    """Check if Ghostscript is available."""
    try:
        for cmd in ['gs', 'gswin64c', 'gswin32c']:
            try:
                result = subprocess.run([cmd, '--version'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    return True, cmd, result.stdout.strip()
            except Exception:
                continue
    except Exception:
        pass
    return False, None, None

GHOSTSCRIPT_AVAILABLE, GHOSTSCRIPT_CMD, GHOSTSCRIPT_VERSION = check_ghostscript()


def check_environment():
    """Report the interpreter and dependency status without converting."""
    errors = []
    warnings = []

    if pikepdf is None:
        errors.append(f"pikepdf: {type(PIKEPDF_IMPORT_ERROR).__name__}: {PIKEPDF_IMPORT_ERROR}")

    if not QPDF_AVAILABLE:
        warnings.append("qpdf not available - will use pikepdf only (limited optimization)")

    if not GHOSTSCRIPT_AVAILABLE:
        warnings.append("Ghostscript not available - image downsampling unavailable")

    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
            "warnings": warnings,
        }

    try:
        pikepdf_version = version("pikepdf")
    except PackageNotFoundError:
        pikepdf_version = "unknown"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "pikepdf_version": pikepdf_version,
        "qpdf_available": QPDF_AVAILABLE,
        "qpdf_version": QPDF_VERSION,
        "ghostscript_available": GHOSTSCRIPT_AVAILABLE,
        "ghostscript_version": GHOSTSCRIPT_VERSION,
        "ghostscript_cmd": GHOSTSCRIPT_CMD,
        "warnings": warnings,
    }


def get_dpi_for_level(level):
    """Get target DPI for compression level."""
    return {
        'low': 150,
        'recommended': 150,
        'high': 96,
    }.get(level, 150)


def get_jpeg_quality_for_level(level):
    """Get JPEG quality for compression level."""
    return {
        'low': 85,
        'recommended': 75,
        'high': 60,
    }.get(level, 75)


def compress_with_ghostscript(input_path, output_path, level):
    """
    Compress PDF using Ghostscript with image downsampling and recompression.
    This provides the best compression for image-heavy PDFs.
    """
    if not GHOSTSCRIPT_AVAILABLE:
        return {"success": False, "error": "Ghostscript not available", "code": "MISSING_DEPENDENCY"}

    dpi = get_dpi_for_level(level)
    jpeg_quality = get_jpeg_quality_for_level(level)

    cmd = [
        GHOSTSCRIPT_CMD,
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        '-dPrinted=false',
        '-dSAFER',
        f'-dDownsampleColorImages=true',
        f'-dColorImageDownsampleType=/Bicubic',
        f'-dColorImageResolution={dpi}',
        f'-dDownsampleGrayImages=true',
        f'-dGrayImageDownsampleType=/Bicubic',
        f'-dGrayImageResolution={dpi}',
        f'-dDownsampleMonoImages=true',
        f'-dMonoImageDownsampleType=/Subsample',
        f'-dMonoImageResolution={dpi}',
        f'-dColorImageFilter=/DCTEncode',
        f'-dJPEGQ={jpeg_quality}',
        f'-dGrayImageFilter=/DCTEncode',
        f'-dMonoImageFilter=/CCITTFaxEncode',
        '-dEmbedAllFonts=true',
        '-dSubsetFonts=true',
        '-dConvertCMYKImagesToRGB=true',
        '-dDetectDuplicateImages=true',
        '-dCompressFonts=true',
        '-dCompressPages=true',
        f'-sOutputFile={output_path}',
        input_path
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

        if result.returncode != 0:
            return {"success": False, "error": f"Ghostscript failed: {result.stderr}", "traceback": result.stderr}

        if not os.path.exists(output_path):
            return {"success": False, "error": "Ghostscript did not produce output file"}

        return {
            "success": True,
            "output_path": output_path,
            "method": f"ghostscript_{level}",
            "level": level,
            "dpi": dpi,
            "jpeg_quality": jpeg_quality,
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Ghostscript compression timed out", "code": "TIMEOUT"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def compress_with_pikepdf(input_path, output_path, level):
    """
    Compress PDF using pikepdf.
    """
    try:
        pdf = pikepdf.open(input_path)
        page_count = len(pdf.pages)

        # Apply compression based on level
        if level == 'low':
            pdf.save(output_path,
                     object_stream_mode=pikepdf.ObjectStreamMode.generate,
                     compress_streams=True,
                     linearize=False)
        elif level == 'recommended':
            pdf.save(output_path,
                     object_stream_mode=pikepdf.ObjectStreamMode.generate,
                     compress_streams=True,
                     linearize=True,
                     recompress_flate=True)
        elif level == 'high':
            pdf.save(output_path,
                     object_stream_mode=pikepdf.ObjectStreamMode.generate,
                     compress_streams=True,
                     linearize=True,
                     recompress_flate=True,
                     decode_streams=True)
        else:
            pdf.save(output_path,
                     object_stream_mode=pikepdf.ObjectStreamMode.generate,
                     compress_streams=True,
                     linearize=True)

        pdf.close()

        return {
            "success": True,
            "output_path": output_path,
            "page_count": page_count,
            "method": "pikepdf",
            "level": level,
        }

    except pikepdf.PasswordError:
        return {"success": False, "error": "PDF is password protected", "code": "PASSWORD_PROTECTED", "traceback": traceback.format_exc()}
    except pikepdf.PdfError as e:
        return {"success": False, "error": f"Invalid or corrupted PDF: {str(e)}", "code": "CORRUPTED_FILE", "traceback": traceback.format_exc()}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def compress_with_qpdf(input_path, output_path, level):
    """
    Compress PDF using qpdf command line tool for stronger optimization.
    """
    if not QPDF_AVAILABLE:
        return {"success": False, "error": "qpdf not available", "code": "MISSING_DEPENDENCY"}

    try:
        if level == 'low':
            cmd = ['qpdf', '--object-streams=generate', '--stream-data=compress', '--linearize', input_path, output_path]
        elif level == 'recommended':
            cmd = ['qpdf', '--object-streams=generate', '--stream-data=compress', '--linearize', '--recompress-flate', input_path, output_path]
        elif level == 'high':
            cmd = ['qpdf', '--object-streams=generate', '--stream-data=compress', '--linearize', '--recompress-flate', '--decode-level=all', input_path, output_path]
        else:
            cmd = ['qpdf', '--object-streams=generate', '--stream-data=compress', '--linearize', input_path, output_path]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            return {"success": False, "error": f"qpdf failed: {result.stderr}", "traceback": result.stderr}

        return {
            "success": True,
            "output_path": output_path,
            "method": "qpdf",
            "level": level,
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Compression timed out", "code": "TIMEOUT"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def get_dpi_for_level(level):
    """Get target DPI for compression level."""
    return {
        'low': 150,
        'recommended': 150,
        'high': 96,
    }.get(level, 150)


def get_jpeg_quality_for_level(level):
    """Get JPEG quality for compression level."""
    return {
        'low': 85,
        'recommended': 75,
        'high': 60,
    }.get(level, 75)


def compress_pdf(input_path, output_path, level="recommended"):
    """
    Main compression function with multiple strategies and fallback.
    Strategy order:
    1. Ghostscript (best for image-heavy PDFs) - for recommended/high
    2. qpdf (good structural optimization)
    3. pikepdf (fallback)
    
    Returns the best result (smallest output that's actually smaller than input).
    """
    valid_levels = ['low', 'recommended', 'high']
    if level not in valid_levels:
        level = 'recommended'

    original_size = os.path.getsize(input_path)
    best_result = None
    best_size = original_size

    # Strategy 1: Ghostscript (best for image-heavy PDFs)
    if GHOSTSCRIPT_AVAILABLE and level in ['recommended', 'high']:
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp_path = tmp.name
        try:
            result = compress_with_ghostscript(input_path, tmp_path, level)
            if result.get('success'):
                compressed_size = os.path.getsize(tmp_path)
                if compressed_size < original_size:
                    result['original_size'] = original_size
                    result['compressed_size'] = compressed_size
                    result['bytes_saved'] = original_size - compressed_size
                    result['reduction_percent'] = round((original_size - compressed_size) / original_size * 100, 2)
                    result['smaller'] = True
                    best_result = result
                    best_size = compressed_size
                    shutil.move(tmp_path, output_path)
                else:
                    if os.path.exists(tmp_path):
                        os.unlink(tmp_path)
        except Exception:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    # Strategy 2: qpdf (structural optimization)
    if QPDF_AVAILABLE and (best_result is None or level == 'high'):
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp_path = tmp.name
        try:
            result = compress_with_qpdf(input_path, tmp_path, level)
            if result.get('success'):
                compressed_size = os.path.getsize(tmp_path)
                if compressed_size < original_size and compressed_size < best_size:
                    result['original_size'] = original_size
                    result['compressed_size'] = compressed_size
                    result['bytes_saved'] = original_size - compressed_size
                    result['reduction_percent'] = round((original_size - compressed_size) / original_size * 100, 2)
                    result['smaller'] = True
                    best_result = result
                    best_size = compressed_size
                    if os.path.exists(output_path):
                        os.unlink(output_path)
                    shutil.move(tmp_path, output_path)
                else:
                    if os.path.exists(tmp_path):
                        os.unlink(tmp_path)
        except Exception:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    # Strategy 3: pikepdf (fallback)
    if best_result is None:
        try:
            result = compress_with_pikepdf(input_path, output_path, level)
            if result.get('success'):
                compressed_size = os.path.getsize(output_path)
                result['original_size'] = original_size
                result['compressed_size'] = compressed_size
                result['bytes_saved'] = original_size - compressed_size
                result['reduction_percent'] = round((original_size - compressed_size) / original_size * 100, 2)
                result['smaller'] = compressed_size < original_size
                if not result['smaller']:
                    result['warning'] = "PDF was already optimized or compression did not reduce size"
                best_result = result
                best_size = compressed_size
        except Exception:
            pass

    if best_result is None:
        return {"success": False, "error": "All compression methods failed"}

    return best_result


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python pdf_compressor.py <input.pdf> <output.pdf> [low|recommended|high]"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    level = sys.argv[3] if len(sys.argv) == 4 else "recommended"

    if level not in ('low', 'recommended', 'high'):
        print(json.dumps({"success": False, "error": f"Invalid level: {level}. Use 'low', 'recommended', or 'high'"}))
        sys.exit(1)

    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)

    result = compress_pdf(input_path, output_path, level)
    print(json.dumps(result))


if __name__ == "__main__":
    main()