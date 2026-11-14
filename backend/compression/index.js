/**
 * Compression Router
 * Central entry point for all compression tools
 * Routes requests to appropriate compressors
 */

const { CompressionError, COMPRESSION_ERROR_CODES } = require('./types');
const { PDFCompressor } = require('./PDFCompressor');
const { JPGCompressor } = require('./JPGCompressor');
const { PNGCompressor } = require('./PNGCompressor');
const { WEBPCompressor } = require('./WEBPCompressor');
const { BulkImageCompressor } = require('./BulkImageCompressor');

class CompressionRouter {
  constructor() {
    this.compressors = new Map();
    this.initializeCompressors();
  }

  initializeCompressors() {
    // Single file compressors
    this.compressors.set('pdf', new PDFCompressor());
    this.compressors.set('jpg', new JPGCompressor());
    this.compressors.set('jpeg', new JPGCompressor());
    this.compressors.set('png', new PNGCompressor());
    this.compressors.set('webp', new WEBPCompressor());

    // Bulk compressor
    this.compressors.set('bulk', new BulkImageCompressor());
  }

  getCompressor(key) {
    const compressor = this.compressors.get(key);
    if (!compressor) {
      throw new CompressionError(
        `Unsupported compression type: ${key}`,
        COMPRESSION_ERROR_CODES.UNSUPPORTED_FORMAT
      );
    }
    return compressor;
  }

  async compress({ inputBuffer, inputFormat, options = {} }) {
    const compressor = this.getCompressor(inputFormat);
    return compressor.compress({ inputBuffer, inputFormat, options });
  }

  async compressBulk({ files, options = {} }) {
    const compressor = this.getCompressor('bulk');
    return compressor.compress({
      inputBuffer: null,
      inputFormat: 'bulk',
      options: { files, ...options },
    });
  }

  isCompressionSupported(format) {
    return this.compressors.has(format.toLowerCase());
  }

  getSupportedFormats() {
    return ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
  }

  getBulkSupportedFormats() {
    return ['jpg', 'jpeg', 'png', 'webp'];
  }
}

// Singleton instance
let routerInstance = null;

function getCompressionRouter() {
  if (!routerInstance) {
    routerInstance = new CompressionRouter();
  }
  return routerInstance;
}

module.exports = { CompressionRouter, getCompressionRouter };