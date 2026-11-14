/**
 * PDF to HTML Converter
 * Uses PyMuPDF (fitz) for layout extraction and generates HTML with CSS positioning
 * Supports embedded images (single HTML) or ZIP with separate assets
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');

const PDF_TO_HTML_SCRIPT = path.join(__dirname, 'pdf_to_html.py');

const PDF_SIGNATURES = [
  { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2D], format: 'pdf' }, // %PDF-
];

class PdfToHtmlConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('pdf');
  }

  async convert({ inputBuffer, outputFormat, options = {} }) {
    const embedImages = options.embedImages !== false; // default true
    const outputFormatType = options.format || (embedImages ? 'html' : 'zip');

    this.validateFileSize(inputBuffer, this.maxFileSize);

    const detectedFormat = this.validateFileSignature(inputBuffer, PDF_SIGNATURES);
    if (!detectedFormat) {
      throw new ConversionError(
        'File is not a valid PDF',
        ERROR_CODES.INVALID_INPUT
      );
    }

    // Determine output extension
    const outputExt = outputFormatType === 'zip' ? 'zip' : 'html';
    const inputPath = this.generateTempPath('pdf');
    const outputPath = this.generateTempPath(outputExt);

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      // Check if Python environment and dependencies are available
      await this.checkPdfHtmlTooling();

      const pythonBin = this.getPythonBin();
      await this.runCommand(pythonBin, [
        PDF_TO_HTML_SCRIPT,
        inputPath,
        outputPath,
        embedImages.toString(),
        outputFormatType
      ], {
        timeout: 300000, // 5 minutes for large PDFs with many images
      });

      const outputBuffer = await this.readOutputBuffer(outputPath);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(inputPath, outputPath);
    }
  }

  async checkPdfHtmlTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [PDF_TO_HTML_SCRIPT, '--check'], {
        timeout: 30000,
      });

      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);

      if (!parsed.success) {
        throw new ConversionError(
          `PDF to HTML dependencies not available: ${parsed.error}`,
          ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
    } catch (err) {
      if (err instanceof ConversionError) throw err;
      throw new ConversionError(
        'PDF to HTML conversion service unavailable',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }

  getSupportedOptions() {
    return ['embedImages', 'format'];
  }
}

module.exports = { PdfToHtmlConverter };