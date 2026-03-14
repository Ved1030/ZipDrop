"use client";

import { useState } from "react";
import { shareText } from "../utils/api";

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TypeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

export default function TextShare() {
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const MAX_CHARS = 5000;

  const handleShare = async () => {
    if (!text.trim()) {
      setError("Please enter some text to share.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await shareText(text);
      setCode(data.code);
    } catch {
      setError("Share failed. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const charPct = (text.length / MAX_CHARS) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* HEADER HINT */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)" }}>
        <TypeIcon />
        Type or paste any text, code, or notes
      </div>

      {/* TEXTAREA */}
      <div style={{ position: "relative" }}>
        <textarea
          className="neon-textarea"
          rows={7}
          placeholder="Paste your text, code snippet, or any content here..."
          value={text}
          onChange={(e) => { setText(e.target.value.slice(0, MAX_CHARS)); setError(""); }}
          style={{ padding: "14px 16px", minHeight: "160px" }}
        />
        {/* Character count */}
        <div style={{
          position: "absolute",
          bottom: "10px",
          right: "12px",
          fontSize: "11px",
          color: charPct > 90 ? "#FF6B6B" : "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          transition: "color 0.2s",
        }}>
          {text.length}/{MAX_CHARS}
        </div>
      </div>

      {/* CHAR PROGRESS BAR */}
      {text.length > 0 && (
        <div style={{ height: "2px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.min(charPct, 100)}%`,
            background: charPct > 90
              ? "linear-gradient(90deg, #FF6B6B, #FF4444)"
              : "linear-gradient(90deg, var(--cyan), var(--cyan-soft))",
            borderRadius: "2px",
            transition: "width 0.3s ease, background 0.3s ease",
            boxShadow: charPct > 90 ? "0 0 8px rgba(255,107,107,0.5)" : "0 0 8px rgba(0,245,255,0.4)",
          }} />
        </div>
      )}

      {/* ERROR */}
      {error && (
        <p style={{ fontSize: "12px", color: "#FF6B6B", padding: "8px 12px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "8px" }}>
          {error}
        </p>
      )}

      {/* SHARE BUTTON */}
      <button
        className="btn-cyan"
        onClick={handleShare}
        disabled={loading || !text.trim()}
        style={{
          padding: "13px 24px",
          width: "100%",
          opacity: loading || !text.trim() ? 0.5 : 1,
          cursor: loading || !text.trim() ? "not-allowed" : "pointer",
        }}
      >
        <span className="shimmer" />
        {loading ? (
          <>
            <div className="spinner" />
            Sharing...
          </>
        ) : (
          <>
            <SendIcon />
            Share Text
          </>
        )}
      </button>

      {/* GENERATED CODE */}
      {code && (
        <div className="animate-scaleIn" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="divider" />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className="section-label">Your share code</p>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "11px", color: "var(--cyan-soft)" }}>
              <CheckIcon size={13} /> Shared
            </span>
          </div>
          <div className="code-display">
            {code.split("").map((digit, i) => (
              <div key={i} className="code-digit" style={{ animationDelay: `${i * 0.08}s` }}>
                {digit}
              </div>
            ))}
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
            Share this 4-digit code with the recipient
          </p>
        </div>
      )}
    </div>
  );
}