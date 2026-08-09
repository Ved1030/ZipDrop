/**
 * DOCX Document renderer — renders the document model as A4 pages
 * with contenteditable editing and real-time model updates.
 */

"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  DocxDocument, DocxSection, DocxParagraph, DocxRun, DocxTable,
  DocxTableRow, DocxTableCell, InlineContent, DocxHyperlink,
  RunProperties, ParagraphProperties, ContentBlock,
  TWIPS_PER_PX,
} from "./types";
import { extractDocx } from "./extract";
import { generateDocx } from "./generator";
import { normalizeColor } from "../editor/html-to-docx";
import { layoutParagraph, LayoutParagraph } from "./layout";

/* ── Constants ─────────────────────────────────────────────────────── */

function twipsToPx(t: number): number {
  return (t / 1440) * 96;
}

const PAGE_SHADOW = "0 2px 12px rgba(0,0,0,0.45)";

/* ── Run style → CSS ───────────────────────────────────────────────── */

function runStyleCss(rp: RunProperties): React.CSSProperties {
  const css: React.CSSProperties = {};
  if (rp.font) css.fontFamily = `'${rp.font}', sans-serif`;
  if (rp.size) css.fontSize = `${rp.size / 2}pt`;
  if (rp.color) css.color = normalizeColor(rp.color);
  if (rp.bold) css.fontWeight = "bold";
  if (rp.italic) css.fontStyle = "italic";
  if (rp.underline) css.textDecoration = "underline";
  if (rp.strike) css.textDecoration = css.textDecoration ? `${css.textDecoration} line-through` : "line-through";
  if (rp.superscript) { css.verticalAlign = "super"; css.fontSize = "0.75em"; }
  if (rp.subscript) { css.verticalAlign = "sub"; css.fontSize = "0.75em"; }
  if (rp.highlight) css.backgroundColor = normalizeColor(rp.highlight);
  if (rp.caps || rp.smallCaps) css.fontVariant = "small-caps";
  if (rp.shading?.fill) css.backgroundColor = normalizeColor(rp.shading.fill);
  return css;
}

/* ── Paragraph style → CSS ─────────────────────────────────────────── */

function paraStyleCss(pp: ParagraphProperties): React.CSSProperties {
  const css: React.CSSProperties = {};
  if (pp.alignment) css.textAlign = pp.alignment === "distribute" ? "justify" : pp.alignment;
  if (pp.indent) {
    if (pp.indent.hanging) {
      css.textIndent = `${twipsToPx(pp.indent.hanging)}px`;
      if (pp.indent.left) css.marginLeft = `${twipsToPx(pp.indent.left)}px`;
    } else {
      if (pp.indent.left) css.marginLeft = `${twipsToPx(pp.indent.left)}px`;
      if (pp.indent.right) css.marginRight = `${twipsToPx(pp.indent.right)}px`;
      if (pp.indent.firstLine) css.textIndent = `${twipsToPx(pp.indent.firstLine)}px`;
    }
  }
  if (pp.spacing) {
    if (pp.spacing.before) css.marginTop = `${twipsToPx(pp.spacing.before)}px`;
    if (pp.spacing.after) css.marginBottom = `${twipsToPx(pp.spacing.after)}px`;
    if (pp.spacing.line) {
      if (pp.spacing.lineRule === "exact") {
        css.lineHeight = `${twipsToPx(pp.spacing.line)}px`;
      } else if (pp.spacing.lineRule === "atLeast") {
        css.lineHeight = `${twipsToPx(pp.spacing.line)}px`;
      } else {
        css.lineHeight = pp.spacing.line / 240;
      }
    }
  }
  if (pp.shading?.fill) css.backgroundColor = normalizeColor(pp.shading.fill);
  return css;
}

/* ── Inline renderer ───────────────────────────────────────────────── */

function InlineRenderer({ items, onTextChange }: { items: InlineContent[]; onTextChange?: (oldText: string, newText: string) => void }) {
  return (
    <>
      {items.map((item, i) => {
        if (item.kind === "run") {
          return <span key={i} style={runStyleCss(item.properties)}>{item.text}</span>;
        }
        if (item.kind === "hyperlink") {
          return (
            <a key={i} href={item.anchor || "#"} style={{ color: "#0563C1", textDecoration: "underline" }}>
              {item.runs.map((r, j) => <span key={j} style={runStyleCss(r.properties)}>{r.text}</span>)}
            </a>
          );
        }
        if (item.kind === "tab") return <span key={i} style={{ display: "inline-block", width: "2em" }} />;
        if (item.kind === "break") return <br key={i} />;
        return null;
      })}
    </>
  );
}

/* ── Paragraph renderer ────────────────────────────────────────────── */

function ParagraphRenderer({ paragraph, onInput }: {
  paragraph: DocxParagraph;
  onInput?: (text: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleInput = useCallback(() => {
    if (ref.current && onInput) {
      onInput(ref.current.textContent || "");
    }
  }, [onInput]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      style={{
        ...paraStyleCss(paragraph.properties),
        outline: "none",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        minHeight: "1em",
      }}
    >
      <InlineRenderer items={paragraph.runs} />
    </div>
  );
}

/* ── Table renderer ────────────────────────────────────────────────── */

function TableRenderer({ table }: { table: DocxTable }) {
  return (
    <table style={{ borderCollapse: "collapse", width: "100%", margin: "8px 0" }}>
      <tbody>
        {table.rows.map((row, ri) => (
          <tr key={ri}>
            {row.cells.map((cell, ci) => (
              <td
                key={ci}
                colSpan={cell.properties.columnSpan}
                rowSpan={cell.properties.rowSpan}
                style={{
                  border: "1px solid #ccc",
                  padding: "4px 8px",
                  verticalAlign: cell.properties.verticalAlign || "top",
                  width: cell.properties.width ? `${twipsToPx(cell.properties.width.value)}px` : undefined,
                  backgroundColor: cell.properties.shading?.fill ? normalizeColor(cell.properties.shading.fill) : undefined,
                }}
              >
                {cell.content.map((block, bi) => {
                  if ("runs" in block) return <ParagraphRenderer key={bi} paragraph={block as DocxParagraph} />;
                  if ("rows" in block) return <TableRenderer key={bi} table={block as DocxTable} />;
                  return null;
                })}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Section → Pages renderer ──────────────────────────────────────── */

function SectionPages({ section, onParagraphEdit }: {
  section: DocxSection;
  onParagraphEdit?: (sectionIdx: number, paraIdx: number, newText: string) => void;
}) {
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

  const blocks = useMemo(() => {
    return section.content.map((block, idx) => {
      if ("runs" in block) {
        return { type: "paragraph" as const, layout: layoutParagraph(block as DocxParagraph, contentWidthPx), block, idx };
      }
      if ("rows" in block) {
        return { type: "table" as const, layout: null, block, idx };
      }
      return { type: "paragraph" as const, layout: null, block, idx };
    });
  }, [section, contentWidthPx]);

  const pages: typeof blocks[] = [[]];
  let currentPageHeight = 0;
  const contentHeightPx = pageHeightPx - marginsPx.top - marginsPx.bottom;

  for (const block of blocks) {
    const blockH = block.layout
      ? (block.layout as LayoutParagraph).totalHeight +
        (block.layout as LayoutParagraph).spacingBefore +
        (block.layout as LayoutParagraph).spacingAfter
      : 100;

    if (currentPageHeight + blockH > contentHeightPx && pages[pages.length - 1].length > 0) {
      pages.push([]);
      currentPageHeight = 0;
    }
    pages[pages.length - 1].push(block);
    currentPageHeight += blockH;
  }

  return (
    <>
      {pages.map((pageBlocks, pageIdx) => (
        <div
          key={pageIdx}
          style={{
            background: "#fff",
            width: pageWidthPx,
            minHeight: pageHeightPx,
            padding: `${marginsPx.top}px ${marginsPx.right}px ${marginsPx.bottom}px ${marginsPx.left}px`,
            boxShadow: PAGE_SHADOW,
            borderRadius: 2,
            position: "relative",
            flexShrink: 0,
            boxSizing: "border-box",
          }}
        >
          {pageBlocks.map((block) => {
            if (block.type === "paragraph" && "runs" in block.block) {
              return (
                <ParagraphRenderer
                  key={`${pageIdx}-${block.idx}`}
                  paragraph={block.block as DocxParagraph}
                  onInput={onParagraphEdit ? (text) => onParagraphEdit(0, block.idx, text) : undefined}
                />
              );
            }
            if (block.type === "table" && "rows" in block.block) {
              return <TableRenderer key={`${pageIdx}-${block.idx}`} table={block.block as DocxTable} />;
            }
            return null;
          })}
        </div>
      ))}
    </>
  );
}

/* ── Main DocxRenderer component ───────────────────────────────────── */

export interface DocxRendererProps {
  document: DocxDocument;
  zoom?: number;
  onDocumentChange?: (doc: DocxDocument) => void;
}

export function DocxRenderer({ document: doc, zoom = 100, onDocumentChange }: DocxRendererProps) {
  const handleParagraphEdit = useCallback((sectionIdx: number, paraIdx: number, newText: string) => {
    if (!onDocumentChange) return;
    const newDoc = { ...doc, sections: [...doc.sections] };
    const section = { ...newDoc.sections[sectionIdx], content: [...newDoc.sections[sectionIdx].content] };
    newDoc.sections[sectionIdx] = section;

    const para = section.content[paraIdx];
    if (para && "runs" in para) {
      const p = { ...(para as DocxParagraph), runs: [...(para as DocxParagraph).runs] };
      if (p.runs.length === 1 && p.runs[0].kind === "run") {
        p.runs[0] = { ...p.runs[0], text: newText };
      } else {
        p.runs = [{ kind: "run", properties: p.runs[0]?.kind === "run" ? p.runs[0].properties : {}, text: newText }];
      }
      section.content[paraIdx] = p;
    }

    onDocumentChange(newDoc);
  }, [doc, onDocumentChange]);

  return (
    <>
      {doc.sections.map((section, si) => (
        <SectionPages
          key={si}
          section={section}
          onParagraphEdit={onDocumentChange ? handleParagraphEdit : undefined}
        />
      ))}
      {doc.sections.length === 0 && (
        <div style={{
          background: "#fff", width: twipsToPx(11906), minHeight: twipsToPx(16838),
          padding: 96, boxShadow: PAGE_SHADOW, borderRadius: 2, flexShrink: 0,
        }}>
          <div style={{ color: "#999", fontStyle: "italic" }}>Empty document</div>
        </div>
      )}
    </>
  );
}

/* ── Full DOCX Editor ──────────────────────────────────────────────── */

export interface DocxEditorProps {
  arrayBuffer: ArrayBuffer;
  fileName: string;
  onBack: () => void;
  onFileSelect: (file: File) => void;
}

export function DocxEditor({ arrayBuffer, fileName, onBack, onFileSelect }: DocxEditorProps) {
  const [doc, setDoc] = useState<DocxDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    extractDocx(arrayBuffer).then(d => { setDoc(d); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); });
  }, [arrayBuffer]);

  const handleDownload = useCallback(async () => {
    if (!doc) return;
    const blob = await generateDocx(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.[^.]+$/, "") + ".docx";
    a.click();
    URL.revokeObjectURL(url);
  }, [doc, fileName]);

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#1a1a2e" }}><p style={{ color: "#888" }}>Parsing OOXML...</p></div>;
  if (error) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#1a1a2e" }}><p style={{ color: "#ff4444" }}>{error}</p></div>;
  if (!doc) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#1a1a2e", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", borderBottom: "1px solid #2a2a3e", gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 13 }}>Back</button>
        <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{fileName}</span>
        <span style={{ color: "#666", fontSize: 11, marginLeft: 4 }}>DOCX (OOXML)</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: "#666", fontSize: 11 }}>Zoom</span>
        <input type="range" min={50} max={200} value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ width: 100 }} />
        <span style={{ color: "#888", fontSize: 11 }}>{zoom}%</span>
        <button onClick={handleDownload} style={{ background: "#00e5ff", border: "none", borderRadius: 4, padding: "6px 14px", color: "#000", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Download</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
          <DocxRenderer document={doc} zoom={zoom} onDocumentChange={setDoc} />
        </div>
      </div>
    </div>
  );
}
