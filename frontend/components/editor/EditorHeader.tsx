"use client";

import { Check } from "lucide-react";

interface EditorHeaderProps {
  fileName: string;
  isSaving: boolean;
  onBack: () => void;
  onDownload: () => void;
  onOpenFile: () => void;
  onShareEdited: () => void;
}

export default function EditorHeader({
  fileName,
  isSaving,
  onBack,
  onDownload,
  onOpenFile,
  onShareEdited,
}: EditorHeaderProps) {
  return (
    <div
      id="topbar"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #e0e0e0",
        height: 52,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 17,
          fontWeight: 700,
          color: "#3c3c3c",
          textDecoration: "none",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="6" fill="#00e5ff22" />
          <path
            d="M8 14l4 4 8-8"
            stroke="#00e5ff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        ZipDrop
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 13,
          color: "#3c3c3c",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: 4,
          transition: "background 0.15s",
        }}
        className="back-btn"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to files
      </button>

      {/* Center */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            background: "#1a73e8",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            color: "#fff",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          W
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#3c3c3c",
              cursor: "pointer",
              padding: "1px 4px",
              borderRadius: 3,
            }}
          >
            {fileName}
          </span>
          <div
            style={{
              fontSize: 11,
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Check size={11} />
            {isSaving ? "Saving\u2026" : "Saved \u2713"}
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            fontSize: 12,
            color: "#5f6368",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
          Auto-saved just now
        </div>

        <button
          onClick={onOpenFile}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 16px",
            borderRadius: 6,
            border: "1px solid #dadce0",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s",
            background: "#f1f3f4",
            color: "#1a73e8",
          }}
          className="top-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Open file
        </button>

        <button
          onClick={onDownload}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 16px",
            borderRadius: 6,
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
            background: "#1a73e8",
            color: "#fff",
          }}
          className="top-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download
        </button>

        <button
          onClick={onShareEdited}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 16px",
            borderRadius: 6,
            border: "1px solid #dadce0",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s",
            background: "#f1f3f4",
            color: "#1a73e8",
          }}
          className="top-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share Edited
        </button>

        <div
          style={{
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f1f3f4",
            border: "1px solid #dadce0",
            borderRadius: 6,
            cursor: "pointer",
            color: "#5f6368",
            fontSize: 18,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </div>
      </div>
    </div>
  );
}
