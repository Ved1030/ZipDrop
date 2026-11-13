"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Image, Download, Check, X, Loader2, AlertCircle, Info, FileText } from "lucide-react";
import Navbar from "../../../components/Navbar";

const API = process.env.NEXT_PUBLIC_API_URL || "https://zipdrop.onrender.com";
const MAX_FILE_SIZE = 25 * 1024 * 1024;

interface ConversionResult {
  blob: Blob;
  filename: string;
}

const TOOL_NAME = "PNG to PDF";
const TOOL_DESCRIPTION = "Convert PNG images to PDF documents";
const CATEGORY = "IMAGE CONVERSIONS";
const ACCEPT = ".png";
const FILE_TYPE_LABEL = "PNG image";
const FROM_EXT = "png";

export default function PngToPdfPage() {
  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg-main)", padding: "clamp(24px, 4vh, 48px) 24px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
  const [file, setFile] = useState<File | null>(null);
  const [pageSize, setPageSize] = useState("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState(0);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (f: File) => {
    const validTypes = ["image/png"];
    const validExts = [".png"];
    if (!validTypes.includes(f.type) && !validExts.some(ext => f.name.toLowerCase().endsWith(ext))) {
      return "Please select a PNG image.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const handleFileSelect = (f: File | null) => {
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const convert = async () => {
    if (!file) return;
    setConverting(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pageSize", pageSize);
      formData.append("orientation", orientation);
      formData.append("margin", margin.toString());

      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 20, 90));
      }, 300);

      const response = await fetch(`${API}/convert/png-to-pdf`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Conversion failed: ${response.status}`);
      }

      const blob = await response.blob();
      const filename = file.name.replace(/\.png$/i, ".pdf");
      setResult({ blob, filename });
    } catch (err: any) {
      setError(err.message || "Conversion failed. Please try again.");
    } finally {
      setConverting(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", padding: "clamp(24px, 4vh, 48px) 24px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/conversion" style={{ textDecoration: "none", color: "var(--text-secondary)", padding: "8px" }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="section-label">{CATEGORY}</span>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
              {TOOL_NAME}
            </h1>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "clamp(24px, 3vh, 32px)" }}>
          <div style={{ marginBottom: "24px", padding: "20px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <FileText size={18} style={{ color: "var(--primary-teal)" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                PDF Options
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Page Size
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                  disabled={converting}
                  className="neon-input"
                  style={{ padding: "10px 12px", fontSize: "13px" }}
                >
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="Letter">Letter (8.5 × 11 in)</option>
                  <option value="Legal">Legal (8.5 × 14 in)</option>
                  <option value="A3">A3 (297 × 420 mm)</option>
                  <option value="A5">A5 (148 × 210 mm)</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Orientation
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")}
                  disabled={converting}
                  className="neon-input"
                  style={{ padding: "10px 12px", fontSize: "13px" }}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Margin (points)
                </label>
                <input
                  type="number"
                  value={margin}
                  onChange={(e) => setMargin(Math.max(0, parseFloat(e.target.value) || 0))}
                  min="0"
                  max="144"
                  step="1"
                  disabled={converting}
                  className="neon-input"
                  style={{ padding: "10px 12px", fontSize: "13px" }}
                />
              </div>
            </div>
          </div>

          <div
            className={`drag-zone ${dragActive ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !converting && inputRef.current?.click()}
            style={{ cursor: converting ? "not-allowed" : "pointer", opacity: converting ? 0.6 : 1 }}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              style={{ display: "none" }}
              onChange={(e) => handleFileSelect((e.target as HTMLInputElement).files?.[0] ?? null)}
              disabled={converting}
            />
            <Image size={48} style={{ color: dragActive ? "var(--primary-teal)" : "var(--text-muted)", transition: "color 0.2s ease" }} />
            <p style={{ fontSize: "16px", fontWeight: 500, color: dragActive ? "var(--primary-teal)" : "var(--text-secondary)", transition: "color 0.2s ease" }}>
              {dragActive ? "Release to upload PNG" : "Drag & drop a PNG image"}
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>or click to browse (max 25 MB)</p>
          </div>

          {file && (
            <div className="animate-slideUp" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "var(--teal-light)", border: "1px solid rgba(7,140,145,0.24)", borderRadius: "12px" }}>
              <Image size={24} style={{ color: "var(--primary-teal)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {file.name}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {formatBytes(file.size)} • {FILE_TYPE_LABEL}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); reset(); }}
                style={{ padding: "8px", borderRadius: "8px", background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {error && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 16px", background: "var(--danger-light)", border: "1px solid rgba(214,69,69,0.20)", borderRadius: "10px" }}>
              <AlertCircle size={20} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "13px", color: "var(--danger)", margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            onClick={convert}
            disabled={converting || !file}
            className="btn-cyan"
            style={{
              width: "100%",
              padding: "16px 24px",
              fontSize: "15px",
              fontWeight: 700,
              opacity: converting || !file ? 0.5 : 1,
              cursor: converting || !file ? "not-allowed" : "pointer",
            }}
          >
            <span className="shimmer" />
            {converting ? (
              <>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                Converting... {progress}%
              </>
            ) : (
              <>
                <FileText size={20} />
                Convert to PDF
              </>
            )}
          </button>

          {result && (
            <div className="animate-scaleIn" style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
              <div className="divider" />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "10px", background: "var(--teal-light)", border: "1px solid rgba(7,140,145,0.24)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-teal)" }}>
                    <Check size={20} />
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                      Conversion complete
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                      {result.filename} • {pageSize} • {orientation}
                    </p>
                  </div>
                </div>
                <button
                  onClick={downloadResult}
                  className="btn-cyan"
                  style={{ padding: "12px 20px" }}
                >
                  <Download size={18} />
                  Download PDF
                </button>
              </div>
              <button
                onClick={reset}
                className="btn-ghost"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <ArrowLeft size={16} />
                Convert another file
              </button>
            </div>
          )}

          <div style={{ marginTop: "24px", padding: "16px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "12px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <Info size={18} style={{ color: "var(--primary-teal)", flexShrink: 0, marginTop: "1px" }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px" }}>
                  Notes
                </p>
                <ul style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, paddingLeft: "20px", lineHeight: 1.8 }}>
                  <li>Preserves PNG transparency in PDF</li>
                  <li>Image is fitted to page with selected margins</li>
                  <li>For multiple images, use <strong>Images to PDF</strong> tool</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
          Files are processed securely and deleted after conversion. No permanent storage.
        </p>
      </div>
    </div>
    </>
  );
}