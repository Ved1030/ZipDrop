"use client";

import { useState } from "react";

interface ReceivedFile {
  file_name: string;
  file_url: string;
}

/* ─── Icons ─────────────────────────────────── */

function ReceiveArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="8 6 12 10 16 6" />
      <line x1="12" y1="2" x2="12" y2="10" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function DownloadIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function FileIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function ZipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9.5" y1="14" x2="14.5" y2="14" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ─── Code Input ─────────────────────────────── */

function CodeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const digits = value.padEnd(4, " ").split("").slice(0, 4);

  const handleKey = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      (e.currentTarget.previousElementSibling as HTMLInputElement)?.focus();
    }
  };

  const handleChange = (index: number, char: string) => {
    const sanitized = char.replace(/\D/g, "");
    if (!sanitized && char) return; // reject non-digit
    const arr = value.split("").slice(0, 4);
    arr[index] = sanitized.slice(-1);
    const next = arr.join("").slice(0, 4);
    onChange(next);

    if (sanitized && index < 3) {
      const inputs = document.querySelectorAll<HTMLInputElement>(".code-digit-input");
      inputs[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted) onChange(pasted);
  };

  return (
    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }} onPaste={handlePaste}>
      {[0, 1, 2, 3].map((index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[index]?.trim() || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKey(index, e)}
          className="code-digit-input"
          id={`code-digit-${index}`}
          style={{
            width: "58px",
            height: "70px",
            textAlign: "center",
            fontSize: "26px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: digits[index]?.trim() ? "var(--cyan)" : "var(--text-muted)",
            background: digits[index]?.trim()
              ? "rgba(0,245,255,0.08)"
              : "rgba(0,0,0,0.4)",
            border: digits[index]?.trim()
              ? "1px solid rgba(0,245,255,0.5)"
              : "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            outline: "none",
            caretColor: "var(--cyan)",
            transition: "all 0.2s ease",
            boxShadow: digits[index]?.trim() ? "0 0 12px rgba(0,245,255,0.2)" : "none",
            textShadow: digits[index]?.trim() ? "0 0 12px rgba(0,245,255,0.8)" : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Received Text Block ─────────────────────── */

function ReceivedTextBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block animate-slideUp">
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderBottom: "1px solid rgba(0,245,255,0.1)",
      }}>
        <span className="section-label">Received text</span>
        <button
          className="btn-ghost"
          onClick={copy}
          style={{ padding: "5px 10px", gap: "5px" }}
        >
          {copied ? (
            <>
              <CheckIcon size={12} />
              Copied!
            </>
          ) : (
            <>
              <CopyIcon />
              Copy
            </>
          )}
        </button>
      </div>
      <pre>{text}</pre>
    </div>
  );
}

/* ─── Main Component ──────────────────────────── */

export default function ReceiveCard() {
  const [code, setCode] = useState("");
  const [files, setFiles] = useState<ReceivedFile[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  const receiveData = async () => {
    if (code.length < 4) {
      setError("Please enter all 4 digits.");
      return;
    }
    setLoading(true);
    setError("");
    setFetched(false);

    try {
      const res = await fetch(`/api/receive/${code}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();

      if (data.type === "files") {
        setFiles(data.files);
        setText("");
      } else if (data.type === "text") {
        setText(data.text);
        setFiles([]);
      }
      setFetched(true);
    } catch {
      setError("No data found for this code. Double check and retry.");
    } finally {
      setLoading(false);
    }
  };

  const downloadZip = () => {
    const link = document.createElement("a");
    link.href = `/api/download-zip/${code}`;
    link.download = `zipdrop-${code}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 4) receiveData();
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
            <ReceiveArrow />
          </div>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
              Receive
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Enter a code to retrieve
            </p>
          </div>
        </div>
        <span className="badge">
          <span className="badge-dot" />
          Secure
        </span>
      </div>

      {/* DIVIDER */}
      <div className="divider" />

      {/* INSTRUCTIONS */}
      <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
        Enter the <span style={{ color: "var(--cyan-soft)", fontWeight: 600 }}>4-digit code</span> from the sender
      </p>

      {/* CODE INPUT BOXES */}
      <div onKeyDown={handleKeyDown}>
        <CodeInput value={code} onChange={setCode} />
      </div>

      {/* ERROR */}
      {error && (
        <p style={{ fontSize: "12px", color: "#FF6B6B", padding: "8px 12px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "8px", textAlign: "center" }}>
          {error}
        </p>
      )}

      {/* RECEIVE BUTTON */}
      <button
        className="btn-cyan"
        onClick={receiveData}
        disabled={loading || code.length < 4}
        id="receive-button"
        style={{
          padding: "13px 24px",
          width: "100%",
          opacity: loading || code.length < 4 ? 0.5 : 1,
          cursor: loading || code.length < 4 ? "not-allowed" : "pointer",
        }}
      >
        <span className="shimmer" />
        {loading ? (
          <>
            <div className="spinner" />
            Retrieving...
          </>
        ) : (
          <>
            <SearchIcon />
            Receive
          </>
        )}
      </button>

      {/* RESULTS */}
      {fetched && (
        <>
          <div className="divider" />

          {/* TEXT RESULT */}
          {text && <ReceivedTextBlock text={text} />}

          {/* FILE RESULTS */}
          {files.length > 0 && (
            <div className="animate-slideUp" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p className="section-label">
                  {files.length} file{files.length !== 1 ? "s" : ""} received
                </p>
                {files.length > 1 && (
                  <button
                    className="btn-ghost"
                    onClick={downloadZip}
                    style={{ padding: "5px 10px", gap: "5px" }}
                    id="download-zip-button"
                  >
                    <ZipIcon />
                    Download All (ZIP)
                  </button>
                )}
              </div>

              <div className="file-list">
                {files.map((file, index) => (
                  <div key={index} className="file-item animate-fadeInUp" style={{ animationDelay: `${index * 0.06}s` }}>
                    <span style={{ color: "var(--cyan-soft)", flexShrink: 0 }}>
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
                      className="btn-ghost"
                      style={{ padding: "5px 10px", gap: "5px", flexShrink: 0 }}
                      download
                    >
                      <DownloadIcon />
                      Save
                    </a>
                  </div>
                ))}
              </div>

              {files.length > 1 && (
                <button
                  className="btn-cyan"
                  onClick={downloadZip}
                  style={{ padding: "12px 24px", width: "100%" }}
                  id="download-zip-button-bottom"
                >
                  <span className="shimmer" />
                  <ZipIcon />
                  Download All (ZIP)
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}