# Word-to-PDF engine comparison

Baseline: LibreOffice 26.8 headless. Candidates: word2pdf 0.1.0, office2pdf-python 0.4.1.

## Quality by fixture

| Fixture | Engine | Pages (ref/cand) | Token recall | Token precision | Text sim | Mean SSIM | Pixel sim | Images matched |
|---|---|---|---|---|---|---|---|---|
| 01_simple_text | word2pdf | 1/1 | 1.000 | 1.000 | 0.993 | 0.986 | 0.996 | - |
| 01_simple_text | office2pdf | 1/1 | 1.000 | 1.000 | 0.993 | 0.986 | 0.997 | - |
| 02_fonts_sizes | word2pdf | 1/1 | 1.000 | 1.000 | 1.000 | 0.999 | 0.999 | - |
| 02_fonts_sizes | office2pdf | 1/1 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | - |
| 03_tables_merged | word2pdf | 1/1 | 1.000 | 1.000 | 1.000 | 0.896 | 0.990 | - |
| 03_tables_merged | office2pdf | 1/1 | 1.000 | 1.000 | 0.819 | 0.761 | 0.981 | - |
| 04_images | word2pdf | 1/1 | 1.000 | 1.000 | 1.000 | 0.893 | 0.970 | 3/3 |
| 04_images | office2pdf | 1/1 | 1.000 | 1.000 | 1.000 | 0.893 | 0.970 | 3/3 |
| 05_headers_footers | word2pdf | 2/2 | 1.000 | 1.000 | 1.000 | 0.998 | 0.999 | - |
| 05_headers_footers | office2pdf | 2/2 | 1.000 | 1.000 | 0.835 | 0.998 | 0.999 | - |
| 06_page_numbers | word2pdf | 3/3 | 1.000 | 1.000 | 1.000 | 0.996 | 0.990 | - |
| 06_page_numbers | office2pdf | 3/3 | 1.000 | 1.000 | 0.997 | 0.998 | 0.993 | - |
| 07_multipage | word2pdf | 3/3 | 1.000 | 1.000 | 1.000 | 0.995 | 0.985 | - |
| 07_multipage | office2pdf | 3/3 | 1.000 | 1.000 | 1.000 | 0.998 | 0.989 | - |
| 08_page_breaks | word2pdf | 3/3 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | - |
| 08_page_breaks | office2pdf | 3/3 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | - |
| 09_orientations | word2pdf | 3/3 | 1.000 | 1.000 | 1.000 | 0.884 | 0.998 | - |
| 09_orientations | office2pdf | 3/3 | 1.000 | 1.000 | 1.000 | 0.753 | 0.995 | - |
| 10_devanagari | word2pdf | 1/1 | 0.991 | 0.991 | 0.998 | 0.909 | 0.988 | - |
| 10_devanagari | office2pdf | 1/1 | 1.000 | 1.000 | 1.000 | 0.999 | 0.998 | - |
| 11_floating_images | word2pdf | 1/1 | 1.000 | 1.000 | 1.000 | 0.933 | 0.988 | 1/1 |
| 11_floating_images | office2pdf | 1/1 | 1.000 | 1.000 | 1.000 | 0.461 | 0.961 | 0/1 |
| 12_nested_tables | word2pdf | 1/1 | 1.000 | 1.000 | 1.000 | 0.950 | 0.996 | - |
| 12_nested_tables | office2pdf | 1/1 | 1.000 | 1.000 | 1.000 | 0.762 | 0.990 | - |
| 13_kitchen_sink | word2pdf | 3/3 | 1.000 | 1.000 | 1.000 | 0.931 | 0.992 | 2/2 |
| 13_kitchen_sink | office2pdf | 3/3 | 1.000 | 1.000 | 0.754 | 0.667 | 0.973 | 0/2 |
| 14_perf_large | word2pdf | 24/24 | 1.000 | 1.000 | 1.000 | 0.858 | 0.966 | 1/2 |
| 14_perf_large | office2pdf | 24/24 | 1.000 | 1.000 | 1.000 | 0.870 | 0.972 | 1/2 |
| 15_indian_languages | word2pdf | 1/1 | 1.000 | 1.000 | 0.997 | 0.950 | 0.991 | - |
| 15_indian_languages | office2pdf | 1/1 | 1.000 | 1.000 | 1.000 | 0.997 | 0.998 | - |

## Header, footer and page-number checks

| Fixture | Engine | Expected text present | PAGE fields found |
|---|---|---|---|
| 05_headers_footers | word2pdf | ZipDrop Header: yes, internal evaluation copy: yes | none |
| 05_headers_footers | office2pdf | ZipDrop Header: yes, internal evaluation copy: yes | none |
| 06_page_numbers | word2pdf | Page 1 of: yes, Page 2 of: yes | 1 of 3, 2 of 3, 3 of 3 |
| 06_page_numbers | office2pdf | Page 1 of: yes, Page 2 of: yes | 1 of 3, 2 of 3, 3 of 3 |
| 13_kitchen_sink | word2pdf | Kitchen Sink Header: yes | 1 of 3, 2 of 3, 3 of 3 |
| 13_kitchen_sink | office2pdf | Kitchen Sink Header: yes | 1 of 3, 2 of 3, 3 of 3 |

## Devanagari text-layer checks

| Fixture | Engine | Expected substrings found |
|---|---|---|
| 10_devanagari | word2pdf | हिन्दी: yes, ज़िपड्रॉप: yes, भारत: yes, नमस्ते: yes, सर्वे: yes, संयुक्ताक्षर: yes |
| 10_devanagari | office2pdf | हिन्दी: yes, ज़िपड्रॉप: yes, भारत: yes, नमस्ते: yes, सर्वे: yes, संयुक्ताक्षर: yes |
| 13_kitchen_sink | word2pdf | नमस्ते दुनिया: yes |
| 13_kitchen_sink | office2pdf | नमस्ते दुनिया: yes |

## Warnings and missing fonts

| Engine | Fixture | Warnings | Missing fonts |
|---|---|---|---|
| both | all | none | none |
