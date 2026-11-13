/**
 * Conversion Engine - Shared Types and Interfaces
 * 
 * Provides a unified interface for all file conversions.
 * Each converter implements the ConverterInterface.
 */

const SUPPORTED_FORMATS = {
  // PDF Conversions
  'pdf': ['docx', 'xlsx', 'pptx', 'jpg', 'png', 'txt', 'html', 'pdfa'],
  // Office to PDF
  'docx': ['pdf', 'txt', 'html'],
  'doc': ['pdf', 'txt', 'html'],
  'xlsx': ['pdf', 'csv'],
  'xls': ['pdf', 'csv'],
  'pptx': ['pdf'],
  'ppt': ['pdf'],
  // Image Conversions
  'jpg': ['png', 'webp', 'pdf'],
  'jpeg': ['png', 'webp', 'pdf'],
  'png': ['jpg', 'webp', 'pdf'],
  'webp': ['jpg', 'png', 'pdf'],
  'svg': ['png', 'pdf'],
  // Other
  'txt': ['pdf'],
  'html': ['pdf'],
  'csv': ['xlsx'],
  'rtf': ['docx'],
};

const CONVERSION_CATEGORIES = {
  'pdf-conversions': ['pdf-to-docx', 'pdf-to-xlsx', 'pdf-to-pptx', 'pdf-to-jpg', 'pdf-to-png', 'pdf-to-txt', 'pdf-to-html', 'pdf-to-pdfa'],
  'office-to-pdf': ['docx-to-pdf', 'xlsx-to-pdf', 'pptx-to-pdf'],
  'office-other': ['docx-to-txt', 'docx-to-html', 'xlsx-to-csv'],
  'image-conversions': ['jpg-to-png', 'png-to-jpg', 'webp-to-jpg', 'jpg-to-webp', 'png-to-webp', 'svg-to-png', 'images-to-pdf'],
  'other-conversions': ['txt-to-pdf', 'html-to-pdf', 'csv-to-xlsx', 'rtf-to-docx'],
};

const FILE_SIZE_LIMITS = {
  default: 100 * 1024 * 1024, // 100MB
  pdf: 50 * 1024 * 1024,      // 50MB for PDF
  image: 25 * 1024 * 1024,    // 25MB for images
  office: 50 * 1024 * 1024,   // 50MB for office docs
};

const MIME_TYPES = {
  'pdf': 'application/pdf',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'doc': 'application/msword',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'xls': 'application/vnd.ms-excel',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'ppt': 'application/vnd.ms-powerpoint',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'txt': 'text/plain',
  'html': 'text/html',
  'csv': 'text/csv',
  'rtf': 'application/rtf',
  'pdfa': 'application/pdf',
};

class ConversionError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'ConversionError';
    this.code = code;
    this.details = details;
  }
}

const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  CONVERSION_FAILED: 'CONVERSION_FAILED',
  PASSWORD_PROTECTED: 'PASSWORD_PROTECTED',
  CORRUPTED_FILE: 'CORRUPTED_FILE',
  TIMEOUT: 'TIMEOUT',
  MEMORY_EXCEEDED: 'MEMORY_EXCEEDED',
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
  OCR_REQUIRED: 'OCR_REQUIRED',
};

class ConverterInterface {
  /**
   * @param {Object} options
   * @param {Buffer} options.inputBuffer - Input file buffer
   * @param {string} options.inputFormat - Input format (e.g., 'pdf')
   * @param {string} options.outputFormat - Output format (e.g., 'docx')
   * @param {Object} options.options - Conversion-specific options
   * @returns {Promise<Buffer>} Output file buffer
   */
  async convert({ inputBuffer, inputFormat, outputFormat, options = {} }) {
    throw new Error('convert() must be implemented by subclass');
  }

  /**
   * Validate input file
   * @param {Buffer} buffer 
   * @param {string} format 
   * @returns {Promise<{ valid: boolean, error?: string }>}
   */
  async validateInput(buffer, format) {
    return { valid: true };
  }

  /**
   * Get supported output formats for a given input format
   * @param {string} inputFormat 
   * @returns {string[]}
   */
  getSupportedOutputFormats(inputFormat) {
    return SUPPORTED_FORMATS[inputFormat] || [];
  }

  /**
   * Check if conversion is supported
   * @param {string} inputFormat 
   * @param {string} outputFormat 
   * @returns {boolean}
   */
  isConversionSupported(inputFormat, outputFormat) {
    const supported = this.getSupportedOutputFormats(inputFormat);
    return supported.includes(outputFormat);
  }

  /**
   * Get max file size for format
   * @param {string} format 
   * @returns {number}
   */
  getMaxFileSize(format) {
    return FILE_SIZE_LIMITS[format] || FILE_SIZE_LIMITS.default;
  }

  /**
   * Get MIME type for format
   * @param {string} format 
   * @returns {string}
   */
  getMimeType(format) {
    return MIME_TYPES[format] || 'application/octet-stream';
  }
}

module.exports = {
  SUPPORTED_FORMATS,
  CONVERSION_CATEGORIES,
  FILE_SIZE_LIMITS,
  MIME_TYPES,
  ConversionError,
  ERROR_CODES,
  ConverterInterface,
};