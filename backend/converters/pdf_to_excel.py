#!/usr/bin/env python3
"""
PDF to Excel (XLSX) conversion using pdfplumber for table extraction
and openpyxl for Excel generation.

Supports:
- Table detection across all pages
- Multiple tables per page
- Tables spanning multiple pages
- Preserved cell relationships and merged cells where detectable
- Scanned PDF detection (no extractable text)
"""

import sys
import os
import json
import platform
import traceback
from importlib.metadata import version, PackageNotFoundError

try:
    import pdfplumber
    PDFPLUMBER_IMPORT_ERROR = None
except Exception as exc:
    pdfplumber = None
    PDFPLUMBER_IMPORT_ERROR = exc

try:
    import openpyxl
    from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
    from openpyxl.utils import get_column_letter
    OPENPYXL_IMPORT_ERROR = None
except Exception as exc:
    openpyxl = None
    OPENPYXL_IMPORT_ERROR = exc


def check_environment():
    """Report the interpreter and dependency status without converting."""
    errors = []
    warnings = []

    if pdfplumber is None:
        errors.append(f"pdfplumber: {type(PDFPLUMBER_IMPORT_ERROR).__name__}: {PDFPLUMBER_IMPORT_ERROR}")

    if openpyxl is None:
        errors.append(f"openpyxl: {type(OPENPYXL_IMPORT_ERROR).__name__}: {OPENPYXL_IMPORT_ERROR}")

    if errors:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": "; ".join(errors),
            "warnings": warnings,
        }

    try:
        pdfplumber_version = version("pdfplumber")
    except PackageNotFoundError:
        pdfplumber_version = "unknown"

    try:
        openpyxl_version = version("openpyxl")
    except PackageNotFoundError:
        openpyxl_version = "unknown"

    return {
        "success": True,
        "executable": sys.executable,
        "python_version": platform.python_version(),
        "pdfplumber_version": pdfplumber_version,
        "openpyxl_version": openpyxl_version,
        "warnings": warnings,
    }


def extract_tables_from_page(page, table_settings=None):
    """
    Extract tables from a single PDF page using pdfplumber.
    Returns a list of tables, each as a list of rows (list of cell values).
    """
    if table_settings is None:
        table_settings = {
            "vertical_strategy": "lines",
            "horizontal_strategy": "lines",
            "explicit_vertical_lines": None,
            "explicit_horizontal_lines": None,
            "snap_tolerance": 3,
            "join_tolerance": 3,
            "edge_min_length": 3,
            "min_words_vertical": 3,
            "min_words_horizontal": 1,
            "intersection_tolerance": 3,
            "text_tolerance": 3,
            "text_x_tolerance": 3,
            "text_y_tolerance": 3,
        }

    tables = page.extract_tables(table_settings)
    return tables


def extract_tables_with_bbox(page, table_settings=None):
    """
    Extract tables with bounding box information for better positioning.
    Returns list of (table_data, bbox) tuples.
    """
    if table_settings is None:
        table_settings = {
            "vertical_strategy": "lines",
            "horizontal_strategy": "lines",
            "snap_tolerance": 3,
            "join_tolerance": 3,
            "edge_min_length": 3,
            "min_words_vertical": 3,
            "min_words_horizontal": 1,
            "intersection_tolerance": 3,
        }

    # Find table areas
    table_findings = page.find_tables(table_settings)
    results = []

    for table_finding in table_findings:
        bbox = table_finding.bbox
        table_data = table_finding.extract()
        if table_data and len(table_data) > 0:
            results.append((table_data, bbox))

    return results


def normalize_table(table_data):
    """
    Normalize table data: handle None cells, ensure rectangular shape.
    """
    if not table_data:
        return []

    # Find max columns
    max_cols = max(len(row) for row in table_data) if table_data else 0

    normalized = []
    for row in table_data:
        normalized_row = []
        for cell in row:
            if cell is None:
                normalized_row.append("")
            else:
                normalized_row.append(str(cell).strip())
        # Pad row to max_cols
        while len(normalized_row) < max_cols:
            normalized_row.append("")
        normalized.append(normalized_row)

    return normalized


def merge_tables_across_pages(tables_by_page):
    """
    Attempt to merge tables that span across pages.
    Simple heuristic: if a table ends without a clear footer and next page
    starts with a similar column structure, merge them.
    """
    if not tables_by_page:
        return []

    merged = []
    current_table = None

    for page_num, tables in tables_by_page:
        for table_data, bbox in tables:
            normalized = normalize_table(table_data)
            if not normalized:
                continue

            if current_table is None:
                current_table = {
                    "data": normalized,
                    "start_page": page_num,
                    "end_page": page_num,
                    "col_count": len(normalized[0]) if normalized else 0,
                }
            else:
                # Check if tables have similar column structure
                if len(normalized[0]) == current_table["col_count"]:
                    # Check header similarity
                    header_similarity = sum(
                        1 for a, b in zip(current_table["data"][0], normalized[0])
                        if a.lower().strip() == b.lower().strip()
                    )
                    if header_similarity >= max(1, current_table["col_count"] * 0.5):
                        # Merge: skip header of new table, append data rows
                        current_table["data"].extend(normalized[1:])
                        current_table["end_page"] = page_num
                    else:
                        merged.append(current_table)
                        current_table = {
                            "data": normalized,
                            "start_page": page_num,
                            "end_page": page_num,
                            "col_count": len(normalized[0]) if normalized else 0,
                        }
                else:
                    merged.append(current_table)
                    current_table = {
                        "data": normalized,
                        "start_page": page_num,
                        "end_page": page_num,
                        "col_count": len(normalized[0]) if normalized else 0,
                    }

    if current_table:
        merged.append(current_table)

    return merged


def has_extractable_text(page):
    """Check if page has selectable/extractable text."""
    text = page.extract_text()
    return text is not None and len(text.strip()) > 0


def write_tables_to_xlsx(merged_tables, output_path, pdf_metadata=None):
    """
    Write merged tables to an XLSX workbook with formatting.
    """
    wb = openpyxl.Workbook()

    # Remove default sheet
    wb.remove(wb.active)

    for idx, table in enumerate(merged_tables):
        ws = wb.create_sheet(title=f"Table_{idx + 1}_p{table['start_page']}-{table['end_page']}")

        data = table["data"]
        if not data:
            continue

        # Write data
        for row_idx, row in enumerate(data, 1):
            for col_idx, cell_value in enumerate(row, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=cell_value)

        # Apply formatting
        header_font = Font(bold=True)
        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_font_white = Font(bold=True, color="FFFFFF")
        thin_border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )

        # Format header row
        for col_idx in range(1, len(data[0]) + 1):
            cell = ws.cell(row=1, column=col_idx)
            cell.font = header_font_white
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
            cell.border = thin_border

        # Format data rows
        for row_idx in range(2, len(data) + 1):
            for col_idx in range(1, len(data[0]) + 1):
                cell = ws.cell(row=row_idx, column=col_idx)
                cell.border = thin_border
                cell.alignment = Alignment(vertical='center', wrap_text=True)

        # Auto-adjust column widths (with reasonable limits)
        for col_idx in range(1, len(data[0]) + 1):
            max_length = 0
            for row_idx in range(1, len(data) + 1):
                cell_value = str(ws.cell(row=row_idx, column=col_idx).value or "")
                max_length = max(max_length, len(cell_value))
            # Cap at reasonable width
            adjusted_width = min(max(max_length + 2, 10), 50)
            ws.column_dimensions[get_column_letter(col_idx)].width = adjusted_width

    # If no tables were found, create a sheet with a message
    if len(wb.sheetnames) == 0:
        ws = wb.create_sheet(title="No_Tables_Found")
        ws.cell(row=1, column=1, value="No tables could be extracted from this PDF.")
        ws.cell(row=2, column=1, value="Possible reasons:")
        ws.cell(row=3, column=1, value="1. The PDF contains no structured tables")
        ws.cell(row=4, column=1, value="2. The PDF is scanned (image-based) and requires OCR")
        ws.cell(row=5, column=1, value="3. Tables use formatting not detectable as structured data")

    wb.save(output_path)


def convert_pdf_to_excel(input_path, output_path):
    """
    Main conversion function: extract tables from PDF and write to XLSX.
    """
    if pdfplumber is None:
        return {
            "success": False,
            "error": f"pdfplumber import failed: {PDFPLUMBER_IMPORT_ERROR}",
            "traceback": "",
        }

    if openpyxl is None:
        return {
            "success": False,
            "error": f"openpyxl import failed: {OPENPYXL_IMPORT_ERROR}",
            "traceback": "",
        }

    try:
        doc = pdfplumber.open(input_path)
        total_pages = len(doc.pages)

        if total_pages == 0:
            doc.close()
            return {"success": False, "error": "PDF has no pages", "traceback": ""}

        # Check if PDF has any extractable text (scanned detection)
        has_any_text = False
        tables_by_page = []

        for page_num, page in enumerate(doc.pages, 1):
            page_has_text = has_extractable_text(page)
            if page_has_text:
                has_any_text = True

            # Extract tables with bbox
            tables = extract_tables_with_bbox(page)
            if tables:
                tables_by_page.append((page_num, tables))

        doc.close()

        # If no text and no tables, it's likely a scanned PDF
        if not has_any_text and not tables_by_page:
            return {
                "success": False,
                "error": "PDF appears to be scanned (no extractable text). OCR is required to extract tables from image-based PDFs.",
                "code": "OCR_REQUIRED",
                "traceback": "",
            }

        # If no tables found at all
        if not tables_by_page:
            return {
                "success": False,
                "error": "No tables detected in PDF. The document may not contain structured tabular data.",
                "code": "NO_TABLES_FOUND",
                "traceback": "",
            }

        # Merge tables across pages
        merged_tables = merge_tables_across_pages(tables_by_page)

        # Write to XLSX
        write_tables_to_xlsx(merged_tables, output_path)

        return {
            "success": True,
            "output_path": output_path,
            "table_count": len(merged_tables),
            "total_pages": total_pages,
            "pages_with_tables": len(tables_by_page),
        }

    except pdfplumber.PDFSyntaxError as e:
        return {"success": False, "error": f"Corrupted or invalid PDF: {str(e)}", "traceback": traceback.format_exc()}
    except Exception as e:
        error_msg = str(e)
        if "encrypted" in error_msg.lower() or "permission" in error_msg.lower() or "password" in error_msg.lower():
            return {"success": False, "error": f"PDF is password protected or encrypted: {error_msg}", "traceback": traceback.format_exc()}
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}


def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return

    # Usage: python pdf_to_excel.py <input.pdf> <output.xlsx>
    if len(sys.argv) != 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: python pdf_to_excel.py <input.pdf> <output.xlsx>"
        }))
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    if not os.path.exists(input_path):
        print(json.dumps({"success": False, "error": f"Input file not found: {input_path}"}))
        sys.exit(1)

    result = convert_pdf_to_excel(input_path, output_path)
    print(json.dumps(result))


if __name__ == "__main__":
    main()