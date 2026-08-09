"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useEditor } from "@tiptap/react";
import { editorExtensions } from "@/lib/editor/extensions";
import EditorHeader from "./EditorHeader";
import MenuBar from "./MenuBar";
import Toolbar from "./Toolbar";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import DocumentCanvas from "./DocumentCanvas";
import TipTapEditor from "./TipTapEditor";
import StatusBar from "./StatusBar";
import UploadOverlay from "./UploadOverlay";

interface EditorShellProps {
  fileName: string;
  fileType: string;
  fileSize: string;
  initialContent: string;
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

export default function EditorShell({
  fileName,
  fileType,
  fileSize,
  initialContent,
  hasFileUrl,
  recipientCode,
  originalFileUrl,
  onBack,
  onFileSelect,
}: EditorShellProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showRulers, setShowRulers] = useState(true);
  const [showPageBreaks, setShowPageBreaks] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [spellCheck, setSpellCheck] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(!initialContent && !hasFileUrl);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareResult, setShareResult] = useState<{ code: string; expiry?: string; link?: string } | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const editor = useEditor({
    extensions: editorExtensions,
    content: initialContent,
    editorProps: {
      attributes: {
        id: "editor",
        style: `
          outline: none;
          min-height: 864px;
          font-size: 11pt;
          line-height: 1.7;
          color: #000;
          font-family: 'Calibri','Segoe UI',Arial,sans-serif;
          caret-color: #1a73e8;
        `,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      setIsSaving(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
        try {
          localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
            fileName,
            fileType,
            content: html,
            timestamp: Date.now(),
          }));
        } catch {}
      }, 1200);
    },
  });

  // Load from autosave if no initial content
  useEffect(() => {
    if (!initialContent && !content) {
      try {
        const saved = localStorage.getItem(AUTOSAVE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.content && editor) {
            editor.commands.setContent(data.content);
            setContent(data.content);
            setOverlayVisible(false);
          }
        }
      } catch {}
    }
  }, [editor]);

  // Push content into TipTap when initialContent changes (async file loading completes)
  useEffect(() => {
    if (editor && initialContent && initialContent !== content) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
      setContent(initialContent);
      setOverlayVisible(false);
    }
  }, [initialContent, editor]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
    };
  }, []);

  const words = countWords(content);
  const chars = countChars(content);
  const loading = hasFileUrl && !initialContent;

  const handleStartBlank = useCallback(() => {
    setOverlayVisible(false);
    if (editor) editor.commands.setContent("");
    setContent("");
  }, [editor]);

  const handleDownload = useCallback(async (format?: string) => {
    if (!editor) return;
    const html = editor.getHTML();
    console.log("Editor HTML for download:", html);
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
    } else if (fmt === "txt") {
      const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
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
      md = md.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
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
  }, [editor, fileName, fileType]);

  const handleShareEdited = useCallback(async () => {
    if (!editor || !shareCode || shareCode.length !== 4) return;
    setShareLoading(true);
    try {
      const html = editor.getHTML();
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
  }, [editor, shareCode, fileName]);

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
        background: "#f0f0f0",
        color: "#3c3c3c",
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
      <Toolbar editor={editor} />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <LeftSidebar pageCount={1} editor={editor} />
        <DocumentCanvas zoom={zoom}>
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 600,
              }}
            >
              <div className="spinner" />
            </div>
          ) : (
            <TipTapEditor editor={editor} />
          )}
        </DocumentCanvas>
        <RightSidebar
          info={{
            fileName,
            fileType,
            fileSize,
            pageCount: 1,
            wordCount: words,
            charCount: chars,
            createdAt: "Today, " + nowFormatted(),
            modifiedAt: lastSaved
              ? lastSaved.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
              : "Today, " + nowFormatted(),
          }}
          showRulers={showRulers}
          showPageBreaks={showPageBreaks}
          darkMode={darkMode}
          spellCheck={spellCheck}
          onToggleRulers={() => setShowRulers(!showRulers)}
          onTogglePageBreaks={() => setShowPageBreaks(!showPageBreaks)}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onToggleSpellCheck={() => {
            setSpellCheck(!spellCheck);
            if (editor) editor.setOptions({ editorProps: { attributes: { spellcheck: String(!spellCheck) } } });
          }}
        />
      </div>

      <StatusBar
        pageCount={1}
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
            background: "rgba(10,10,22,0.97)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
          onClick={() => !shareLoading && setShareModalOpen(false)}
        >
          <div
            style={{
              background: "#0f0f1a",
              border: "1px solid #2a2a3e",
              borderRadius: 12,
              padding: 32,
              width: 400,
              maxWidth: "90vw",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!shareResult ? (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 6 }}>
                  Share Edited Copy
                </h3>
                <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
                  Upload your edited version and generate a new share code. The original file is never overwritten.
                </p>
                <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 6 }}>
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
                    background: "#1a1a2e",
                    border: "1px solid #2a2a3e",
                    borderRadius: 6,
                    color: "#fff",
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
                      background: "none",
                      border: "1px solid #2a2a3e",
                      borderRadius: 6,
                      color: "#888",
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
                      background: shareCode.length === 4 ? "#00e5ff" : "#2a2a3e",
                      border: "none",
                      borderRadius: 6,
                      color: shareCode.length === 4 ? "#000" : "#666",
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
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#00e5ff", marginBottom: 12 }}>
                  Shared Successfully
                </h3>
                <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#888" }}>Share Code</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#00e5ff", fontFamily: "monospace", letterSpacing: 2 }}>
                      {shareResult.code}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#888" }}>Expires</span>
                    <span style={{ fontSize: 12, color: "#fff" }}>{shareResult.expiry}</span>
                  </div>
                  {shareResult.link && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#888" }}>Download Link</span>
                      <a href={shareResult.link} target="_blank" rel="noopener" style={{ fontSize: 12, color: "#00e5ff" }}>
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
                    background: "#00e5ff",
                    border: "none",
                    borderRadius: 6,
                    color: "#000",
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
