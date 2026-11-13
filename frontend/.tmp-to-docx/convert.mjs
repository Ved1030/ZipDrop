// lib/pdf/to-docx.ts
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
  WidthType
} from "docx";
var PdfConversionError = class extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PdfConversionError";
    this.code = code;
  }
};
var MAX_PAGES = 80;
function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
function weightedMedianSize(lines) {
  const weighted = [];
  for (const line of lines) {
    const weight = Math.max(1, Math.min(line.text.length, 120));
    for (let i = 0; i < weight; i++) weighted.push(line.fontSize);
  }
  return median(weighted) || 11;
}
function lineSegments(items, pageWidth) {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  const segments = [];
  let current = [];
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
  return segments.map((segment) => {
    let text = "";
    let previousEnd = null;
    for (const item of segment) {
      const gap = previousEnd === null ? 0 : item.x - previousEnd;
      const needsSpace = text.length > 0 && gap > Math.max(1, Math.min(item.height, 12) * 0.18) && !/\s$/.test(text) && !/^[,.;:!?%)\]]/.test(item.text);
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
      text: text.replace(/\s+/g, " ").trim()
    };
  }).filter((line) => line.text.length > 0);
}
function collectPageLines(items, page, pageWidth) {
  const positioned = items.filter((item) => typeof item.str === "string" && item.str.trim().length > 0).map((item) => {
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
      fontName: item.fontName || ""
    };
  });
  const rows = [];
  for (const item of [...positioned].sort((a, b) => b.baseline - a.baseline)) {
    let row;
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
  return rows.sort((a, b) => b[0].baseline - a[0].baseline).flatMap((row) => lineSegments(row, pageWidth)).map((line) => ({ ...line, page }));
}
function isHorizontal(rule) {
  return Math.abs(rule.y1 - rule.y2) <= 1.2 && Math.abs(rule.x2 - rule.x1) > 8;
}
function isVertical(rule) {
  return Math.abs(rule.x1 - rule.x2) <= 1.2 && Math.abs(rule.y2 - rule.y1) > 8;
}
function overlap(a1, a2, b1, b2) {
  return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
}
function detectTables(lines, rules) {
  const candidates = [];
  if (rules.length === 0) return candidates;
  const ruleBoxes = rules.map((r) => ({
    left: Math.min(r.x1, r.x2),
    right: Math.max(r.x1, r.x2),
    top: Math.max(r.y1, r.y2),
    bottom: Math.min(r.y1, r.y2)
  }));
  const used = /* @__PURE__ */ new Set();
  const neighbours = /* @__PURE__ */ new Map();
  for (let i = 0; i < ruleBoxes.length; i++) {
    for (let j = i + 1; j < ruleBoxes.length; j++) {
      const a = ruleBoxes[i];
      const b = ruleBoxes[j];
      const touchX = overlap(a.left, a.right, b.left, b.right) >= -2;
      const touchY = overlap(a.bottom, a.top, b.bottom, b.top) >= -2;
      if (touchX && touchY) {
        if (!neighbours.has(i)) neighbours.set(i, []);
        if (!neighbours.has(j)) neighbours.set(j, []);
        neighbours.get(i).push(j);
        neighbours.get(j).push(i);
      }
    }
  }
  for (let start = 0; start < rules.length; start++) {
    if (used.has(start)) continue;
    const stack = [start];
    const component = [];
    while (stack.length) {
      const index = stack.pop();
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
      return line.baseline > bottom - 4 && line.baseline < top + 4 && mid > left - 4 && mid < right + 4;
    });
    if (inside.length === 0) continue;
    candidates.push({ rules: partRules, lines: inside });
  }
  return candidates;
}
function buildTableRows(candidate) {
  const horizontals = candidate.rules.filter(isHorizontal);
  const verticals = candidate.rules.filter(isVertical);
  const columnEdges = [...new Set(verticals.flatMap((r) => [Math.round(r.x1), Math.round(r.x2)]))].sort((a, b) => a - b);
  const rowEdges = [...new Set(horizontals.flatMap((r) => [Math.round(r.y1), Math.round(r.y2)]))].sort((a, b) => b - a);
  const columnCount = Math.max(1, columnEdges.length - 1);
  const rowCount = Math.max(1, rowEdges.length - 1);
  const cells = Array.from(
    { length: rowCount },
    () => Array.from({ length: columnCount }, () => "")
  );
  const rowBaselines = Array.from({ length: rowCount }, () => []);
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
    cells[rowIndex][columnIndex] = cells[rowIndex][columnIndex] ? `${cells[rowIndex][columnIndex]} ${line.text}` : line.text;
    rowBaselines[rowIndex].push(line.baseline);
  }
  const rows = cells.map(
    (row, i) => new TableRow({
      children: row.map(
        (text) => new TableCell({
          width: { size: 100 / columnCount, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text, bold: i === 0, size: 20 })
              ]
            })
          ]
        })
      )
    })
  );
  return rows.map((row, i) => ({
    row,
    baselines: rowBaselines[i].length ? rowBaselines[i] : [rowEdges[i]]
  }));
}
function toImage(bytes) {
  if (bytes.length > 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) {
    return { data: bytes, type: "png" };
  }
  if (bytes.length > 3 && bytes[0] === 255 && bytes[1] === 216) {
    return { data: bytes, type: "jpg" };
  }
  return null;
}
var DEFAULT_FILL = [0, 0, 0];
function multiply(m1, m2) {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + b1 * c2,
    a1 * b2 + b1 * d2,
    c1 * a2 + d1 * c2,
    c1 * b2 + d1 * d2,
    e1 * a2 + f1 * c2 + e2,
    e1 * b2 + f1 * d2 + f2
  ];
}
function applyMatrix(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}
async function loadImage(page, ref) {
  if (typeof ref !== "string") return ref;
  if (page.objs.has(ref)) return page.objs.get(ref);
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 5e3));
  const fetched = new Promise(
    (resolve) => page.objs.get(ref, (value) => resolve(value))
  );
  return Promise.race([fetched, timeout]).catch(() => null);
}
async function pixelsToPng(data, width, height, kind) {
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
var PNG_CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(bytes) {
  let crc = 4294967295;
  for (const byte of bytes) crc = PNG_CRC_TABLE[(crc ^ byte) & 255] ^ crc >>> 8;
  return (crc ^ 4294967295) >>> 0;
}
function encodePng(width, height, idat) {
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header[8] = 8;
  header[9] = 2;
  const chunks = [
    ["IHDR", header],
    ["IDAT", idat],
    ["IEND", new Uint8Array(0)]
  ];
  const total = 8 + chunks.reduce((n, [type, body]) => n + 12 + type.length + body.length, 0);
  const out = new Uint8Array(total);
  out.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
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
async function collectImages(page, pageNumber, operatorList, ops) {
  const images = [];
  const viewport = page.getViewport({ scale: 1 });
  let ctm = [1, 0, 0, 1, 0, 0];
  let fill = DEFAULT_FILL;
  const stack = [];
  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const fn = operatorList.fnArray[i];
    const args = operatorList.argsArray[i];
    if (fn === ops.save) {
      stack.push({ ctm: ctm.slice(), fill: fill.slice() });
    } else if (fn === ops.restore) {
      const saved = stack.pop();
      if (saved) {
        ctm = saved.ctm;
        fill = saved.fill;
      }
    } else if (fn === ops.transform) {
      ctm = multiply(ctm, args);
    } else if (fn === ops.setFillColorN || fn === ops.setFillRGBColor) {
      if (fn === ops.setFillRGBColor) fill = args.slice(0, 3);
      else if (typeof args === "string") fill = hexToRgb(args);
      else fill = args.slice(0, 3);
    } else if (fn === ops.paintImageXObject || fn === ops.paintInlineImageXObject) {
      const img = await loadImage(
        page,
        fn === ops.paintImageXObject ? args[0] : args
      );
      if (!img?.data || !img.width || !img.height) continue;
      const corners = [
        applyMatrix(ctm, 0, 0),
        applyMatrix(ctm, 1, 0),
        applyMatrix(ctm, 0, 1),
        applyMatrix(ctm, 1, 1)
      ].map(([x, y]) => viewport.convertToViewportPoint(x, y));
      const xs = corners.map((p) => p[0]);
      const ys = corners.map((p) => p[1]);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      if (width < 8 || height < 8) continue;
      const embedded = toImage(img.data) || { data: await pixelsToPng(img.data, img.width, img.height, img.kind), type: "png" };
      if (!embedded.data) continue;
      images.push({
        page: pageNumber,
        x: Math.min(...xs),
        top: Math.min(...ys),
        width,
        height,
        data: embedded.data,
        type: embedded.type
      });
    }
  }
  return images;
}
function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16) || 0,
    parseInt(value.slice(2, 4), 16) || 0,
    parseInt(value.slice(4, 6), 16) || 0
  ];
}
var LIST_PATTERN = /^(?:[\u2022\u25AA\u25E6\u2023\u00B7\u25CF\u25CB\-])|^\(?\d{1,3}[.)]|^[a-zA-Z][.)]\s+/;
function stripListMarker(text) {
  return text.replace(LIST_PATTERN, "").trim();
}
function headingLevelFor(fontSize, bodySize) {
  const ratio = fontSize / Math.max(bodySize, 1);
  if (ratio >= 1.75) return 1;
  if (ratio >= 1.42) return 2;
  if (ratio >= 1.18) return 3;
  return void 0;
}
function imageParagraph(image, pageWidth) {
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
          height: Math.max(16, Math.round(image.height * scale))
        }
      })
    ]
  });
}
function pathPoint(coords, index) {
  if (typeof coords[0] !== "number") {
    const [x, y] = coords[index];
    return [x, y];
  }
  return [coords[index * 2], coords[index * 2 + 1]];
}
function extractRules(operatorList, ops) {
  const rules = [];
  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const fn = operatorList.fnArray[i];
    if (fn === ops.constructPath) {
      const args = operatorList.argsArray[i];
      const rawOps = Array.isArray(args[0]) ? args[0] : args[0].ops;
      const pathOps = Array.from(rawOps ?? []);
      const coords = Array.isArray(args[0]) ? args[1] : args[0].coords;
      const CUBIC_TO = 1;
      let point = 0;
      let cursor = null;
      for (const op of pathOps) {
        const points = op === ops.moveTo || op === ops.lineTo ? 1 : op === CUBIC_TO ? 3 : 0;
        if (op === ops.moveTo) {
          cursor = pathPoint(coords, point);
        } else if (op === ops.lineTo && cursor) {
          const next = pathPoint(coords, point);
          rules.push({ x1: cursor[0], y1: cursor[1], x2: next[0], y2: next[1] });
          cursor = next;
        }
        point += points;
      }
    } else if (fn === ops.rectangle) {
      const [x, y, w, h] = operatorList.argsArray[i];
      rules.push({ x1: x, y1: y, x2: x + w, y2: y });
      rules.push({ x1: x, y1: y + h, x2: x + w, y2: y + h });
      rules.push({ x1: x, y1: y, x2: x, y2: y + h });
      rules.push({ x1: x + w, y1: y, x2: x + w, y2: y + h });
    }
  }
  return rules;
}
var pdfjsPromise = null;
function loadPdfjs() {
  pdfjsPromise ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((mod) => {
    mod.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.mjs";
    return mod;
  });
  return pdfjsPromise;
}
async function convertPdfToDocx(data) {
  const pdfjs = await loadPdfjs();
  let pdf;
  let loadingTask;
  try {
    loadingTask = pdfjs.getDocument({
      data,
      useWorkerFetch: false,
      useSystemFonts: true
    });
    pdf = await loadingTask.promise;
  } catch (error) {
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
  const pages = [];
  let characterCount = 0;
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();
      const lines = collectPageLines(
        (textContent.items || []).filter(
          (it) => "str" in it
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
      const textEdges = {
        left: Math.min(...lines.map((l) => l.x), viewport.width),
        right: Math.max(...lines.map((l) => l.endX), 0),
        top: Math.max(...lines.map((l) => l.baseline), 0),
        bottom: Math.min(...lines.map((l) => l.baseline), viewport.height)
      };
      const relevantRules = rules.filter(
        (r) => (isHorizontal(r) || isVertical(r)) && Math.max(r.x1, r.x2) >= textEdges.left - 20 && Math.min(r.x1, r.x2) <= textEdges.right + 20 && Math.max(r.y1, r.y2) <= textEdges.top + 20 && Math.min(r.y1, r.y2) >= textEdges.bottom - 20
      );
      const tableCandidates = detectTables(lines, relevantRules);
      const tables = tableCandidates.map((c) => ({
        page: pageNumber,
        top: Math.max(...c.rules.filter(isHorizontal).flatMap((r) => [r.y1, r.y2])),
        bottom: Math.min(...c.rules.filter(isHorizontal).flatMap((r) => [r.y1, r.y2])),
        rows: buildTableRows(c)
      }));
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
        tables
      });
    }
  } catch (error) {
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
  const sections = [];
  let currentPage = null;
  for (const page of pages) {
    const ops = [];
    for (const table of page.tables) {
      ops.push({ kind: "table", table: table.rows.map((r) => r.row), order: page.height - table.top });
    }
    for (const image of page.images) {
      ops.push({ kind: "image", image, order: page.height - image.top });
    }
    const blocks = buildTextBlocks(page.lines, bodySize);
    for (const block of blocks) {
      ops.push({
        kind: block.kind,
        text: block.text,
        fontSize: block.fontSize,
        headingLevel: block.headingLevel,
        listLevel: block.listLevel,
        order: page.height - block.baseline
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
            rows: op.table
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
          paragraph: { spacing: { after: 120, line: 300 } }
        }
      }
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
        },
        children: sections
      }
    ]
  });
  return Packer.toBuffer(document);
}
function buildTextBlocks(lines, bodySize) {
  const blocks = [];
  const gaps = [];
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
  let previous = null;
  let current = null;
  for (const line of lines) {
    const headingLevel = headingLevelFor(line.fontSize, bodySize);
    const isList = LIST_PATTERN.test(line.text);
    const text = isList ? stripListMarker(line.text) : line.text;
    if (!text) continue;
    const verticalGap = previous ? previous.baseline - line.baseline : 0;
    const sameSize = previous && Math.abs(previous.fontSize - line.fontSize) <= bodySize * 0.16;
    const indented = previous && line.x - previous.x > Math.max(8, bodySize * 0.7);
    const startsNew = !previous || !current || verticalGap > blockGapThreshold || !sameSize && !headingLevel || indented;
    if (isList) {
      current = {
        kind: "list",
        baseline: line.baseline,
        text,
        fontSize: line.fontSize,
        listLevel: Math.max(0, Math.min(4, Math.round((line.x - baseListX) / Math.max(bodySize * 1.6, 14))))
      };
      blocks.push(current);
    } else if (current?.kind === "list" && verticalGap <= blockGapThreshold && line.x <= previous.x + 40) {
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
function paragraphForBlock(block, bodySize) {
  const size = Math.round(Math.max(16, Math.min(64, (block.fontSize || bodySize) * 2)));
  if (block.kind === "heading") {
    const level = block.headingLevel === 1 ? HeadingLevel.HEADING_1 : block.headingLevel === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
    return new Paragraph({
      heading: level,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: block.text, bold: true, size })]
    });
  }
  if (block.kind === "list") {
    return new Paragraph({
      bullet: { level: block.listLevel || 0 },
      spacing: { after: 80 },
      children: [new TextRun({ text: block.text, size })]
    });
  }
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 300, after: 140 },
    children: [new TextRun({ text: block.text, size })]
  });
}
export {
  PdfConversionError,
  convertPdfToDocx
};
