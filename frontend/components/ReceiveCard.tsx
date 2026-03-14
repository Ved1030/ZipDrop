"use client";

import { useState } from "react";

interface ReceivedFile {
  file_name: string;
  file_url: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "https://zipdrop.onrender.com";

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

    if (code.length < 4) {
      setError("Please enter all 4 digits.");
      return;
    }

    setLoading(true);
    setError("");
    setFetched(false);

    try {

      const res = await fetch(`https://zipdrop.onrender.com/receive/${code}`);

      if (!res.ok) {
        throw new Error("Invalid code");
      }

      const data = await res.json();

      if (data.type === "files") {
        setFiles(data.files);
        setText("");
      }

      if (data.type === "text") {
        setText(data.text);
        setFiles([]);
      }

      setFetched(true);

    } catch (err) {

      console.error(err);
      setError("No data found for this code. Double check and retry.");

    } finally {

      setLoading(false);

    }

  };

  /* DOWNLOAD ZIP */

  const downloadZip = () => {

    const link = document.createElement("a");

    link.href = `https://zipdrop.onrender.com/download-zip/${code}`;
    link.download = `zipdrop-${code}.zip`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 4) {
      receiveFiles();
    }
  };

  return (

    <div className="glass-card">

      <h2>Receive</h2>

      <p>Enter the 4-digit code from sender</p>

      <input
        type="text"
        maxLength={4}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      <button onClick={receiveFiles} disabled={loading || code.length < 4}>
        {loading ? "Retrieving..." : "Receive"}
      </button>

      {/* TEXT RESULT */}

      {text && (

        <div>

          <h3>Received Text</h3>

          <pre>{text}</pre>

        </div>

      )}

      {/* FILE RESULT */}

      {files.length > 0 && (

        <div>

          <h3>{files.length} file(s) received</h3>

          {files.map((file, index) => (

            <div key={index}>

              <FileIcon />

              {file.file_name}

              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <DownloadIcon />
                Download
              </a>

            </div>

          ))}

          {files.length > 1 && (

            <button onClick={downloadZip}>
              Download All (ZIP)
            </button>

          )}

        </div>

      )}

    </div>

  );

}