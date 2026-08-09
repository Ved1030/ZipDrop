/* ── OOXML Document Model ──────────────────────────────────────────── */

export interface DocxDocument {
  core: CoreProperties;
  styles: DocxStyles;
  numbering: DocxNumbering;
  theme: DocxTheme;
  settings: DocxSettings;
  sections: DocxSection[];
}

export interface CoreProperties {
  title?: string;
  creator?: string;
  description?: string;
  created?: string;
  modified?: string;
}

/* ── Section ───────────────────────────────────────────────────────── */

export interface DocxSection {
  properties: SectionProperties;
  headers: HeaderFooter[];
  footers: HeaderFooter[];
  content: ContentBlock[];
}

export interface HeaderFooter { type: "default" | "first" | "even"; paragraphs: DocxParagraph[] }

export interface SectionProperties {
  pageWidth: number;
  pageHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  orientation: "portrait" | "landscape";
}

/* ── Content ───────────────────────────────────────────────────────── */

export type ContentBlock = DocxParagraph | DocxTable;

export interface DocxParagraph {
  styleId?: string;
  properties: ParagraphProperties;
  runs: InlineContent[];
}

export type InlineContent = DocxRun | DocxHyperlink | DocxTab | DocxBreak | DocxImage | DocxDrawing;

export interface DocxRun {
  kind: "run";
  properties: RunProperties;
  text: string;
}

export interface DocxHyperlink {
  kind: "hyperlink";
  anchor?: string;
  history?: boolean;
  runs: DocxRun[];
}

export interface DocxTab { kind: "tab"; tabType?: string }
export interface DocxBreak { kind: "break"; breakType?: "page" | "column" | "textWrapping" }
export interface DocxImage { kind: "image"; data: string; contentType: string; cx: number; cy: number }
export interface DocxDrawing { kind: "drawing"; html: string }

/* ── Properties ────────────────────────────────────────────────────── */

export interface ParagraphProperties {
  styleId?: string;
  alignment?: "left" | "center" | "right" | "justify" | "distribute";
  indent?: { left?: number; right?: number; firstLine?: number; hanging?: number };
  spacing?: { before?: number; after?: number; line?: number; lineRule?: "auto" | "exact" | "atLeast" };
  numbering?: { numId: number; level: number };
  keepNext?: boolean;
  keepLines?: boolean;
  pageBreakBefore?: boolean;
  widowControl?: boolean;
  shading?: { fill?: string; color?: string; val?: string };
  border?: ParagraphBorder;
  tabs?: TabStop[];
}

export interface ParagraphBorder {
  top?: BorderInfo; bottom?: BorderInfo; left?: BorderInfo; right?: BorderInfo;
  between?: BorderInfo;
}

export interface BorderInfo {
  style: string; size?: number; color?: string; space?: number;
}

export interface TabStop {
  val: string; leader?: string; pos: number;
}

export interface RunProperties {
  styleId?: string;
  font?: string;
  eastAsiaFont?: string;
  size?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: { val: string; color?: string };
  strike?: boolean;
  doubleStrike?: boolean;
  superscript?: boolean;
  subscript?: boolean;
  highlight?: string;
  shading?: { fill?: string; color?: string; val?: string };
  caps?: boolean;
  smallCaps?: boolean;
  spacing?: number;
  kern?: number;
  position?: number;
}

/* ── Table ─────────────────────────────────────────────────────────── */

export interface DocxTable {
  kind: "table";
  properties: TableProperties;
  rows: DocxTableRow[];
}

export interface TableProperties {
  width?: { value: number; type: string };
  alignment?: "left" | "center" | "right";
  borders?: TableBorders;
  cellMargin?: { top?: number; bottom?: number; left?: number; right?: number };
  layout?: string;
  styleId?: string;
}

export interface TableBorders {
  top?: BorderInfo; bottom?: BorderInfo; left?: BorderInfo; right?: BorderInfo;
  insideH?: BorderInfo; insideV?: BorderInfo;
}

export interface DocxTableRow {
  properties: TableRowProperties;
  cells: DocxTableCell[];
}

export interface TableRowProperties {
  height?: { value: number; rule: string };
  header?: boolean;
}

export interface DocxTableCell {
  properties: TableCellProperties;
  content: ContentBlock[];
}

export interface TableCellProperties {
  width?: { value: number; type: string };
  verticalAlign?: "top" | "center" | "bottom";
  columnSpan?: number;
  rowSpan?: number;
  borders?: TableBorders;
  shading?: { fill?: string; color?: string; val?: string };
  margins?: { top?: number; bottom?: number; left?: number; right?: number };
}

/* ── Styles ────────────────────────────────────────────────────────── */

export interface DocxStyles {
  docDefaults: {
    runDefaults: RunProperties;
    paragraphDefaults: ParagraphProperties;
  };
  paragraphStyles: Map<string, ParagraphStyle>;
  characterStyles: Map<string, CharacterStyle>;
  tableStyles: Map<string, TableStyle>;
  numberingStyles: Map<string, NumberingStyle>;
  listStyles: Map<string, ListStyle>;
}

export interface ParagraphStyle {
  id: string; name?: string; basedOn?: string; next?: string;
  hidden?: boolean; semiHidden?: boolean; qFormat?: boolean;
  paragraphProperties: ParagraphProperties;
  runProperties: RunProperties;
}

export interface CharacterStyle {
  id: string; name?: string; basedOn?: string;
  runProperties: RunProperties;
}

export interface TableStyle {
  id: string; name?: string; basedOn?: string;
  tableProperties: TableProperties;
  paragraphProperties: ParagraphProperties;
  runProperties: RunProperties;
}

export interface NumberingStyle { id: string; name?: string }
export interface ListStyle { id: string; name?: string }

/* ── Numbering ─────────────────────────────────────────────────────── */

export interface DocxNumbering {
  abstractNums: Map<number, AbstractNumbering>;
  nums: Map<number, NumberingInstance>;
}

export interface AbstractNumbering {
  multiLevelType?: string;
  levels: Map<number, NumberingLevel>;
}

export interface NumberingLevel {
  level: number;
  start?: number;
  numberFormat?: string;
  levelText?: string;
  levelJustification?: string;
  paragraphProperties?: ParagraphProperties;
  runProperties?: RunProperties;
}

export interface NumberingInstance {
  abstractNumId: number;
  levels: Map<number, NumberingLevelOverride>;
}

export interface NumberingLevelOverride {
  level: number;
  start?: number;
  levelText?: string;
}

/* ── Theme ─────────────────────────────────────────────────────────── */

export interface DocxTheme {
  name?: string;
  fontScheme?: {
    majorFont?: string;
    minorFont?: string;
  };
  colorScheme?: {
    name?: string;
    colors: Map<string, string>;
  };
}

/* ── Settings ──────────────────────────────────────────────────────── */

export interface DocxSettings {
  defaultTabStop?: number;
  compatibility?: Record<string, string>;
}

/* ── Constants ─────────────────────────────────────────────────────── */

export const TWIPS_PER_INCH = 1440;
export const PX_PER_INCH = 96;
export const TWIPS_PER_PX = TWIPS_PER_INCH / PX_PER_INCH;
export const PT_PER_TWIP = 1 / 20;
export const HALF_PT_PER_PX = 2 / 0.75;

export const A4_WIDTH_TWIPS = 11906;
export const A4_HEIGHT_TWIPS = 16838;
export const A4_WIDTH_PX = Math.round(A4_WIDTH_TWIPS / TWIPS_PER_PX);
export const A4_HEIGHT_PX = Math.round(A4_HEIGHT_TWIPS / TWIPS_PER_PX);

export function twipsToPx(twips: number): number {
  return Math.round((twips / TWIPS_PER_INCH) * PX_PER_INCH * 100) / 100;
}

export function ptToPx(pt: number): number {
  return Math.round((pt * PX_PER_INCH) / 72 * 100) / 100;
}

export function halfPtToPt(hp: number): number {
  return hp / 2;
}
