/**
 * Compression Engine - Shared Types and Interfaces
 * Provides a unified interface for all compression tools.
 */

const COMPRESSION_FILE_SIZE_LIMITS = {
  default: 100 * 1024 * 1024,   // 100MB
  pdf: 100 * 1024 * 1024,       // 100MB for PDF
  image: 50 * 1024 * 1024,      // 50MB for images
  bulk: 200 * 1024 * 1024,      // 200MB for bulk uploads
};

const COMPRESSION_MIME_TYPES = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  zip: 'application/zip',
};

const COMPRESSION_FORMATS = {
  pdf: ['pdf'],
  jpg: ['jpg', 'jpeg'],
  png: ['png'],
  webp: ['webp'],
};

const PDF_COMPRESSION_LEVELS = {
  low: 'low',
  recommended: 'recommended',
  high: 'high',
};

const IMAGE_QUALITY_PRESETS = {
  high: 90,
  balanced: 80,
  smaller: 65,
};

class CompressionError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'CompressionError';
    this.code = code;
    this.details = details;
  }
}

const COMPRESSION_ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  COMPRESSION_FAILED: 'COMPRESSION_FAILED',
  PASSWORD_PROTECTED: 'PASSWORD_PROTECTED',
  CORRUPTED_FILE: 'CORRUPTED_FILE',
  TIMEOUT: 'TIMEOUT',
  MEMORY_EXCEEDED: 'MEMORY_EXCEEDED',
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
  NO_IMPROVEMENT: 'NO_IMPROVEMENT',
  ZIP_CREATION_FAILED: 'ZIP_CREATION_FAILED',
};

class CompressorInterface {
  async compress({ inputBuffer, inputFormat, options = {} }) {
    throw new Error('compress() must be implemented by subclass');
  }

  async validateInput(buffer, format) {
    return { valid: true };
  }

  getMaxFileSize(format) {
    return COMPRESSION_FILE_SIZE_LIMITS[format] || COMPRESSION_FILE_SIZE_LIMITS.default;
  }

  getMimeType(format) {
    return COMPRESSION_MIME_TYPES[format] || 'application/octet-stream';
  }

  getSupportedFormats() {
    return Object.keys(COMPRESSION_FORMATS).flatMap(f => COMPRESSION_FORMATS[f]);
  }
}

module.exports = {
  COMPRESSION_FILE_SIZE_LIMITS,
  COMPRESSION_MIME_TYPES,
  COMPRESSION_FORMATS,
  PDF_COMPRESSION_LEVELS,
  IMAGE_QUALITY_PRESETS,
  CompressionError,
  COMPRESSION_ERROR_CODES,
  CompressorInterface,
};