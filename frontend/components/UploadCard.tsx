"use client";

import { useState } from "react";
import FileUpload from "./FileUpload";
import TextShare from "./TextShare";

function UploadTabIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function TextTabIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

function ShareArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

type Tab = "file" | "text";

export default function UploadCard() {
  const [tab, setTab] = useState<Tab>("file");

  return (
    <div
      className="glass-card"
      style={{
        width: "100%",
        maxWidth: "420px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        animation: "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      }}
    >
      {/* CARD HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            background: "var(--cyan-dim)",
            border: "1px solid rgba(0,245,255,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--cyan)",
            boxShadow: "0 0 16px rgba(0,245,255,0.2)",
          }}>
            <ShareArrow />
          </div>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
              Share
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Upload and generate a code
            </p>
          </div>
        </div>
        <span className="badge">
          <span className="badge-dot" />
          Instant
        </span>
      </div>

      {/* DIVIDER */}
      <div className="divider" />

      {/* TABS */}
      <div style={{
        display: "flex",
        gap: "4px",
        background: "rgba(0,0,0,0.35)",
        padding: "4px",
        borderRadius: "10px",
        border: "1px solid var(--border-soft)",
      }}>
        <button
          className={`tab-btn ${tab === "file" ? "active" : ""}`}
          onClick={() => setTab("file")}
          style={{ flex: 1 }}
          id="tab-upload-files"
        >
          <UploadTabIcon />
          Upload Files
        </button>
        <button
          className={`tab-btn ${tab === "text" ? "active" : ""}`}
          onClick={() => setTab("text")}
          style={{ flex: 1 }}
          id="tab-share-text"
        >
          <TextTabIcon />
          Share Text
        </button>
      </div>

      {/* TAB CONTENT */}
      <div key={tab} className="animate-fadeIn">
        {tab === "file" ? <FileUpload /> : <TextShare />}
      </div>
    </div>
  );
}