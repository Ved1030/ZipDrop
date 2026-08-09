"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const EditorShell = dynamic(
  () => import("@/components/editor/EditorShell"),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#1a1a2e" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ width: 40, height: 40, border: "2px solid #00e5ff22", borderTop: "2px solid #00e5ff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 13, color: "#888" }}>Loading editor...</p>
        </div>
      </div>
    ),
  }
);

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function simpleMarkdownToHtml(md: string): string {
  let html = md;
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  html = html.replace(/^---$/gm, "<hr />");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*<\/li>)/g, "<ul>$1</ul>");
  html = html.replace(/\n{2,}/g, "</p><p>");
  html = "<p>" + html + "</p>";
  html = html.replace(/<p><\/p>/g, "");
  html = html.replace(/<p>(<h[1-6]>)/g, "$1");
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, "$1");
  html = html.replace(/<p>(<ul>)/g, "$1");
  html = html.replace(/(<\/ul>)<\/p>/g, "$1");
  html = html.replace(/<p>(<blockquote>)/g, "$1");
  html = html.replace(/(<\/blockquote>)<\/p>/g, "$1");
  html = html.replace(/<p>(<pre>)/g, "$1");
  html = html.replace(/(<\/pre>)<\/p>/g, "$1");
  html = html.replace(/<p>(<hr \/>)/g, "$1");
  return html;
}

async function parseDocxClientSide(arrayBuffer: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await (mammoth as any).convertToHtml({
    arrayBuffer,
    convertImage: (mammoth as any).images.imgElement((image: any) =>
      image.read("base64").then((data: string) => ({
        src: `data:${image.contentType};base64,${data}`,
      }))
    ),
  });
  return result.value || "<p>No content found.</p>";
}

function EditorPageInner() {
  const searchParams = useSearchParams();
  const fileUrl = searchParams.get("fileUrl") || "";
  const filename = searchParams.get("filename") || "";
  const recipientCode = searchParams.get("code") || "";

  const hasFileUrl = !!fileUrl;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState(filename || "Untitled document");
  const [fileType, setFileType] = useState("docx");
  const [fileSize, setFileSize] = useState("\u2014");
  const [content, setContent] = useState("");

  const processFile = useCallback(async (url: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      const ext = getExtension(name);
      setFileType(ext);
      setFileName(name);

      console.log("[editor] Fetching file:", url);
      const response = await fetch(url);
      console.log("[editor] Response status:", response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const contentLength = response.headers.get("content-length");
      if (contentLength) setFileSize(formatFileSize(Number(contentLength)));

      if (ext === "txt") {
        const text = await response.text();
        console.log("[editor] TXT loaded:", text.length, "chars");
        setContent(text.split("\n").map((l) => `<p>${l || "&nbsp;"}</p>`).join(""));
      } else if (ext === "md" || ext === "markdown") {
        const text = await response.text();
        console.log("[editor] Markdown loaded:", text.length, "chars");
        setContent(simpleMarkdownToHtml(text));
      } else if (ext === "html") {
        const text = await response.text();
        console.log("[editor] HTML loaded:", text.length, "chars");
        setContent(text);
      } else if (ext === "docx" || ext === "doc") {
        console.log("[editor] DOCX: downloading binary...");
        const arrayBuffer = await response.arrayBuffer();
        console.log("[editor] DOCX: downloaded", arrayBuffer.byteLength, "bytes");

        console.log("[editor] DOCX: starting mammoth conversion...");
        const html = await parseDocxClientSide(arrayBuffer);
        console.log("[editor] DOCX: conversion complete,", html.length, "chars of HTML");
        setContent(html);
      } else {
        const text = await response.text();
        console.log("[editor] Unknown format, loading as text:", text.length, "chars");
        setContent(text.split("\n").map((l) => `<p>${l || "&nbsp;"}</p>`).join(""));
      }
    } catch (err: any) {
      console.error("[editor] Error:", err.message);
      setError(err.message || "Failed to load file");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fileUrl && filename) {
      processFile(fileUrl, filename);
    } else if (!fileUrl) {
      setLoading(false);
    }
  }, [fileUrl, filename, processFile]);

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#1a1a2e", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: "#ff000015", border: "1px solid #ff000033", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <p style={{ color: "#ff4444", fontSize: 15, fontWeight: 600 }}>Unable to open this document</p>
        <p style={{ color: "#888", fontSize: 13, maxWidth: 400, textAlign: "center" }}>{error}</p>
        <a href="/" style={{ color: "#00e5ff", fontSize: 13, marginTop: 8 }}>Go to ZipDrop</a>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#1a1a2e" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ width: 40, height: 40, border: "2px solid #00e5ff22", borderTop: "2px solid #00e5ff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 13, color: "#888" }}>Opening document...</p>
        </div>
      </div>
    );
  }

  return (
    <EditorShell
      fileName={fileName}
      fileType={fileType}
      fileSize={fileSize}
      initialContent={content}
      hasFileUrl={hasFileUrl}
      recipientCode={recipientCode}
      originalFileUrl={fileUrl}
      onBack={() => (window.history.length > 1 ? window.history.back() : (window.location.href = "/"))}
      onFileSelect={(file) => {
        const url = URL.createObjectURL(file);
        processFile(url, file.name);
      }}
    />
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#1a1a2e" }}>
          <div style={{ width: 40, height: 40, border: "2px solid #00e5ff22", borderTop: "2px solid #00e5ff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      }
    >
      <EditorPageInner />
    </Suspense>
  );
}
