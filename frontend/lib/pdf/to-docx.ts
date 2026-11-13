import {
  AlignmentType,
  Document,
  HeadingLevel,
  PageBreak,
  Packer,
  Paragraph,
  TextRun,
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
  baseline: number;
  text: string;
  fontSize: number;
  fontName: string;
}

type BlockKind = "paragraph" | "heading" | "list";

interface ContentBlock {
  kind: BlockKind;
  page: number;
  x: number;
  text: string;
  fontSize: number;
  headingLevel?: number;
  listLevel?: number;
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
  for (const item of positioned) {
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

const LIST_PATTERN = /^(?:[•▪◦‣·●○\-–—*]|\(?\d{1,3}[.)]|[a-zA-Z][.)])\s+/;

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

function buildBlocks(lines: PageLine[]): ContentBlock[] {
  const bodySize = weightedMedianSize(lines);
  const blocks: ContentBlock[] = [];
  const pageGaps = new Map<number, number[]>();

  for (let i = 1; i < lines.length; i++) {
    const previous = lines[i - 1];
    const current = lines[i];
    if (previous.page !== current.page) continue;
    if (Math.abs(previous.fontSize - current.fontSize) > bodySize * 0.3) continue;
    const gap = previous.baseline - current.baseline;
    if (gap > 0 && gap < bodySize * 3.2) {
      const gaps = pageGaps.get(current.page) || [];
      gaps.push(gap);
      pageGaps.set(current.page, gaps);
    }
  }

  const minListXByPage = new Map<number, number>();
  for (const line of lines) {
    if (LIST_PATTERN.test(line.text)) {
      minListXByPage.set(
        line.page,
        Math.min(minListXByPage.get(line.page) ?? line.x, line.x)
      );
    }
  }

  let previousLine: PageLine | null = null;
  let currentBlock: ContentBlock | null = null;

  for (const line of lines) {
    const headingLevel = headingLevelFor(line.fontSize, bodySize);
    const isList = LIST_PATTERN.test(line.text);
    const text = isList ? stripListMarker(line.text) : line.text;
    if (!text) continue;

    const typicalGap = median(pageGaps.get(line.page) || []) || bodySize * 1.25;
    const blockGapThreshold = Math.max(bodySize * 1.65, typicalGap * 1.38);
    const verticalGap = previousLine ? previousLine.baseline - line.baseline : 0;
    const samePage = previousLine?.page === line.page;
    const sameSize = previousLine && Math.abs(previousLine.fontSize - line.fontSize) <= bodySize * 0.16;
    const indented = previousLine && line.x - previousLine.x > Math.max(8, bodySize * 0.7);
    const startsNewParagraph =
      !previousLine ||
      !currentBlock ||
      !samePage ||
      verticalGap > blockGapThreshold ||
      (!sameSize && !headingLevel) ||
      indented;

    if (isList) {
      const baseX = minListXByPage.get(line.page) ?? line.x;
      const listLevel = Math.max(
        0,
        Math.min(4, Math.round((line.x - baseX) / Math.max(bodySize * 1.6, 14)))
      );
      currentBlock = {
        kind: "list",
        page: line.page,
        x: line.x,
        text,
        fontSize: line.fontSize,
        listLevel,
      };
      blocks.push(currentBlock);
    } else if (
      currentBlock?.kind === "list" &&
      samePage &&
      verticalGap <= blockGapThreshold &&
      line.x <= currentBlock.x + bodySize * 1.5
    ) {
      currentBlock.text += line.text.endsWith("-")
        ? line.text.replace(/-\s*$/, "")
        : " " + text;
    } else if (headingLevel) {
      if (
        currentBlock?.kind === "heading" &&
        currentBlock.headingLevel === headingLevel &&
        samePage &&
        !startsNewParagraph
      ) {
        currentBlock.text += " " + text;
      } else {
        currentBlock = {
          kind: "heading",
          page: line.page,
          x: line.x,
          text,
          fontSize: line.fontSize,
          headingLevel,
        };
        blocks.push(currentBlock);
      }
    } else if (currentBlock?.kind === "paragraph" && !startsNewParagraph) {
      if (currentBlock.text.endsWith("-") && /^[a-z]/.test(line.text)) {
        currentBlock.text = currentBlock.text.replace(/-\s*$/, "") + line.text;
      } else {
        currentBlock.text += " " + text;
      }
    } else {
      currentBlock = {
        kind: "paragraph",
        page: line.page,
        x: line.x,
        text,
        fontSize: line.fontSize,
      };
      blocks.push(currentBlock);
    }

    previousLine = line;
  }

  return blocks;
}

function paragraphForBlock(block: ContentBlock, bodySize: number): Paragraph {
  const size = Math.round(
    Math.max(16, Math.min(64, (block.fontSize || bodySize) * 2))
  );

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

export async function convertPdfToDocx(data: Uint8Array): Promise<Uint8Array> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc =
    "pdfjs-dist/legacy/build/pdf.worker.mjs";

  let pdf: any;
  let loadingTask: any;
  try {
    loadingTask = pdfjs.getDocument({
      data,
      useWorkerFetch: false,
      useSystemFonts: true,
    });
    pdf = await loadingTask.promise;
  } catch (error: any) {
    console.error("[pdf-to-docx] open failed:", error?.name, error?.message);
    if (error?.name === "PasswordException") {
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

  const lines: PageLine[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();
      const rawItems = (textContent.items || []) as RawTextItem[];
      lines.push(...collectPageLines(rawItems, pageNumber, viewport.width));
    }
  } catch (error: any) {
    if (error?.name === "PasswordException") {
      throw new PdfConversionError(
        "PASSWORD_PROTECTED",
        "This PDF is password protected. Remove the password and try again."
      );
    }
    throw new PdfConversionError(
      "INVALID_PDF",
      "The PDF could not be read. It may be damaged or use unsupported encryption."
    );
  } finally {
    await loadingTask?.destroy?.().catch(() => {});
  }

  const characterCount = lines.reduce(
    (total, line) => total + line.text.replace(/\s/g, "").length,
    0
  );
  if (characterCount < 12) {
    throw new PdfConversionError(
      "OCR_REQUIRED",
      "This PDF appears to be scanned or image-only. Text recognition (OCR) is required before it can be edited."
    );
  }

  const blocks = buildBlocks(lines);
  if (blocks.length === 0) {
    throw new PdfConversionError(
      "NO_CONTENT",
      "No editable text was found in this PDF."
    );
  }

  const bodySize = weightedMedianSize(lines);
  const children: Paragraph[] = [];
  let currentPage: number | null = null;

  for (const block of blocks) {
    if (currentPage !== null && block.page !== currentPage) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
    currentPage = block.page;
    children.push(paragraphForBlock(block, bodySize));
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
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
}
