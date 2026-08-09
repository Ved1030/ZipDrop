/**
 * Layout engine — font metrics estimation, line breaking, pagination.
 * Uses canvas measurement for accurate text width.
 */

import {
  DocxSection, DocxParagraph, DocxRun, DocxTable, DocxHyperlink, InlineContent,
  RunProperties, ParagraphProperties,
  TWIPS_PER_PX, halfPtToPt,
} from "./types";

/* ── Font metrics cache ────────────────────────────────────────────── */

const measureCanvas = typeof document !== "undefined"
  ? document.createElement("canvas").getContext("2d")
  : null;

interface MetricKey { font: string; size: number; bold: boolean; italic: boolean }
const metricCache = new Map<string, number>();

function fontKey(props: RunProperties): string {
  const font = props.font || "Calibri";
  const size = props.size || 22;
  const b = props.bold ? "1" : "0";
  const i = props.italic ? "1" : "0";
  return `${font}|${size}|${b}|${i}`;
}

function measureText(text: string, props: RunProperties): number {
  if (!measureCanvas || !text) return text.length * 8;

  const key = fontKey(props);
  const cached = metricCache.get(key);
  const pt = halfPtToPt(props.size || 22);
  const px = pt * (96 / 72);

  let fontStr = "";
  if (props.italic) fontStr += "italic ";
  if (props.bold) fontStr += "bold ";
  fontStr += `${px}px "${props.font || "Calibri"}", sans-serif`;

  if (cached === undefined) {
    measureCanvas.font = fontStr;
    const w = measureCanvas.measureText("M").width;
    metricCache.set(key, w / 8);
  }

  const ratio = metricCache.get(key) || 1;
  measureCanvas.font = fontStr;
  return measureCanvas.measureText(text).width;
}

function measureRunWidth(run: DocxRun): number {
  return measureText(run.text, run.properties);
}

/* ── Paragraph layout ──────────────────────────────────────────────── */

export interface LineFragment {
  runs: { run: DocxRun; startOffset: number; endOffset: number }[];
  width: number;
}

export interface LayoutLine {
  fragments: LineFragment[];
  totalWidth: number;
  lineHeight: number;
  baseline: number;
}

export interface LayoutParagraph {
  lines: LayoutLine[];
  totalHeight: number;
  spacingBefore: number;
  spacingAfter: number;
  indent: { left: number; right: number; hanging: number };
}

export interface LayoutBlock {
  paragraphs: (LayoutParagraph | LayoutTable)[];
  totalHeight: number;
}

export interface LayoutTable {
  kind: "table";
  totalHeight: number;
}

export interface LayoutSection {
  blocks: LayoutBlock[];
  pageWidthPx: number;
  pageHeightPx: number;
  marginsPx: { top: number; bottom: number; left: number; right: number };
  contentWidthPx: number;
  pages: LayoutBlock[][];
}

/* ── Line breaking ─────────────────────────────────────────────────── */

function breakRunsIntoLines(
  runs: DocxRun[],
  maxWidth: number,
): LayoutLine[] {
  const lines: LayoutLine[] = [];
  let currentLine: LayoutLine = { fragments: [], totalWidth: 0, lineHeight: 0, baseline: 0 };
  let runOffset = 0;

  for (const run of runs) {
    const text = run.text;
    if (!text) continue;

    const fontSize = halfPtToPt(run.properties.size || 22);
    const lineH = fontSize * 1.2;
    currentLine.lineHeight = Math.max(currentLine.lineHeight, lineH);
    currentLine.baseline = Math.max(currentLine.baseline, fontSize);

    if (currentLine.fragments.length === 0 && currentLine.totalWidth === 0) {
      const words = text.split(/(\s+)/);
      let wordText = "";

      for (const word of words) {
        const wordWidth = measureText(wordText + word, run.properties);
        if (currentLine.totalWidth + wordWidth > maxWidth && wordText) {
          if (wordText) {
            currentLine.fragments.push({ runs: [{ run: { ...run, text: wordText }, startOffset: runOffset, endOffset: runOffset + wordText.length }], width: measureText(wordText, run.properties) });
            currentLine.totalWidth += measureText(wordText, run.properties);
          }
          lines.push(currentLine);
          currentLine = { fragments: [], totalWidth: 0, lineHeight: lineH, baseline: fontSize };
          wordText = word.trimStart();
        } else {
          wordText += word;
        }
      }

      if (wordText) {
        currentLine.fragments.push({ runs: [{ run: { ...run, text: wordText }, startOffset: runOffset, endOffset: runOffset + wordText.length }], width: measureText(wordText, run.properties) });
        currentLine.totalWidth += measureText(wordText, run.properties);
      }
    } else {
      const words = text.split(/(\s+)/);
      let wordText = "";

      for (const word of words) {
        const testWidth = currentLine.totalWidth + measureText(wordText + word, run.properties);
        if (testWidth > maxWidth && wordText.trim()) {
          currentLine.fragments.push({ runs: [{ run: { ...run, text: wordText }, startOffset: runOffset, endOffset: runOffset + wordText.length }], width: measureText(wordText, run.properties) });
          currentLine.totalWidth += measureText(wordText, run.properties);
          lines.push(currentLine);
          currentLine = { fragments: [], totalWidth: 0, lineHeight: lineH, baseline: fontSize };
          wordText = word.trimStart();
        } else {
          wordText += word;
        }
      }

      if (wordText) {
        currentLine.fragments.push({ runs: [{ run: { ...run, text: wordText }, startOffset: runOffset, endOffset: runOffset + wordText.length }], width: measureText(wordText, run.properties) });
        currentLine.totalWidth += measureText(wordText, run.properties);
      }
    }

    runOffset += text.length;
  }

  if (currentLine.fragments.length > 0 || lines.length === 0) {
    lines.push(currentLine);
  }

  return lines;
}

/* ── Convert twips to px ───────────────────────────────────────────── */

function twipsToPx(twips: number): number {
  return (twips / 1440) * 96;
}

/* ── Layout paragraph ──────────────────────────────────────────────── */

export function layoutParagraph(para: DocxParagraph, contentWidthPx: number): LayoutParagraph {
  const allRuns: DocxRun[] = [];
  for (const item of para.runs) {
    if (item.kind === "run") allRuns.push(item);
    else if (item.kind === "hyperlink") allRuns.push(...item.runs);
  }

  const lines = breakRunsIntoLines(allRuns, contentWidthPx);
  const sp = para.properties.spacing || {};
  const spacingBefore = sp.before ? twipsToPx(sp.before) : 0;
  const spacingAfter = sp.after ? twipsToPx(sp.after) : 0;

  let totalLineHeight = 0;
  for (const line of lines) {
    if (sp.line) {
      if (sp.lineRule === "exact") {
        totalLineHeight += twipsToPx(sp.line);
      } else if (sp.lineRule === "atLeast") {
        totalLineHeight += Math.max(twipsToPx(sp.line), line.lineHeight);
      } else {
        totalLineHeight += line.lineHeight * (sp.line / 240);
      }
    } else {
      totalLineHeight += line.lineHeight * 1.15;
    }
  }

  const indent = para.properties.indent || {};
  return {
    lines,
    totalHeight: totalLineHeight,
    spacingBefore,
    spacingAfter,
    indent: {
      left: indent.left ? twipsToPx(indent.left) : 0,
      right: indent.right ? twipsToPx(indent.right) : 0,
      hanging: indent.hanging ? twipsToPx(indent.hanging) : 0,
    },
  };
}

/* ── Layout section (pagination) ───────────────────────────────────── */

export function layoutSection(section: DocxSection): LayoutSection {
  const props = section.properties;
  const pageWidthPx = twipsToPx(props.pageWidth);
  const pageHeightPx = twipsToPx(props.pageHeight);
  const marginsPx = {
    top: twipsToPx(props.marginTop),
    bottom: twipsToPx(props.marginBottom),
    left: twipsToPx(props.marginLeft),
    right: twipsToPx(props.marginRight),
  };
  const contentWidthPx = pageWidthPx - marginsPx.left - marginsPx.right;
  const contentHeightPx = pageHeightPx - marginsPx.top - marginsPx.bottom;

  const blocks: (LayoutParagraph | LayoutTable)[] = [];
  for (const block of section.content) {
    if ("runs" in block) {
      blocks.push(layoutParagraph(block as DocxParagraph, contentWidthPx));
    } else if ("rows" in block) {
      blocks.push({ kind: "table" as const, totalHeight: 100 });
    }
  }

  const pages: LayoutBlock[][] = [[]];
  let currentPageHeight = 0;

  for (const block of blocks) {
    const blockHeight = "totalHeight" in block ? block.totalHeight + ("spacingBefore" in block ? (block as LayoutParagraph).spacingBefore + (block as LayoutParagraph).spacingAfter : 0) : 100;

    if (currentPageHeight + blockHeight > contentHeightPx && pages[pages.length - 1].length > 0) {
      pages.push([]);
      currentPageHeight = 0;
    }

    pages[pages.length - 1].push({ paragraphs: [block], totalHeight: blockHeight });
    currentPageHeight += blockHeight;
  }

  return { blocks: [], pageWidthPx, pageHeightPx, marginsPx, contentWidthPx, pages };
}
