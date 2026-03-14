"use client";

import { useState } from "react";

interface ReceivedFile {
  file_name: string;
  file_url: string;
}

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://zipdrop-backend-production.up.railway.app";

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
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────── */

export default function ReceiveCard() {
  const [code, setCode] = useState("");
  const [files, setFiles] = useState<ReceivedFile[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);

  /* RECEIVE DATA */

  const receiveFiles = async () => {
    if (code.length !== 4) {
      setError("Please enter a valid 4-digit code.");
      return;
    }

    setLoading(true);
    setError("");
    setFetched(false);

    try {
      const res = await fetch(`${API}/receive/${code}`);

      if (!res.ok) throw new Error("Invalid code");

      const data = await res.json();

      if (data.type === "files") {
        setFiles(data.files);
        setText("");
      } else if (data.type === "text") {
        setText(data.text);
        setFiles([]);
      }

      setFetched(true);
    } catch (err) {
      console.error(err);
      setError("No data found for this code. Double-check and retry.");
    } finally {
      setLoading(false);
    }
  };

  /* ZIP DOWNLOAD */

  const downloadZip = () => {
    const link = document.createElement("a");
    link.href = `${API}/download-zip/${code}`;
    link.download = `zipdrop-${code}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 4) receiveFiles();
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
              Enter a code to retrieve files
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

      {/* CODE INPUT */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span className="section-label">4-digit code</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            id="receive-code-input"
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="e.g. 4821"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={handleKeyDown}
            className="neon-input"
            style={{ padding: "10px 14px", flex: 1, letterSpacing: "0.3em", fontSize: "18px", fontFamily: "var(--font-mono)", fontWeight: 600 }}
          />
          <button
            id="btn-receive"
            className="btn-cyan"
            onClick={receiveFiles}
            disabled={loading || code.length !== 4}
            style={{
              padding: "10px 20px",
              flexShrink: 0,
              opacity: loading || code.length !== 4 ? 0.5 : 1,
              cursor: loading || code.length !== 4 ? "not-allowed" : "pointer",
            }}
          >
            <span className="shimmer" />
            {loading ? (
              <>
                <span className="spinner" />
                Fetching…
              </>
            ) : (
              <>
                <ReceiveArrow />
                Receive
              </>
            )}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <p style={{
            fontSize: "12px",
            color: "#ff6b6b",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}
      </div>

      {/* TEXT RESULT */}
      {fetched && text && (
        <div
          className="animate-fadeIn"
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <div className="divider" />
          <span className="section-label">Received text</span>
          <div className="code-block">
            <pre>{text}</pre>
          </div>
        </div>
      )}

      {/* FILE RESULT */}
      {fetched && files.length > 0 && (
        <div
          className="animate-fadeIn"
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <div className="divider" />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="section-label">
              {files.length} file{files.length !== 1 ? "s" : ""} received
            </span>
            {files.length > 1 && (
              <button
                id="btn-download-zip"
                className="btn-ghost"
                onClick={downloadZip}
                style={{ padding: "4px 12px" }}
              >
                <ZipIcon />
                Download ZIP
              </button>
            )}
          </div>

          <div className="file-list">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <span style={{ color: "var(--cyan)", flexShrink: 0 }}>
                  <FileIcon size={16} />
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.file_name}
                </span>
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="btn-ghost"
                  style={{ padding: "4px 10px", flexShrink: 0 }}
                >
                  <DownloadIcon size={12} />
                  Save
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}