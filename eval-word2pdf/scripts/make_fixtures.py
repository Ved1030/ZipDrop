"""Generate the shared DOCX corpus used by every engine under test."""

from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT, WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures"
IMAGES = FIXTURES / "images"
FIXTURES.mkdir(exist_ok=True)
IMAGES.mkdir(exist_ok=True)


def make_images():
    logo = Image.new("RGB", (600, 260), "#0f172a")
    d = ImageDraw.Draw(logo)
    d.rounded_rectangle([30, 30, 570, 230], radius=28, fill="#1d4ed8")
    d.ellipse([60, 60, 200, 200], fill="#f59e0b")
    d.text((230, 100), "ZipDrop", fill="white")
    d.text((232, 150), "sample logo image", fill="#dbeafe")
    logo.save(IMAGES / "logo.png")

    chart = Image.new("RGB", (900, 520), "white")
    d = ImageDraw.Draw(chart)
    d.text((30, 20), "Quarterly conversion volume", fill="black")
    values = [120, 210, 175, 310, 285, 360]
    for i, value in enumerate(values):
        x = 70 + i * 130
        d.rectangle([x, 450 - value, x + 80, 450], fill="#2563eb")
        d.text((x + 20, 460), f"Q{i + 1}", fill="black")
        d.text((x + 15, 430 - value), str(value), fill="black")
    d.line([50, 450, 860, 450], fill="black", width=3)
    chart.save(IMAGES / "chart.png")

    photo = Image.new("RGB", (640, 400))
    d = ImageDraw.Draw(photo)
    for y in range(400):
        d.line([(0, y), (640, y)], fill=(30 + y // 6, 70 + y // 4, 140 + y // 8))
    d.ellipse([220, 90, 420, 290], fill="#fbbf24")
    d.text((230, 330), "floating image", fill="white")
    photo.save(IMAGES / "photo.jpg", quality=88)


def set_font(run, name, size=None, bold=None, italic=None, color=None, cs=False):
    run.font.name = name
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.insert(0, rfonts)
    for attr in ("w:ascii", "w:hAnsi", "w:eastAsia"):
        rfonts.set(qn(attr), name)
    if cs:
        rfonts.set(qn("w:cs"), name)
    if size is not None:
        run.font.size = Pt(size)
        if cs:
            szcs = OxmlElement("w:szCs")
            szcs.set(qn("w:val"), str(int(size * 2)))
            rpr.append(szcs)
    if bold is not None:
        run.font.bold = bold
    if italic is not None:
        run.font.italic = italic
    if color is not None:
        run.font.color.rgb = RGBColor.from_string(color)


def add_field(paragraph, instruction, cached="1", font="Calibri", size=10):
    run = paragraph.add_run()
    set_font(run, font, size)
    r = run._element

    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = f" {instruction} "
    sep = OxmlElement("w:fldChar")
    sep.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = cached
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    for node in (begin, instr, sep, text, end):
        r.append(node)


def page_number_footer(section, prefix="Page "):
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(prefix)
    set_font(run, "Calibri", 10)
    add_field(p, "PAGE", "1")
    run = p.add_run(" of ")
    set_font(run, "Calibri", 10)
    add_field(p, "NUMPAGES", "9")


def float_picture(paragraph, image_path, x_in=3.6, y_in=0.2, width_in=2.2, behind=False):
    """Insert an inline picture, then convert it to a square-wrapped anchor."""
    run = paragraph.add_run()
    run.add_picture(str(image_path), width=Inches(width_in))
    drawing = run._element.find(qn("w:drawing"))
    inline = drawing.find(qn("wp:inline"))

    anchor = OxmlElement("wp:anchor")
    for key, value in {
        "distT": "0",
        "distB": "0",
        "distL": "114300",
        "distR": "114300",
        "simplePos": "0",
        "relativeHeight": "251658240",
        "behindDoc": "1" if behind else "0",
        "locked": "0",
        "layoutInCell": "1",
        "allowOverlap": "1",
    }.items():
        anchor.set(key, value)

    simple_pos = OxmlElement("wp:simplePos")
    simple_pos.set("x", "0")
    simple_pos.set("y", "0")
    anchor.append(simple_pos)

    for tag, rel, offset in (
        ("wp:positionH", "column", x_in),
        ("wp:positionV", "paragraph", y_in),
    ):
        pos = OxmlElement(tag)
        pos.set("relativeFrom", rel)
        value = OxmlElement("wp:posOffset")
        value.text = str(int(offset * 914400))
        pos.append(value)
        anchor.append(pos)

    wrap = OxmlElement("wp:wrapSquare")
    wrap.set("wrapText", "bothSides")
    anchor.append(wrap)

    preserved = []
    for tag in ("wp:extent", "wp:effectExtent", "wp:docPr", "wp:cNvGraphicFramePr", "a:graphic"):
        element = inline.find(qn(tag))
        if element is not None:
            preserved.append(element)
    for element in preserved:
        anchor.append(element)

    drawing.remove(inline)
    drawing.append(anchor)


def base_document():
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)
    return doc


def simple_text():
    doc = base_document()
    doc.add_heading("Simple Text Document", level=1)
    doc.add_paragraph(
        "ZipDrop converts files quickly and reliably. This paragraph contains ordinary "
        "sentences with punctuation, numbers (1234567890), and symbols (& % $ # @)."
    )
    doc.add_paragraph("A second paragraph follows with a manual line break here:\nand the text continues on the next line.")
    p = doc.add_paragraph("Bulleted items:", style="List Bullet")
    p = doc.add_paragraph("First bullet point about documents", style="List Bullet")
    p = doc.add_paragraph("Second bullet point about conversions", style="List Bullet")
    p = doc.add_paragraph("Numbered item one", style="List Number")
    p = doc.add_paragraph("Numbered item two", style="List Number")
    doc.save(FIXTURES / "01_simple_text.docx")


def fonts_sizes():
    doc = base_document()
    doc.add_heading("Fonts and Sizes", level=1)
    samples = [
        ("Calibri 11 regular", "Calibri", 11, False, False),
        ("Arial 14 bold", "Arial", 14, True, False),
        ("Times New Roman 12 italic", "Times New Roman", 12, False, True),
        ("Courier New 10", "Courier New", 10, False, False),
        ("Georgia 16 bold italic", "Georgia", 16, True, True),
        ("Verdana 9", "Verdana", 9, False, False),
        ("Tahoma 18", "Tahoma", 18, False, False),
        ("Segoe UI 24 bold", "Segoe UI", 24, True, False),
        ("Calibri 32 display", "Calibri", 32, False, False),
    ]
    for text, font, size, bold, italic in samples:
        p = doc.add_paragraph()
        run = p.add_run(text)
        set_font(run, font, size, bold, italic)
    p = doc.add_paragraph()
    for text, colour in (("Red ", "C00000"), ("Green ", "00B050"), ("Blue", "0070C0")):
        set_font(p.add_run(text), "Calibri", 14, bool(True), False, colour)
    doc.save(FIXTURES / "02_fonts_sizes.docx")


def tables_merged():
    doc = base_document()
    doc.add_heading("Tables and Merged Cells", level=1)
    table = doc.add_table(rows=5, cols=4)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Region", "Q1", "Q2", "Total"]
    for i, header in enumerate(headers):
        cell = table.cell(0, i)
        cell.text = header
        cell.paragraphs[0].runs[0].bold = True
    rows = [
        ("North", "1,200", "1,450", "2,650"),
        ("South", "980", "1,310", "2,290"),
        ("East", "1,540", "1,620", "3,160"),
    ]
    for r, values in enumerate(rows, start=1):
        for c, value in enumerate(values):
            table.cell(r, c).text = value
    merged = table.cell(4, 0).merge(table.cell(4, 1))
    merged.text = "Merged across two columns"
    table.cell(4, 2).merge(table.cell(4, 3)).text = "Merged right side"

    doc.add_paragraph()
    table2 = doc.add_table(rows=4, cols=3)
    table2.style = "Light Grid Accent 1"
    table2.cell(0, 0).merge(table2.cell(2, 0)).text = "Vertical merge"
    for r in range(4):
        for c in (1, 2):
            table2.cell(r, c).text = f"R{r + 1}C{c + 1}"
    doc.save(FIXTURES / "03_tables_merged.docx")


def images():
    doc = base_document()
    doc.add_heading("Inline Images", level=1)
    doc.add_paragraph("The image below is inline and should stay between these two paragraphs.")
    doc.add_picture(str(IMAGES / "logo.png"), width=Inches(3.2))
    doc.add_paragraph("A chart follows on its own line.")
    doc.add_picture(str(IMAGES / "chart.png"), width=Inches(5.6))
    doc.add_paragraph("A JPEG photograph follows.")
    doc.add_picture(str(IMAGES / "photo.jpg"), width=Inches(3.0))
    doc.save(FIXTURES / "04_images.docx")


def headers_footers():
    doc = base_document()
    section = doc.sections[0]
    hp = section.header.paragraphs[0]
    hp.text = "ZipDrop Header — Confidential"
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    set_font(hp.runs[0], "Arial", 10, True, False, "1F4E79")
    fp = section.footer.paragraphs[0]
    fp.text = "Footer: internal evaluation copy"
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_font(fp.runs[0], "Arial", 9, False, True, "595959")

    doc.add_heading("Headers and Footers", level=1)
    for i in range(3):
        doc.add_paragraph(
            f"Page body paragraph {i + 1}. The header above and the footer below must appear "
            "on this page as well as on any following pages."
        )
    doc.add_page_break()
    doc.add_paragraph("Second page body. Header and footer should still be present.")
    doc.save(FIXTURES / "05_headers_footers.docx")


def page_numbers():
    doc = base_document()
    page_number_footer(doc.sections[0])
    doc.add_heading("Page Numbers", level=1)
    doc.add_paragraph("The footer shows a PAGE field and a NUMPAGES field.")
    for i in range(40):
        doc.add_paragraph(
            f"Filler paragraph {i + 1} for pagination. "
            "This text is long enough to push the document across several pages."
        )
    doc.save(FIXTURES / "06_page_numbers.docx")


def multipage():
    doc = base_document()
    doc.add_heading("Multiple Pages", level=1)
    for chapter in range(1, 6):
        doc.add_heading(f"Chapter {chapter}", level=2)
        for para in range(8):
            doc.add_paragraph(
                f"Chapter {chapter}, paragraph {para + 1}. "
                "ZipDrop should preserve reading order and reflow this text across pages exactly "
                "as a word processor would. This sentence is repeated to build volume."
            )
    doc.save(FIXTURES / "07_multipage.docx")


def page_breaks():
    doc = base_document()
    doc.add_heading("Page Breaks", level=1)
    p = doc.add_paragraph("Content on page one.")
    p.add_run().add_break(WD_BREAK.PAGE)
    doc.add_paragraph("Content after the first explicit page break (page two).")
    p = doc.add_paragraph("More page-two content.")
    p.add_run().add_break(WD_BREAK.PAGE)
    doc.add_paragraph("Content after the second explicit page break (page three).")
    doc.save(FIXTURES / "08_page_breaks.docx")


def orientations():
    doc = base_document()
    doc.add_heading("Portrait Section", level=1)
    doc.add_paragraph("This section is portrait A4-like Letter size.")
    landscape = doc.add_section(WD_SECTION.NEW_PAGE)
    landscape.orientation = WD_ORIENT.LANDSCAPE
    landscape.page_width, landscape.page_height = landscape.page_height, landscape.page_width
    doc.add_heading("Landscape Section", level=1)
    doc.add_paragraph("This section is landscape. A wide table follows.")
    table = doc.add_table(rows=3, cols=8)
    table.style = "Table Grid"
    for r in range(3):
        for c in range(8):
            table.cell(r, c).text = f"L{r + 1}C{c + 1}"
    portrait = doc.add_section(WD_SECTION.NEW_PAGE)
    portrait.orientation = WD_ORIENT.PORTRAIT
    portrait.page_width, portrait.page_height = portrait.page_height, portrait.page_width
    doc.add_heading("Portrait Again", level=1)
    doc.add_paragraph("This section returns to portrait orientation.")
    doc.save(FIXTURES / "09_orientations.docx")


def devanagari():
    doc = base_document()
    doc.add_heading("Devanagari and Indian Languages", level=1)
    lines = [
        ("हिन्दी", "Hindi"),
        ("ज़िपड्रॉप में आपका स्वागत है।", "Welcome to ZipDrop."),
        ("भारत एक विशाल और विविधतापूर्ण देश है।", "India is a large and diverse country."),
        ("क्ष त्र ज्ञ श्र — संयुक्ताक्षर परीक्षण", "Conjunct consonant test"),
        ("नमस्ते दुनिया! १२३४५६७८९०", "Hello world with Devanagari digits"),
        ("मराठी: माझे नाव वेद आहे.", "Marathi sample"),
        ("संस्कृत: सर्वे भवन्तु सुखिनः।", "Sanskrit sample"),
    ]
    for text, gloss in lines:
        p = doc.add_paragraph()
        run = p.add_run(text)
        set_font(run, "Nirmala UI", 16, cs=True)
        p2 = doc.add_paragraph()
        run2 = p2.add_run(f"({gloss})")
        set_font(run2, "Calibri", 9, italic=True)
    p = doc.add_paragraph()
    set_font(p.add_run("Mixed script: ZipDrop supports हिन्दी text in the same paragraph."), "Nirmala UI", 12, cs=True)
    doc.save(FIXTURES / "10_devanagari.docx")


def floating_images():
    doc = base_document()
    doc.add_heading("Floating Images", level=1)
    p = doc.add_paragraph()
    float_picture(p, IMAGES / "photo.jpg", x_in=3.5, y_in=0.1, width_in=2.4)
    p.add_run(
        "This paragraph flows beside a floating picture anchored to the right of the column. "
        "The image is square-wrapped, so the text should stop at its left edge and continue "
        "below it. ZipDrop needs to keep the picture in place while the surrounding text wraps. "
        "Additional sentences make the wrap effect visible: the quick brown fox jumps over the "
        "lazy dog while the conversion engine keeps every line intact. "
        "One more sentence to guarantee the paragraph is taller than the image."
    )
    doc.add_paragraph("A normal paragraph after the floating image.")
    doc.save(FIXTURES / "11_floating_images.docx")


def nested_tables():
    doc = base_document()
    doc.add_heading("Nested Tables", level=1)
    outer = doc.add_table(rows=3, cols=3)
    outer.style = "Table Grid"
    for r in range(3):
        for c in range(3):
            outer.cell(r, c).text = f"Outer {r + 1},{c + 1}"
    inner = outer.cell(1, 1).add_table(rows=3, cols=2)
    inner.style = "Light Shading Accent 2"
    for r in range(3):
        for c in range(2):
            inner.cell(r, c).text = f"In {r + 1},{c + 1}"
    outer.cell(1, 1).paragraphs[-1].text = "Cell containing a nested table above."
    doc.add_paragraph("Text after the nested table.")
    doc.save(FIXTURES / "12_nested_tables.docx")


def kitchen_sink():
    doc = base_document()
    section = doc.sections[0]
    section.header.paragraphs[0].text = "Kitchen Sink Header"
    page_number_footer(section)
    doc.add_heading("Kitchen Sink", level=1)
    doc.add_paragraph("This document combines most features in a single file.")
    table = doc.add_table(rows=4, cols=4)
    table.style = "Table Grid"
    for r in range(4):
        for c in range(4):
            table.cell(r, c).text = f"K{r},{c}"
    table.cell(0, 0).merge(table.cell(0, 3)).text = "Merged title row"
    doc.add_picture(str(IMAGES / "chart.png"), width=Inches(4.5))
    p = doc.add_paragraph()
    float_picture(p, IMAGES / "logo.png", x_in=3.8, y_in=0.0, width_in=2.0)
    p.add_run(
        "Floating logo beside this paragraph. " * 6
    )
    doc.add_page_break()
    doc.add_heading("Devanagari section", level=2)
    run = doc.add_paragraph().add_run("नमस्ते दुनिया — ज़िपड्रॉप परीक्षण")
    set_font(run, "Nirmala UI", 14, cs=True)
    doc.add_heading("Landscape section", level=2)
    landscape = doc.add_section(WD_SECTION.NEW_PAGE)
    landscape.orientation = WD_ORIENT.LANDSCAPE
    landscape.page_width, landscape.page_height = landscape.page_height, landscape.page_width
    doc.add_paragraph("Landscape page with a wide table.")
    wide = doc.add_table(rows=3, cols=9)
    wide.style = "Table Grid"
    for r in range(3):
        for c in range(9):
            wide.cell(r, c).text = f"{r},{c}"
    doc.save(FIXTURES / "13_kitchen_sink.docx")


def indian_languages():
    doc = base_document()
    doc.add_heading("Indian Languages", level=1)
    samples = [
        ("Bengali", "বাংলা ভাষা সুন্দর।"),
        ("Tamil", "தமிழ் மொழி அழகானது."),
        ("Telugu", "తెలుగు భాష చాలా బాగుంది."),
        ("Gujarati", "ગુજરાતી ભાષા સુંદર છે."),
        ("Punjabi", "ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਬਹੁਤ ਸੋਹਣੀ ਹੈ।"),
        ("Kannada", "ಕನ್ನಡ ಭಾಷೆ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ."),
        ("Malayalam", "മലയാളം ഭാഷ വളരെ മനോഹരമാണ്."),
        ("Odia", "ଓଡ଼ିଆ ଭାଷା ବହୁତ ସୁନ୍ଦର |"),
        ("Devanagari", "हिन्दी और मराठी और संस्कृत।"),
    ]
    for language, text in samples:
        p = doc.add_paragraph()
        set_font(p.add_run(f"{language}: "), "Calibri", 11, bold=True)
        set_font(p.add_run(text), "Nirmala UI", 15, cs=True)
    doc.save(FIXTURES / "15_indian_languages.docx")


def perf_large():
    doc = base_document()
    doc.add_heading("Large Performance Document", level=1)
    for chapter in range(1, 21):
        doc.add_heading(f"Chapter {chapter}: Conversion throughput", level=2)
        for para in range(12):
            doc.add_paragraph(
                f"Chapter {chapter}, paragraph {para + 1}. "
                "ZipDrop is evaluating pure-Python and pure-Rust document conversion engines. "
                "This repeated body text simulates a long policy or report document and gives "
                "the pagination logic enough content to produce many pages. "
            )
        if chapter % 4 == 0:
            table = doc.add_table(rows=6, cols=5)
            table.style = "Table Grid"
            for r in range(6):
                for c in range(5):
                    table.cell(r, c).text = f"C{chapter}-{r}-{c}"
        if chapter % 7 == 0:
            doc.add_picture(str(IMAGES / "chart.png"), width=Inches(4.0))
    doc.save(FIXTURES / "14_perf_large.docx")


def main():
    make_images()
    simple_text()
    fonts_sizes()
    tables_merged()
    images()
    headers_footers()
    page_numbers()
    multipage()
    page_breaks()
    orientations()
    devanagari()
    floating_images()
    nested_tables()
    kitchen_sink()
    indian_languages()
    perf_large()
    for path in sorted(FIXTURES.glob("*.docx")):
        print(f"{path.name:28s} {path.stat().st_size / 1024:8.1f} KB")


if __name__ == "__main__":
    main()
