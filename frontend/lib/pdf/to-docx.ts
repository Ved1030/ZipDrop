import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  PageBreak,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

export type PdfConversionErrorCode =
  | "INVALID_PDF"
  | "PASSWORD_PROTECTED"
  | "OCR_REQUIRED"
  | "NO_CONTENT";

export class PdfConversionError extends Error {
  code: PdfConversionErrorCode;

  constructor(code: PdfConversionErrorCode, message: string) {
    super(message);
    this.name = "PdfConversionError";
    this.code = code;
  }
}

const MAX_PAGES = 80;

interface PdfOperatorList {
  fnArray: number[];
  argsArray: unknown[];
}

interface PdfPathArgs {
  ops: number[];
  coords: CoordList;
}

interface PdfOps {
  save: number;
  restore: number;
  transform: number;
  setFillColorN: number;
  setFillRGBColor: number;
  paintImageXObject: number;
  paintInlineImageXObject: number;
  constructPath: number;
  moveTo: number;
  lineTo: number;
  rectangle: number;
}

interface PdfImageObject {
  data?: Uint8Array;
  width?: number;
  height?: number;
  kind?: number;
}

interface PdfJsPage {
  getViewport(opts: { scale: number }): {
    width: number;
    height: number;
    convertToViewportPoint(x: number, y: number): number[];
  };
  getOperatorList(): Promise<PdfOperatorList>;
  objs: {
    has(id: string): boolean;
    get(
      id: string,
      callback?: (value: PdfImageObject) => void
    ): PdfImageObject | null;
  };
}

interface RawTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName?: string;
}

interface PositionedItem {
  text: string;
  x: number;
  endX: number;
  baseline: number;
  height: number;
  fontName: string;
}

interface PageLine {
  page: number;
  x: number;
  endX: number;
  baseline: number;
  text: string;
  fontSize: number;
  fontName: string;
}

interface PdfImage {
  page: number;
  /** PDF user-space box: left, top edge, width, height */
  x: number;
  top: number;
  width: number;
  height: number;
  data: Uint8Array;
  type: "png" | "jpg";
}

interface PdfTable {
  page: number;
  /** vertical band the table occupies */
  top: number;
  bottom: number;
  rows: { row: TableRow; baselines: number[] }[];
}

interface PdfPage {
  page: number;
  width: number;
  height: number;
  lines: PageLine[];
  images: PdfImage[];
  tables: PdfTable[];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function weightedMedianSize(lines: PageLine[]): number {
  const weighted: number[] = [];
  for (const line of lines) {
    const weight = Math.max(1, Math.min(line.text.length, 120));
    for (let i = 0; i < weight; i++) weighted.push(line.fontSize);
  }
  return median(weighted) || 11;
}

/* ─── Text reconstruction ─────────────── */

function lineSegments(
  items: PositionedItem[],
  pageWidth: number
): Omit<PageLine, "page">[] {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const segments: PositionedItem[][] = [];
  let current: PositionedItem[] = [];

  for (const item of sorted) {
    const previous = current[current.length - 1];
    const gap = previous ? item.x - previous.endX : 0;
    const splitThreshold = Math.max(48, pageWidth * 0.08);
    if (previous && gap > splitThreshold) {
      segments.push(current);
      current = [];
    }
    current.push(item);
  }
  if (current.length > 0) segments.push(current);

  return segments
    .map((segment) => {
      let text = "";
      let previousEnd: number | null = null;
      for (const item of segment) {
        const gap = previousEnd === null ? 0 : item.x - previousEnd;
        const needsSpace =
          text.length > 0 &&
          gap > Math.max(1, Math.min(item.height, 12) * 0.18) &&
          !/\s$/.test(text) &&
          !/^[,.;:!?%)\]]/.test(item.text);
        if (needsSpace) text += " ";
        text += item.text;
        previousEnd = item.endX;
      }

      return {
        x: segment[0].x,
        endX: Math.max(...segment.map((item) => item.endX)),
        baseline: segment[0].baseline,
        fontSize: Math.max(...segment.map((item) => item.height), 8),
        fontName: segment[0].fontName,
        text: text.replace(/\s+/g, " ").trim(),
      };
    })
    .filter((line) => line.text.length > 0);
}

function collectPageLines(
  items: RawTextItem[],
  page: number,
  pageWidth: number
): PageLine[] {
  const positioned = items
    .filter((item) => typeof item.str === "string" && item.str.trim().length > 0)
    .map<PositionedItem>((item) => {
      const x = Number(item.transform?.[4]) || 0;
      const baseline = Number(item.transform?.[5]) || 0;
      const height = Math.abs(Number(item.height) || Number(item.transform?.[3]) || 11);
      const width = Math.abs(Number(item.width) || 0);
      return {
        text: item.str,
        x,
        endX: x + width,
        baseline,
        height,
        fontName: item.fontName || "",
      };
    });

  const rows: PositionedItem[][] = [];
  // Items arrive in stream order, which need not be top-to-bottom.
  for (const item of [...positioned].sort((a, b) => b.baseline - a.baseline)) {
    let row: PositionedItem[] | undefined;
    for (let i = rows.length - 1; i >= 0 && i >= rows.length - 12; i--) {
      const candidate = rows[i];
      const reference = candidate[0];
      const tolerance = Math.max(1.5, Math.min(reference.height, item.height) * 0.28);
      if (Math.abs(reference.baseline - item.baseline) <= tolerance) {
        row = candidate;
        break;
      }
    }
    if (!row) {
      row = [];
      rows.push(row);
    }
    row.push(item);
  }

  return rows
    .sort((a, b) => b[0].baseline - a[0].baseline)
    .flatMap((row) => lineSegments(row, pageWidth))
    .map((line) => ({ ...line, page }));
}

/* ─── Table detection ─────────────────── */

interface DrawnRule {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface CandidateTable {
  rules: DrawnRule[];
  lines: PageLine[];
}

function isHorizontal(rule: DrawnRule): boolean {
  return Math.abs(rule.y1 - rule.y2) <= 1.2 && Math.abs(rule.x2 - rule.x1) > 8;
}

function isVertical(rule: DrawnRule): boolean {
  return Math.abs(rule.x1 - rule.x2) <= 1.2 && Math.abs(rule.y2 - rule.y1) > 8;
}

function overlap(a1: number, a2: number, b1: number, b2: number): number {
  return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
}

/**
 * Groups drawn rules and text lines into candidates by connected components.
 * A candidate becomes a table only if its rows line up into >= 2 distinct
 * baselines with >= 2 text cells on at least two rows and drawn rules exist.
 * That conservative test keeps ordinary paragraphs, underlines and dividers
 * out of table output.
 */
function detectTables(lines: PageLine[], rules: DrawnRule[]): CandidateTable[] {
  const candidates: CandidateTable[] = [];
  if (rules.length === 0) return candidates;

  const ruleBoxes = rules.map((r) => ({
    left: Math.min(r.x1, r.x2),
    right: Math.max(r.x1, r.x2),
    top: Math.max(r.y1, r.y2),
    bottom: Math.min(r.y1, r.y2),
  }));

  const used = new Set<number>();
  const neighbours = new Map<number, number[]>();
  for (let i = 0; i < ruleBoxes.length; i++) {
    for (let j = i + 1; j < ruleBoxes.length; j++) {
      const a = ruleBoxes[i];
      const b = ruleBoxes[j];
      const touchX = overlap(a.left, a.right, b.left, b.right) >= -2;
      const touchY = overlap(a.bottom, a.top, b.bottom, b.top) >= -2;
      if (touchX && touchY) {
        if (!neighbours.has(i)) neighbours.set(i, []);
        if (!neighbours.has(j)) neighbours.set(j, []);
        neighbours.get(i)!.push(j);
        neighbours.get(j)!.push(i);
      }
    }
  }

  for (let start = 0; start < rules.length; start++) {
    if (used.has(start)) continue;
    const stack = [start];
    const component: number[] = [];
    while (stack.length) {
      const index = stack.pop()!;
      if (used.has(index)) continue;
      used.add(index);
      component.push(index);
      for (const next of neighbours.get(index) || []) {
        if (!used.has(next)) stack.push(next);
      }
    }

    const partRules = component.map((i) => rules[i]);
    const horizontals = partRules.filter(isHorizontal);
    const verticals = partRules.filter(isVertical);
    if (horizontals.length < 3 || verticals.length < 2) continue;

    const left = Math.min(...verticals.flatMap((r) => [r.x1, r.x2]));
    const right = Math.max(...verticals.flatMap((r) => [r.x1, r.x2]));
    const top = Math.max(...horizontals.flatMap((r) => [r.y1, r.y2]));
    const bottom = Math.min(...horizontals.flatMap((r) => [r.y1, r.y2]));
    if (right - left < 40 || top - bottom < 20) continue;

    const inside = lines.filter((line) => {
      const mid = (line.x + line.endX) / 2;
      return (
        line.baseline > bottom - 4 &&
        line.baseline < top + 4 &&
        mid > left - 4 &&
        mid < right + 4
      );
    });
    if (inside.length === 0) continue;

    candidates.push({ rules: partRules, lines: inside });
  }

  return candidates;
}

function buildTableRows(candidate: CandidateTable): { row: TableRow; baselines: number[] }[] {
  const horizontals = candidate.rules.filter(isHorizontal);
  const verticals = candidate.rules.filter(isVertical);

  const columnEdges = [...new Set(verticals.flatMap((r) => [Math.round(r.x1), Math.round(r.x2)]))]
    .sort((a, b) => a - b);
  const rowEdges = [...new Set(horizontals.flatMap((r) => [Math.round(r.y1), Math.round(r.y2)]))]
    .sort((a, b) => b - a);

  const columnCount = Math.max(1, columnEdges.length - 1);
  const rowCount = Math.max(1, rowEdges.length - 1);
  const cells: string[][] = Array.from({ length: rowCount }, () =>
    Array.from({ length: columnCount }, () => "")
  );
  const rowBaselines: number[][] = Array.from({ length: rowCount }, () => []);

  for (const line of candidate.lines) {
    let rowIndex = rowEdges.findIndex(
      (edge, i) => i < rowEdges.length - 1 && line.baseline <= edge && line.baseline > rowEdges[i + 1] - 2
    );
    if (rowIndex < 0) {
      rowIndex = line.baseline >= rowEdges[0] ? 0 : rowCount - 1;
    }

    const centre = (line.x + line.endX) / 2;
    let columnIndex = columnEdges.findIndex(
      (edge, i) => i < columnEdges.length - 1 && centre >= edge && centre < columnEdges[i + 1]
    );
    if (columnIndex < 0) columnIndex = 0;

    cells[rowIndex][columnIndex] = cells[rowIndex][columnIndex]
      ? `${cells[rowIndex][columnIndex]} ${line.text}`
      : line.text;
    rowBaselines[rowIndex].push(line.baseline);
  }

  const rows = cells.map(
    (row, i) =>
      new TableRow({
        children: row.map(
          (text) =>
            new TableCell({
              width: { size: 100 / columnCount, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text, bold: i === 0, size: 20 }),
                  ],
                }),
              ],
            })
        ),
      })
  );

  return rows.map((row, i) => ({
    row,
    baselines: rowBaselines[i].length ? rowBaselines[i] : [rowEdges[i]],
  }));
}

/* ─── Images ──────────────────────────── */

function toImage(bytes: Uint8Array): { data: Uint8Array; type: "png" | "jpg" } | null {
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { data: bytes, type: "png" };
  }
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return { data: bytes, type: "jpg" };
  }
  return null;
}

type Rgb = [number, number, number];

const DEFAULT_FILL: Rgb = [0, 0, 0];

function multiply(m1: number[], m2: number[]): number[] {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + b1 * c2,
    a1 * b2 + b1 * d2,
    c1 * a2 + d1 * c2,
    c1 * b2 + d1 * d2,
    e1 * a2 + f1 * c2 + e2,
    e1 * b2 + f1 * d2 + f2,
  ];
}

function applyMatrix(m: number[], x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

async function loadImage(
  page: PdfJsPage,
  ref: string | PdfImageObject
): Promise<PdfImageObject | null> {
  if (typeof ref !== "string") return ref;
  if (page.objs.has(ref)) return page.objs.get(ref) as PdfImageObject;
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000));
  const fetched = new Promise<PdfImageObject>((resolve) =>
    page.objs.get(ref, (value: PdfImageObject) => resolve(value))
  );
  return Promise.race([fetched, timeout]).catch(() => null);
}

/** Server-side there is no canvas, so pdfjs hands raw pixels; encode them as PNG. */
async function pixelsToPng(
  data: Uint8Array,
  width: number,
  height: number,
  kind?: number
): Promise<Uint8Array | null> {
  let pixels = data;
  if (kind === 3) {
    const rgb = new Uint8Array(width * height * 3);
    for (let i = 0, j = 0; i < width * height; i++, j += 4) {
      rgb[i * 3] = data[j];
      rgb[i * 3 + 1] = data[j + 1];
      rgb[i * 3 + 2] = data[j + 2];
    }
    pixels = rgb;
  } else if (kind !== 2 || pixels.length < width * height * 3) {
    return null;
  }
  const stride = width * 3 + 1;
  const raw = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    raw.set(pixels.subarray(y * width * 3, (y + 1) * width * 3), y * stride + 1);
  }
  const { deflateSync } = await import("node:zlib");
  return encodePng(width, height, deflateSync(raw));
}

const PNG_CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = PNG_CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function encodePng(width: number, height: number, idat: Uint8Array): Uint8Array {
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header[8] = 8;
  header[9] = 2;
  const chunks: [string, Uint8Array][] = [
    ["IHDR", header],
    ["IDAT", idat],
    ["IEND", new Uint8Array(0)],
  ];
  const total = 8 + chunks.reduce((n, [type, body]) => n + 12 + type.length + body.length, 0);
  const out = new Uint8Array(total);
  out.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const outView = new DataView(out.buffer);
  let offset = 8;
  for (const [type, body] of chunks) {
    outView.setUint32(offset, body.length);
    offset += 4;
    out.set(new TextEncoder().encode(type), offset);
    out.set(body, offset + 4);
    outView.setUint32(offset + 4 + body.length, crc32(out.subarray(offset, offset + 4 + body.length)));
    offset += 12 + body.length;
  }
  return out;
}

async function collectImages(
  page: PdfJsPage,
  pageNumber: number,
  operatorList: PdfOperatorList,
  ops: PdfOps
): Promise<PdfImage[]> {
  const images: PdfImage[] = [];
  const viewport = page.getViewport({ scale: 1 });
  let ctm = [1, 0, 0, 1, 0, 0];
  let fill: Rgb = DEFAULT_FILL;
  const stack: { ctm: number[]; fill: Rgb }[] = [];


  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const fn = operatorList.fnArray[i];
    const args = operatorList.argsArray[i];
    if (fn === ops.save) {
      stack.push({ ctm: ctm.slice(), fill: fill.slice() as Rgb });
    } else if (fn === ops.restore) {
      const saved = stack.pop();
      if (saved) {
        ctm = saved.ctm;
        fill = saved.fill;
      }
    } else if (fn === ops.transform) {
      ctm = multiply(ctm, args as number[]);
    } else if (fn === ops.setFillColorN || fn === ops.setFillRGBColor) {
      if (fn === ops.setFillRGBColor) fill = (args as number[]).slice(0, 3) as Rgb;
      else if (typeof args === "string") fill = hexToRgb(args);
      else fill = (args as number[]).slice(0, 3) as Rgb;
    } else if (fn === ops.paintImageXObject || fn === ops.paintInlineImageXObject) {
      const img = await loadImage(
        page,
        fn === ops.paintImageXObject ? ((args as [string])[0]) : (args as PdfImageObject)
      );
      if (!img?.data || !img.width || !img.height) continue;

      const corners = [
        applyMatrix(ctm, 0, 0),
        applyMatrix(ctm, 1, 0),
        applyMatrix(ctm, 0, 1),
        applyMatrix(ctm, 1, 1),
      ].map(([x, y]) => viewport.convertToViewportPoint(x, y));
      const xs = corners.map((p) => p[0]);
      const ys = corners.map((p) => p[1]);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      if (width < 8 || height < 8) continue;

      const embedded = toImage(img.data) || { data: await pixelsToPng(img.data, img.width, img.height, img.kind), type: "png" as const };
      if (!embedded.data) continue;

      images.push({
        page: pageNumber,
        x: Math.min(...xs),
        top: Math.min(...ys),
        width,
        height,
        data: embedded.data,
        type: embedded.type,
      });
    }
  }

  return images;
}

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16) || 0,
    parseInt(value.slice(2, 4), 16) || 0,
    parseInt(value.slice(4, 6), 16) || 0,
  ];
}

/* ─── Block assembly ──────────────────── */

type Op = { order: number } & (
  | { kind: "heading" | "paragraph" | "list"; text: string; fontSize: number; headingLevel?: number; listLevel?: number }
  | { kind: "image"; image: PdfImage }
  | { kind: "table"; table: TableRow[] }
);

const LIST_PATTERN = /^(?:[\u2022\u25AA\u25E6\u2023\u00B7\u25CF\u25CB\-])|^\(?\d{1,3}[.)]|^[a-zA-Z][.)]\s+/;

function stripListMarker(text: string): string {
  return text.replace(LIST_PATTERN, "").trim();
}

function headingLevelFor(fontSize: number, bodySize: number): number | undefined {
  const ratio = fontSize / Math.max(bodySize, 1);
  if (ratio >= 1.75) return 1;
  if (ratio >= 1.42) return 2;
  if (ratio >= 1.18) return 3;
  return undefined;
}

function imageParagraph(image: PdfImage, pageWidth: number): Paragraph {
  // Fit images to the printable width (A4 minus 1" margins) and cap height.
  const maxWidth = (pageWidth - 144) * 0.95;
  const maxHeight = 520;
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  return new Paragraph({
    spacing: { before: 120, after: 160 },
    alignment: AlignmentType.CENTER,
    children: [
      new ImageRun({
        type: image.type,
        data: image.data,
        transformation: {
          width: Math.max(16, Math.round(image.width * scale)),
          height: Math.max(16, Math.round(image.height * scale)),
        },
      }),
    ],
  });
}

interface CoordList {
  [index: number]: unknown;
  length: number;
}

function pathPoint(coords: CoordList, index: number): [number, number] {
  const first = coords[0];
  if (typeof first === "number") {
    return [coords[index * 2] as number, coords[index * 2 + 1] as number];
  }
  const point = coords[index] as ArrayLike<number> | undefined;
  return point ? [point[0], point[1]] : [0, 0];
}

// PDF path construction operators (from the PDF spec, not pdf.js OPS ids).
const PATH_MOVE_TO = 0;
const PATH_LINE_TO = 1;
const PATH_CUBIC_TO = 2;

function extractRules(operatorList: PdfOperatorList, ops: PdfOps): DrawnRule[] {
  const rules: DrawnRule[] = [];
  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const fn = operatorList.fnArray[i];
    if (fn === ops.constructPath) {
      // pdf.js emits [opCodes, coords] or [opCode, coords, extraCoords]; a
      // trailing array is path bounds and is only read when coords run out.
      const rawArgs = operatorList.argsArray[i] as unknown[];
      const firstArg = rawArgs[0] as number[] | number | PdfPathArgs;
      const groups = rawArgs.slice(1) as CoordList[];
      const pathArgs =
        Array.isArray(firstArg) || typeof firstArg === "number" ? null : firstArg;
      const rawOps = Array.from(pathArgs ? pathArgs.ops : Array.isArray(firstArg) ? firstArg : []);
      const coords = (pathArgs ? pathArgs.coords : groups[0]) as CoordList | undefined;
      if (!coords) continue;


      let arg = 0;
      let index = 0;
      let cursor: [number, number] | null = null;
      const nextPoint = (): [number, number] => {
        if (rawOps.length === 0) return pathPoint(coords, index++);
        for (;;) {
          const list = (arg === 0 ? coords : groups[arg]) as CoordList | undefined;
          if (list && index * 2 < list.length) return pathPoint(list, index++);
          if (arg >= groups.length) return [0, 0];
          arg += 1;
          index = 0;
        }
      };

      // Without op codes a single segment is still recoverable from its points.
      // Without op codes, a segment's one move and one line are implied by its points.
      const pathOps = rawOps.length
        ? rawOps
        : coords.length > 2
          ? [PATH_MOVE_TO, PATH_LINE_TO]
          : [PATH_MOVE_TO];
      for (const op of pathOps) {
        if (op === PATH_MOVE_TO) {
          cursor = nextPoint();
        } else if (op === PATH_LINE_TO) {
          const next = nextPoint();
          if (cursor) rules.push({ x1: cursor[0], y1: cursor[1], x2: next[0], y2: next[1] });
          cursor = next;
        } else if (op === PATH_CUBIC_TO) {
          Array.from({ length: 3 }, nextPoint);
        }
      }
    } else if (fn === ops.rectangle) {
      const [x, y, w, h] = operatorList.argsArray[i] as [number, number, number, number];
      rules.push({ x1: x, y1: y, x2: x + w, y2: y });
      rules.push({ x1: x, y1: y + h, x2: x + w, y2: y + h });
      rules.push({ x1: x, y1: y, x2: x, y2: y + h });
      rules.push({ x1: x + w, y1: y, x2: x + w, y2: y + h });
    }
  }
  return rules;
}

/* ─── Entry point ─────────────────────── */

type Pdfjs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
let pdfjsPromise: Promise<Pdfjs> | null = null;

/** A single instance keeps OPS ids aligned with the operator lists it produces. */
function loadPdfjs(): Promise<Pdfjs> {
  pdfjsPromise ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((mod) => {
    mod.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.mjs";
    return mod;
  });
  return pdfjsPromise;
}

export async function convertPdfToDocx(data: Uint8Array): Promise<Uint8Array> {
  const pdfjs = await loadPdfjs();

  type PdfDocument = Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
  let pdf: PdfDocument;
  let loadingTask: ReturnType<typeof pdfjs.getDocument> | undefined;
  try {
    loadingTask = pdfjs.getDocument({
      data,
      useWorkerFetch: false,
      useSystemFonts: true,
    });
    pdf = await loadingTask.promise;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "PasswordException") {
      throw new PdfConversionError(
        "PASSWORD_PROTECTED",
        "This PDF is password protected. Remove the password and try again."
      );
    }
    throw new PdfConversionError(
      "INVALID_PDF",
      "This file is not a valid PDF or it is corrupted."
    );
  }

  if (pdf.numPages > MAX_PAGES) {
    throw new PdfConversionError(
      "INVALID_PDF",
      `This PDF has ${pdf.numPages} pages. The maximum for editing is ${MAX_PAGES}.`
    );
  }

  const pages: PdfPage[] = [];
  let characterCount = 0;

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();
      const lines = collectPageLines(
        (textContent.items || []).filter(
          (it): it is Extract<typeof it, { str: string }> => "str" in it
        ),
        pageNumber,
        viewport.width
      );
      characterCount += lines.reduce(
        (total, line) => total + line.text.replace(/\s/g, "").length,
        0
      );

      const operatorList = await page.getOperatorList();
      const rules = extractRules(operatorList, pdfjs.OPS);

      // Only stroked/filled line work counts, and only if it is near text.
      const textEdges = {
        left: Math.min(...lines.map((l) => l.x), viewport.width),
        right: Math.max(...lines.map((l) => l.endX), 0),
        top: Math.max(...lines.map((l) => l.baseline), 0),
        bottom: Math.min(...lines.map((l) => l.baseline), viewport.height),
      };
      const relevantRules = rules.filter(
        (r) =>
          (isHorizontal(r) || isVertical(r)) &&
          Math.max(r.x1, r.x2) >= textEdges.left - 20 &&
          Math.min(r.x1, r.x2) <= textEdges.right + 20 &&
          Math.max(r.y1, r.y2) <= textEdges.top + 20 &&
          Math.min(r.y1, r.y2) >= textEdges.bottom - 20
      );

      const tableCandidates = detectTables(lines, relevantRules);
      const tables: PdfTable[] = tableCandidates.map((c) => ({
        page: pageNumber,
        top: Math.max(...c.rules.filter(isHorizontal).flatMap((r) => [r.y1, r.y2])),
        bottom: Math.min(...c.rules.filter(isHorizontal).flatMap((r) => [r.y1, r.y2])),
        rows: buildTableRows(c),
      }));

      // Text lines consumed by a table must not be emitted again as paragraphs.
      const tableLines = new Set(tableCandidates.flatMap((c) => c.lines));

      const images = await collectImages(page, pageNumber, operatorList, pdfjs.OPS).catch(
        () => []
      );

      pages.push({
        page: pageNumber,
        width: viewport.width,
        height: viewport.height,
        lines: lines.filter((l) => !tableLines.has(l)),
        images,
        tables,
      });
    }
  } catch (error: unknown) {
    console.error("[pdf-to-docx] extraction failed:", error instanceof Error ? error.stack : error);
    throw new PdfConversionError(
      "INVALID_PDF",
      "The PDF could not be read. It may be damaged or use unsupported encryption."
    );
  } finally {
    await loadingTask?.destroy();
  }

  if (characterCount < 12 && pages.every((p) => p.images.length === 0)) {
    throw new PdfConversionError(
      "OCR_REQUIRED",
      "This PDF appears to be scanned or image-only. Text recognition (OCR) is required before it can be edited."
    );
  }

  const allLines = pages.flatMap((p) => p.lines);
  const bodySize = weightedMedianSize(allLines) || 11;

  const sections: (Paragraph | Table)[] = [];
  let currentPage: number | null = null;

  for (const page of pages) {
    const ops: Op[] = [];

    for (const table of page.tables) {
      ops.push({ kind: "table", table: table.rows.map((r) => r.row), order: page.height - table.top });
    }
    for (const image of page.images) {
      ops.push({ kind: "image", image, order: page.height - image.top });
    }

    // Re-run the paragraph/heading/list grouping per page for correct page gaps.
    const blocks = buildTextBlocks(page.lines, bodySize);
    for (const block of blocks) {
      ops.push({
        kind: block.kind,
        text: block.text,
        fontSize: block.fontSize,
        headingLevel: block.headingLevel,
        listLevel: block.listLevel,
        order: page.height - block.baseline,
      });
    }
    ops.sort((a, b) => a.order - b.order);

    if (currentPage !== null && ops.length > 0) {
      sections.push(new Paragraph({ children: [new PageBreak()] }));
    }
    currentPage = page.page;

    for (const op of ops) {
      if (op.kind === "image") {
        sections.push(imageParagraph(op.image, page.width));
      } else if (op.kind === "table") {
        sections.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: op.table,
          })
        );
        sections.push(
          new Paragraph({ spacing: { before: 0, after: 160 }, children: [] })
        );
      } else {
        sections.push(
          paragraphForBlock(
            { ...op, baseline: page.height - op.order },
            bodySize
          )
        );
      }
    }
  }

  if (sections.length === 0) {
    throw new PdfConversionError("NO_CONTENT", "No editable content was found in this PDF.");
  }

  const document = new Document({
    creator: "ZipDrop",
    title: "Converted PDF",
    description: "Created by ZipDrop PDF to Word conversion",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 24 },
          paragraph: { spacing: { after: 120, line: 300 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        children: sections,
      },
    ],
  });

  return Packer.toBuffer(document);
}

interface TextBlock {
  kind: "heading" | "paragraph" | "list";
  baseline: number;
  text: string;
  fontSize: number;
  headingLevel?: number;
  listLevel?: number;
}

function buildTextBlocks(lines: PageLine[], bodySize: number): TextBlock[] {
  const blocks: TextBlock[] = [];
  const gaps: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    const gap = lines[i - 1].baseline - lines[i].baseline;
    if (gap > 0 && gap < bodySize * 3.2 && Math.abs(lines[i - 1].fontSize - lines[i].fontSize) <= bodySize * 0.3) {
      gaps.push(gap);
    }
  }
  const typicalGap = median(gaps) || bodySize * 1.25;
  const blockGapThreshold = Math.max(bodySize * 1.65, typicalGap * 1.38);

  const listXs = lines.filter((l) => LIST_PATTERN.test(l.text)).map((l) => l.x);
  const baseListX = listXs.length ? Math.min(...listXs) : 0;

  let previous: PageLine | null = null;
  let current: TextBlock | null = null;

  for (const line of lines) {
    const headingLevel = headingLevelFor(line.fontSize, bodySize);
    const isList = LIST_PATTERN.test(line.text);
    const text = isList ? stripListMarker(line.text) : line.text;
    if (!text) continue;

    const verticalGap = previous ? previous.baseline - line.baseline : 0;
    const sameSize = previous && Math.abs(previous.fontSize - line.fontSize) <= bodySize * 0.16;
    const indented = previous && line.x - previous.x > Math.max(8, bodySize * 0.7);
    const startsNew =
      !previous || !current || verticalGap > blockGapThreshold || (!sameSize && !headingLevel) || indented;

    if (isList) {
      current = {
        kind: "list",
        baseline: line.baseline,
        text,
        fontSize: line.fontSize,
        listLevel: Math.max(0, Math.min(4, Math.round((line.x - baseListX) / Math.max(bodySize * 1.6, 14)))),
      };
      blocks.push(current);
    } else if (current?.kind === "list" && verticalGap <= blockGapThreshold && line.x <= previous!.x + 40) {
      current.text += text.startsWith("-") ? text.replace(/^-/, "") : " " + text;
    } else if (headingLevel) {
      if (current?.kind === "heading" && current.headingLevel === headingLevel && !startsNew) {
        current.text += " " + text;
      } else {
        current = { kind: "heading", baseline: line.baseline, text, fontSize: line.fontSize, headingLevel };
        blocks.push(current);
      }
    } else if (current?.kind === "paragraph" && !startsNew) {
      if (current.text.endsWith("-") && /^[a-z]/.test(line.text)) {
        current.text = current.text.replace(/-\s*$/, "") + line.text;
      } else {
        current.text += " " + text;
      }
    } else {
      current = { kind: "paragraph", baseline: line.baseline, text, fontSize: line.fontSize };
      blocks.push(current);
    }
    previous = line;
  }

  return blocks;
}

function paragraphForBlock(block: TextBlock, bodySize: number): Paragraph {
  const size = Math.round(Math.max(16, Math.min(64, (block.fontSize || bodySize) * 2)));

  if (block.kind === "heading") {
    const level =
      block.headingLevel === 1
        ? HeadingLevel.HEADING_1
        : block.headingLevel === 2
          ? HeadingLevel.HEADING_2
          : HeadingLevel.HEADING_3;
    return new Paragraph({
      heading: level,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: block.text, bold: true, size })],
    });
  }

  if (block.kind === "list") {
    return new Paragraph({
      bullet: { level: block.listLevel || 0 },
      spacing: { after: 80 },
      children: [new TextRun({ text: block.text, size })],
    });
  }

  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 300, after: 140 },
    children: [new TextRun({ text: block.text, size })],
  });
}
