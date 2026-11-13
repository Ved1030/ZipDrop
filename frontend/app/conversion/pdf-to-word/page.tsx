"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Download, Check, X, Loader2, AlertCircle, Info, HelpCircle } from "lucide-react";
import Navbar from "../../../components/Navbar";

const API = process.env.NEXT_PUBLIC_API_URL || "https://zipdrop.onrender.com";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

type ConversionMode = "editable" | "visual-fidelity";

interface ConversionResult {
  blob: Blob;
  filename: string;
}

export default function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ConversionMode>("editable");
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
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      return "Please select a PDF file.";
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
      formData.append("mode", mode);

      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      const response = await fetch(`${API}/convert/pdf-to-word`, {
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
      const filename = file.name.replace(/\.pdf$/i, ".docx");
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

  const modeDescriptions = {
    editable: "Reconstructs text, tables, and images as editable Word elements. Best for documents you need to edit.",
    "visual-fidelity": "Preserves exact page appearance using positioned elements. Best for complex layouts where visual accuracy matters most.",
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
              <span className="section-label">PDF CONVERSIONS</span>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                PDF to Word
              </h1>
            </div>
          </div>

          {/* Main Card */}
          <div className="glass-card" style={{ padding: "clamp(24px, 3vh, 32px)" }}>
            {/* Mode Selection */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Conversion Mode
              </label>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {(["editable", "visual-fidelity"] as ConversionMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      flex: 1,
                      minWidth: "200px",
                      padding: "16px 20px",
                      borderRadius: "12px",
                      border: `2px solid ${mode === m ? "var(--primary-teal)" : "var(--border)"}`,
                      background: mode === m ? "var(--teal-light)" : "var(--bg-card)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (mode !== m) e.currentTarget.style.borderColor = "var(--primary-teal)";
                    }}
                    onMouseLeave={(e) => {
                      if (mode !== m) e.currentTarget.style.borderColor = "var(--border)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: mode === m ? "var(--primary-teal)" : "var(--text-primary)",
                        textTransform: "capitalize",
                      }}>
                        {m === "editable" ? "Editable Word" : "Visual Fidelity"}
                      </span>
                      {mode === m && <Check size={16} style={{ color: "var(--primary-teal)" }} />}
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                      {modeDescriptions[m]}
                    </p>
                  </button>
                ))}
              </div>
            </div>

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
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect((e.target as HTMLInputElement).files?.[0] ?? null)}
                disabled={converting}
              />
              <FileText size={48} style={{ color: dragActive ? "var(--primary-teal)" : "var(--text-muted)", transition: "color 0.2s ease" }} />
              <p style={{ fontSize: "16px", fontWeight: 500, color: dragActive ? "var(--primary-teal)" : "var(--text-secondary)", transition: "color 0.2s ease" }}>
                {dragActive ? "Release to upload PDF" : "Drag & drop a PDF file"}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>or click to browse (max 50 MB)</p>
            </div>

            {/* Selected File */}
            {file && (
              <div className="animate-slideUp" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "var(--teal-light)", border: "1px solid rgba(7,140,145,0.24)", borderRadius: "12px" }}>
                <FileText size={24} style={{ color: "var(--primary-teal)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {formatBytes(file.size)} • PDF document
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
                  <FileText size={20} />
                  Convert to Word
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
                        {result.filename} • {mode === "editable" ? "Editable" : "Visual Fidelity"} mode
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={downloadResult}
                    className="btn-cyan"
                    style={{ padding: "12px 20px" }}
                  >
                    <Download size={18} />
                    Download DOCX
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
                    Tips for best results
                  </p>
                  <ul style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, paddingLeft: "20px", lineHeight: 1.8 }}>
                    <li>Text-based PDFs convert best in <strong>Editable</strong> mode</li>
                    <li>Scanned/image PDFs work better with <strong>Visual Fidelity</strong> mode</li>
                    <li>Complex layouts (multi-column, tables) may need Visual Fidelity</li>
                    <li>Password-protected PDFs cannot be converted</li>
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