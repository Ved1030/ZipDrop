"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Table, Download, Check, X, Loader2, AlertCircle, Info, FileText } from "lucide-react";
import Navbar from "../../../components/Navbar";

const API = process.env.NEXT_PUBLIC_API_URL || "https://zipdrop.onrender.com";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface ConversionResult {
  blob: Blob;
  filename: string;
}

interface ParsedRow {
  cells: string[];
}

export default function CsvToExcelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [encoding, setEncoding] = useState("auto");
  const [delimiter, setDelimiter] = useState("auto");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [hasHeader, setHasHeader] = useState(true);
  const [skipRows, setSkipRows] = useState(0);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (f: File) => {
    const validTypes = ["text/csv", "text/plain", "application/csv"];
    const validExts = [".csv"];
    if (!validTypes.includes(f.type) && !validExts.some(ext => f.name.toLowerCase().endsWith(ext))) {
      return "Please select a CSV file.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const parsePreview = async (f: File) => {
    try {
      const text = await f.text();
      const lines = text.split('\n').slice(0, 10).filter(l => l.trim());
      if (lines.length === 0) return;
      
      // Try to detect delimiter
      const delims = [',', ';', '\t', '|', ':'];
      let bestDelim = ',';
      let bestScore = 0;
      
      for (const d of delims) {
        const counts = lines.map(l => l.split(d).length);
        const consistent = counts.every(c => c === counts[0]) && counts[0] > 1;
        if (consistent && counts[0] > bestScore) {
          bestScore = counts[0];
          bestDelim = d;
        }
      }
      
      if (delimiter === 'auto') {
        setDelimiter(bestDelim);
      }
      
      const rows: ParsedRow[] = lines.map(line => ({
        cells: line.split(delimiter === 'auto' ? bestDelim : delimiter)
      }));
      setPreview(rows);
    } catch {
      setPreview([]);
    }
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
    setPreview([]);
    parsePreview(f);
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
      formData.append("encoding", encoding);
      formData.append("delimiter", delimiter);
      formData.append("sheetName", sheetName);
      formData.append("hasHeader", hasHeader.toString());
      formData.append("skipRows", skipRows.toString());

      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      const response = await fetch(`${API}/convert/csv-to-excel`, {
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
      const filename = file.name.replace(/\.csv$/i, ".xlsx");
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
    setPreview([]);
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
                CSV to Excel
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
                Conversion Options
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
                      Encoding
                    </label>
                    <select value={encoding} onChange={(e) => setEncoding(e.target.value)} disabled={converting} className="neon-input" style={{ padding: "10px 12px", fontSize: "13px" }}>
                      <option value="auto">Auto-detect</option>
                      <option value="utf-8">UTF-8</option>
                      <option value="utf-8-sig">UTF-8 with BOM</option>
                      <option value="utf-16">UTF-16</option>
                      <option value="cp1252">Windows-1252</option>
                      <option value="latin1">ISO-8859-1</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Delimiter
                    </label>
                    <select value={delimiter} onChange={(e) => setDelimiter(e.target.value)} disabled={converting} className="neon-input" style={{ padding: "10px 12px", fontSize: "13px" }}>
                      <option value="auto">Auto-detect</option>
                      <option value=",">Comma (,)</option>
                      <option value=";">Semicolon (;)</option>
                      <option value="\t">Tab (\t)</option>
                      <option value="|">Pipe (|)</option>
                      <option value=":">Colon (:)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Sheet Name
                    </label>
                    <input type="text" value={sheetName} onChange={(e) => setSheetName(e.target.value.slice(0, 31))} maxLength={31} disabled={converting} className="neon-input" style={{ padding: "10px 12px", fontSize: "13px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Skip Rows
                    </label>
                    <input type="number" value={skipRows} onChange={(e) => setSkipRows(Math.max(0, parseInt(e.target.value) || 0))} min="0" disabled={converting} className="neon-input" style={{ padding: "10px 12px", fontSize: "13px" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)" }}>
                      <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} disabled={converting} style={{ width: "18px", height: "18px", accentColor: "var(--primary-teal)" }} />
                      First row is header
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            {preview.length > 0 && (
              <div style={{ marginBottom: "24px", padding: "16px", background: "var(--editor-workspace)", border: "1px solid var(--border)", borderRadius: "12px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 12px" }}>
                  Preview (first 10 rows)
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "var(--bg-card)" }}>
                        {preview[0].cells.map((cell, idx) => (
                          <th key={idx} style={{ padding: "8px", border: "1px solid var(--border)", textAlign: "left", fontWeight: 600 }}>
                            {hasHeader ? cell : `Column ${idx + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(hasHeader ? 1 : 0).map((row, rowIdx) => (
                        <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? "var(--bg-card)" : "transparent" }}>
                          {row.cells.map((cell, idx) => (
                            <td key={idx} style={{ padding: "6px 8px", border: "1px solid var(--border)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                accept=".csv"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect((e.target as HTMLInputElement).files?.[0] ?? null)}
                disabled={converting}
              />
              <Table size={48} style={{ color: dragActive ? "var(--primary-teal)" : "var(--text-muted)", transition: "color 0.2s ease" }} />
              <p style={{ fontSize: "16px", fontWeight: 500, color: dragActive ? "var(--primary-teal)" : "var(--text-secondary)", transition: "color 0.2s ease" }}>
                {dragActive ? "Release to upload CSV file" : "Drag & drop a CSV file"}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>or click to browse (max 50 MB)</p>
            </div>

            {/* Selected File */}
            {file && (
              <div className="animate-slideUp" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "var(--teal-light)", border: "1px solid rgba(7,140,145,0.24)", borderRadius: "12px" }}>
                <Table size={24} style={{ color: "var(--primary-teal)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {formatBytes(file.size)} • CSV file
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
                  <Table size={20} />
                  Convert to Excel
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
                    Download XLSX
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
                    <li>Auto-detects encoding (UTF-8, UTF-16, Windows-1252, etc.)</li>
                    <li>Auto-detects delimiter (comma, semicolon, tab, pipe)</li>
                    <li>Formula injection protection (prefixes =, +, -, @ with quote)</li>
                    <li>Preserves leading zeros and large numeric identifiers as text</li>
                    <li>Handles quoted fields, escaped quotes, and multiline cells</li>
                    <li>Auto-adjusts column widths, freezes header row</li>
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
                    Limitations
                  </p>
                  <ul style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, paddingLeft: "20px", lineHeight: 1.8 }}>
                    <li>CSV formulas (=, +, -, @) are prefixed with quote for safety</li>
                    <li>No formatting, charts, or macros - CSV is data only</li>
                    <li>Encoding auto-detection may not be 100% accurate for all files</li>
                    <li>Very large files may take longer to process</li>
                    <li>Maximum file size: 50 MB</li>
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