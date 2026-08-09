/**
 * Document Model → DOCX generator.
 * Produces valid OOXML packaged as a .docx ZIP file.
 */

import JSZip from "jszip";
import {
  DocxDocument, DocxSection, DocxParagraph, DocxRun, DocxTable,
  DocxTableRow, DocxTableCell, InlineContent,
  ParagraphProperties, RunProperties, TableProperties,
  TWIPS_PER_INCH, A4_WIDTH_TWIPS, A4_HEIGHT_TWIPS,
} from "./types";

/* ── XML builders ──────────────────────────────────────────────────── */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function attr(name: string, val: string | number): string {
  return ` ${name}="${val}"`;
}

function indent(level: number): string {
  return "  ".repeat(level);
}

function runPropsXml(rp: RunProperties, indentLevel = 0): string {
  const p = indent(indentLevel);
  let xml = `${p}<w:rPr>`;
  if (rp.styleId) xml += `<w:rStyle w:val="${esc(rp.styleId)}"/>`;
  if (rp.font || rp.eastAsiaFont) {
    xml += `<w:rFonts`;
    if (rp.font) xml += ` w:ascii="${esc(rp.font)}" w:hAnsi="${esc(rp.font)}"`;
    if (rp.eastAsiaFont) xml += ` w:eastAsia="${esc(rp.eastAsiaFont)}"`;
    xml += `/>`;
  }
  if (rp.bold) xml += `<w:b/>`;
  if (rp.italic) xml += `<w:i/>`;
  if (rp.underline) xml += `<w:underline w:val="${esc(rp.underline.val)}"/>`;
  if (rp.strike) xml += `<w:strike/>`;
  if (rp.doubleStrike) xml += `<w:dstrike/>`;
  if (rp.superscript) xml += `<w:vertAlign w:val="superscript"/>`;
  if (rp.subscript) xml += `<w:vertAlign w:val="subscript"/>`;
  if (rp.size) xml += `<w:sz w:val="${rp.size}"/><w:szCs w:val="${rp.size}"/>`;
  if (rp.color) xml += `<w:color w:val="${esc(rp.color)}"/>`;
  if (rp.highlight) xml += `<w:highlight w:val="${esc(rp.highlight)}"/>`;
  if (rp.caps) xml += `<w:caps/>`;
  if (rp.smallCaps) xml += `<w:smallCaps/>`;
  if (rp.spacing) xml += `<w:spacing w:val="${rp.spacing}"/>`;
  if (rp.shading) xml += `<w:shd w:val="${esc(rp.shading.val || 'clear')}" w:color="${esc(rp.shading.color || 'auto')}" w:fill="${esc(rp.shading.fill || 'auto')}"/>`;
  xml += `</w:rPr>`;
  return xml;
}

function paraPropsXml(pp: ParagraphProperties): string {
  let xml = `<w:pPr>`;
  if (pp.styleId) xml += `<w:pStyle w:val="${esc(pp.styleId)}"/>`;
  if (pp.keepNext) xml += `<w:keepNext/>`;
  if (pp.keepLines) xml += `<w:keepLines/>`;
  if (pp.pageBreakBefore) xml += `<w:pageBreakBefore/>`;
  if (pp.numbering) {
    xml += `<w:numPr>`;
    xml += `<w:ilvl w:val="${pp.numbering.level}"/>`;
    xml += `<w:numId w:val="${pp.numbering.numId}"/>`;
    xml += `</w:numPr>`;
  }
  if (pp.alignment) {
    const alignMap: Record<string, string> = { left: "left", center: "center", right: "right", justify: "both" };
    xml += `<w:jc w:val="${alignMap[pp.alignment] || 'left'}"/>`;
  }
  if (pp.indent) {
    xml += `<w:ind`;
    if (pp.indent.left != null) xml += ` w:left="${pp.indent.left}"`;
    if (pp.indent.right != null) xml += ` w:right="${pp.indent.right}"`;
    if (pp.indent.firstLine != null) xml += ` w:firstLine="${pp.indent.firstLine}"`;
    if (pp.indent.hanging != null) xml += ` w:hanging="${pp.indent.hanging}"`;
    xml += `/>`;
  }
  if (pp.spacing) {
    xml += `<w:spacing`;
    if (pp.spacing.before != null) xml += ` w:before="${pp.spacing.before}"`;
    if (pp.spacing.after != null) xml += ` w:after="${pp.spacing.after}"`;
    if (pp.spacing.line != null) xml += ` w:line="${pp.spacing.line}"`;
    if (pp.spacing.lineRule) xml += ` w:lineRule="${pp.spacing.lineRule}"`;
    xml += `/>`;
  }
  if (pp.shading) {
    xml += `<w:shd w:val="${esc(pp.shading.val || 'clear')}" w:color="${esc(pp.shading.color || 'auto')}" w:fill="${esc(pp.shading.fill || 'auto')}"/>`;
  }
  if (pp.tabs && pp.tabs.length > 0) {
    xml += `<w:tabs>`;
    for (const tab of pp.tabs) {
      xml += `<w:tab w:val="${esc(tab.val)}" w:pos="${tab.pos}"`;
      if (tab.leader) xml += ` w:leader="${esc(tab.leader)}"`;
      xml += `/>`;
    }
    xml += `</w:tabs>`;
  }
  xml += `</w:pPr>`;
  return xml;
}

function inlineContentXml(item: InlineContent): string {
  if (item.kind === "run") {
    return `<w:r>${runPropsXml(item.properties)}<w:t xml:space="preserve">${esc(item.text)}</w:t></w:r>`;
  }
  if (item.kind === "tab") return `<w:r><w:tab/></w:r>`;
  if (item.kind === "break") return `<w:r><w:br${item.breakType ? ` w:type="${item.breakType}"` : ""}/></w:r>`;
  if (item.kind === "hyperlink") {
    let xml = `<w:hyperlink`;
    if (item.anchor) xml += ` w:anchor="${esc(item.anchor)}"`;
    xml += `>`;
    for (const run of item.runs) {
      xml += `<w:r>${runPropsXml(run.properties)}<w:t xml:space="preserve">${esc(run.text)}</w:t></w:r>`;
    }
    xml += `</w:hyperlink>`;
    return xml;
  }
  return "";
}

function paragraphXml(para: DocxParagraph): string {
  let xml = `<w:p>`;
  xml += paraPropsXml(para.properties);
  if (para.runs.length === 0) {
    xml += `<w:r><w:t/></w:r>`;
  } else {
    for (const item of para.runs) xml += inlineContentXml(item);
  }
  xml += `</w:p>`;
  return xml;
}

function tableBordersXml(borders: TableProperties["borders"]): string {
  if (!borders) return "";
  let xml = `<w:tblBorders>`;
  for (const side of ["top", "bottom", "left", "right", "insideH", "insideV"]) {
    const b = (borders as any)[side];
    if (b) {
      xml += `<w:${side} w:val="${esc(b.style || 'single')}"`;
      if (b.size) xml += ` w:sz="${b.size}"`;
      if (b.color) xml += ` w:color="${esc(b.color)}"`;
      xml += `/>`;
    }
  }
  xml += `</w:tblBorders>`;
  return xml;
}

function tableXml(table: DocxTable): string {
  let xml = `<w:tbl>`;
  xml += `<w:tblPr>`;
  if (table.properties.styleId) xml += `<w:tblStyle w:val="${esc(table.properties.styleId)}"/>`;
  if (table.properties.width) {
    xml += `<w:tblW w:w="${table.properties.width.value}" w:type="${esc(table.properties.width.type)}"/>`;
  }
  if (table.properties.alignment) xml += `<w:jc w:val="${table.properties.alignment}"/>`;
  xml += tableBordersXml(table.properties.borders);
  if (table.properties.layout) xml += `<w:tblLayout w:type="${esc(table.properties.layout)}"/>`;
  xml += `</w:tblPr>`;

  for (const row of table.rows) {
    xml += `<w:tr>`;
    if (row.properties.header) xml += `<w:trPr><w:tblHeader/></w:trPr>`;
    for (const cell of row.cells) {
      xml += `<w:tc>`;
      xml += `<w:tcPr>`;
      if (cell.properties.width) {
        xml += `<w:tcW w:w="${cell.properties.width.value}" w:type="${esc(cell.properties.width.type)}"/>`;
      }
      if (cell.properties.columnSpan) xml += `<w:gridSpan w:val="${cell.properties.columnSpan}"/>`;
      if (cell.properties.verticalAlign) xml += `<w:vAlign w:val="${cell.properties.verticalAlign}"/>`;
      if (cell.properties.shading) {
        xml += `<w:shd w:val="${esc(cell.properties.shading.val || 'clear')}" w:color="${esc(cell.properties.shading.color || 'auto')}" w:fill="${esc(cell.properties.shading.fill || 'auto')}"/>`;
      }
      xml += `</w:tcPr>`;
      for (const block of cell.content) {
        if ("runs" in block) xml += paragraphXml(block as DocxParagraph);
        else if ("rows" in block) xml += tableXml(block as DocxTable);
      }
      xml += `</w:tc>`;
    }
    xml += `</w:tr>`;
  }

  xml += `</w:tbl>`;
  return xml;
}

function sectionContentXml(section: DocxSection): string {
  let xml = "";
  for (const block of section.content) {
    if ("runs" in block) xml += paragraphXml(block as DocxParagraph);
    else if ("rows" in block) xml += tableXml(block as DocxTable);
  }
  return xml;
}

function sectionPropsXml(props: DocxSection["properties"]): string {
  let xml = `<w:sectPr>`;
  xml += `<w:pgSz w:w="${props.pageWidth}" w:h="${props.pageHeight}"`;
  if (props.orientation === "landscape") xml += ` w:orient="landscape"`;
  xml += `/>`;
  xml += `<w:pgMar w:top="${props.marginTop}" w:bottom="${props.marginBottom}" w:left="${props.marginLeft}" w:right="${props.marginRight}" w:header="720" w:footer="720" w:gutter="0"/>`;
  xml += `</w:sectPr>`;
  return xml;
}

function documentXml(doc: DocxDocument): string {
  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  xml += `<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" `;
  xml += `xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" `;
  xml += `xmlns:o="urn:schemas-microsoft-com:office:office" `;
  xml += `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" `;
  xml += `xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" `;
  xml += `xmlns:v="urn:schemas-microsoft-com:vml" `;
  xml += `xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" `;
  xml += `xmlns:w10="urn:schemas-microsoft-com:office:word" `;
  xml += `xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" `;
  xml += `xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" `;
  xml += `mc:Ignorable="w14 wp14">\n`;
  xml += `<w:body>\n`;

  for (const section of doc.sections) {
    xml += sectionContentXml(section);
  }

  if (doc.sections.length > 0) {
    xml += sectionPropsXml(doc.sections[doc.sections.length - 1].properties);
  } else {
    xml += sectionPropsXml({
      pageWidth: A4_WIDTH_TWIPS, pageHeight: A4_HEIGHT_TWIPS,
      marginTop: 1440, marginBottom: 1440,
      marginLeft: 1800, marginRight: 1800,
      orientation: "portrait",
    });
  }

  xml += `</w:body>\n</w:document>`;
  return xml;
}

function stylesXml(doc: DocxDocument): string {
  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  xml += `<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n`;

  xml += `<w:docDefaults>`;
  xml += `<w:rPrDefault><w:rPr>`;
  const rd = doc.styles.docDefaults.runDefaults;
  if (rd.font) xml += `<w:rFonts w:ascii="${esc(rd.font)}" w:hAnsi="${esc(rd.font)}"/>`;
  if (rd.size) xml += `<w:sz w:val="${rd.size}"/><w:szCs w:val="${rd.size}"/>`;
  xml += `</w:rPr></w:rPrDefault>`;
  xml += `<w:pPrDefault><w:pPr>`;
  if (doc.styles.docDefaults.paragraphDefaults.spacing?.after != null) {
    xml += `<w:spacing w:after="${doc.styles.docDefaults.paragraphDefaults.spacing.after}"/>`;
  }
  xml += `</w:pPr></w:pPrDefault>`;
  xml += `</w:docDefaults>\n`;

  for (const [, ps] of doc.styles.paragraphStyles) {
    xml += `<w:style w:type="paragraph" w:styleId="${esc(ps.id)}"${ps.qFormat ? ' w:default="0"' : ""}>`;
    if (ps.name) xml += `<w:name w:val="${esc(ps.name)}"/>`;
    if (ps.basedOn) xml += `<w:basedOn w:val="${esc(ps.basedOn)}"/>`;
    xml += `<w:pPr>`;
    if (ps.paragraphProperties.alignment) xml += `<w:jc w:val="${ps.paragraphProperties.alignment}"/>`;
    if (ps.paragraphProperties.spacing?.after != null) xml += `<w:spacing w:after="${ps.paragraphProperties.spacing.after}"/>`;
    xml += `</w:pPr>`;
    xml += runPropsXml(ps.runProperties, 0);
    xml += `</w:style>\n`;
  }

  for (const [, cs] of doc.styles.characterStyles) {
    xml += `<w:style w:type="character" w:styleId="${esc(cs.id)}">`;
    if (cs.name) xml += `<w:name w:val="${esc(cs.name)}"/>`;
    xml += runPropsXml(cs.runProperties, 0);
    xml += `</w:style>\n`;
  }

  xml += `</w:styles>`;
  return xml;
}

function numberingXml(doc: DocxDocument): string {
  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  xml += `<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n`;

  for (const [id, abs] of doc.numbering.abstractNums) {
    xml += `<w:abstractNum w:abstractNumId="${id}">`;
    for (const [ilvl, lvl] of abs.levels) {
      xml += `<w:lvl w:ilvl="${ilvl}">`;
      if (lvl.start != null) xml += `<w:start w:val="${lvl.start}"/>`;
      if (lvl.numberFormat) xml += `<w:numFmt w:val="${esc(lvl.numberFormat)}"/>`;
      if (lvl.levelText) xml += `<w:lvlText w:val="${esc(lvl.levelText)}"/>`;
      if (lvl.levelJustification) xml += `<w:lvlJc w:val="${esc(lvl.levelJustification)}"/>`;
      xml += `</w:lvl>`;
    }
    xml += `</w:abstractNum>\n`;
  }

  for (const [id, num] of doc.numbering.nums) {
    xml += `<w:num w:numId="${id}">`;
    xml += `<w:abstractNumId w:val="${num.abstractNumId}"/>`;
    for (const [ilvl, ovr] of num.levels) {
      xml += `<w:lvlOverride w:ilvl="${ilvl}">`;
      if (ovr.start != null) xml += `<w:startOverride w:val="${ovr.start}"/>`;
      xml += `</w:lvlOverride>`;
    }
    xml += `</w:num>\n`;
  }

  xml += `</w:numbering>`;
  return xml;
}

function contentTypesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>`;
}

function relsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

function documentRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`;
}

/* ── Public API ────────────────────────────────────────────────────── */

export async function generateDocx(doc: DocxDocument): Promise<Blob> {
  const zip = new JSZip();

  zip.file("[Content_Types].xml", contentTypesXml());
  zip.file("_rels/.rels", relsXml());
  zip.file("word/document.xml", documentXml(doc));
  zip.file("word/styles.xml", stylesXml(doc));
  zip.file("word/numbering.xml", numberingXml(doc));
  zip.file("word/_rels/document.xml.rels", documentRelsXml());

  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
