"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Download, Check, X, Loader2, AlertCircle, Info } from "lucide-react";
import Navbar from "../../../components/Navbar";

const API = process.env.NEXT_PUBLIC_API_URL || "https://zipdrop.onrender.com";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

interface ConversionResult {
  blob: Blob;
  filename: string;
}

export default function HtmlToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageSize, setPageSize] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");
  const [marginTop, setMarginTop] = useState(20);
  const [marginBottom, setMarginBottom] = useState(20);
  const [marginLeft, setMarginLeft] = useState(20);
  const [marginRight, setMarginRight] = useState(20);
  const [printBackground, setPrintBackground] = useState(true);
  const [scale, setScale] = useState(1.0);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (f: File) => {
    const validTypes = ["text/html", "application/xhtml+xml"];
    const validExts = [".html", ".htm"];
    if (!validTypes.includes(f.type) && !validExts.some(ext => f.name.toLowerCase().endsWith(ext))) {
      return "Please select an HTML file (HTML or HTM).";
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
      formData.append("marginTop", marginTop.toString());
      formData.append("marginBottom", marginBottom.toString());
      formData.append("marginLeft", marginLeft.toString());
      formData.append("marginRight", marginRight.toString());
      formData.append("printBackground", printBackground.toString());
      formData.append("scale", scale.toString());

      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      const response = await fetch(`${API}/convert/html-to-pdf`, {
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
      const filename = file.name.replace(/\.(html|htm)$/i, ".pdf");
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
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg-main)", padding: "clamp(24px, 4vh, 48px) 24px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link href="/conversion" style={{ textDecoration: "none", color: "var(--text-secondary)", padding: "8px" }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <span className="section-label">OTHER CONVERSIONS</span>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                HTML to PDF
              </h1>
            </div>
          </div>

          {/* Main Card */}
          <div className="glass-card" style={{ padding: "clamp(24px, 3vh, 32px)" }}>
            {/* Options Toggle */}
            <button
              onClick={() => setShowOptions(!showOptions)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--editor-workspace)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                Output Options
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {showOptions ? "Hide" : "Show"}
              </span>
            </button>

            {/* Options Panel */}
            {showOptions && (
              <div style={{ marginBottom: "24px", padding: "20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Page Size
                    </label>
                    <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} disabled={converting} className="neon-input" style={{ padding: "10px 12px", fontSize: "13px" }}>
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
                    <select value={orientation} onChange={(e) => setOrientation(e.target.value)} disabled={converting} className="neon-input" style={{ padding: "10px 12px", fontSize: "13px" }}>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Scale
                    </label>
                    <input type="number" value={scale} onChange={(e) => setScale(Math.max(0.1, Math.min(2, parseFloat(e.target.value) || 1)))} min="0.1" max="2" step="0.1" disabled={converting} className="neon-input" style={{ padding: "10px 12px", fontSize: "13px" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
                      <input type="checkbox" checked={printBackground} onChange={(e) => setPrintBackground(e.target.checked)} disabled={converting} style={{ width: "18px", height: "18px", accentColor: "var(--primary-teal)" }} />
                      Print Background
                    </label>
                  </div>
                </div>
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Margins (mm)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>Top</label>
                      <input type="number" value={marginTop} onChange={(e) => setMarginTop(Math.max(0, parseFloat(e.target.value) || 0))} step="1" min="0" disabled={converting} className="neon-input" style={{ padding: "8px 10px", fontSize: "12px" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>Bottom</label>
                      <input type="number" value={marginBottom} onChange={(e) => setMarginBottom(Math.max(0, parseFloat(e.target.value) || 0))} step="1" min="0" disabled={converting} className="neon-input" style={{ padding: "8px 10px", fontSize: "12px" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>Left</label>
                      <input type="number" value={marginLeft} onChange={(e) => setMarginLeft(Math.max(0, parseFloat(e.target.value) || 0))} step="1" min="0" disabled={converting} className="neon-input" style={{ padding: "8px 10px", fontSize: "12px" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>Right</label>
                      <input type="number" value={marginRight} onChange={(e) => setMarginRight(Math.max(0, parseFloat(e.target.value) || 0))} step="1" min="0" disabled={converting} className="neon-input" style={{ padding: "8px 10px", fontSize: "12px" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Zone */}
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
                accept=".html,.htm"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect((e.target as HTMLInputElement).files?.[0] ?? null)}
                disabled={converting}
              />
              <Globe size={48} style={{ color: dragActive ? "var(--primary-teal)" : "var(--text-muted)", transition: "color 0.2s ease" }} />
              <p style={{ fontSize: "16px", fontWeight: 500, color: dragActive ? "var(--primary-teal)" : "var(--text-secondary)", transition: "color 0.2s ease" }}>
                {dragActive ? "Release to upload HTML file" : "Drag & drop an HTML file"}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>or click to browse (max 25 MB)</p>
            </div>

            {/* Selected File */}
            {file && (
              <div className="animate-slideUp" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "var(--teal-light)", border: "1px solid rgba(7,140,145,0.24)", borderRadius: "12px" }}>
                <Globe size={24} style={{ color: "var(--primary-teal)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {formatBytes(file.size)} • HTML file
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

            {/* Error */}
            {error && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 16px", background: "var(--danger-light)", border: "1px solid rgba(214,69,69,0.20)", borderRadius: "10px" }}>
                <AlertCircle size={20} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "1px" }} />
                <p style={{ fontSize: "13px", color: "var(--danger)", margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Convert Button */}
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
                  <Globe size={20} />
                  Convert to PDF
                </>
              )}
            </button>

            {/* Result */}
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
                        {result.filename}
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

            {/* Info */}
            <div style={{ marginTop: "24px", padding: "16px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <Info size={18} style={{ color: "var(--primary-teal)", flexShrink: 0, marginTop: "1px" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px" }}>
                    Features
                  </p>
                  <ul style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, paddingLeft: "20px", lineHeight: 1.8 }}>
                    <li>Full CSS support including Flexbox, Grid, and media queries</li>
                    <li>Embedded images and base64 data URIs supported</li>
                    <li>Relative asset paths resolved automatically</li>
                    <li>JavaScript disabled for security</li>
                    <li>Print-specific CSS (@page, @media print) respected</li>
                    <li>Page breaks and margins configurable</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Limitations */}
            <div style={{ marginTop: "16px", padding: "16px", background: "var(--warning-light)", border: "1px solid rgba(217,147,8,0.20)", borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <AlertCircle size={18} style={{ color: "var(--warning)", flexShrink: 0, marginTop: "1px" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px" }}>
                    Limitations & Security
                  </p>
                  <ul style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, paddingLeft: "20px", lineHeight: 1.8 }}>
                    <li>External resources (fonts, images, CSS) not loaded for security</li>
                    <li>JavaScript execution disabled - no dynamic content rendering</li>
                    <li>Forms, inputs, and interactive elements not functional</li>
                    <li>Local file access and network requests blocked</li>
                    <li>Very large or complex HTML may timeout (3 min limit)</li>
                    <li>Maximum file size: 25 MB</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
            Files are processed securely and deleted after conversion. No permanent storage.
          </p>
        </div>
      </div>
    </>
  );
}