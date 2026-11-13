# ZipDrop: Pure-Python Word-to-PDF Proof of Concept

**Status:** evaluation only. No production converter was changed, removed, or reconfigured.

**Candidate engines**

| | Package | Version | Engine | License |
|---|---|---|---|---|
| A | `word2pdf` | 0.1.0 | Pure Python (ReportLab) | MIT |
| B | `office2pdf-python` | 0.4.1 | Pure Rust (PyO3 wheel, upstream `office2pdf` 0.9.1) | Apache-2.0 |
| Baseline | LibreOffice | 26.8 headless | Native office suite | MPL-2.0 |

Artifacts live in `eval-word2pdf/`:

- `fixtures/` – 15 shared DOCX test documents
- `scripts/engine_word2pdf.py`, `scripts/engine_office2pdf.py`, `scripts/engine_libreoffice.py` – isolated per-engine harnesses
- `scripts/run_suite.py` – timing, memory and concurrency measurements
- `scripts/compare.py` – PyMuPDF text/page/image comparison against LibreOffice
- `results/summary.md`, `results/comparison.json`, `results/performance.json` – raw results
- `results/contact/` – side-by-side page renders (LibreOffice vs candidate)

## 1. Compatibility

| Criterion | LibreOffice | word2pdf 0.1.0 | office2pdf-python 0.4.1 |
|---|---|---|---|
| Python 3.13 | n/a | ✅ tested on 3.13.5 (pure Python, `requires-python >=3.9`) | ✅ tested on 3.13.5 (`abi3-py310` wheel, supports 3.10–3.14) |
| Windows 11 | ✅ | ✅ tested | ✅ tested |
| Render Linux | ✅ via nixpacks/AppImage | ✅ pure-Python wheel, OS independent | ✅ `manylinux_2_17` x86_64/aarch64 + musllinux wheels; not runtime-tested here (no Docker/WSL available) |
| Install dependencies | System package / bundled AppImage | `reportlab` (pulls `Pillow`, `charset-normalizer`); optional `Jinja2` | None (single native wheel) |
| Commercial use | ✅ MPL-2.0 | ✅ MIT (ReportLab BSD, Pillow HPND) | ✅ Apache-2.0 |
| Legacy `.doc` | ✅ | ❌ only Open XML `.docx` | ❌ only `.docx`/`.pptx`/`.xlsx` |
| Other formats | DOC/XLS/PPT/ODF | DOCX only | DOCX, PPTX, XLSX |
| PDF/A output | ✅ (filter dependent) | ❌ | ✅ PDF/A-2b |
| Maturity | Mature | v0.1.0, beta, 1 maintainer | v0.4.1, alpha, 1 maintainer |

Deployment caveat for Render: neither candidate bundles fonts. Indic shaping depends on system fonts (e.g. Noto Sans Devanagari) being present or supplied via `word2pdf` `font_dirs` / `office2pdf` `font_paths`. Calibri is also absent on Linux, so a metric-compatible substitute (Carlito) should be shipped for layout fidelity.

## 2–3. Test corpus and output comparison

15 fixtures cover every requested case plus a multi-script Indian-language document:

| # | Fixture | Coverage |
|---|---|---|
| 01 | `simple_text` | paragraphs, line break, bullets/numbers |
| 02 | `fonts_sizes` | Calibri/Arial/Times/Courier/Georgia/Verdana/Tahoma/Segoe UI, 9–32 pt, bold/italic/colour |
| 03 | `tables_merged` | merged columns, vertical merge, table styles |
| 04 | `images` | PNG, JPEG, chart image, inline placement |
| 05 | `headers_footers` | header/footer text on multiple pages |
| 06 | `page_numbers` | `PAGE` and `NUMPAGES` fields, 3 pages |
| 07 | `multipage` | 3 pages of flowing text |
| 08 | `page_breaks` | two explicit page breaks |
| 09 | `orientations` | portrait → landscape → portrait sections |
| 10 | `devanagari` | Hindi, Marathi, Sanskrit, conjuncts, Devanagari digits |
| 11 | `floating_images` | anchored/square-wrapped image beside text |
| 12 | `nested_tables` | table inside a table cell |
| 13 | `kitchen_sink` | merged tables, images, float, page numbers, Devanagari, landscape |
| 14 | `perf_large` | 24-page document, 5 tables, 2 charts |
| 15 | `indian_languages` | Bengali, Tamil, Telugu, Gujarati, Punjabi, Kannada, Malayalam, Odia, Devanagari |

### Aggregate quality vs LibreOffice

| Metric | word2pdf | office2pdf |
|---|---|---|
| Fixtures compared | 15/15 | 15/15 |
| Page-count parity | **49/49 pages** | **49/49 pages** |
| Mean token recall / precision | 0.9994 / 0.9994 | **1.0000 / 1.0000** |
| Mean fixture SSIM (structural) | 0.9451 | 0.8761 |
| Median fixture SSIM | 0.9497 | **0.9863** |
| Mean page-level SSIM | **0.9084** | 0.8769 |
| Worst fixture SSIM | **0.8577** (`perf_large`) | 0.4606 (`floating_images`) |
| Fixtures with SSIM ≥ 0.95 | 6/15 | **8/15** |
| Mean pixel similarity | **0.9899** | 0.9876 |

SSIM understates the word2pdf Indic failure: broken glyph shaping still produces text-like blobs in roughly the right positions. Visual review is authoritative.

### Feature-level verdicts

| Feature | word2pdf | office2pdf |
|---|---|---|
| Simple text | ✅ near-identical (SSIM 0.986) | ✅ near-identical (SSIM 0.986) |
| Fonts and sizes | ✅ excellent (0.999) | ✅ **pixel-exact (1.000)** |
| Tables and merged cells | ✅ good, closest layout | ⚠️ fair — column widths, row heights and merge geometry drift (SSIM 0.761) |
| Inline images | ✅ 3/3 placed, mean IoU 0.94 | ✅ 3/3 placed, mean IoU 0.94 |
| Headers and footers | ✅ text present on all pages (SSIM 0.998) | ✅ text present on all pages (SSIM 0.998) |
| Page numbers | ✅ correctly recalculated `1 of 3` … `3 of 3` | ✅ correctly recalculated `1 of 3` … `3 of 3` |
| Multiple pages | ✅ 49/49 pages | ✅ 49/49 pages |
| Page breaks | ✅ **exact (SSIM 1.000)** | ✅ **exact (SSIM 1.000)** |
| Page orientations | ✅ portrait/landscape honoured | ✅ honoured; small vertical-spacing drift (SSIM 0.753) |
| Devanagari | ❌ **broken shaping** — conjuncts separated, matras reordered (`हिन्दी`→`हनिदी`, `क्ष`→`कष`) | ✅ matches baseline (SSIM 0.999) |
| Other Indian scripts | ❌ Tamil/Telugu/Kannada/Malayalam visibly broken | ✅ all match baseline (SSIM 0.997) |
| Floating images | ❌ placed at the anchor but **overlaps text** (no wrap) | ❌ **repositioned above the paragraph**, shifting page content (SSIM 0.461) |
| Nested tables | ✅ good (SSIM 0.950) | ⚠️ fair — widths and outer borders drift (SSIM 0.762) |

Full page images: `results/contact/<fixture>-<engine>-pNN.png`. Raw numbers: `results/comparison.json`.

### Unsupported features and warnings

- **word2pdf:** no `.doc`; no complex-script shaping (Arabic, Devanagari, Tamil, Telugu, Kannada, Malayalam confirmed); no text wrap around floating objects; EMF/WMF skipped; charts/SmartArt only when stored as a picture; table rows never split across pages; fields requiring recalculation use cached values.
- **office2pdf:** no `.doc`; anchored/floating images are moved out of position; table geometry deviations; alpha maturity. It exposes a typed warning API, but emitted **no warnings** for the float or table misrenderings.
- Both engines reported **zero warnings and zero missing fonts** on Windows for all 15 fixtures. No installation/runtime warnings were observed.

## 4. Performance

Measured on the same Windows 11 / Python 3.13.5 machine, one process per conversion (matches ZipDrop's production invocation pattern).

| Metric | LibreOffice | word2pdf | office2pdf |
|---|---|---|---|
| Install footprint (measured venv / bundle) | ~294 MB bundled / ~730 MB system install | **42 MB venv (40 MB core)** | 81 MB venv |
| Cold-process conversion, median | 7.26 s | **0.80 s** (0.67–1.42) | 1.42 s (1.29–1.55) |
| First run with fresh font cache | 6.99 s / 8.55 s (small/large) | **0.83 s / 1.76 s** | 1.83 s / 1.92 s |
| Peak RSS per conversion | 252 MB avg / 277 MB max | **52 MB avg / 65 MB max** | 61 MB avg / 81 MB max |
| Warm batch, 15 files (one process) | 112.8 s (7.5 s/file) | **9.1 s (0.61 s/file)** | 16.5 s (1.10 s/file) |
| Peak RSS in long-lived batch | 277 MB | **94 MB** | 135 MB |
| 4 concurrent conversions | 17.5 s / 260 MB | **2.4 s / 63 MB** | 4.7 s / 76 MB |
| Average output PDF | 68.3 KB | 89.6 KB | **55.8 KB** |
| Total output, 15 fixtures | 1.02 MB | 1.34 MB | **0.84 MB** |

Notes:
- word2pdf is ~9× faster and ~5× lighter than LibreOffice per cold conversion; office2pdf is ~5× faster and ~4× lighter.
- Warm-batch throughput varied noticeably between runs on this Windows host (word2pdf 4.86–9.34 s, office2pdf 9.40–16.98 s for 15 files), likely from host contention/antivirus. The table uses the median of three repeated runs; the concurrency figures were stable across runs, and the relative ranking did not change.
- office2pdf's in-process batch memory grows to ~135 MB and its batch time is more variable; a process-per-conversion design (what ZipDrop already uses) avoids this.
- All four-way concurrent runs succeeded for all engines; no crashes, deadlocks or file collisions.
- word2pdf output is consistently larger due to embedded font subsets (e.g. 258 KB for the nine-font fixture vs 100 KB for office2pdf).
- office2pdf's lower "text similarity" scores on some table/header fixtures (0.75–0.84) come from block reading order in extraction, not missing text: token recall/precision remain 1.000 for every fixture.

## 5. Decision

### Recommendation: do not replace LibreOffice yet

1. **word2pdf is not suitable for ZipDrop.** It fails the explicit Indian-language requirement: Devanagari, Tamil, Telugu, Kannada and Malayalam all render with broken shaping. It also cannot read legacy `.doc`, which ZipDrop currently accepts. Its speed, size and Latin-text fidelity are attractive, but the Indic failure is disqualifying.
2. **office2pdf-python is the stronger candidate**, and the only one that matches LibreOffice on Indian-language rendering. It also achieves 100 % text/page parity, correct headers/footers/page numbers, and 5× faster conversions at 1/4 the memory. However, it is an alpha release with two material fidelity defects: **floating images are moved above the paragraph** and **table geometry drifts**. Neither is flagged by its warning API.
3. **A complete LibreOffice removal is not possible today** because neither package supports `.doc`. LibreOffice must remain as the fallback for legacy Word files regardless of the DOCX path chosen.

### Suggested next step (requires your approval)

- Keep LibreOffice as the default Word→PDF engine.
- Run a **shadow-mode pilot** of `office2pdf` for `.docx` files only, behind a feature flag, with automatic fallback to LibreOffice for: `.doc` input, files containing anchored/floating images, or any conversion error.
- Gate the pilot on a fidelity check (page count + sampled text) and only promote after office2pdf reaches a stable release with floating-image and table-layout fixes.
- Do not integrate `word2pdf` unless the requirement for Indian-language output is dropped.

## Reproduce

```bash
cd eval-word2pdf
python -m venv venv-harness
venv-harness/Scripts/python -m pip install pymupdf pillow numpy python-docx psutil
venv-harness/Scripts/python scripts/make_fixtures.py
venv-harness/Scripts/python scripts/run_suite.py      # timing, memory, concurrency
venv-harness/Scripts/python scripts/compare.py        # quality vs LibreOffice
```

Engine harnesses use `venv-word2pdf` and `venv-office2pdf` respectively. Set `LIBREOFFICE_PATH` if `soffice.com` is not in a standard location.
