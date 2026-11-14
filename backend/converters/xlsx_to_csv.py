#!/usr/bin/env python3
"""
XLSX to CSV conversion using openpyxl.
Converts Excel spreadsheets to CSV format.
For multiple worksheets, creates a ZIP archive with one CSV per sheet.
"""

import sys
import os
import json
import platform
import traceback
import zipfile
import tempfile
from importlib.metadata import version, PackageNotFoundError
import csv

try:
    import openpyxl
    OPENPYXL_IMPORT_ERROR = None
except Exception as exc:
    openpyxl = None
    OPENPYXL_IMPORT_ERROR = exc


def check_environment():
    """Report the interpreter and dependency status without converting."""
    errors = []

    if openpyxl is None:
        errors.append(f"openpyxl: {type(OPENPYXL_IMPORT_ERROR).__name__}: {OPENPYXL_IMPORT_ERROR}")

    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
        }

    try:
        openpyxl_version = version("openpyxl")
    except PackageNotFoundError:
        openpyxl_version = "unknown"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "openpyxl_version": openpyxl_version,
    }


def sanitize_filename(name):
    """Sanitize worksheet name for use as filename."""
    # Remove invalid characters
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        name = name.replace(char, '_')
    # Limit length
    if len(name) > 100:
        name = name[:100]
    # Ensure not empty
    if not name:
        name = "sheet"
    return name


def get_cell_value(cell):
    """Get the value of a cell, preferring cached formula results."""
    if cell.value is None:
        return ""
    
    # For formula cells, try to get cached value
    if cell.data_type == 'f':
        # openpyxl doesn't evaluate formulas, but we can try to get cached value
        if cell.value and isinstance(cell.value, str) and cell.value.startswith('='):
            # This is a formula without cached result
            return ""  # Return empty for unevaluated formulas
    
    # Convert to string
    value = cell.value
    if isinstance(value, (int, float)):
        # Handle numbers - avoid scientific notation for large numbers
        if isinstance(value, float) and value.is_integer():
            return str(int(value))
        return str(value)
    elif isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    else:
        return str(value)


def convert_worksheet_to_csv(worksheet, output_path):
    """Convert a single worksheet to CSV."""
    # Find the actual used range
    rows = list(worksheet.iter_rows(values_only=False))
    if not rows:
        # Empty sheet - create empty CSV
        with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
            pass
        return 0, 0
    
    max_row = worksheet.max_row
    max_col = worksheet.max_column
    
    if max_row == 1 and max_col == 1 and worksheet.cell(1, 1).value is None:
        # Truly empty
        with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
            pass
        return 0, 0
    
    with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL, lineterminator='\n')
        
        for row_idx in range(1, max_row + 1):
            row_data = []
            for col_idx in range(1, max_col + 1):
                cell = worksheet.cell(row_idx, col_idx)
                row_data.append(get_cell_value(cell))
            
            # Trim trailing empty cells
            while row_data and row_data[-1] == "":
                row_data.pop()
            
            if row_data or row_idx <= max_row:
                writer.writerow(row_data)
    
    return max_row, max_col


def convert_xlsx_to_csv(input_path, output_path):
    """
    Main conversion function: convert XLSX to CSV or ZIP of CSVs.
    """
    if openpyxl is None:
        return {
            "success": False,
            "error": f"openpyxl import failed: {OPENPYXL_IMPORT_ERROR}",
            "traceback": "",
        }

    try:
        # Load workbook in read-only mode for memory efficiency
        wb = openpyxl.load_workbook(input_path, read_only=True, data_only=True)
        sheet_names = wb.sheetnames
        
        if not sheet_names:
            wb.close()
            return {"success": False, "error": "Workbook has no worksheets", "traceback": ""}
        
        if len(sheet_names) == 1:
            # Single worksheet - output directly as CSV
            ws = wb[sheet_names[0]]
            rows, cols = convert_worksheet_to_csv(ws, output_path)
            wb.close()
            return {
                "success": True,
                "output_path": output_path,
                "format": "csv",
                "sheet_count": 1,
                "sheet_name": sheet_names[0],
                "rows": rows,
                "columns": cols,
            }
        else:
            # Multiple worksheets - create ZIP
            with tempfile.TemporaryDirectory() as tmpdir:
                csv_files = []
                
                for sheet_name in sheet_names:
                    ws = wb[sheet_name]
                    safe_name = sanitize_filename(sheet_name)
                    csv_path = os.path.join(tmpdir, f"{safe_name}.csv")
                    rows, cols = convert_worksheet_to_csv(ws, csv_path)
                    csv_files.append({
                        "name": safe_name,
                        "path": csv_path,
                        "rows": rows,
                        "cols": cols,
                    })
                
                wb.close()
                
                # Create ZIP
                with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                    for csv_file in csv_files:
                        zf.write(csv_file["path"], f"{csv_file['name']}.csv")
                
                return {
                    "success": True,
                    "output_path": output_path,
                    "format": "zip",
                    "sheet_count": len(sheet_names),
                    "sheets": [{"name": f["name"], "rows": f["rows"], "columns": f["cols"]} for f in csv_files],
                }

    except Exception as e:
        error_msg = str(e)
        if "encrypted" in error_msg.lower() or "password" in error_msg.lower():
            return {"success": False, "error": f"Workbook is password protected: {error_msg}", "traceback": traceback.format_exc()}
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python xlsx_to_csv.py <input.xlsx> <output.csv|output.zip>
    if len(sys.argv) != 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: python xlsx_to_csv.py <input.xlsx> <output.csv|output.zip>"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)

    result = convert_xlsx_to_csv(input_path, output_path)
    print(json.dumps(result))


if __name__ == "__main__":
    main()