"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Image, X, Loader2, AlertCircle, Check, Info } from "lucide-react";

interface CompressionFile {
  file: File;
  preview?: string;
  originalName: string;
  size: number;
  type: string;
  format: string;
}

interface UseCompressionUploadOptions {
  accept: string;
  maxSize: number;
  multiple?: boolean;
  maxFiles?: number;
  onFilesChange?: (files: CompressionFile[]) => void;
  validateFile?: (file: File) => string | null;
}

export function useCompressionUpload({
  accept,
  maxSize,
  multiple = false,
  maxFiles = 20,
  onFilesChange,
  validateFile,
}: UseCompressionUploadOptions) {
  const [files, setFiles] = useState<CompressionFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFormatFromFile = (file: File): string => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'jpeg') return 'jpg';
    return ext || '';
  };

  const processFile = (file: File): CompressionFile => {
    return {
      file,
      originalName: file.name,
      size: file.size,
      type: file.type,
      format: getFormatFromFile(file),
    };
  };

  const validate = (file: File): string | null => {
    if (validateFile) {
      const customError = validateFile(file);
      if (customError) return customError;
    }

    // Check file type
    const ext = file.name.split('.').pop()?.toLowerCase();
    const acceptTypes = accept.split(',').map(t => t.trim().replace('.', ''));
    if (ext && !acceptTypes.includes(ext) && !acceptTypes.includes(ext === 'jpeg' ? 'jpg' : ext)) {
      return `Unsupported file type. Accepted: ${acceptTypes.join(', ')}`;
    }

    // Check MIME type
    if (!acceptTypes.some(t => file.type.includes(t.replace('jpg', 'jpeg')))) {
      // Fallback: check extension if MIME doesn't match
    }

    // Check file size
    if (file.size > maxSize) {
      return `File is too large. Maximum size is ${formatBytes(maxSize)}.`;
    }

    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    if (!multiple && fileArray.length > 1) {
      setError("Only one file allowed");
      return;
    }

    if (multiple && files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: CompressionFile[] = [];
    let firstError: string | null = null;

    for (const file of fileArray) {
      const err = validate(file);
      if (err) {
        if (!firstError) firstError = err;
        continue;
      }
      validFiles.push(processFile(file));
    }

    if (firstError) {
      setError(firstError);
    }

    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
      setError(null);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [files, multiple, maxFiles, onFilesChange, validate]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      onFilesChange?.(updated);
      return updated;
    });
  }, [onFilesChange]);

  const clearFiles = useCallback(() => {
    setFiles([]);
    onFilesChange?.([]);
    setError(null);
  }, [onFilesChange]);

  const replaceFile = useCallback((index: number, newFile: File) => {
    const err = validate(newFile);
    if (err) {
      setError(err);
      return;
    }
    setFiles(prev => {
      const updated = [...prev];
      updated[index] = processFile(newFile);
      onFilesChange?.(updated);
      return updated;
    });
    setError(null);
  }, [onFilesChange, validate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  }, [addFiles]);

  const triggerFileSelect = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const dropZoneProps = {
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
    onClick: triggerFileSelect,
    inputRef,
    accept,
    onChange: handleFileSelect,
  };

  return {
    files,
    dragActive,
    error,
    setError,
    inputRef,
    dropZoneProps,
    handleFileSelect,
    addFiles,
    removeFile,
    replaceFile,
    clearFiles,
    formatBytes,
  };
}

interface FilePreviewProps {
  file: CompressionFile;
  index: number;
  onRemove: () => void;
  onReplace?: () => void;
  showReplace?: boolean;
  compressing?: boolean;
}

export function FilePreview({ file, index, onRemove, onReplace, showReplace = false, compressing = false }: FilePreviewProps) {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = useState<string | null>(null);

  // Generate preview for images
  if (isImage && !preview && !compressing) {
    const url = URL.createObjectURL(file.file);
    setPreview(url);
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "16px",
      background: "var(--teal-light)",
      border: "1px solid rgba(7,140,145,0.24)",
      borderRadius: "12px",
      animation: "slideUp 0.3s ease forwards",
    }}>
      {isImage && preview ? (
        <img
          src={preview}
          alt={file.originalName}
          style={{
            width: 48,
            height: 48,
            borderRadius: "8px",
            objectFit: "cover",
            background: "var(--bg-card)",
          }}
        />
      ) : (
        <div style={{
          width: 48,
          height: 48,
          borderRadius: "8px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--primary-teal)",
        }}>
          {isImage ? <Image size={24} /> : <FileText size={24} />}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--text-primary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          margin: 0,
        }}>
          {file.originalName}
        </p>
        <p style={{
          fontSize: "12px",
          color: "var(--text-secondary)",
          marginTop: "2px",
          margin: 0,
        }}>
          {file.format.toUpperCase()} • {file.size > 1024 * 1024 
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
            : `${(file.size / 1024).toFixed(1)} KB`}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {showReplace && onReplace && (
          <button
            onClick={onReplace}
            disabled={compressing}
            style={{
              padding: "8px",
              borderRadius: "8px",
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              cursor: compressing ? "not-allowed" : "pointer",
              opacity: compressing ? 0.5 : 1,
            }}
            title="Replace file"
          >
            <Loader2 size={16} />
          </button>
        )}
        <button
          onClick={onRemove}
          disabled={compressing}
          style={{
            padding: "8px",
            borderRadius: "8px",
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            cursor: compressing ? "not-allowed" : "pointer",
            opacity: compressing ? 0.5 : 1,
          }}
          title="Remove file"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

interface CompressionUploadZoneProps {
  dragActive: boolean;
  onClick: () => void;
  compressing?: boolean;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  label?: string;
  subLabel?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  accept?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CompressionUploadZone({
  dragActive,
  onClick,
  compressing = false,
  children,
  icon,
  label = "Drag & drop a file",
  subLabel = "or click to browse",
  inputRef,
  accept,
  onChange,
}: CompressionUploadZoneProps) {
  return (
    <div
      className={`drag-zone ${dragActive ? "dragging" : ""}`}
      onClick={onClick}
      style={{
        cursor: compressing ? "not-allowed" : "pointer",
        opacity: compressing ? 0.6 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: "0",
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: "0",
        }}
        disabled={compressing}
        tabIndex={-1}
      />
      {icon || <Image size={48} style={{ color: dragActive ? "var(--primary-teal)" : "var(--text-muted)", transition: "color 0.2s ease" }} />}
      <p style={{
        fontSize: "16px",
        fontWeight: 500,
        color: dragActive ? "var(--primary-teal)" : "var(--text-secondary)",
        transition: "color 0.2s ease",
        margin: 0,
      }}>
        {dragActive ? "Release to upload" : label}
      </p>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0" }}>
        {subLabel}
      </p>
      {children}
    </div>
  );
}

interface ErrorDisplayProps {
  error: string | null;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) return null;
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      padding: "12px 16px",
      background: "var(--danger-light)",
      border: "1px solid rgba(214,69,69,0.20)",
      borderRadius: "10px",
      animation: "slideUp 0.3s ease forwards",
    }}>
      <AlertCircle size={20} style={{ color: "var(--danger)", flexShrink: 0, marginTop: "1px" }} />
      <p style={{ fontSize: "13px", color: "var(--danger)", margin: 0 }}>{error}</p>
    </div>
  );
}

interface SuccessDisplayProps {
  originalSize: number;
  compressedSize: number;
  bytesSaved: number;
  reductionPercent: number;
  format: string;
  fileName: string;
  onDownload: () => void;
  onReset: () => void;
  downloadLabel: string;
  formatBytes: (bytes: number) => string;
  extraStats?: React.ReactNode;
  compressionMethod?: string;
  warning?: string;
  fallbackUsed?: boolean;
}

export function SuccessDisplay({
  originalSize,
  compressedSize,
  bytesSaved,
  reductionPercent,
  format,
  fileName,
  onDownload,
  onReset,
  downloadLabel,
  formatBytes,
  extraStats,
  compressionMethod,
  warning,
  fallbackUsed,
}: SuccessDisplayProps) {
  const isNotSmaller = bytesSaved <= 0;
  const showWarning = warning || isNotSmaller || fallbackUsed;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      paddingTop: "8px",
      animation: "scaleIn 0.3s ease forwards",
    }}>
      <div className="divider" />
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "4px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                background: isNotSmaller ? "var(--warning-light)" : "var(--teal-light)",
                border: isNotSmaller ? "1px solid rgba(214,158,46,0.24)" : "1px solid rgba(7,140,145,0.24)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isNotSmaller ? "var(--warning)" : "var(--primary-teal)",
              }}>
                {isNotSmaller ? (
                  <Info size={20} />
                ) : (
                  <Check size={20} />
                )}
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                  {isNotSmaller ? "Compression complete (no size reduction)" : "Compression complete"}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                  {fileName} • {format.toUpperCase()}
                </p>
              </div>
            </div>
            {extraStats}
          </div>
        </div>
        <button
          onClick={onDownload}
          className="btn-cyan"
          style={{ padding: "12px 20px" }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1={12} y1={15} x2={12} y2={3}></line>
          </svg>
          {downloadLabel}
        </button>
      </div>

      {showWarning && (
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          padding: "12px 16px",
          background: "var(--warning-light)",
          border: "1px solid rgba(214,158,46,0.20)",
          borderRadius: "10px",
          animation: "slideUp 0.3s ease forwards",
        }}>
          <Info size={20} style={{ color: "var(--warning)", flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "13px", color: "var(--warning)", margin: 0 }}>
            {warning || (fallbackUsed ? 'Original file returned - no compression method reduced the file size' : 'File could not be reduced further - already optimized or incompressible format')}
          </p>
        </div>
      )}

      {compressionMethod && !fallbackUsed && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          background: "var(--editor-workspace)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}>
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Method:</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{compressionMethod}</span>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "12px",
        padding: "16px",
        background: isNotSmaller ? "var(--warning-light)" : "var(--editor-workspace)",
        border: isNotSmaller ? "1px solid rgba(214,158,46,0.20)" : "1px solid var(--border)",
        borderRadius: "12px",
      }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
            Original Size
          </p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-mono)" }}>
            {formatBytes(originalSize)}
          </p>
        </div>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
            Compressed Size
          </p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: isNotSmaller ? "var(--warning)" : "var(--primary-teal)", margin: 0, fontFamily: "var(--font-mono)" }}>
            {formatBytes(compressedSize)}
          </p>
        </div>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
            Saved
          </p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: isNotSmaller ? "var(--text-secondary)" : "var(--green-highlight)", margin: 0, fontFamily: "var(--font-mono)" }}>
            {isNotSmaller ? "0 B" : formatBytes(bytesSaved)}
          </p>
        </div>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>
            Reduction
          </p>
          <p style={{ fontSize: "18px", fontWeight: 700, color: isNotSmaller ? "var(--text-secondary)" : "var(--primary-teal)", margin: 0, fontFamily: "var(--font-mono)" }}>
            {isNotSmaller ? "0.0%" : reductionPercent.toFixed(1)}%
          </p>
        </div>
      </div>
      <button
        onClick={onReset}
        className="btn-ghost"
        style={{ width: "100%", justifyContent: "center" }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1={19} y1={12} x2={5} y2={12}></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Compress another file
      </button>
    </div>
  );
}