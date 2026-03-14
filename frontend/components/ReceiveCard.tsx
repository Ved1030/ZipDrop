"use client";

import { useState, useRef } from "react";

interface ReceivedFile {
  file_name: string;
  file_url: string;
}

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://zipdrop-backend-production.up.railway.app";

/* ─── Icons ─────────────────────────────────── */

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function DownloadIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function FileIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function ZipIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────── */

export default function ReceiveCard() {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [files, setFiles] = useState<ReceivedFile[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");

  /* ── DIGIT INPUT HANDLERS ── */

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError("");
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && code.length === 4) receiveFiles();
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length > 0) {
      const newDigits = ["", "", "", ""];
      for (let i = 0; i < pasted.length && i < 4; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 3);
      inputRefs.current[nextFocus]?.focus();
    }
    e.preventDefault();
  };

  /* ── RECEIVE DATA ── */

  const receiveFiles = async () => {
    if (code.length !== 4) {
      setError("Please fill in all 4 digits.");
      return;
    }
    setLoading(true);
    setError("");
    setFetched(false);
    try {
      const res = await fetch(`${API}/receive/${code}`);
      if (!res.ok) throw new Error("Invalid code");
      const data = await res.json();
      if (data.type === "files") { setFiles(data.files); setText(""); }
      else if (data.type === "text") { setText(data.text); setFiles([]); }
      setFetched(true);
    } catch (err) {
      console.error(err);
      setError("No data found for this code. Double-check and retry.");
    } finally {
      setLoading(false);
    }
  };

  /* ── ZIP DOWNLOAD ── */

  const downloadZip = () => {
    const link = document.createElement("a");
    link.href = `${API}/download-zip/${code}`;
    link.download = `zipdrop-${code}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        animation: "fadeInUp 0.6s 0.15s cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
    >
      {/* ── HEADER ── */}
      <p style={{
        fontSize: "13px",
        color: "var(--text-secondary)",
        textAlign: "center",
        lineHeight: 1.6,
      }}>
        Enter the{" "}
        <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>
          4-digit code
        </strong>{" "}
        from the sender
      </p>

      {/* ── GLASSMORPHISM DIGIT BOXES ── */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        {digits.map((digit, i) => {
          const isFocused = focusedIndex === i;
          const isFilled  = digit !== "";
          return (
            /* Wrapper: visible glass box */
            <div
              key={i}
              onClick={() => inputRefs.current[i]?.focus()}
              style={{
                position: "relative",
                width: "68px",
                height: "76px",
                borderRadius: "14px",
                background: isFilled
                  ? "rgba(0, 245, 255, 0.10)"
                  : "rgba(0, 0, 0, 0.45)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: isFocused
                  ? "1.5px solid rgba(0, 245, 255, 0.75)"
                  : isFilled
                  ? "1.5px solid rgba(0, 245, 255, 0.45)"
                  : "1.5px solid rgba(0, 245, 255, 0.18)",
                boxShadow: isFocused
                  ? "0 0 0 3px rgba(0,245,255,0.10), 0 0 24px rgba(0,245,255,0.30), inset 0 0 16px rgba(0,245,255,0.06)"
                  : isFilled
                  ? "0 0 16px rgba(0,245,255,0.18), inset 0 0 10px rgba(0,245,255,0.05)"
                  : "inset 0 1px 0 rgba(255,255,255,0.04)",
                cursor: "text",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {/* Subtle top-gloss shine */}
              <span style={{
                position: "absolute",
                top: 0, left: "10%",
                width: "80%", height: "40%",
                background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)",
                borderRadius: "0 0 50% 50%",
                pointerEvents: "none",
              }} />

              {/* Actual invisible input — sits on top */}
              <input
                ref={(el) => { inputRefs.current[i] = el; }}
                id={`receive-digit-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleDigitKeyDown(i, e)}
                onPaste={handleDigitPaste}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setFocusedIndex(null)}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "text",
                  zIndex: 2,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                }}
              />

              {/* Visible digit display */}
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "34px",
                fontWeight: 700,
                color: isFilled ? "var(--cyan)" : "rgba(0,245,255,0.2)",
                textShadow: isFilled
                  ? "0 0 20px rgba(0,245,255,0.95), 0 0 40px rgba(0,245,255,0.4)"
                  : "none",
                letterSpacing: 0,
                userSelect: "none",
                pointerEvents: "none",
                position: "relative",
                zIndex: 1,
                transition: "all 0.15s ease",
                animation: isFilled ? "codeReveal 0.25s ease forwards" : "none",
              }}>
                {isFilled ? digit : (isFocused ? "┃" : "—")}
              </span>
            </div>
          );
        })}
      </div>

      {/* ERROR */}
      {error && (
        <p style={{
          fontSize: "12px",
          color: "#ff6b6b",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px",
          padding: "8px 12px",
          background: "rgba(255,107,107,0.07)",
          border: "1px solid rgba(255,107,107,0.2)",
          borderRadius: "8px",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}

      {/* ── RECEIVE BUTTON ── */}
      <button
        id="btn-receive"
        className="btn-cyan"
        onClick={receiveFiles}
        disabled={loading || code.length !== 4}
        style={{
          width: "100%",
          padding: "14px",
          fontSize: "15px",
          fontWeight: 700,
          letterSpacing: "0.04em",
          opacity: loading || code.length !== 4 ? 0.45 : 1,
          cursor: loading || code.length !== 4 ? "not-allowed" : "pointer",
          background: "linear-gradient(135deg, rgba(0,245,255,0.2) 0%, rgba(34,211,238,0.13) 100%)",
        }}
      >
        <span className="shimmer" />
        {loading ? (
          <>
            <span className="spinner" />
            Retrieving…
          </>
        ) : (
          <>
            <SearchIcon />
            Receive
          </>
        )}
      </button>

      {/* ── TEXT RESULT ── */}
      {fetched && text && (
        <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="divider" />
          <span className="section-label">Received text</span>
          <div className="code-block">
            <pre>{text}</pre>
          </div>
        </div>
      )}

      {/* ── FILE RESULTS ── */}
      {fetched && files.length > 0 && (
        <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="divider" />

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="section-label">
              {files.length} file{files.length !== 1 ? "s" : ""} received
            </span>
            {files.length > 1 && (
              <button
                id="btn-download-zip-top"
                className="btn-ghost"
                onClick={downloadZip}
                style={{ padding: "4px 10px" }}
              >
                <ZipIcon />
                Download All (ZIP)
              </button>
            )}
          </div>

          {/* File list */}
          <div className="file-list">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <span style={{ color: "var(--cyan)", flexShrink: 0 }}>
                  <FileIcon />
                </span>
                <span style={{
                  flex: 1,
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {file.file_name}
                </span>
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="btn-ghost"
                  style={{ padding: "4px 10px", flexShrink: 0, textDecoration: "none" }}
                >
                  <DownloadIcon size={12} />
                  Save
                </a>
              </div>
            ))}
          </div>

          {/* Full-width Download All ZIP button */}
          {files.length > 1 && (
            <button
              id="btn-download-zip-bottom"
              className="btn-cyan"
              onClick={downloadZip}
              style={{
                width: "100%",
                padding: "13px",
                fontSize: "14px",
                fontWeight: 600,
                background: "linear-gradient(135deg, rgba(0,245,255,0.18) 0%, rgba(34,211,238,0.12) 100%)",
              }}
            >
              <span className="shimmer" />
              <ZipIcon />
              Download All (ZIP)
            </button>
          )}
        </div>
      )}
    </div>
  );
}