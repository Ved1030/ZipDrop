const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://zipdrop.onrender.com";

/* Analytics Helper */

const trackEvent = (eventName: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName);
  }
};

/* Upload Files */

export const uploadFile = async (formData: FormData) => {
  const res = await fetch(`${API}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }

  trackEvent("file_upload");
  trackEvent("code_generated");

  return res.json();
};

/* Share Text */

export const shareText = async (text: string) => {
  const res = await fetch(`${API}/share-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Share failed: ${res.status} ${text}`);
  }

  trackEvent("text_shared");
  trackEvent("code_generated");

  return res.json();
};

/* Receive Files or Text */

export const receiveData = async (code: string) => {
  const res = await fetch(`${API}/receive/${code}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Receive failed: ${res.status} ${text}`);
  }

  trackEvent("code_entered");
  trackEvent("file_download");

  return res.json();
};

/* Compression */

export interface CompressionResult {
  blob: Blob;
  filename: string;
  stats: {
    originalSize: number;
    compressedSize: number;
    bytesSaved: number;
    reductionPercent: number;
    [key: string]: any;
  };
}

export interface BulkCompressionResult {
  blob: Blob;
  filename: string;
  stats: {
    totalFiles: number;
    successful: number;
    failed: number;
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalBytesSaved: number;
    totalReductionPercent: number;
  };
  results: {
    successful: Array<{
      originalName: string;
      outputName: string;
      format: string;
      originalSize: number;
      compressedSize: number;
      bytesSaved: number;
      reductionPercent: number;
      smaller: boolean;
    }>;
    failed: Array<{
      originalName: string;
      format: string;
      error: string;
      code?: string;
    }>;
  };
}

async function compressFile(
  endpoint: string,
  file: File,
  options: Record<string, string> = {}
): Promise<CompressionResult> {
  const formData = new FormData();
  formData.append("file", file);
  
  Object.entries(options).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const res = await fetch(`${API}${endpoint}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Compression failed: ${res.status}`);
  }

  const blob = await res.blob();
  
  // Extract stats from headers
  const stats = {
    originalSize: parseInt(res.headers.get("X-Original-Size") || "0"),
    compressedSize: parseInt(res.headers.get("X-Compressed-Size") || "0"),
    bytesSaved: parseInt(res.headers.get("X-Bytes-Saved") || "0"),
    reductionPercent: parseFloat(res.headers.get("X-Reduction-Percent") || "0"),
    pageCount: parseInt(res.headers.get("X-Page-Count") || "0") || undefined,
    width: parseInt(res.headers.get("X-Width") || "0") || undefined,
    height: parseInt(res.headers.get("X-Height") || "0") || undefined,
    level: res.headers.get("X-Compression-Level") || undefined,
    mode: res.headers.get("X-Compression-Mode") || undefined,
    quality: res.headers.get("X-Quality") || undefined,
    method: res.headers.get("X-Compression-Method") || undefined,
    warning: res.headers.get("X-Warning") || undefined,
  };

  // Get filename from Content-Disposition or generate
  const contentDisposition = res.headers.get("Content-Disposition");
  let filename = file.name.replace(/\.[^.]+$/, `_compressed.${file.name.split('.').pop()}`);
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match) filename = match[1];
  }

  return { blob, filename, stats };
}

export const compressPdf = async (
  file: File,
  options: { level?: "low" | "recommended" | "high" } = {}
): Promise<CompressionResult> => {
  return compressFile("/compress/pdf", file, {
    level: options.level || "recommended",
  });
};

export const compressJpg = async (
  file: File,
  options: { quality?: string | number; progressive?: boolean } = {}
): Promise<CompressionResult> => {
  return compressFile("/compress/jpg", file, {
    quality: options.quality?.toString() || "balanced",
    progressive: options.progressive?.toString() || "true",
  });
};

export const compressPng = async (
  file: File,
  options: { mode?: "lossless" | "optimized"; useOxipng?: boolean } = {}
): Promise<CompressionResult> => {
  return compressFile("/compress/png", file, {
    mode: options.mode || "lossless",
    useOxipng: options.useOxipng?.toString() || "true",
  });
};

export const compressWebp = async (
  file: File,
  options: { mode?: "lossy" | "lossless"; quality?: string | number; allowAnimated?: boolean } = {}
): Promise<CompressionResult> => {
  return compressFile("/compress/webp", file, {
    mode: options.mode || "lossy",
    quality: options.quality?.toString() || "balanced",
    allowAnimated: options.allowAnimated?.toString() || "false",
  });
};

export const compressBulkImages = async (
  files: File[],
  options: { quality?: string | number; mode?: "lossless" | "optimized" | "lossy" | "balanced"; progressive?: boolean; useOxipng?: boolean; allowAnimated?: boolean } = {}
): Promise<BulkCompressionResult> => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append("files", file);
  });
  
  Object.entries(options).forEach(([key, value]) => {
    formData.append(key, value.toString());
  });

  const res = await fetch(`${API}/compress/images/bulk`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Bulk compression failed: ${res.status}`);
  }

  const blob = await res.blob();
  
  // Extract stats from headers
  const stats = {
    totalFiles: parseInt(res.headers.get("X-Total-Files") || "0"),
    successful: parseInt(res.headers.get("X-Successful") || "0"),
    failed: parseInt(res.headers.get("X-Failed") || "0"),
    totalOriginalSize: parseInt(res.headers.get("X-Total-Original-Size") || "0"),
    totalCompressedSize: parseInt(res.headers.get("X-Total-Compressed-Size") || "0"),
    totalBytesSaved: parseInt(res.headers.get("X-Total-Bytes-Saved") || "0"),
    totalReductionPercent: parseFloat(res.headers.get("X-Total-Reduction-Percent") || "0"),
  };

  const contentDisposition = res.headers.get("Content-Disposition");
  let filename = "compressed_images.zip";
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    if (match) filename = match[1];
  }

  // For bulk, we can't easily get individual file results from headers
  // The ZIP contains the files; individual stats would need a separate endpoint
  // For now, return what we have from headers
  return { 
    blob, 
    filename, 
    stats,
    results: { successful: [], failed: [] } // Would need separate API for details
  };
};

/* Health Checks */

export const checkCompressionHealth = async () => {
  const res = await fetch(`${API}/health/compression`);
  return res.json();
};

export const checkPdfCompressionHealth = async () => {
  const res = await fetch(`${API}/health/compression`);
  return res.json();
};