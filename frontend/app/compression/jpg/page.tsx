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
  CompressionSlider,
  InfoBox,
  InfoItem,
} from "../../../components/compression/CompressionSettings";
import { compressJpg } from "../../../utils/api";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const TOOL_NAME = "Compress JPG";
const TOOL_DESCRIPTION = "Reduce JPG file size with adjustable quality settings";
const CATEGORY = "COMPRESSION TOOLS";
const ACCEPT = ".jpg,.jpeg";
const FILE_TYPE_LABEL = "JPG image";

export default function CompressJpgPage() {
  const [qualityPreset, setQualityPreset] = useState<"high" | "balanced" | "smaller" | "custom">("balanced");
  const [customQuality, setCustomQuality] = useState(80);
  const [progressive, setProgressive] = useState(true);
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
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!ext || !['jpg', 'jpeg'].includes(ext)) {
      return "Please select a JPG/JPEG file.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const getQualityValue = () => {
    if (qualityPreset === "custom") return customQuality;
    const presets = { high: 90, balanced: 80, smaller: 65 };
    return presets[qualityPreset];
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

      const result = await compressJpg(file.file, {
        quality: getQualityValue(),
        progressive,
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

  const qualityOptions = [
    { value: "high", label: "High Quality", description: "Quality 90 — minimal visible loss" },
    { value: "balanced", label: "Balanced", description: "Quality 80 — good balance of size and quality" },
    { value: "smaller", label: "Smaller File", description: "Quality 65 — noticeable size reduction" },
    { value: "custom", label: "Custom Quality", description: "Set your own quality (1-95)" },
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
            <CompressionSettingsPanel title="Quality Settings">
              <CompressionRadioGroup
                label="Quality Preset"
                value={qualityPreset}
                onChange={(v: string) => setQualityPreset(v as "high" | "balanced" | "smaller" | "custom")}
                options={qualityOptions}
                disabled={compressing}
              />
              {qualityPreset === "custom" && (
                <CompressionSlider
                  label="Quality"
                  value={customQuality}
                  onChange={setCustomQuality}
                  min={1}
                  max={95}
                  unit=""
                  disabled={compressing}
                  marks={[
                    { value: 1, label: "Low" },
                    { value: 50, label: "Medium" },
                    { value: 95, label: "High" },
                  ]}
                />
              )}
              <div style={{ marginTop: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: compressing ? "not-allowed" : "pointer", opacity: compressing ? 0.5 : 1 }}>
                  <input
                    type="checkbox"
                    checked={progressive}
                    onChange={(e) => setProgressive(e.target.checked)}
                    disabled={compressing}
                    style={{ width: "18px", height: "18px", accentColor: "var(--primary-teal)" }}
                  />
                  <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>Progressive JPEG</span>
                </label>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", marginLeft: "28px" }}>
                  Loads in passes — better for web display
                </p>
              </div>
            </CompressionSettingsPanel>

            <CompressionUploadZone
              {...dropZoneProps}
              dragActive={dragActive}
              compressing={compressing}
              label="Drag & drop a JPG file"
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
                  Compress JPG
                </>
              )}
            </button>

            {result && (
              <SuccessDisplay
                originalSize={result.stats.originalSize}
                compressedSize={result.stats.compressedSize}
                bytesSaved={result.stats.bytesSaved}
                reductionPercent={result.stats.reductionPercent}
                format="JPG"
                fileName={result.filename}
                onDownload={downloadResult}
                onReset={reset}
                downloadLabel="Download JPG"
                formatBytes={formatBytes}
                compressionMethod={result.stats.method}
                warning={result.stats.warning}
                fallbackUsed={result.stats.fallbackUsed}
                extraStats={
                  result.stats.width && result.stats.height && (
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                      {result.stats.width} × {result.stats.height} • Quality: {getQualityValue()} • {result.stats.progressive ? "Progressive" : "Baseline"}
                    </p>
                  )
                }
              />
            )}

            <InfoBox>
              <InfoItem>EXIF orientation is automatically corrected</InfoItem>
              <InfoItem>ICC color profiles are preserved when possible</InfoItem>
              <InfoItem>Transparency is not supported in JPG — transparent areas become white</InfoItem>
              <InfoItem>Progressive JPEG loads gradually in browsers</InfoItem>
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