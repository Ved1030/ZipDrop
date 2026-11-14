/**
 * WEBP Compressor
 * Uses Pillow for WEBP compression (lossy and lossless)
 */

const fs = require('fs');
const path = require('path');
const { BaseCompressor } = require('./BaseCompressor');
const { CompressionError, COMPRESSION_ERROR_CODES, IMAGE_QUALITY_PRESETS } = require('./types');

const IMAGE_COMPRESSOR_SCRIPT = path.join(__dirname, 'image_compressor.py');

const WEBP_SIGNATURES = [
  { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46], format: 'webp' }, // RIFF (check WEBP at offset 8)
];

class WEBPCompressor extends BaseCompressor {
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

  async compress({ inputBuffer, inputFormat, options = {} }) {
    // Validate input format
    if (inputFormat !== 'webp') {
      throw new CompressionError(
        `Unsupported input format for WEBP compression: ${inputFormat}. Only WEBP supported.`,
        COMPRESSION_ERROR_CODES.UNSUPPORTED_FORMAT
      );
    }

    this.validateFileSize(inputBuffer, this.maxFileSize);

    // Validate WEBP signature (RIFF + WEBP at offset 8)
    if (inputBuffer.length < 12) {
      throw new CompressionError(
        'File is too small to be a valid WEBP image',
        COMPRESSION_ERROR_CODES.INVALID_INPUT
      );
    }
    const riff = inputBuffer.slice(0, 4);
    const webp = inputBuffer.slice(8, 12);
    if (!riff.equals(Buffer.from([0x52, 0x49, 0x46, 0x46])) || !webp.equals(Buffer.from([0x57, 0x45, 0x42, 0x50]))) {
      throw new CompressionError(
        'File is not a valid WEBP image',
        COMPRESSION_ERROR_CODES.INVALID_INPUT
      );
    }

    // Check for animated WebP (multiple frames)
    // We'll handle this in Python, but we can warn here
    const isAnimated = options.allowAnimated !== true;

    // Get compression settings
    const mode = options.mode || 'lossy'; // 'lossy' or 'lossless'
    const lossless = mode === 'lossless';
    const quality = lossless ? 100 : this.getQualityValue(options.quality || 'balanced');

    const inputPath = this.generateTempPath('webp');
    const outputPath = this.generateTempPath('webp');

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      await this.checkImageCompressorTooling();

      const pythonBin = this.getPythonBin();
      const result = await this.runCommand(pythonBin, [
        IMAGE_COMPRESSOR_SCRIPT,
        inputPath,
        outputPath,
        'webp',
        'webp',
        quality.toString(),
        lossless.toString(),
        'true', // progressive
        'true', // use_oxipng
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
          'Invalid response from WEBP compressor',
          COMPRESSION_ERROR_CODES.COMPRESSION_FAILED,
          { stdout: result.stdout, stderr: result.stderr }
        );
      }

      if (!parsed.success) {
        const errorCode = parsed.code === 'INVALID_INPUT' ? COMPRESSION_ERROR_CODES.INVALID_INPUT :
                         parsed.code === 'UNSUPPORTED_FORMAT' ? COMPRESSION_ERROR_CODES.UNSUPPORTED_FORMAT :
                         COMPRESSION_ERROR_CODES.COMPRESSION_FAILED;
        throw new CompressionError(
          parsed.error || 'WEBP compression failed',
          errorCode,
          { details: parsed }
        );
      }

      // Check if animated and not allowed
      if (parsed.frames && parsed.frames > 1 && !options.allowAnimated) {
        throw new CompressionError(
          'Animated WEBP files are not supported. Please use a static WEBP or enable animated processing.',
          COMPRESSION_ERROR_CODES.UNSUPPORTED_FORMAT,
          { frames: parsed.frames }
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
          mode: parsed.lossless ? 'lossless' : 'lossy',
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

module.exports = { WEBPCompressor };