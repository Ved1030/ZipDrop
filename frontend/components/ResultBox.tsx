"use client";

import { useState } from "react";

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function ResultBox({ link }: { link: string }) {

  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      marginTop: "20px",
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "14px",
      padding: "16px",
      animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
    }}>
      <p style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
        Share Link
      </p>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <div style={{
          flex: 1,
          background: "var(--editor-workspace)",
          borderRadius: "10px",
          padding: "10px 14px",
          overflow: "hidden",
        }}>
          <input
            value={link}
            readOnly
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "13px",
              width: "100%",
              outline: "none",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
        </div>

        <button
          onClick={copyLink}
          className="btn-ghost"
          style={{
            padding: "9px 10px",
            color: copied ? "var(--primary-teal)" : "var(--text-secondary)",
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>

      </div>
    </div>
  );
}