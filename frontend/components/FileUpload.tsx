"use client";

import { useState, useCallback, useRef } from "react";
import { uploadFile } from "../utils/api";

interface UploadedFile {
  file_name: string;
  file_url: string;
}

function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function FileIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [code, setCode] = useState("");
  const [links, setLinks] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: File[]) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const fresh = incoming.filter((f) => !existing.has(f.name + f.size));
      return [...prev, ...fresh];
    });
    setError("");
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      const data = await uploadFile(formData);
      setCode(data.code);
      setLinks(data.files || []);
    } catch {
      setError("Upload failed. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* DRAG & DROP ZONE */}
      <div
        className={`drag-zone ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{ cursor: "pointer" }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e) => addFiles(Array.from(e.target.files || []))}
        />
        <div style={{ color: dragging ? "var(--cyan)" : "var(--text-muted)", transition: "color 0.2s ease" }}>
          <UploadIcon />
        </div>
        <p style={{ fontSize: "14px", fontWeight: 500, color: dragging ? "var(--cyan)" : "var(--text-secondary)", transition: "color 0.2s ease", textAlign: "center" }}>
          {dragging ? "Release to drop files" : "Drag & drop files here"}
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>or click to browse</p>

        {/* Animated glow corners */}
        <span style={{ position: "absolute", top: 8, left: 8, width: 12, height: 12, borderTop: "2px solid var(--cyan)", borderLeft: "2px solid var(--cyan)", borderRadius: "2px 0 0 0", opacity: dragging ? 1 : 0.3, transition: "opacity 0.2s" }} />
        <span style={{ position: "absolute", top: 8, right: 8, width: 12, height: 12, borderTop: "2px solid var(--cyan)", borderRight: "2px solid var(--cyan)", borderRadius: "0 2px 0 0", opacity: dragging ? 1 : 0.3, transition: "opacity 0.2s" }} />
        <span style={{ position: "absolute", bottom: 8, left: 8, width: 12, height: 12, borderBottom: "2px solid var(--cyan)", borderLeft: "2px solid var(--cyan)", borderRadius: "0 0 0 2px", opacity: dragging ? 1 : 0.3, transition: "opacity 0.2s" }} />
        <span style={{ position: "absolute", bottom: 8, right: 8, width: 12, height: 12, borderBottom: "2px solid var(--cyan)", borderRight: "2px solid var(--cyan)", borderRadius: "0 0 2px 0", opacity: dragging ? 1 : 0.3, transition: "opacity 0.2s" }} />
      </div>

      {/* FILE LIST */}
      {files.length > 0 && (
        <div className="animate-slideUp">
          <p className="section-label" style={{ marginBottom: "8px" }}>
            {files.length} file{files.length !== 1 ? "s" : ""} selected
          </p>
          <div className="file-list">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <span style={{ color: "var(--cyan-soft)", flexShrink: 0 }}>
                  <FileIcon />
                </span>
                <span style={{ flex: 1, fontSize: "13px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.name}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}>
                  {formatBytes(file.size)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                  className="btn-ghost"
                  style={{ padding: "4px", borderRadius: "6px", flexShrink: 0 }}
                >
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <p style={{ fontSize: "12px", color: "#FF6B6B", padding: "8px 12px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "8px" }}>
          {error}
        </p>
      )}

      {/* UPLOAD BUTTON */}
      <button
        className="btn-cyan"
        onClick={handleUpload}
        disabled={loading || files.length === 0}
        style={{
          padding: "13px 24px",
          width: "100%",
          opacity: loading || files.length === 0 ? 0.5 : 1,
          cursor: loading || files.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        <span className="shimmer" />
        {loading ? (
          <>
            <div className="spinner" />
            Uploading...
          </>
        ) : (
          <>
            <UploadIcon />
            Upload Files
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
              <CheckIcon size={13} /> Uploaded
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

          {/* Uploaded file list */}
          {links.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <p className="section-label">Uploaded files</p>
              {links.map((file, index) => (
                <div key={index} className="file-item">
                  <span style={{ color: "var(--cyan-soft)" }}><FileIcon /></span>
                  <span style={{ flex: 1, fontSize: "13px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.file_name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}