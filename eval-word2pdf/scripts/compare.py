"""Compare candidate PDFs with the LibreOffice baseline (text, pages, images, raster)."""

import json
import math
import re
import unicodedata
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path

import fitz
import numpy as np
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures"
OUTPUTS = ROOT / "outputs"
RESULTS = ROOT / "results"
RENDERS = RESULTS / "renders"
CONTACT = RESULTS / "contact"
ENGINES = ["word2pdf", "office2pdf"]
DPI = 110
TOKEN_RE = re.compile(r"\w+", re.UNICODE)
PAGE_NO_RE = re.compile(r"Page\s+(\d+)\s+of\s+(\d+)", re.IGNORECASE)

HEADER_FOOTER_EXPECTATIONS = {
    "05_headers_footers": ["ZipDrop Header", "internal evaluation copy"],
    "13_kitchen_sink": ["Kitchen Sink Header"],
    "06_page_numbers": ["Page 1 of", "Page 2 of"],
}

DEVANAGARI_EXPECTATIONS = {
    "10_devanagari": ["हिन्दी", "ज़िपड्रॉप", "भारत", "नमस्ते", "सर्वे", "संयुक्ताक्षर"],
    "13_kitchen_sink": ["नमस्ते दुनिया"],
}


def normalize(text):
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\u00ad", "").replace("\ufeff", "")
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text):
    return [t.casefold() for t in TOKEN_RE.findall(normalize(text))]


def multiset_scores(reference, candidate):
    ref = Counter(reference)
    cand = Counter(candidate)
    overlap = sum((ref & cand).values())
    recall = overlap / sum(ref.values()) if ref else 1.0
    precision = overlap / sum(cand.values()) if cand else 1.0
    return round(recall, 4), round(precision, 4)


def text_similarity(reference, candidate):
    if not reference and not candidate:
        return 1.0
    return round(SequenceMatcher(None, reference, candidate).ratio(), 4)


def page_text(doc):
    return [page.get_text("text") for page in doc]


def render_page(page, dpi=DPI):
    pix = page.get_pixmap(dpi=dpi, colorspace=fitz.csGRAY, alpha=False)
    image = Image.frombytes("L", (pix.width, pix.height), pix.samples)
    return image


def to_array(image, size=(620, 800)):
    return np.asarray(image.resize(size, Image.LANCZOS), dtype=np.float64)


def structural_similarity(a, b, block=8):
    h, w = a.shape
    bh, bw = h // block * block, w // block * block
    a = a[:bh, :bw].reshape(bh // block, block, bw // block, block).mean(axis=(1, 3))
    b = b[:bh, :bw].reshape(bh // block, block, bw // block, block).mean(axis=(1, 3))
    mu_a, mu_b = a.mean(), b.mean()
    var_a, var_b = a.var(), b.var()
    covariance = ((a - mu_a) * (b - mu_b)).mean()
    c1 = (0.01 * 255) ** 2
    c2 = (0.03 * 255) ** 2
    numerator = (2 * mu_a * mu_b + c1) * (2 * covariance + c2)
    denominator = (mu_a**2 + mu_b**2 + c1) * (var_a + var_b + c2)
    return float(numerator / denominator) if denominator else 1.0


def raster_metrics(reference, candidate):
    a = to_array(reference)
    b = to_array(candidate)
    mae = float(np.abs(a - b).mean() / 255.0)
    corr = float(np.corrcoef(a.ravel(), b.ravel())[0, 1]) if a.std() and b.std() else 1.0
    return {
        "pixel_similarity": round(1.0 - mae, 4),
        "ssim": round(structural_similarity(a, b), 4),
        "correlation": round(corr, 4),
    }


def bbox_iou(a, b):
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b
    ix0, iy0 = max(ax0, bx0), max(ay0, by0)
    ix1, iy1 = min(ax1, bx1), min(ay1, by1)
    if ix1 <= ix0 or iy1 <= iy0:
        return 0.0
    inter = (ix1 - ix0) * (iy1 - iy0)
    area_a = max(0.0, ax1 - ax0) * max(0.0, ay1 - ay0)
    area_b = max(0.0, bx1 - bx0) * max(0.0, by1 - by0)
    union = area_a + area_b - inter
    return inter / union if union else 0.0


def image_metrics(reference_page, candidate_page):
    ref_boxes = [tuple(info["bbox"]) for info in reference_page.get_image_info()]
    cand_boxes = [tuple(info["bbox"]) for info in candidate_page.get_image_info()]
    matched = 0
    ious = []
    used = set()
    for ref in sorted(ref_boxes, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]), reverse=True):
        best = 0.0
        best_index = None
        for index, cand in enumerate(cand_boxes):
            if index in used:
                continue
            score = bbox_iou(ref, cand)
            if score > best:
                best = score
                best_index = index
        if best_index is not None and best >= 0.5:
            used.add(best_index)
            matched += 1
            ious.append(best)
        elif ref_boxes and cand_boxes:
            ious.append(0.0)
    largest_iou = None
    if ref_boxes and cand_boxes:
        ref_largest = max(ref_boxes, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]))
        cand_largest = max(cand_boxes, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]))
        largest_iou = round(bbox_iou(ref_largest, cand_largest), 4)
    return {
        "reference_count": len(ref_boxes),
        "candidate_count": len(cand_boxes),
        "matched": matched,
        "mean_iou": round(float(np.mean(ious)), 4) if ious else None,
        "largest_iou": largest_iou,
    }


def fonts_in(doc):
    names = set()
    for page in doc:
        for font in page.get_fonts(full=True):
            names.add(font[3])
    return sorted(names)


def contact_sheet(rows, path):
    width = 620
    height = 800
    pad = 24
    label_h = 28
    columns = len(rows)
    sheet = Image.new("RGB", (columns * width + (columns + 1) * pad, height + label_h + 2 * pad), "white")
    draw = ImageDraw.Draw(sheet)
    for index, (label, image) in enumerate(rows.items()):
        x = pad + index * (width + pad)
        sheet.paste(image.resize((width, height), Image.LANCZOS).convert("RGB"), (x, pad + label_h))
        draw.text((x + 4, pad + 6), label, fill="black")
    sheet.save(path)


def compare_fixture(fixture, engines):
    baseline_path = OUTPUTS / "libreoffice" / f"{fixture.stem}.pdf"
    baseline = fitz.open(baseline_path)
    baseline_pages = page_text(baseline)
    baseline_norm = normalize(" ".join(baseline_pages))
    baseline_tokens = tokenize(" ".join(baseline_pages))
    baseline_fonts = fonts_in(baseline)
    baseline_sizes = [(round(p.rect.width, 1), round(p.rect.height, 1)) for p in baseline]

    report = {
        "fixture": fixture.stem,
        "baseline": {
            "pages": len(baseline),
            "page_sizes": baseline_sizes,
            "text_chars": len(baseline_norm),
            "fonts": baseline_fonts,
            "pdf_bytes": baseline_path.stat().st_size,
        },
        "engines": {},
    }

    for engine in engines:
        candidate_path = OUTPUTS / engine / f"{fixture.stem}.pdf"
        entry = {"pdf_bytes": None, "ok": False}
        if not candidate_path.is_file():
            entry["error"] = "missing output PDF"
            report["engines"][engine] = entry
            continue
        candidate = fitz.open(candidate_path)
        candidate_pages = page_text(candidate)
        candidate_norm = normalize(" ".join(candidate_pages))
        candidate_tokens = tokenize(" ".join(candidate_pages))
        recall, precision = multiset_scores(baseline_tokens, candidate_tokens)

        page_rows = []
        render_dir = RENDERS / engine / fixture.stem
        render_dir.mkdir(parents=True, exist_ok=True)
        page_count = min(len(baseline), len(candidate))
        for index in range(page_count):
            ref_image = render_page(baseline[index])
            cand_image = render_page(candidate[index])
            ref_image.save(render_dir / f"p{index + 1:02d}-baseline.png")
            cand_image.save(render_dir / f"p{index + 1:02d}-candidate.png")
            metrics = raster_metrics(ref_image, cand_image)
            metrics.update(image_metrics(baseline[index], candidate[index]))
            metrics["baseline_size"] = baseline_sizes[index]
            metrics["candidate_size"] = (
                round(candidate[index].rect.width, 1),
                round(candidate[index].rect.height, 1),
            )
            metrics["same_orientation"] = (
                (baseline_sizes[index][0] > baseline_sizes[index][1])
                == (metrics["candidate_size"][0] > metrics["candidate_size"][1])
            )
            page_rows.append(metrics)

            sheet_path = CONTACT / f"{fixture.stem}-{engine}-p{index + 1:02d}.png"
            sheet_path.parent.mkdir(parents=True, exist_ok=True)
            contact_sheet(
                {
                    "LibreOffice": ref_image,
                    engine: cand_image,
                },
                sheet_path,
            )

        entry.update(
            {
                "ok": True,
                "pdf_bytes": candidate_path.stat().st_size,
                "pages": len(candidate),
                "page_count_match": len(candidate) == len(baseline),
                "page_sizes": [
                    (round(p.rect.width, 1), round(p.rect.height, 1)) for p in candidate
                ],
                "text_chars": len(candidate_norm),
                "token_recall": recall,
                "token_precision": precision,
                "text_similarity": text_similarity(baseline_norm, candidate_norm),
                "fonts": fonts_in(candidate),
                "page_metrics": page_rows,
                "mean_ssim": round(float(np.mean([r["ssim"] for r in page_rows])), 4) if page_rows else None,
                "mean_pixel_similarity": round(
                    float(np.mean([r["pixel_similarity"] for r in page_rows])), 4
                )
                if page_rows
                else None,
            }
        )

        expected_headers = HEADER_FOOTER_EXPECTATIONS.get(fixture.stem, [])
        entry["header_footer_checks"] = {
            text: text in candidate_norm for text in expected_headers
        }
        entry["page_number_matches"] = PAGE_NO_RE.findall(candidate_norm)
        if fixture.stem in DEVANAGARI_EXPECTATIONS:
            entry["devanagari_checks"] = {
                text: text in candidate_norm for text in DEVANAGARI_EXPECTATIONS[fixture.stem]
            }

        missing_fonts = sorted(set(baseline_fonts) - set(entry["fonts"]))
        entry["fonts_missing_vs_baseline"] = missing_fonts
        report["engines"][engine] = entry
        candidate.close()

    baseline.close()
    return report


def load_warnings():
    path = RESULTS / "performance.json"
    warnings = {}
    if not path.is_file():
        return warnings
    data = json.loads(path.read_text(encoding="utf-8"))
    for engine, records in data.get("sequential", {}).items():
        for record in records:
            fixture = Path(record.get("input", "")).stem
            warnings[f"{engine}/{fixture}"] = {
                "warnings": record.get("warnings", []),
                "missing_fonts": record.get("missing_fonts", []),
            }
    return warnings


def fmt(value, digits=3):
    if value is None:
        return "n/a"
    if isinstance(value, float):
        return f"{value:.{digits}f}"
    return str(value)


def write_summary(reports, warnings):
    lines = ["# Word-to-PDF engine comparison", ""]
    lines.append(
        "Baseline: LibreOffice 26.8 headless. Candidates: word2pdf 0.1.0, office2pdf-python 0.4.1."
    )
    lines.append("")
    lines.append("## Quality by fixture")
    lines.append("")
    lines.append(
        "| Fixture | Engine | Pages (ref/cand) | Token recall | Token precision | Text sim | Mean SSIM | Pixel sim | Images matched |"
    )
    lines.append("|---|---|---|---|---|---|---|---|---|")
    for report in reports:
        ref_pages = report["baseline"]["pages"]
        for engine, entry in report["engines"].items():
            if not entry.get("ok"):
                lines.append(
                    f"| {report['fixture']} | {engine} | {ref_pages}/- | - | - | - | - | - | {entry.get('error', 'failed')} |"
                )
                continue
            images = [r for r in entry["page_metrics"] if r["reference_count"] or r["candidate_count"]]
            matched = (
                f"{sum(r['matched'] for r in images)}/{sum(r['reference_count'] for r in images)}"
                if images
                else "-"
            )
            lines.append(
                f"| {report['fixture']} | {engine} | {ref_pages}/{entry['pages']} | "
                f"{fmt(entry['token_recall'])} | {fmt(entry['token_precision'])} | "
                f"{fmt(entry['text_similarity'])} | {fmt(entry['mean_ssim'])} | "
                f"{fmt(entry['mean_pixel_similarity'])} | {matched} |"
            )
    lines.append("")
    lines.append("## Header, footer and page-number checks")
    lines.append("")
    lines.append("| Fixture | Engine | Expected text present | PAGE fields found |")
    lines.append("|---|---|---|---|")
    for report in reports:
        for engine, entry in report["engines"].items():
            if not entry.get("ok"):
                continue
            checks = entry.get("header_footer_checks") or {}
            if not checks and not entry.get("page_number_matches"):
                continue
            check_text = ", ".join(f"{k}: {'yes' if v else 'NO'}" for k, v in checks.items()) or "-"
            page_nums = entry.get("page_number_matches") or []
            page_text_value = ", ".join(f"{a} of {b}" for a, b in page_nums) or "none"
            lines.append(f"| {report['fixture']} | {engine} | {check_text} | {page_text_value} |")
    lines.append("")
    lines.append("## Devanagari text-layer checks")
    lines.append("")
    lines.append("| Fixture | Engine | Expected substrings found |")
    lines.append("|---|---|---|")
    for report in reports:
        for engine, entry in report["engines"].items():
            checks = entry.get("devanagari_checks")
            if not checks:
                continue
            lines.append(
                f"| {report['fixture']} | {engine} | "
                + ", ".join(f"{k}: {'yes' if v else 'NO'}" for k, v in checks.items())
                + " |"
            )
    lines.append("")
    lines.append("## Warnings and missing fonts")
    lines.append("")
    lines.append("| Engine | Fixture | Warnings | Missing fonts |")
    lines.append("|---|---|---|---|")
    for key, value in sorted(warnings.items()):
        if not value["warnings"] and not value["missing_fonts"]:
            continue
        lines.append(
            f"| {key} | - | {'; '.join(value['warnings']) or 'none'} | "
            f"{', '.join(value['missing_fonts']) or 'none'} |"
        )
    if all(not v["warnings"] and not v["missing_fonts"] for v in warnings.values()):
        lines.append("| both | all | none | none |")
    lines.append("")
    (RESULTS / "summary.md").write_text("\n".join(lines), encoding="utf-8")


def main():
    RESULTS.mkdir(parents=True, exist_ok=True)
    RENDERS.mkdir(parents=True, exist_ok=True)
    CONTACT.mkdir(parents=True, exist_ok=True)
    reports = []
    for fixture in sorted(FIXTURES.glob("*.docx")):
        print(f"comparing {fixture.name}", flush=True)
        reports.append(compare_fixture(fixture, ENGINES))
    warnings = load_warnings()
    payload = {"reports": reports, "warnings": warnings}
    (RESULTS / "comparison.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    write_summary(reports, warnings)
    print("wrote results/comparison.json and results/summary.md")


if __name__ == "__main__":
    main()
