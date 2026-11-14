/**
 * Bulk Image Compressor
 * Compresses multiple images and packages them into a ZIP archive
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { BaseCompressor } = require('./BaseCompressor');
const { CompressionError, COMPRESSION_ERROR_CODES, IMAGE_QUALITY_PRESETS } = require('./types');
const { JPGCompressor } = require('./JPGCompressor');
const { PNGCompressor } = require('./PNGCompressor');
const { WEBPCompressor } = require('./WEBPCompressor');

const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_CONCURRENT = 3; // Bounded concurrency

class BulkImageCompressor extends BaseCompressor {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('bulk');
    this.maxFiles = 50;
    this.maxTotalSize = 200 * 1024 * 1024; // 200MB total

    // Initialize individual compressors
    this.jpgCompressor = new JPGCompressor();
    this.pngCompressor = new PNGCompressor();
    this.webpCompressor = new WEBPCompressor();
  }

  getQualityValue(quality) {
    if (typeof quality === 'string') {
      const preset = quality.toLowerCase();
      if (IMAGE_QUALITY_PRESETS[preset]) {
        return IMAGE_QUALITY_PRESETS[preset];
      }
      const num = parseInt(quality);
      if (!isNaN(num)) return num;
    }
    if (typeof quality === 'number') {
      return Math.min(Math.max(quality, 1), 95);
    }
    return IMAGE_QUALITY_PRESETS.balanced;
  }

  getCompressorForFormat(format) {
    const normFormat = format === 'jpeg' ? 'jpg' : format.toLowerCase();
    switch (normFormat) {
      case 'jpg':
        return this.jpgCompressor;
      case 'png':
        return this.pngCompressor;
      case 'webp':
        return this.webpCompressor;
      default:
        return null;
    }
  }

  getFormatFromFilename(filename) {
    const ext = path.extname(filename).toLowerCase().slice(1);
    return SUPPORTED_FORMATS.includes(ext) ? ext : null;
  }

  getOutputFilename(originalName, format) {
    const parsed = path.parse(originalName);
    const suffix = '_compressed';
    return `${parsed.name}${suffix}.${format === 'jpeg' ? 'jpg' : format}`;
  }

  async compressSingle(file, options) {
    const { buffer, originalName, format } = file;
    const compressor = this.getCompressorForFormat(format);

    if (!compressor) {
      return {
        success: false,
        originalName,
        error: `Unsupported format: ${format}`,
        format,
      };
    }

    try {
      const compressorOptions = {
        quality: options.quality,
        mode: options.mode,
        progressive: options.progressive,
        useOxipng: options.useOxipng,
        allowAnimated: options.allowAnimated,
      };

      // Remove undefined options
      Object.keys(compressorOptions).forEach(key => {
        if (compressorOptions[key] === undefined) {
          delete compressorOptions[key];
        }
      });

      const result = await compressor.compress({
        inputBuffer: buffer,
        inputFormat: format,
        options: compressorOptions,
      });

      return {
        success: true,
        originalName,
        outputName: this.getOutputFilename(originalName, format),
        format,
        buffer: result.buffer,
        stats: result.stats,
      };
    } catch (err) {
      return {
        success: false,
        originalName,
        error: err.message || 'Compression failed',
        format,
        code: err.code,
      };
    }
  }

  async compressBulk(files, options = {}) {
    // Validate file count
    if (files.length === 0) {
      throw new CompressionError(
        'No files provided',
        COMPRESSION_ERROR_CODES.INVALID_INPUT
      );
    }

    if (files.length > this.maxFiles) {
      throw new CompressionError(
        `Too many files. Maximum is ${this.maxFiles}`,
        COMPRESSION_ERROR_CODES.FILE_TOO_LARGE
      );
    }

    // Validate total size
    const totalSize = files.reduce((sum, f) => sum + f.buffer.length, 0);
    if (totalSize > this.maxTotalSize) {
      throw new CompressionError(
        `Total upload size exceeds limit of ${Math.round(this.maxTotalSize / 1024 / 1024)} MB`,
        COMPRESSION_ERROR_CODES.FILE_TOO_LARGE
      );
    }

    // Process files with bounded concurrency
    const results = [];
    const queue = [...files];

    const processNext = async () => {
      if (queue.length === 0) return;
      const file = queue.shift();
      const result = await this.compressSingle(file, options);
      results.push(result);
      await processNext();
    };

    // Start workers
    const workers = Array(Math.min(MAX_CONCURRENT, files.length))
      .fill(null)
      .map(() => processNext());

    await Promise.all(workers);

    // Separate successful and failed
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length === 0) {
      throw new CompressionError(
        'All files failed to compress',
        COMPRESSION_ERROR_CODES.COMPRESSION_FAILED,
        { failed }
      );
    }

    // Create ZIP archive
    const zipBuffer = await this.createZipArchive(successful);

    // Calculate totals
    const totalOriginalSize = successful.reduce((sum, r) => sum + (r.stats?.originalSize || 0), 0);
    const totalCompressedSize = successful.reduce((sum, r) => sum + (r.stats?.compressedSize || 0), 0);

    return {
      zipBuffer,
      stats: {
        totalFiles: files.length,
        successful: successful.length,
        failed: failed.length,
        totalOriginalSize,
        totalCompressedSize,
        totalBytesSaved: totalOriginalSize - totalCompressedSize,
        totalReductionPercent: totalOriginalSize > 0
          ? Math.round((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100 * 100) / 100
          : 0,
      },
      results: {
        successful: successful.map(r => ({
          originalName: r.originalName,
          outputName: r.outputName,
          format: r.format,
          originalSize: r.stats?.originalSize,
          compressedSize: r.stats?.compressedSize,
          bytesSaved: r.stats?.bytesSaved,
          reductionPercent: r.stats?.reductionPercent,
          smaller: r.stats?.smaller,
        })),
        failed: failed.map(r => ({
          originalName: r.originalName,
          format: r.format,
          error: r.error,
          code: r.code,
        })),
      },
    };
  }

  async createZipArchive(successfulResults) {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 6 }, // Compression level
      });

      const chunks = [];

      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', (err) => reject(new CompressionError(
        `ZIP creation failed: ${err.message}`,
        COMPRESSION_ERROR_CODES.ZIP_CREATION_FAILED,
        { originalError: err.message }
      )));

      // Add each file to the archive
      for (const result of successfulResults) {
        archive.append(result.buffer, { name: result.outputName });
      }

      archive.finalize();
    });
  }

  // Main interface method
  async compress({ inputBuffer, inputFormat, options = {} }) {
    // For bulk, we expect options.files to be an array of {buffer, originalName, format}
    const files = options.files;
    if (!files || !Array.isArray(files)) {
      throw new CompressionError(
        'Bulk compression requires files array in options',
        COMPRESSION_ERROR_CODES.INVALID_INPUT
      );
    }

    return this.compressBulk(files, options);
  }
}

module.exports = { BulkImageCompressor };