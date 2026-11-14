"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Image, Download, Check, Loader2, AlertCircle, Info } from "lucide-react";
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
import { compressPng } from "../../../utils/api";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const TOOL_NAME = "Compress PNG";
const TOOL_DESCRIPTION = "Reduce PNG file size with lossless or optimized compression";
const CATEGORY = "COMPRESSION TOOLS";
const ACCEPT = ".png";
const FILE_TYPE_LABEL = "PNG image";

export default function CompressPngPage() {
  const [mode, setMode] = useState<"lossless" | "optimized">("lossless");
  const [useOxipng, setUseOxipng] = useState(true);
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
    if (f.type !== "image/png" && !f.name.toLowerCase().endsWith(".png")) {
      return "Please select a PNG file.";
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
        setProgress(p => Math.min(p + 15, 90));
      }, 300);

      const result = await compressPng(file.file, {
        mode,
        useOxipng,
      });

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

  const modeOptions = [
    { value: "lossless", label: "Lossless", description: "Preserves pixel data exactly — guaranteed identical output (uses oxipng when available)" },
    { value: "optimized", label: "Optimized", description: "Allows palette optimization — may reduce colors but smaller files" },
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
            <CompressionSettingsPanel title="Compression Mode">
              <CompressionRadioGroup
                label="Compression Mode"
                value={mode}
                onChange={(v: string) => setMode(v as "lossless" | "optimized")}
                options={modeOptions}
                disabled={compressing}
                helperText="Lossless mode guarantees identical pixel data. Optimized mode may reduce color count for smaller files."
              />
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: compressing ? "not-allowed" : "pointer", opacity: compressing ? 0.5 : 1 }}>
                  <input
                    type="checkbox"
                    checked={useOxipng}
                    onChange={(e) => setUseOxipng(e.target.checked)}
                    disabled={compressing || mode !== "lossless"}
                    style={{ width: "18px", height: "18px", accentColor: "var(--primary-teal)", marginTop: "2px", flexShrink: 0 }}
                  />
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>Use oxipng for lossless optimization</span>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", margin: 0 }}>
                      Provides better lossless compression than Pillow alone (if available on server)
                    </p>
                  </div>
                </label>
              </div>
            </CompressionSettingsPanel>

            <CompressionUploadZone
              {...dropZoneProps}
              dragActive={dragActive}
              compressing={compressing}
              label="Drag & drop a PNG file"
              subLabel="or click to browse (max 50 MB)"
              icon={<Image size={48} />}
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
                  <Image size={20} />
                  Compress PNG
                </>
              )}
            </button>

            {result && (
              <SuccessDisplay
                originalSize={result.stats.originalSize}
                compressedSize={result.stats.compressedSize}
                bytesSaved={result.stats.bytesSaved}
                reductionPercent={result.stats.reductionPercent}
                format="PNG"
                fileName={result.filename}
                onDownload={downloadResult}
                onReset={reset}
                downloadLabel="Download PNG"
                formatBytes={formatBytes}
                compressionMethod={result.stats.method}
                warning={result.stats.warning}
                fallbackUsed={result.stats.fallbackUsed}
                extraStats={
                  result.stats.width && result.stats.height && (
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                      {result.stats.width} × {result.stats.height} • Mode: {mode} • Method: {result.stats.method || "pillow"}
                    </p>
                  )
                }
              />
            )}

            <InfoBox>
              <InfoItem>Transparency and alpha channel are always preserved</InfoItem>
              <InfoItem>Lossless mode guarantees pixel-perfect output</InfoItem>
              <InfoItem>Optimized mode may reduce color palette (256 colors max) for smaller files</InfoItem>
              <InfoItem>oxipng provides better lossless compression when available on server</InfoItem>
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