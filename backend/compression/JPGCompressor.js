/**
 * JPG Compressor
 * Uses Pillow for JPEG compression with quality control
 */

const fs = require('fs');
const path = require('path');
const { BaseCompressor } = require('./BaseCompressor');
const { CompressionError, COMPRESSION_ERROR_CODES, IMAGE_QUALITY_PRESETS } = require('./types');

const IMAGE_COMPRESSOR_SCRIPT = path.join(__dirname, 'image_compressor.py');

const JPG_SIGNATURES = [
  { offset: 0, bytes: [0xFF, 0xD8, 0xFF], format: 'jpg' },
];

class JPGCompressor extends BaseCompressor {
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

  getQualityValue(quality) {
    // Handle preset names
    if (typeof quality === 'string') {
      const preset = quality.toLowerCase();
      if (IMAGE_QUALITY_PRESETS[preset]) {
        return IMAGE_QUALITY_PRESETS[preset];
      }
      // Try parsing as number
      const num = parseInt(quality);
      if (!isNaN(num)) return num;
    }
    // Handle numeric quality
    if (typeof quality === 'number') {
      return Math.min(Math.max(quality, 1), 95);
    }
    return IMAGE_QUALITY_PRESETS.balanced;
  }

  async compress({ inputBuffer, inputFormat, options = {} }) {
    // Validate input format
    const normInput = inputFormat === 'jpeg' ? 'jpg' : inputFormat;
    if (normInput !== 'jpg') {
      throw new CompressionError(
        `Unsupported input format for JPG compression: ${inputFormat}. Only JPG/JPEG supported.`,
        COMPRESSION_ERROR_CODES.UNSUPPORTED_FORMAT
      );
    }

    this.validateFileSize(inputBuffer, this.maxFileSize);

    // Validate JPG signature
    const detectedFormat = this.validateFileSignature(inputBuffer, JPG_SIGNATURES);
    if (!detectedFormat) {
      throw new CompressionError(
        'File is not a valid JPG/JPEG image',
        COMPRESSION_ERROR_CODES.INVALID_INPUT
      );
    }

    // Get quality setting
    const quality = this.getQualityValue(options.quality || 'balanced');
    const progressive = options.progressive !== false; // Default true

    const inputPath = this.generateTempPath('jpg');
    const outputPath = this.generateTempPath('jpg');

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      await this.checkImageCompressorTooling();

      const pythonBin = this.getPythonBin();
      const result = await this.runCommand(pythonBin, [
        IMAGE_COMPRESSOR_SCRIPT,
        inputPath,
        outputPath,
        'jpg',
        'jpg',
        quality.toString(),
        'false', // lossless
        progressive.toString(),
        'true', // use_oxipng (not used for jpg)
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
          'Invalid response from JPG compressor',
          COMPRESSION_ERROR_CODES.COMPRESSION_FAILED,
          { stdout: result.stdout, stderr: result.stderr }
        );
      }

      if (!parsed.success) {
        const errorCode = parsed.code === 'INVALID_INPUT' ? COMPRESSION_ERROR_CODES.INVALID_INPUT :
                         parsed.code === 'UNSUPPORTED_FORMAT' ? COMPRESSION_ERROR_CODES.UNSUPPORTED_FORMAT :
                         COMPRESSION_ERROR_CODES.COMPRESSION_FAILED;
        throw new CompressionError(
          parsed.error || 'JPG compression failed',
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
          quality: parsed.quality,
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

module.exports = { JPGCompressor };