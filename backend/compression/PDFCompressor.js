/**
 * PDF Compressor
 * Uses pikepdf and qpdf for PDF optimization
 */

const fs = require('fs');
const path = require('path');
const { BaseCompressor } = require('./BaseCompressor');
const { CompressionError, COMPRESSION_ERROR_CODES, PDF_COMPRESSION_LEVELS } = require('./types');

const PDF_COMPRESSOR_SCRIPT = path.join(__dirname, 'pdf_compressor.py');

const PDF_SIGNATURES = [
  { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46], format: 'pdf' }, // %PDF
];

class PDFCompressor extends BaseCompressor {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('pdf');
  }

  async checkPDFCompressorTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [PDF_COMPRESSOR_SCRIPT, '--check'], {
        timeout: 30000,
      });

      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);

      if (!parsed.success) {
        throw new CompressionError(
          `PDF compressor dependencies not available: ${parsed.error}`,
          COMPRESSION_ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
      return parsed;
    } catch (err) {
      if (err instanceof CompressionError) throw err;
      throw new CompressionError(
        'PDF compression service unavailable',
        COMPRESSION_ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }

  async compress({ inputBuffer, inputFormat, options = {} }) {
    // Validate input format
    if (inputFormat !== 'pdf') {
      throw new CompressionError(
        `Unsupported input format for PDF compression: ${inputFormat}`,
        COMPRESSION_ERROR_CODES.UNSUPPORTED_FORMAT
      );
    }

    this.validateFileSize(inputBuffer, this.maxFileSize);

    // Validate PDF signature
    const detectedFormat = this.validateFileSignature(inputBuffer, PDF_SIGNATURES);
    if (!detectedFormat) {
      throw new CompressionError(
        'File is not a valid PDF',
        COMPRESSION_ERROR_CODES.INVALID_INPUT
      );
    }

    // Get compression level
    const level = options.level || 'recommended';
    if (!Object.values(PDF_COMPRESSION_LEVELS).includes(level)) {
      throw new CompressionError(
        `Invalid compression level: ${level}. Must be one of: ${Object.values(PDF_COMPRESSION_LEVELS).join(', ')}`,
        COMPRESSION_ERROR_CODES.INVALID_INPUT
      );
    }

    const inputPath = this.generateTempPath('pdf');
    const outputPath = this.generateTempPath('pdf');

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      await this.checkPDFCompressorTooling();

      const pythonBin = this.getPythonBin();
      const result = await this.runCommand(pythonBin, [
        PDF_COMPRESSOR_SCRIPT,
        inputPath,
        outputPath,
        level
      ], {
        timeout: 180000,
      });

      // Parse Python script result
      const lastLine = result.stdout.trim().split('\n').pop();
      let parsed;
      try {
        parsed = JSON.parse(lastLine);
      } catch (e) {
        throw new CompressionError(
          'Invalid response from PDF compressor',
          COMPRESSION_ERROR_CODES.COMPRESSION_FAILED,
          { stdout: result.stdout, stderr: result.stderr }
        );
      }

      if (!parsed.success) {
        const errorCode = parsed.code === 'PASSWORD_PROTECTED' ? COMPRESSION_ERROR_CODES.PASSWORD_PROTECTED :
                         parsed.code === 'CORRUPTED_FILE' ? COMPRESSION_ERROR_CODES.CORRUPTED_FILE :
                         parsed.code === 'MISSING_DEPENDENCY' ? COMPRESSION_ERROR_CODES.MISSING_DEPENDENCY :
                         COMPRESSION_ERROR_CODES.COMPRESSION_FAILED;
        throw new CompressionError(
          parsed.error || 'PDF compression failed',
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
          pageCount: parsed.page_count,
          level: parsed.level,
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

module.exports = { PDFCompressor };