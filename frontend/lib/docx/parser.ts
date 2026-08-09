/**
 * OOXML → Document Model parser.
 * Client-side only — uses DOMParser for XML parsing.
 */

import {
  DocxDocument, DocxSection, SectionProperties, ContentBlock,
  DocxParagraph, DocxRun, InlineContent, DocxHyperlink,
  DocxTab, DocxBreak, DocxImage, DocxDrawing,
  ParagraphProperties, RunProperties, ParagraphBorder, BorderInfo, TabStop,
  DocxTable, DocxTableRow, DocxTableCell,
  TableProperties, TableBorders, TableRowProperties, TableCellProperties,
  DocxStyles, ParagraphStyle, CharacterStyle, TableStyle, NumberingStyle, ListStyle,
  DocxNumbering, AbstractNumbering, NumberingLevel, NumberingInstance, NumberingLevelOverride,
  DocxTheme, DocxSettings, CoreProperties,
  A4_WIDTH_TWIPS, A4_HEIGHT_TWIPS,
} from "./types";

/* ── XML helpers ───────────────────────────────────────────────────── */

function getLocalName(el: Element): string {
  return el.localName || el.tagName.replace(/^[^:]+:/, "");
}

function getAttr(el: Element, name: string): string | null {
  return el.getAttribute(name) || el.getAttribute("w:" + name) ||
    el.getAttribute("xmlns:" + name) || null;
}

function childElements(parent: Element, localName?: string): Element[] {
  const result: Element[] = [];
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];
    if (!localName || getLocalName(child) === localName) {
      result.push(child);
    }
  }
  return result;
}

function firstChild(parent: Element, localName: string): Element | null {
  for (let i = 0; i < parent.children.length; i++) {
    if (getLocalName(parent.children[i]) === localName) return parent.children[i];
  }
  return null;
}

function getVal(el: Element): string {
  return el.getAttribute("w:val") || el.getAttribute("val") || el.textContent || "";
}

function getInt(el: Element, attr = "w:val"): number {
  const v = el.getAttribute(attr) || el.getAttribute("val") || "0";
  return parseInt(v, 10) || 0;
}

function getText(el: Element): string {
  let text = "";
  for (let i = 0; i < el.childNodes.length; i++) {
    const n = el.childNodes[i];
    if (n.nodeType === 3) text += n.textContent || "";
    else if (n.nodeType === 1) text += getText(n as Element);
  }
  return text;
}

function parseXml(str: string): Document {
  return new DOMParser().parseFromString(str, "text/xml");
}

/* ── Boolean attribute helpers ─────────────────────────────────────── */

function isOn(el: Element | null): boolean {
  if (!el) return false;
  const val = getVal(el);
  return val !== "false" && val !== "0" && val !== "off";
}

/* ── Color helpers ─────────────────────────────────────────────────── */

function resolveThemeColor(theme: DocxTheme, color: string): string | null {
  if (!color.startsWith("accent")) return null;
  const scheme = theme.colorScheme;
  if (!scheme) return null;
  return scheme.colors.get(color) || null;
}

/* ── Style resolution ──────────────────────────────────────────────── */

function resolveParagraphProps(
  ppr: Element | null,
  styleId: string | undefined,
  styles: DocxStyles,
): ParagraphProperties {
  const props: ParagraphProperties = {};
  if (styleId) {
    const style = styles.paragraphStyles.get(styleId);
    if (style) Object.assign(props, style.paragraphProperties);
  }
  if (!ppr) return props;

  const jc = firstChild(ppr, "jc");
  if (jc) props.alignment = getVal(jc) as any;

  const ind = firstChild(ppr, "ind");
  if (ind) {
    props.indent = {};
    const left = ind.getAttribute("w:left") || ind.getAttribute("w:start");
    const right = ind.getAttribute("w:right") || ind.getAttribute("w:end");
    if (left) props.indent.left = parseInt(left, 10);
    if (right) props.indent.right = parseInt(right, 10);
    const fl = ind.getAttribute("w:firstLine");
    const hanging = ind.getAttribute("w:hanging");
    if (fl) props.indent.firstLine = parseInt(fl, 10);
    if (hanging) props.indent.hanging = parseInt(hanging, 10);
  }

  const spacing = firstChild(ppr, "spacing");
  if (spacing) {
    props.spacing = {};
    const before = spacing.getAttribute("w:before");
    const after = spacing.getAttribute("w:after");
    const line = spacing.getAttribute("w:line");
    const lineRule = spacing.getAttribute("w:lineRule");
    if (before) props.spacing.before = parseInt(before, 10);
    if (after) props.spacing.after = parseInt(after, 10);
    if (line) props.spacing.line = parseInt(line, 10);
    if (lineRule) props.spacing.lineRule = lineRule as any;
  }

  const numPr = firstChild(ppr, "numPr");
  if (numPr) {
    const ilvl = firstChild(numPr, "ilvl");
    const numId = firstChild(numPr, "numId");
    if (numId) {
      props.numbering = {
        numId: getInt(numId),
        level: ilvl ? getInt(ilvl) : 0,
      };
    }
  }

  if (isOn(firstChild(ppr, "keepNext"))) props.keepNext = true;
  if (isOn(firstChild(ppr, "keepLines"))) props.keepLines = true;
  if (isOn(firstChild(ppr, "pageBreakBefore"))) props.pageBreakBefore = true;

  const shd = firstChild(ppr, "shd");
  if (shd) props.shading = { fill: getAttr(shd, "fill") || undefined, color: getAttr(shd, "color") || undefined, val: getVal(shd) };

  const tabs = firstChild(ppr, "tabs");
  if (tabs) {
    props.tabs = childElements(tabs, "tab").map(t => ({
      val: getVal(t),
      leader: getAttr(t, "leader") || undefined,
      pos: getInt(t, "w:pos") || getInt(t, "pos"),
    }));
  }

  return props;
}

function resolveRunProps(
  rpr: Element | null,
  styleId: string | undefined,
  paraStyleId: string | undefined,
  styles: DocxStyles,
): RunProperties {
  const props: RunProperties = {};
  if (paraStyleId) {
    const ps = styles.paragraphStyles.get(paraStyleId);
    if (ps?.runProperties) Object.assign(props, ps.runProperties);
  }
  if (styleId) {
    const cs = styles.characterStyles.get(styleId);
    if (cs) Object.assign(props, cs.runProperties);
  }
  if (!rpr) return props;

  const rFonts = firstChild(rpr, "rFonts");
  if (rFonts) {
    const ascii = rFonts.getAttribute("w:ascii") || rFonts.getAttribute("ascii");
    const eastAsia = rFonts.getAttribute("w:eastAsia");
    if (ascii) props.font = ascii;
    if (eastAsia) props.eastAsiaFont = eastAsia;
  }

  const sz = firstChild(rpr, "sz");
  if (sz) props.size = getInt(sz);

  const color = firstChild(rpr, "color");
  if (color) {
    const val = getVal(color);
    const themeColor = getAttr(color, "themeColor");
    props.color = val || undefined;
    if (themeColor && !val) {
      const resolved = resolveThemeColor({ colorScheme: { colors: new Map() } } as any, themeColor);
      if (resolved) props.color = resolved;
    }
  }

  if (isOn(firstChild(rpr, "b"))) props.bold = true;
  if (isOn(firstChild(rpr, "i"))) props.italic = true;

  const u = firstChild(rpr, "u");
  if (u) props.underline = { val: getVal(u) };

  if (isOn(firstChild(rpr, "strike"))) props.strike = true;
  if (isOn(firstChild(rpr, "dstrike"))) props.doubleStrike = true;

  const vertAlign = firstChild(rpr, "vertAlign");
  if (vertAlign) {
    const v = getVal(vertAlign);
    if (v === "superscript") props.superscript = true;
    else if (v === "subscript") props.subscript = true;
  }

  const highlight = firstChild(rpr, "highlight");
  if (highlight) props.highlight = getVal(highlight);

  if (isOn(firstChild(rpr, "caps"))) props.caps = true;
  if (isOn(firstChild(rpr, "smallCaps"))) props.smallCaps = true;

  const spacing = firstChild(rpr, "spacing");
  if (spacing) props.spacing = getInt(spacing);

  const shd = firstChild(rpr, "shd");
  if (shd) props.shading = { fill: getAttr(shd, "fill") || undefined, color: getAttr(shd, "color") || undefined, val: getVal(shd) };

  return props;
}

/* ── Parse content blocks ──────────────────────────────────────────── */

function parseRuns(parent: Element, inheritedRpr: RunProperties): InlineContent[] {
  const items: InlineContent[] = [];

  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i];
    if (node.nodeType !== 1) continue;
    const el = node as Element;
    const ln = getLocalName(el);

    if (ln === "r") {
      const rpr = firstChild(el, "rPr");
      const rp = rpr ? mergeRunProps(inheritedRpr, parseRunPropsFromElement(rpr)) : { ...inheritedRpr };
      let text = "";
      for (const child of childElements(el)) {
        const cn = getLocalName(child);
        if (cn === "t") text += child.textContent || "";
        else if (cn === "tab") { items.push({ kind: "run", properties: rp, text }); text = ""; items.push({ kind: "tab" }); }
        else if (cn === "br") { items.push({ kind: "run", properties: rp, text }); text = ""; items.push({ kind: "break", breakType: getVal(child) as any || undefined }); }
        else if (cn === "sym") { text += String.fromCharCode(parseInt(getAttr(child, "char") || "0", 16)); }
        else if (cn === "noBreakHyphen") { text += "\u2011"; }
        else if (cn === "softHyphen") { text += "\u00AD"; }
        else if (cn === "drawing" || cn === "pict") { items.push({ kind: "run", properties: rp, text }); text = ""; items.push({ kind: "drawing", html: el.outerHTML }); }
      }
      if (text) items.push({ kind: "run", properties: rp, text });
    } else if (ln === "hyperlink") {
      const anchor = getAttr(el, "anchor") || getAttr(el, "history") ? undefined : undefined;
      const href = el.getAttribute("w:anchor") || el.getAttribute("r:id") || "";
      const hyperlinkRuns: DocxRun[] = [];
      for (const child of childElements(el)) {
        if (getLocalName(child) === "r") {
          const rpr = firstChild(child, "rPr");
          const rp = rpr ? mergeRunProps(inheritedRpr, parseRunPropsFromElement(rpr)) : { ...inheritedRpr };
          const t = firstChild(child, "t");
          if (t) hyperlinkRuns.push({ kind: "run", properties: rp, text: t.textContent || "" });
        }
      }
      items.push({ kind: "hyperlink", anchor: href, runs: hyperlinkRuns });
    }
  }

  return items;
}

function parseRunPropsFromElement(rpr: Element): RunProperties {
  const props: RunProperties = {};
  const rFonts = firstChild(rpr, "rFonts");
  if (rFonts) {
    const ascii = rFonts.getAttribute("w:ascii");
    if (ascii) props.font = ascii;
  }
  const sz = firstChild(rpr, "sz");
  if (sz) props.size = getInt(sz);
  const color = firstChild(rpr, "color");
  if (color) props.color = getVal(color) || undefined;
  if (isOn(firstChild(rpr, "b"))) props.bold = true;
  if (isOn(firstChild(rpr, "i"))) props.italic = true;
  const u = firstChild(rpr, "u");
  if (u) props.underline = { val: getVal(u) };
  if (isOn(firstChild(rpr, "strike"))) props.strike = true;
  if (isOn(firstChild(rpr, "dstrike"))) props.doubleStrike = true;
  const vertAlign = firstChild(rpr, "vertAlign");
  if (vertAlign) {
    const v = getVal(vertAlign);
    if (v === "superscript") props.superscript = true;
    else if (v === "subscript") props.subscript = true;
  }
  const highlight = firstChild(rpr, "highlight");
  if (highlight) props.highlight = getVal(highlight);
  if (isOn(firstChild(rpr, "caps"))) props.caps = true;
  if (isOn(firstChild(rpr, "smallCaps"))) props.smallCaps = true;
  return props;
}

function mergeRunProps(base: RunProperties, override: RunProperties): RunProperties {
  const result = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v !== undefined && v !== null) (result as any)[k] = v;
  }
  return result;
}

function parseParagraph(pEl: Element, styles: DocxStyles, numbering: DocxNumbering): DocxParagraph {
  const ppr = firstChild(pEl, "pPr");
  let styleId: string | undefined;
  if (ppr) {
    const pStyle = firstChild(ppr, "pStyle");
    if (pStyle) styleId = getVal(pStyle);
  }

  const properties = resolveParagraphProps(ppr, styleId, styles);
  const rpr = ppr ? firstChild(ppr, "rPr") : null;
  const baseRunProps: RunProperties = {};
  if (rpr) Object.assign(baseRunProps, parseRunPropsFromElement(rpr));

  const runs = parseRuns(pEl, baseRunProps);

  return { styleId, properties, runs };
}

/* ── Parse table ───────────────────────────────────────────────────── */

function parseTable(tblEl: Element, styles: DocxStyles, numbering: DocxNumbering): DocxTable {
  const tblPr = firstChild(tblEl, "tblPr");
  const properties = parseTableProps(tblPr);
  const rows: DocxTableRow[] = [];

  for (const child of childElements(tblEl)) {
    const ln = getLocalName(child);
    if (ln === "tr") rows.push(parseTableRow(child, styles, numbering));
  }

  return { kind: "table", properties, rows };
}

function parseTableRow(trEl: Element, styles: DocxStyles, numbering: DocxNumbering): DocxTableRow {
  const trPr = firstChild(trEl, "trPr");
  const properties: TableRowProperties = {};
  if (trPr) {
    const trHeight = firstChild(trPr, "trHeight");
    if (trHeight) {
      properties.height = {
        value: getInt(trHeight),
        rule: getAttr(trHeight, "hRule") || "auto",
      };
    }
    if (isOn(firstChild(trPr, "tblHeader"))) properties.header = true;
  }

  const cells: DocxTableCell[] = [];
  for (const child of childElements(trEl)) {
    if (getLocalName(child) === "tc") cells.push(parseTableCell(child, styles, numbering));
  }

  return { properties, cells };
}

function parseTableCell(tcEl: Element, styles: DocxStyles, numbering: DocxNumbering): DocxTableCell {
  const tcPr = firstChild(tcEl, "tcPr");
  const properties = parseCellProps(tcPr);
  const content: ContentBlock[] = [];

  for (const child of childElements(tcEl)) {
    const ln = getLocalName(child);
    if (ln === "p") content.push(parseParagraph(child, styles, numbering));
    else if (ln === "tbl") content.push(parseTable(child, styles, numbering));
  }

  return { properties, content };
}

function parseTableProps(tblPr: Element | null): TableProperties {
  const props: TableProperties = {};
  if (!tblPr) return props;

  const tblW = firstChild(tblPr, "tblW");
  if (tblW) props.width = { value: getInt(tblW), type: getVal(tblW) || "dxa" };

  const jc = firstChild(tblPr, "jc");
  if (jc) props.alignment = getVal(jc) as any;

  const tblBorders = firstChild(tblPr, "tblBorders");
  if (tblBorders) {
    props.borders = {};
    for (const side of ["top", "bottom", "left", "right", "insideH", "insideV"]) {
      const border = firstChild(tblBorders, side);
      if (border) (props.borders as any)[side] = {
        style: getVal(border), size: getInt(border, "w:sz"),
        color: getAttr(border, "color") || undefined,
      };
    }
  }

  const tblCellMar = firstChild(tblPr, "tblCellMar");
  if (tblCellMar) {
    props.cellMargin = {};
    for (const side of ["top", "bottom", "left", "right"]) {
      const m = firstChild(tblCellMar, side);
      if (m) (props.cellMargin as any)[side] = getInt(m);
    }
  }

  const layout = firstChild(tblPr, "tblLayout");
  if (layout) props.layout = getVal(layout);

  const tblStyle = firstChild(tblPr, "tblStyle");
  if (tblStyle) props.styleId = getVal(tblStyle);

  return props;
}

function parseCellProps(tcPr: Element | null): TableCellProperties {
  const props: TableCellProperties = {};
  if (!tcPr) return props;

  const tcW = firstChild(tcPr, "tcW");
  if (tcW) props.width = { value: getInt(tcW), type: getVal(tcW) || "dxa" };

  const vAlign = firstChild(tcPr, "vAlign");
  if (vAlign) props.verticalAlign = getVal(vAlign) as any;

  const gridSpan = firstChild(tcPr, "gridSpan");
  if (gridSpan) props.columnSpan = getInt(gridSpan);

  const vMerge = firstChild(tcPr, "vMerge");
  if (vMerge) {
    const val = getVal(vMerge);
    if (!val || val === "restart") props.rowSpan = 1;
  }

  const tcBorders = firstChild(tcPr, "tcBorders");
  if (tcBorders) {
    props.borders = {};
    for (const side of ["top", "bottom", "left", "right"]) {
      const border = firstChild(tcBorders, side);
      if (border) (props.borders as any)[side] = {
        style: getVal(border), size: getInt(border, "w:sz"),
        color: getAttr(border, "color") || undefined,
      };
    }
  }

  const shd = firstChild(tcPr, "shd");
  if (shd) props.shading = { fill: getAttr(shd, "fill") || undefined, color: getAttr(shd, "color") || undefined, val: getVal(shd) };

  return props;
}

/* ── Parse styles.xml ──────────────────────────────────────────────── */

export function parseStylesXml(xml: string): DocxStyles {
  const doc = parseXml(xml);
  const root = doc.documentElement;

  const result: DocxStyles = {
    docDefaults: { runDefaults: {}, paragraphDefaults: {} },
    paragraphStyles: new Map(),
    characterStyles: new Map(),
    tableStyles: new Map(),
    numberingStyles: new Map(),
    listStyles: new Map(),
  };

  const docDefaults = firstChild(root, "docDefaults");
  if (docDefaults) {
    const rPrDefault = firstChild(docDefaults, "rPrDefault");
    if (rPrDefault) {
      const rpr = firstChild(rPrDefault, "rPr");
      if (rpr) result.docDefaults.runDefaults = parseRunPropsFromElement(rpr);
    }
    const pPrDefault = firstChild(docDefaults, "pPrDefault");
    if (pPrDefault) {
      const ppr = firstChild(pPrDefault, "pPr");
      if (ppr) result.docDefaults.paragraphDefaults = resolveParagraphProps(ppr, undefined, result);
    }
  }

  for (const styleEl of childElements(root, "style")) {
    const type = getAttr(styleEl, "type") || styleEl.getAttribute("w:type") || "";
    const id = getVal(styleEl);
    const name = firstChild(styleEl, "name");
    const basedOn = firstChild(styleEl, "basedOn");

    if (type === "paragraph") {
      const ppr = firstChild(styleEl, "pPr");
      const rpr = firstChild(styleEl, "rPr");
      const ps: ParagraphStyle = {
        id, name: name ? getVal(name) : undefined,
        basedOn: basedOn ? getVal(basedOn) : undefined,
        hidden: !!firstChild(styleEl, "hidden"),
        semiHidden: !!firstChild(styleEl, "semiHidden"),
        qFormat: !!firstChild(styleEl, "qFormat"),
        paragraphProperties: resolveParagraphProps(ppr, undefined, result),
        runProperties: rpr ? parseRunPropsFromElement(rpr) : {},
      };
      result.paragraphStyles.set(id, ps);
    } else if (type === "character") {
      const rpr = firstChild(styleEl, "rPr");
      result.characterStyles.set(id, {
        id, name: name ? getVal(name) : undefined,
        basedOn: basedOn ? getVal(basedOn) : undefined,
        runProperties: rpr ? parseRunPropsFromElement(rpr) : {},
      });
    } else if (type === "table") {
      const tblPr = firstChild(styleEl, "tblPr");
      const ppr = firstChild(styleEl, "pPr");
      const rpr = firstChild(styleEl, "rPr");
      result.tableStyles.set(id, {
        id, name: name ? getVal(name) : undefined,
        basedOn: basedOn ? getVal(basedOn) : undefined,
        tableProperties: parseTableProps(tblPr),
        paragraphProperties: resolveParagraphProps(ppr, undefined, result),
        runProperties: rpr ? parseRunPropsFromElement(rpr) : {},
      });
    } else if (type === "numbering") {
      result.numberingStyles.set(id, { id, name: name ? getVal(name) : undefined });
    }
  }

  return result;
}

/* ── Parse numbering.xml ───────────────────────────────────────────── */

export function parseNumberingXml(xml: string): DocxNumbering {
  const doc = parseXml(xml);
  const root = doc.documentElement;

  const result: DocxNumbering = {
    abstractNums: new Map(),
    nums: new Map(),
  };

  for (const absEl of childElements(root, "abstractNum")) {
    const absId = getInt(absEl, "w:abstractNumId") || getInt(absEl, "abstractNumId");
    const levels = new Map<number, NumberingLevel>();

    for (const lvlEl of childElements(absEl, "lvl")) {
      const ilvl = getInt(lvlEl, "w:ilvl") || getInt(lvlEl, "ilvl");
      const startEl = firstChild(lvlEl, "start");
      const numFmtEl = firstChild(lvlEl, "numFmt");
      const lvlTextEl = firstChild(lvlEl, "lvlText");
      const lvlJcEl = firstChild(lvlEl, "lvlJc");
      const ppr = firstChild(lvlEl, "pPr");
      const rpr = firstChild(lvlEl, "rPr");

      levels.set(ilvl, {
        level: ilvl,
        start: startEl ? getInt(startEl) : undefined,
        numberFormat: numFmtEl ? getVal(numFmtEl) : undefined,
        levelText: lvlTextEl ? getVal(lvlTextEl) : undefined,
        levelJustification: lvlJcEl ? getVal(lvlJcEl) : undefined,
        paragraphProperties: ppr ? resolveParagraphProps(ppr, undefined, { docDefaults: { runDefaults: {}, paragraphDefaults: {} }, paragraphStyles: new Map(), characterStyles: new Map(), tableStyles: new Map(), numberingStyles: new Map(), listStyles: new Map() }) : undefined,
        runProperties: rpr ? parseRunPropsFromElement(rpr) : undefined,
      });
    }

    result.abstractNums.set(absId, { levels });
  }

  for (const numEl of childElements(root, "num")) {
    const numId = getInt(numEl, "w:numId") || getInt(numEl, "numId");
    const absIdEl = firstChild(numEl, "abstractNumId");
    const abstractNumId = absIdEl ? getInt(absIdEl) : 0;
    const lvlOverrides = new Map<number, NumberingLevelOverride>();

    for (const lvlOvr of childElements(numEl, "lvlOverride")) {
      const ilvl = getInt(lvlOvr, "w:ilvl") || getInt(lvlOvr, "ilvl");
      const startOverride = firstChild(lvlOvr, "startOverride");
      const lvlTextOverride = firstChild(lvlOvr, "lvlText");
      lvlOverrides.set(ilvl, {
        level: ilvl,
        start: startOverride ? getInt(startOverride) : undefined,
        levelText: lvlTextOverride ? getVal(lvlTextOverride) : undefined,
      });
    }

    result.nums.set(numId, { abstractNumId, levels: lvlOverrides });
  }

  return result;
}

/* ── Parse theme.xml ───────────────────────────────────────────────── */

export function parseThemeXml(xml: string): DocxTheme {
  const doc = parseXml(xml);
  const root = doc.documentElement;

  const theme: DocxTheme = {};
  const nameEl = firstChild(root, "name");
  if (nameEl) theme.name = getVal(nameEl);

  const fontSchemeEl = firstChild(root, "fontScheme");
  if (fontSchemeEl) {
    const major = firstChild(fontSchemeEl, "majorFont");
    const minor = firstChild(fontSchemeEl, "minorFont");
    theme.fontScheme = {
      majorFont: major ? (firstChild(major, "latin")?.getAttribute("w:typeface") || getVal(major)) : undefined,
      minorFont: minor ? (firstChild(minor, "latin")?.getAttribute("w:typeface") || getVal(minor)) : undefined,
    };
  }

  const colorSchemeEl = firstChild(root, "clrScheme");
  if (colorSchemeEl) {
    const colors = new Map<string, string>();
    const cn = getLocalName(colorSchemeEl);
    theme.colorScheme = { name: getAttr(colorSchemeEl, "name") || undefined, colors };

    for (const child of childElements(colorSchemeEl)) {
      const ln = getLocalName(child);
      const srgb = firstChild(child, "srgbClr");
      const sysClr = firstChild(child, "sysClr");
      const val = srgb ? (srgb.getAttribute("w:val") || srgb.getAttribute("val") || "") :
        sysClr ? (sysClr.getAttribute("w:lastClr") || sysClr.getAttribute("lastClr") || "") : "";
      if (val) colors.set(ln, val);
    }
  }

  return theme;
}

/* ── Parse settings.xml ────────────────────────────────────────────── */

export function parseSettingsXml(xml: string): DocxSettings {
  const doc = parseXml(xml);
  const root = doc.documentElement;
  const settings: DocxSettings = {};

  const defaultTabStop = firstChild(root, "defaultTabStop");
  if (defaultTabStop) settings.defaultTabStop = getInt(defaultTabStop);

  return settings;
}

/* ── Parse document.xml ────────────────────────────────────────────── */

function parseBody(body: Element, styles: DocxStyles, numbering: DocxNumbering): DocxSection[] {
  const sections: DocxSection[] = [];
  let currentContent: ContentBlock[] = [];
  let lastPpr: Element | null = null;

  const defaultSection: SectionProperties = {
    pageWidth: A4_WIDTH_TWIPS, pageHeight: A4_HEIGHT_TWIPS,
    marginTop: 1440, marginBottom: 1440,
    marginLeft: 1800, marginRight: 1800,
    orientation: "portrait",
  };

  for (let i = 0; i < body.childNodes.length; i++) {
    const node = body.childNodes[i];
    if (node.nodeType !== 1) continue;
    const el = node as Element;
    const ln = getLocalName(el);

    if (ln === "p") {
      currentContent.push(parseParagraph(el, styles, numbering));
      lastPpr = firstChild(el, "pPr");
    } else if (ln === "tbl") {
      currentContent.push(parseTable(el, styles, numbering));
      lastPpr = null;
    } else if (ln === "sectPr") {
      const props = parseSectionProperties(el);
      sections.push({ properties: props, headers: [], footers: [], content: currentContent });
      currentContent = [];
    }
  }

  if (currentContent.length > 0 || sections.length === 0) {
    let props = defaultSection;
    if (lastPpr) {
      const sectPr = firstChild(lastPpr, "sectPr");
      if (sectPr) props = parseSectionProperties(sectPr);
    }
    sections.push({ properties: props, headers: [], footers: [], content: currentContent });
  }

  return sections;
}

function parseSectionProperties(sectPr: Element): SectionProperties {
  const pgSz = firstChild(sectPr, "pgSz");
  const pgMar = firstChild(sectPr, "pgMar");

  let pageWidth = A4_WIDTH_TWIPS;
  let pageHeight = A4_HEIGHT_TWIPS;
  let marginTop = 1440, marginBottom = 1440, marginLeft = 1800, marginRight = 1800;
  let orientation: "portrait" | "landscape" = "portrait";

  if (pgSz) {
    const w = pgSz.getAttribute("w:w") || pgSz.getAttribute("w");
    const h = pgSz.getAttribute("w:h") || pgSz.getAttribute("h");
    const orient = pgSz.getAttribute("w:orient");
    if (w) pageWidth = parseInt(w, 10);
    if (h) pageHeight = parseInt(h, 10);
    if (orient === "landscape") orientation = "landscape";
  }

  if (pgMar) {
    const t = pgMar.getAttribute("w:top") || pgMar.getAttribute("top");
    const b = pgMar.getAttribute("w:bottom") || pgMar.getAttribute("bottom");
    const l = pgMar.getAttribute("w:left") || pgMar.getAttribute("w:start") || pgMar.getAttribute("left");
    const r = pgMar.getAttribute("w:right") || pgMar.getAttribute("w:end") || pgMar.getAttribute("right");
    if (t) marginTop = parseInt(t, 10);
    if (b) marginBottom = parseInt(b, 10);
    if (l) marginLeft = parseInt(l, 10);
    if (r) marginRight = parseInt(r, 10);
  }

  return { pageWidth, pageHeight, marginTop, marginBottom, marginLeft, marginRight, orientation };
}

/* ── Parse core properties ─────────────────────────────────────────── */

export function parseCoreProps(xml: string): CoreProperties {
  if (!xml) return {};
  const doc = parseXml(xml);
  const root = doc.documentElement;
  const get = (tag: string) => firstChild(root, tag)?.textContent || undefined;
  return { title: get("title"), creator: get("creator"), description: get("description"), created: get("created"), modified: get("modified") };
}

/* ── Main parse function ───────────────────────────────────────────── */

export function parseDocumentXml(xml: string, styles: DocxStyles, numbering: DocxNumbering): DocxSection[] {
  const doc = parseXml(xml);
  const root = doc.documentElement;
  const body = firstChild(root, "body");
  if (!body) return [];
  return parseBody(body, styles, numbering);
}

/* ── Top-level parse from files ────────────────────────────────────── */

export interface DocxFiles {
  document?: string;
  styles?: string;
  numbering?: string;
  theme?: string;
  settings?: string;
  core?: string;
}

export function parseDocxFiles(files: DocxFiles): DocxDocument {
  const styles = files.styles ? parseStylesXml(files.styles) : {
    docDefaults: { runDefaults: {}, paragraphDefaults: {} },
    paragraphStyles: new Map(), characterStyles: new Map(),
    tableStyles: new Map(), numberingStyles: new Map(), listStyles: new Map(),
  };
  const numbering = files.numbering ? parseNumberingXml(files.numbering) : {
    abstractNums: new Map(), nums: new Map(),
  };
  const theme = files.theme ? parseThemeXml(files.theme) : {};
  const settings = files.settings ? parseSettingsXml(files.settings) : {};
  const core = files.core ? parseCoreProps(files.core) : {};
  const sections = files.document ? parseDocumentXml(files.document, styles, numbering) : [];

  return { core, styles, numbering, theme, settings, sections };
}
