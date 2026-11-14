"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Download, Check, Loader2, AlertCircle, Info } from "lucide-react";
import Navbar from "../../../components/Navbar";
import {
  useCompressionUpload,
  FilePreview,
  CompressionUploadZone,
  ErrorDisplay,
  SuccessDisplay,
} from "../../../components/compression/CompressionUpload";
import {
  CompressionSettingsPanel,
  CompressionRadioGroup,
  InfoBox,
  InfoItem,
} from "../../../components/compression/CompressionSettings";
import { compressPdf } from "../../../utils/api";

const API = process.env.NEXT_PUBLIC_API_URL || "https://zipdrop.onrender.com";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const TOOL_NAME = "Compress PDF";
const TOOL_DESCRIPTION = "Reduce PDF file size while preserving text, images, and layout";
const CATEGORY = "COMPRESSION TOOLS";
const ACCEPT = ".pdf";
const FILE_TYPE_LABEL = "PDF document";

export default function CompressPdfPage() {
  const [level, setLevel] = useState<"low" | "recommended" | "high">("recommended");
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    blob: Blob;
    filename: string;
    stats: any;
  } | null>(null);

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

  const { files, dragActive, error, setError, inputRef, dropZoneProps, handleFileSelect, removeFile, clearFiles } = useCompressionUpload({
    accept: ACCEPT,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    validateFile,
    onFilesChange: (newFiles) => {
      if (newFiles.length === 0) {
        setResult(null);
      }
    },
  });

  const file = files[0];

  const compress = async () => {
    if (!file) return;
    setCompressing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      const result = await compressPdf(file.file, { level });

      clearInterval(progressInterval);
      setProgress(100);

      setResult({
        blob: result.blob,
        filename: result.filename,
        stats: result.stats,
      });
    } catch (err: any) {
      setError(err.message || "Compression failed. Please try again.");
    } finally {
      setCompressing(false);
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
    clearFiles();
    setResult(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const levelOptions = [
    { value: "low", label: "Low Compression", description: "Prioritize visual quality — minimal size reduction" },
    { value: "recommended", label: "Recommended", description: "Balanced quality and size reduction (default)" },
    { value: "high", label: "High Compression", description: "Stronger optimization — possible quality loss for raster content" },
  ];

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "100vh", background: "var(--bg-main)", padding: "clamp(24px, 4vh, 48px) 24px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link href="/compression" style={{ textDecoration: "none", color: "var(--text-secondary)", padding: "8px" }}>
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
            <CompressionSettingsPanel title="Compression Level">
              <CompressionRadioGroup
                label="Compression Level"
                value={level}
                onChange={(v: string) => setLevel(v as "low" | "recommended" | "high")}
                options={levelOptions}
                disabled={compressing}
                helperText="Higher compression may reduce quality of embedded images. Already-optimized PDFs may see little reduction."
              />
            </CompressionSettingsPanel>

            <CompressionUploadZone
              {...dropZoneProps}
              dragActive={dragActive}
              compressing={compressing}
              label="Drag & drop a PDF file"
              subLabel="or click to browse (max 100 MB)"
              icon={<FileText size={48} />}
            />

            {file && (
              <FilePreview
                file={file}
                index={0}
                onRemove={reset}
                compressing={compressing}
              />
            )}

            <ErrorDisplay error={error} />

            <button
              onClick={compress}
              disabled={compressing || !file}
              className="btn-cyan"
              style={{
                width: "100%",
                padding: "16px 24px",
                fontSize: "15px",
                fontWeight: 700,
                opacity: compressing || !file ? 0.5 : 1,
                cursor: compressing || !file ? "not-allowed" : "pointer",
              }}
            >
              <span className="shimmer" />
              {compressing ? (
                <>
                  <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                  Compressing... {progress}%
                </>
              ) : (
                <>
                  <FileText size={20} />
                  Compress PDF
                </>
              )}
            </button>

            {result && (
              <SuccessDisplay
                originalSize={result.stats.originalSize}
                compressedSize={result.stats.compressedSize}
                bytesSaved={result.stats.bytesSaved}
                reductionPercent={result.stats.reductionPercent}
                format="PDF"
                fileName={result.filename}
                onDownload={downloadResult}
                onReset={reset}
                downloadLabel="Download PDF"
                formatBytes={formatBytes}
                compressionMethod={result.stats.method}
                warning={result.stats.warning}
                fallbackUsed={result.stats.fallbackUsed}
                extraStats={
                  result.stats.pageCount && (
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                      {result.stats.pageCount} page{result.stats.pageCount !== 1 ? "s" : ""} • Level: {level}
                    </p>
                  )
                }
              />
            )}

            <InfoBox>
              <InfoItem>Compression preserves text, vector graphics, links, and bookmarks</InfoItem>
              <InfoItem>Embedded images are optimized based on the selected level</InfoItem>
              <InfoItem>Already-optimized PDFs may not reduce significantly</InfoItem>
              <InfoItem>Password-protected PDFs cannot be compressed</InfoItem>
            </InfoBox>
          </div>

          <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
            Files are processed securely and deleted after compression. No permanent storage.
          </p>
        </div>
      </div>
    </>
  );
}