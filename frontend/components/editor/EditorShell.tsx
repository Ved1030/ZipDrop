"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { PageEditorAdapter } from "@/lib/editor/page-editor-adapter";
import type { PageInfo, PaginatedEditorHandle } from "@/lib/editor/paginated-types";
import EditorHeader from "./EditorHeader";
import MenuBar from "./MenuBar";
import Toolbar from "./Toolbar";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import DocumentCanvas from "./DocumentCanvas";
import StatusBar from "./StatusBar";
import UploadOverlay from "./UploadOverlay";

interface EditorShellProps {
  fileName: string;
  fileType: string;
  fileSize: string;
  initialContent: string;
  docxBuffer?: ArrayBuffer | null;
  loadKey?: number;
  hasFileUrl: boolean;
  recipientCode?: string;
  originalFileUrl?: string;
  onBack: () => void;
  onFileSelect: (file: File) => void;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
}

function countChars(html: string): number {
  return html.replace(/<[^>]*>/g, "").length;
}

function nowFormatted(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const AUTOSAVE_KEY = "zipdrop_editor_autosave";

function readAutosave(): string {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (!saved) return "";
    const data = JSON.parse(saved);
    return typeof data?.content === "string" ? data.content : "";
  } catch {
    return "";
  }
}

export default function EditorShell({
  fileName,
  fileType,
  fileSize,
  initialContent,
  docxBuffer = null,
  loadKey = 0,
  hasFileUrl,
  recipientCode,
  originalFileUrl,
  onBack,
  onFileSelect,
}: EditorShellProps) {
  const [restoredHtml] = useState(() =>
    initialContent || docxBuffer ? "" : readAutosave()
  );
  const [content, setContent] = useState(() => restoredHtml || initialContent);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showRulers, setShowRulers] = useState(true);
  const [showPageBreaks, setShowPageBreaks] = useState(true);
  const [activePage, setActivePage] = useState(0);
  const [spellCheck, setSpellCheck] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(
    !initialContent && !hasFileUrl && !docxBuffer && !restoredHtml
  );
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareResult, setShareResult] = useState<{ code: string; expiry?: string; link?: string } | null>(null);

  const canvasHandleRef = useRef<PaginatedEditorHandle>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const adapterRef = useRef<PageEditorAdapter | null>(null);
  const createdAt = "Today, " + nowFormatted();

  if (!adapterRef.current) {
    adapterRef.current = new PageEditorAdapter(() => canvasHandleRef.current);
  }
  const editor = adapterRef.current as unknown as Editor;

  const pageCount = pages.length;
  const words = countWords(content);
  const chars = countChars(content);

  const handleContentChange = useCallback(
    (html: string) => {
      setContent(html);
      setIsSaving(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
        try {
          localStorage.setItem(
            AUTOSAVE_KEY,
            JSON.stringify({
              fileName,
              fileType,
              content: html,
              timestamp: Date.now(),
            })
          );
        } catch {
          /* storage may be unavailable */
        }
      }, 1200);
    },
    [fileName, fileType]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
      adapterRef.current?.destroy();
    };
  }, []);

  const handleStartBlank = useCallback(() => {
    setOverlayVisible(false);
    setContent("");
    setPages([]);
    setActivePage(0);
    canvasHandleRef.current?.setHTML("");
  }, []);

  const handleScrollToEnd = useCallback(() => {
    if (pageCount > 0) canvasHandleRef.current?.scrollToPage(pageCount - 1);
    canvasHandleRef.current?.focus("end");
  }, [pageCount]);

const handleDownload = useCallback(async (format?: string) => {
    const html = canvasHandleRef.current?.getHTML() || content;
    const name = fileName.replace(/\.[^.]+$/, "") || "document";
    const fmt = format || fileType || "docx";

    if (fmt === "docx" || fmt === "doc") {
      try {
        const res = await fetch("/api/convert-to-docx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html: html,
            filename: name,
            styles: {
              defaultFont: "Calibri",
              fontSize: 11,
              lineHeight: 1.7,
            },
          }),
        });
        if (!res.ok) throw new Error("Conversion failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name + ".docx";
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("DOCX conversion failed:", err);
        alert("Download failed. Please try again.");
      }
    } else if (fmt === "pdf") {
      try {
        const { default: html2canvas } = await import("html2canvas");
        const { jsPDF } = await import("jspdf");

        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        tempContainer.style.top = "0";
        tempContainer.style.width = "794px";
        tempContainer.innerHTML = html;
        document.body.appendChild(tempContainer);

        const pdf = new jsPDF({ unit: "pt", format: "a4" });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 72;

        const pageSections = tempContainer.querySelectorAll(".zd-page, section.zd-export-page, [data-page-break]");
        
        if (pageSections.length === 0) {
          tempContainer.innerHTML = `<div class="docx">${html}</div>`;
        }

        const elementsToRender = pageSections.length > 0 
          ? Array.from(pageSections) 
          : [tempContainer.firstElementChild].filter(Boolean) as HTMLElement[];

        for (let i = 0; i < elementsToRender.length; i++) {
          const element = elementsToRender[i] as HTMLElement;
          if (i > 0) pdf.addPage();
          
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
          } as any);

          const imgData = canvas.toDataURL("image/png");
          const imgWidth = pdfWidth - margin * 2;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          let yPos = margin;
          let remainingHeight = imgHeight;
          
          while (remainingHeight > 0) {
            const pageContentHeight = pdfHeight - margin * 2;
            const clipHeight = Math.min(remainingHeight, pageContentHeight);
            
            pdf.addImage(
              imgData,
              "PNG",
              margin,
              yPos,
              imgWidth,
              clipHeight,
              undefined,
              "FAST"
            );
            
            remainingHeight -= clipHeight;
            if (remainingHeight > 0) {
              pdf.addPage();
              yPos = margin;
            } else {
              yPos += clipHeight;
            }
          }
        }

        tempContainer.remove();
        pdf.save(name + ".pdf");
      } catch (err) {
        console.error("PDF export failed:", err);
        alert("PDF export failed. Please try again.");
      }
    } else if (fmt === "txt") {
      const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
      const blob = new Blob([text], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name + ".txt";
      a.click();
    } else if (fmt === "md") {
      let md = html;
      md = md.replace(/<h1[^>]*>(.*?)<\/h1>/g, "# $1\n\n");
      md = md.replace(/<h2[^>]*>(.*?)<\/h2>/g, "## $1\n\n");
      md = md.replace(/<h3[^>]*>(.*?)<\/h3>/g, "### $1\n\n");
      md = md.replace(/<strong>(.*?)<\/strong>/g, "**$1**");
      md = md.replace(/<em>(.*?)<\/em>/g, "*$1*");
      md = md.replace(/<p>(.*?)<\/p>/g, "$1\n\n");
      md = md.replace(/<br\s*\/?>/g, "\n");
      md = md.replace(/<li>(.*?)<\/li>/g, "- $1\n");
      md = md.replace(/<[^>]+>/g, "");
      md = md.replace(/&nbsp;/g, " ").replace(/&/g, "&");
      const blob = new Blob([md.trim()], { type: "text/markdown" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name + ".md";
      a.click();
    } else {
      const blob = new Blob([html], { type: "text/html" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name + ".html";
      a.click();
    }
  }, [fileName, fileType, content]);

  const handleShareEdited = useCallback(async () => {
    if (!shareCode || shareCode.length !== 4) return;
    setShareLoading(true);
    try {
      const html = canvasHandleRef.current?.getHTML() || content;
      const res = await fetch("/api/share-edited", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          filename: fileName,
          recipientCode: shareCode,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Share failed");
      }
      const data = await res.json();
      setShareResult({
        code: shareCode,
        expiry: data.expiry || "7 days",
        link: data.downloadUrl || data.link || "",
      });
    } catch (err) {
      alert(
        err instanceof Error && err.message
          ? err.message
          : "Failed to share. Make sure the backend is running."
      );
    } finally {
      setShareLoading(false);
    }
  }, [shareCode, fileName, content]);

  const handleOpenFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".docx,.doc,.txt,.md,.rtf,.odt,.html";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onFileSelect(file);
    };
    input.click();
  }, [onFileSelect]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--editor-workspace)",
        color: "var(--text-primary)",
        fontFamily: "'Segoe UI',Arial,sans-serif",
        overflow: "hidden",
      }}
    >
      <EditorHeader
        fileName={fileName}
        isSaving={isSaving}
        onBack={onBack}
        onDownload={() => handleDownload()}
        onOpenFile={handleOpenFile}
        onShareEdited={() => {
          setShareCode(recipientCode || String(Math.floor(1000 + Math.random() * 9000)));
          setShareResult(null);
          setShareModalOpen(true);
        }}
      />

      <MenuBar
        editor={editor}
        onNewDocument={handleStartBlank}
        onOpenFile={handleOpenFile}
        onDownload={(format) => handleDownload(format)}
        onZoom={(delta) => setZoom((z) => Math.min(Math.max(z + delta, 50), 200))}
      />
      <Toolbar editor={editor} showRulers={showRulers} />

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>
        <LeftSidebar
          pages={pages}
          activePage={activePage}
          onPageSelect={(index) => canvasHandleRef.current?.scrollToPage(index)}
          onScrollToEnd={handleScrollToEnd}
        />
        <DocumentCanvas
          ref={canvasHandleRef}
          initialHtml={restoredHtml || initialContent}
          docxBuffer={docxBuffer}
          loadKey={loadKey}
          zoom={zoom}
          showPageBreaks={showPageBreaks}
          spellCheck={spellCheck}
          onPagesChange={setPages}
          onActivePageChange={setActivePage}
          onContentChange={handleContentChange}
        />
        <RightSidebar
          info={{
            fileName,
            fileType: fileType || "DOCX",
            fileSize: fileSize || "—",
            pageCount,
            wordCount: words,
            charCount: chars,
            createdAt: createdAt,
            modifiedAt: lastSaved
              ? lastSaved.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
              : createdAt,
          }}
          showRulers={showRulers}
          showPageBreaks={showPageBreaks}
          spellCheck={spellCheck}
          onToggleRulers={() => setShowRulers(!showRulers)}
          onTogglePageBreaks={() => setShowPageBreaks(!showPageBreaks)}
          onToggleSpellCheck={() => {
            setSpellCheck(!spellCheck);
            adapterRef.current?.setOptions({
              editorProps: { attributes: { spellcheck: String(!spellCheck) } },
            });
          }}
        />
      </div>

      <StatusBar
        pageCount={pageCount}
        activePage={activePage}
        wordCount={words}
        charCount={chars}
        zoom={zoom}
        onZoomChange={setZoom}
        spellCheck={spellCheck}
      />

      {overlayVisible && (
        <UploadOverlay
          onFileSelect={(file) => {
            onFileSelect(file);
            setOverlayVisible(false);
          }}
          onStartBlank={handleStartBlank}
        />
      )}

      {/* Share Edited Copy Modal */}
      {shareModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(32,43,54,0.30)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
          onClick={() => !shareLoading && setShareModalOpen(false)}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 32,
              width: 400,
              maxWidth: "90vw",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!shareResult ? (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                  Share Edited Copy
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
                  Upload your edited version and generate a new share code. The original file is never overwritten.
                </p>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
                  4-digit share code
                </label>
                <input
                  type="text"
                  value={shareCode}
                  onChange={(e) => setShareCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4}
                  placeholder="1234"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    color: "var(--text-primary)",
                    fontSize: 14,
                    fontFamily: "monospace",
                    letterSpacing: 4,
                    outline: "none",
                    marginBottom: 16,
                  }}
                />
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setShareModalOpen(false)}
                    disabled={shareLoading}
                    style={{
                      padding: "8px 16px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      color: "var(--text-secondary)",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShareEdited}
                    disabled={shareLoading || shareCode.length !== 4}
                    style={{
                      padding: "8px 20px",
                      background: shareCode.length === 4 ? "var(--primary-teal)" : "var(--border)",
                      border: "none",
                      borderRadius: 6,
                      color: shareCode.length === 4 ? "#FFFFFF" : "var(--text-muted)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: shareCode.length === 4 ? "pointer" : "not-allowed",
                    }}
                  >
                    {shareLoading ? "Uploading..." : "Share"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#078C91", marginBottom: 12 }}>
                  Shared Successfully
                </h3>
                <div style={{ background: "var(--editor-workspace)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Share Code</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#078C91", fontFamily: "monospace", letterSpacing: 2 }}>
                      {shareResult.code}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Expires</span>
                    <span style={{ fontSize: 12, color: "var(--text-primary)" }}>{shareResult.expiry}</span>
                  </div>
                  {shareResult.link && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Download Link</span>
                      <a href={shareResult.link} target="_blank" rel="noopener" style={{ fontSize: 12, color: "#078C91" }}>
                        Open
                      </a>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShareModalOpen(false)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "var(--primary-teal)",
                    border: "none",
                    borderRadius: 6,
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
