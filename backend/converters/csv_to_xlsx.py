#!/usr/bin/env python3
"""
CSV to Excel conversion using openpyxl and Python's csv module.
Parses CSV with delimiter detection and creates XLSX workbook.
"""

import sys
import os
import json
import platform
import traceback
import csv
import chardet
from importlib.metadata import version, PackageNotFoundError

try:
    import openpyxl
    from openpyxl.styles import Font, Alignment, PatternFill, Border, Side, numbers
    from openpyxl.utils import get_column_letter
    OPENPYXL_IMPORT_ERROR = None
except Exception as exc:
    openpyxl = None
    OPENPYXL_IMPORT_ERROR = exc

# Formula injection prevention - prefix cells starting with =, +, -, @
FORMULA_PREFIXES = ('=', '+', '-', '@')


def check_environment():
    """Report the interpreter and dependency status without converting."""
    errors = []
    warnings = []

    if OPENPYXL_IMPORT_ERROR:
        errors.append(f"openpyxl: {type(OPENPYXL_IMPORT_ERROR).__name__}: {OPENPYXL_IMPORT_ERROR}")

    try:
        import chardet
    except ImportError:
        errors.append("chardet: not installed (required for encoding detection)")

    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
            "warnings": warnings,
        }

    try:
        openpyxl_version = version("openpyxl")
        chardet_version = version("chardet")
    except PackageNotFoundError:
        openpyxl_version = "unknown"
        chardet_version = "unknown"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "openpyxl_version": openpyxl_version,
        "chardet_version": chardet_version,
        "warnings": warnings,
    }


def detect_encoding(file_path, sample_size=100000):
    """Detect file encoding using chardet."""
    with open(file_path, 'rb') as f:
        sample = f.read(sample_size)
    result = chardet.detect(sample)
    encoding = result.get('encoding', 'utf-8')
    confidence = result.get('confidence', 0)
    
    # Normalize encoding names
    encoding = encoding.lower()
    if encoding in ('ascii', 'utf-8', 'utf-8-sig'):
        return 'utf-8-sig'
    elif encoding in ('utf-16', 'utf-16le', 'utf-16be'):
        return encoding
    elif encoding in ('latin-1', 'iso-8859-1', 'cp1252', 'windows-1252'):
        return 'cp1252'
    else:
        return 'utf-8-sig'  # Safe default


def detect_delimiter(sample_text, delimiters=None):
    """Detect CSV delimiter from sample text."""
    if delimiters is None:
        delimiters = [',', ';', '\t', '|', ':']
    
    lines = sample_text.split('\n')[:10]  # Check first 10 lines
    if not lines:
        return ','
    
    best_delimiter = ','
    best_score = 0
    
    for delim in delimiters:
        # Count occurrences per line
        counts = [line.count(delim) for line in lines if line.strip()]
        if not counts:
            continue
        # Check if delimiter appears consistently
        if len(set(counts)) == 1 and counts[0] > 0:
            score = counts[0] * len(counts)
            if score > best_score:
                best_score = score
                best_delimiter = delim
    
    return best_delimiter


def sanitize_cell_value(value):
    """
    Sanitize cell value to prevent formula injection.
    Prefix dangerous values with a single quote to force text interpretation.
    """
    if value is None:
        return ""
    
    value = str(value)
    
    # Strip leading/trailing whitespace but preserve internal
    value = value.strip()
    
    # Check for formula injection
    if value and value[0] in FORMULA_PREFIXES:
        return "'" + value
    
    return value


def try_parse_number(value):
    """Try to parse value as number, return original if fails."""
    if not value or value.startswith("'"):
        return value
    
    # Try integer
    try:
        return int(value)
    except ValueError:
        pass
    
    # Try float
    try:
        return float(value)
    except ValueError:
        pass
    
    return value


def convert_csv_to_xlsx(input_path, output_path, options=None):
    """
    Main conversion function: convert CSV to XLSX.
    """
    if OPENPYXL_IMPORT_ERROR:
        return {
            "success": False,
            "error": f"openpyxl import failed: {OPENPYXL_IMPORT_ERROR}",
            "traceback": "",
        }

    if options is None:
        options = {}

    try:
        # Detect encoding
        encoding = options.get('encoding')
        if not encoding:
            encoding = detect_encoding(input_path)
        
        # Read sample for delimiter detection
        with open(input_path, 'r', encoding=encoding, errors='replace') as f:
            sample = f.read(50000)
        
        # Detect delimiter
        delimiter = options.get('delimiter')
        if not delimiter:
            delimiter = detect_delimiter(sample)
        
        # Parse options
        sheet_name = options.get('sheetName', 'Sheet1')[:31]  # Excel limit
        has_header = options.get('hasHeader', True)
        skip_rows = int(options.get('skipRows', 0))
        max_rows = options.get('maxRows')
        if max_rows:
            max_rows = int(max_rows)
        
        # Create workbook
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = sheet_name
        
        # Styles
        header_font = Font(bold=True)
        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_font_white = Font(bold=True, color="FFFFFF")
        thin_border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )
        
        row_num = 0
        data_rows = 0
        
        with open(input_path, 'r', encoding=encoding, errors='replace') as f:
            reader = csv.reader(f, delimiter=delimiter)
            
            for row_idx, row in enumerate(reader):
                if row_idx < skip_rows:
                    continue
                
                if max_rows and data_rows >= max_rows:
                    break
                
                row_num += 1
                is_header = has_header and row_num == 1
                
                for col_idx, cell_value in enumerate(row):
                    # Sanitize and parse
                    clean_value = sanitize_cell_value(cell_value)
                    parsed_value = try_parse_number(clean_value)
                    
                    cell = ws.cell(row=row_num, column=col_idx + 1, value=parsed_value)
                    
                    # Apply header formatting
                    if is_header:
                        cell.font = header_font_white
                        cell.fill = header_fill
                        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
                    else:
                        cell.alignment = Alignment(vertical='center', wrap_text=True)
                    
                    cell.border = thin_border
                
                if not is_header:
                    data_rows += 1
        
        if row_num == 0:
            return {"success": False, "error": "No data found in CSV", "traceback": ""}
        
        # Auto-adjust column widths
        for col_idx in range(1, ws.max_column + 1):
            max_length = 0
            column_letter = get_column_letter(col_idx)
            
            for row_idx in range(1, min(ws.max_row + 1, 100)):  # Sample first 100 rows
                cell = ws.cell(row=row_idx, column=col_idx)
                if cell.value:
                    max_length = max(max_length, len(str(cell.value)))
            
            # Set width with reasonable limits
            adjusted_width = min(max(max_length + 2, 10), 50)
            ws.column_dimensions[column_letter].width = adjusted_width
        
        # Freeze header row if present
        if has_header and row_num > 1:
            ws.freeze_panes = 'A2'
        
        # Save
        wb.save(output_path)
        
        return {
            "success": True,
            "output_path": output_path,
            "rows": data_rows + (1 if has_header else 0),
            "columns": ws.max_column,
            "has_header": has_header,
            "delimiter": delimiter,
            "encoding": encoding,
        }

    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python csv_to_xlsx.py <input.csv> <output.xlsx> [options_json]
    if len(sys.argv) < 3 or len(sys.argv) > 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python csv_to_xlsx.py <input.csv> <output.xlsx> [options_json]"
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

    result = convert_csv_to_xlsx(input_path, output_path, options)
    print(json.dumps(result))


if __name__ == "__main__":
    main()