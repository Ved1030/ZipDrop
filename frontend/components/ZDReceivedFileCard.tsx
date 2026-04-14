"use client";

import React, { useEffect, useState, useRef } from "react";
import { openFileInEditor } from "../utils/openFileInEditor";

interface ReceivedFile {
  file_name: string;
  file_url: string;
  file_size?: number;
}

/* ─── Format helpers ─────────────────────────────────── */

function getExt(name: string) {
  return (name.split(".").pop() ?? "").toLowerCase();
}

function getFormatInfo(ext: string): {
  label: string;
  color: string;
  bg: string;
  category: "doc" | "sheet" | "code" | "image" | "pdf" | "other";
} {
  if (["docx", "doc", "txt", "md"].includes(ext))
    return { label: "Document", color: "#00E5C0", bg: "rgba(0,229,192,0.12)", category: "doc" };
  if (["xlsx", "xls", "csv"].includes(ext))
    return { label: "Spreadsheet", color: "#00B4E5", bg: "rgba(0,180,229,0.12)", category: "sheet" };
  if (["py", "js", "ts", "jsx", "tsx", "json", "html", "css", "xml"].includes(ext))
    return { label: "Code", color: "#FFB830", bg: "rgba(255,184,48,0.12)", category: "code" };
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext))
    return { label: "Image", color: "#FF9AAD", bg: "rgba(255,154,173,0.12)", category: "image" };
  if (ext === "pdf")
    return { label: "PDF", color: "#C9A7FF", bg: "rgba(201,167,255,0.12)", category: "pdf" };
  return { label: "File", color: "#5A8A7A", bg: "rgba(90,138,122,0.12)", category: "other" };
}

function formatSize(bytes?: number) {
  if (!bytes) return "Size unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Preview content fetcher ────────────────────────── */

function useFilePreview(file: ReceivedFile) {
  const [preview, setPreview] = useState<string | null>(null);
  const ext = getExt(file.file_name);

  useEffect(() => {
    const textable = ["txt", "md", "csv", "js", "ts", "jsx", "tsx", "py", "json", "html", "css"];
    if (!textable.includes(ext)) return;
    fetch(file.file_url)
      .then((r) => r.text())
      .then((t) => setPreview(t.split("\n").slice(0, 4).join("\n")))
      .catch(() => setPreview(null));
  }, [file.file_url, ext]);

  return preview;
}

/* ─── Forward popover ────────────────────────────────── */

function ForwardPopover({ onClose }: { onClose: () => void }) {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#0D1A16",
        border: "0.5px solid #1A3028",
        borderRadius: "10px",
        padding: "10px 14px",
        zIndex: 20,
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "12px",
        color: "#A0C8BE",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        animation: "fadeInUp 0.18s ease",
      }}
    >
      <span>Forward code:</span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "16px",
          fontWeight: 700,
          color: "#00E5C0",
          letterSpacing: "0.08em",
        }}
      >
        {code}
      </span>
      <button
        onClick={handleCopy}
        style={{
          fontSize: "11px",
          color: copied ? "#00E5C0" : "#00B4E5",
          background: "none",
          border: "none",
          cursor: "pointer",
          textDecoration: "underline",
          fontFamily: "var(--font-sans)",
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <button
        onClick={onClose}
        style={{
          fontSize: "14px",
          color: "#3A5848",
          background: "none",
          border: "none",
          cursor: "pointer",
          lineHeight: 1,
          padding: "0 2px",
        }}
      >
        ×
      </button>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────── */

export default function ZDReceivedFileCard({ file }: { file: ReceivedFile }) {
  const ext = getExt(file.file_name);
  const fmt = getFormatInfo(ext);
  const preview = useFilePreview(file);
  const [editLoading, setEditLoading] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const forwardRef = useRef<HTMLDivElement>(null);

  /* close popover on outside click */
  useEffect(() => {
    if (!showForward) return;
    const handler = (e: MouseEvent) => {
      if (forwardRef.current && !forwardRef.current.contains(e.target as Node)) {
        setShowForward(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showForward]);

  const handleEdit = async () => {
    setEditLoading(true);
    try {
      await openFileInEditor({
        file_name: file.file_name,
        file_url: file.file_url,
        file_size: file.file_size,
      });
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Preview section content ── */
  const renderPreview = () => {
    if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
      return (
        <img
          src={file.file_url}
          alt="preview"
          style={{
            height: "80px",
            width: "100%",
            objectFit: "cover",
            borderRadius: "8px",
            display: "block",
          }}
        />
      );
    }
    if (preview) {
      const isMono = ["json", "js", "ts", "jsx", "tsx", "py", "html", "css"].includes(ext);
      return (
        <div
          style={{
            fontFamily: isMono ? "var(--font-mono)" : "var(--font-sans)",
            fontSize: "11px",
            color: "#5A8A7A",
            lineHeight: 1.7,
            WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)",
            maxHeight: "60px",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {preview}
        </div>
      );
    }
    if (["xlsx", "xls"].includes(ext)) {
      return (
        <p style={{ fontSize: "11px", color: "#5A8A7A" }}>
          Spreadsheet — Open &amp; Edit to view full contents
        </p>
      );
    }
    if (ext === "pdf") {
      return <p style={{ fontSize: "11px", color: "#5A8A7A" }}>PDF document — download to view</p>;
    }
    return null;
  };

  const previewContent = renderPreview();

  return (
    <div
      style={{
        background: "#08120F",
        border: "0.5px solid #1A3028",
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "16px",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* Format badge icon */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "9px",
            background: fmt.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              fontWeight: 700,
              color: fmt.color,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            .{ext || "?"}
          </span>
        </div>

        {/* Name + size */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontWeight: 500,
              color: "#E8FFF9",
              fontSize: "13px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "200px",
            }}
          >
            {file.file_name}
          </p>
          <p style={{ fontSize: "11px", color: "#5A8A7A", marginTop: "2px" }}>
            {fmt.label} · {formatSize(file.file_size)}
          </p>
        </div>

        {/* Format pill */}
        <span
          style={{
            flexShrink: 0,
            padding: "3px 10px",
            borderRadius: "20px",
            background: "#0D2820",
            color: fmt.color,
            border: "0.5px solid #1A3028",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          .{ext.toUpperCase()} · {fmt.label}
        </span>
      </div>

      {/* ── PREVIEW ── */}
      {previewContent && (
        <div
          style={{
            padding: "10px 18px",
            borderTop: "0.5px solid #1A3028",
          }}
        >
          {previewContent}
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div
        style={{
          padding: "12px 18px",
          borderTop: "0.5px solid #1A3028",
          display: "flex",
          gap: "8px",
        }}
      >
        {/* Download */}
        <a
          href={file.file_url}
          target="_blank"
          rel="noopener noreferrer"
          download={file.file_name}
          style={{
            flex: 1,
            padding: "9px",
            borderRadius: "9px",
            background: "#00E5C0",
            color: "#030E10",
            border: "none",
            fontFamily: "var(--font-head)",
            fontWeight: 700,
            fontSize: "12px",
            cursor: "pointer",
            textDecoration: "none",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </a>

        {/* Open & Edit */}
        <button
          onClick={handleEdit}
          disabled={editLoading}
          style={{
            flex: 1,
            padding: "9px",
            borderRadius: "9px",
            background: "transparent",
            color: editLoading ? "#3A5848" : "#A0C8BE",
            border: "0.5px solid #1A3028",
            fontFamily: "var(--font-head)",
            fontWeight: 600,
            fontSize: "12px",
            cursor: editLoading ? "wait" : "pointer",
            transition: "border-color 0.2s, color 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
          }}
          onMouseEnter={(e) => {
            if (!editLoading) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#00E5C0";
              (e.currentTarget as HTMLButtonElement).style.color = "#00E5C0";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#1A3028";
            (e.currentTarget as HTMLButtonElement).style.color = editLoading ? "#3A5848" : "#A0C8BE";
          }}
        >
          ✏ {editLoading ? "Opening…" : "Open & Edit"}
        </button>

        {/* Forward */}
        <div ref={forwardRef} style={{ flex: 1, position: "relative" }}>
          <button
            onClick={() => setShowForward((v) => !v)}
            style={{
              width: "100%",
              padding: "9px",
              borderRadius: "9px",
              background: "transparent",
              color: showForward ? "#00B4E5" : "#A0C8BE",
              border: `0.5px solid ${showForward ? "#00B4E5" : "#1A3028"}`,
              fontFamily: "var(--font-head)",
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
              transition: "border-color 0.2s, color 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
            }}
            onMouseEnter={(e) => {
              if (!showForward) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#00B4E5";
                (e.currentTarget as HTMLButtonElement).style.color = "#00B4E5";
              }
            }}
            onMouseLeave={(e) => {
              if (!showForward) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#1A3028";
                (e.currentTarget as HTMLButtonElement).style.color = "#A0C8BE";
              }
            }}
          >
            ↗ Forward
          </button>

          {showForward && (
            <ForwardPopover onClose={() => setShowForward(false)} />
          )}
        </div>
      </div>
    </div>
  );
}
