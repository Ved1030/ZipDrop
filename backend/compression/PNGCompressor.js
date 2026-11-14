/**
 * PNG Compressor
 * Uses Pillow and oxipng for lossless/optimized PNG compression
 */

const fs = require('fs');
const path = require('path');
const { BaseCompressor } = require('./BaseCompressor');
const { CompressionError, COMPRESSION_ERROR_CODES } = require('./types');

const IMAGE_COMPRESSOR_SCRIPT = path.join(__dirname, 'image_compressor.py');

const PNG_SIGNATURES = [
  { offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], format: 'png' },
];

class PNGCompressor extends BaseCompressor {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('image');
  }

  async checkImageCompressorTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [IMAGE_COMPRESSOR_SCRIPT, '--check'], {
        timeout: 30000,
      });

      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);

      if (!parsed.success) {
        throw new CompressionError(
          `Image compressor dependencies not available: ${parsed.error}`,
          COMPRESSION_ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
      return parsed;
    } catch (err) {
      if (err instanceof CompressionError) throw err;
      throw new CompressionError(
        'Image compression service unavailable',
        COMPRESSION_ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }

  async compress({ inputBuffer, inputFormat, options = {} }) {
    // Validate input format
    if (inputFormat !== 'png') {
      throw new CompressionError(
        `Unsupported input format for PNG compression: ${inputFormat}. Only PNG supported.`,
        COMPRESSION_ERROR_CODES.UNSUPPORTED_FORMAT
      );
    }

    this.validateFileSize(inputBuffer, this.maxFileSize);

    // Validate PNG signature
    const detectedFormat = this.validateFileSignature(inputBuffer, PNG_SIGNATURES);
    if (!detectedFormat) {
      throw new CompressionError(
        'File is not a valid PNG image',
        COMPRESSION_ERROR_CODES.INVALID_INPUT
      );
    }

    // Get compression mode
    const mode = options.mode || 'lossless'; // 'lossless' or 'optimized'
    const lossless = mode === 'lossless';
    const useOxipng = options.useOxipng !== false; // Default true

    const inputPath = this.generateTempPath('png');
    const outputPath = this.generateTempPath('png');

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      await this.checkImageCompressorTooling();

      const pythonBin = this.getPythonBin();
      const result = await this.runCommand(pythonBin, [
        IMAGE_COMPRESSOR_SCRIPT,
        inputPath,
        outputPath,
        'png',
        'png',
        '90', // quality (not used for lossless PNG)
        lossless.toString(),
        'true', // progressive (not used for PNG)
        useOxipng.toString(),
      ], {
        timeout: 120000,
      });

      // Parse Python script result
      const lastLine = result.stdout.trim().split('\n').pop();
      let parsed;
      try {
        parsed = JSON.parse(lastLine);
      } catch (e) {
        throw new CompressionError(
          'Invalid response from PNG compressor',
          COMPRESSION_ERROR_CODES.COMPRESSION_FAILED,
          { stdout: result.stdout, stderr: result.stderr }
        );
      }

      if (!parsed.success) {
        const errorCode = parsed.code === 'INVALID_INPUT' ? COMPRESSION_ERROR_CODES.INVALID_INPUT :
                         parsed.code === 'UNSUPPORTED_FORMAT' ? COMPRESSION_ERROR_CODES.UNSUPPORTED_FORMAT :
                         COMPRESSION_ERROR_CODES.COMPRESSION_FAILED;
        throw new CompressionError(
          parsed.error || 'PNG compression failed',
          errorCode,
          { details: parsed }
        );
      }

      const outputBuffer = await this.readOutputBuffer(outputPath);

      return {
        buffer: outputBuffer,
        stats: {
          originalSize: parsed.original_size,
          compressedSize: parsed.compressed_size,
          bytesSaved: parsed.bytes_saved,
          reductionPercent: parsed.reduction_percent,
          width: parsed.width,
          height: parsed.height,
          mode: parsed.lossless ? 'lossless' : 'optimized',
          method: parsed.method,
          smaller: parsed.smaller,
          warning: parsed.warning,
        },
      };
    } finally {
      this.cleanupTempFiles(inputPath, outputPath);
    }
  }
}

module.exports = { PNGCompressor };