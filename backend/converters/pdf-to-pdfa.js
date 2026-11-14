/**
 * PDF to PDF/A Converter
 * Uses Ghostscript for PDF/A conversion and validation
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');

const PDF_TO_PDFA_SCRIPT = path.join(__dirname, 'pdf_to_pdfa.py');

const PDF_SIGNATURES = [
  { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2D], format: 'pdf' }, // %PDF-
];

class PdfToPdfaConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('pdf');
  }

  async convert({ inputBuffer, outputFormat, options = {} }) {
    const conformance = options.conformance || 'pdfa-2b'; // pdfa-1b, pdfa-2b, pdfa-3b

    this.validateFileSize(inputBuffer, this.maxFileSize);

    const detectedFormat = this.validateFileSignature(inputBuffer, PDF_SIGNATURES);
    if (!detectedFormat) {
      throw new ConversionError(
        'File is not a valid PDF',
        ERROR_CODES.INVALID_INPUT
      );
    }

    const validConformance = ['pdfa-1b', 'pdfa-2b', 'pdfa-3b'];
    if (!validConformance.includes(conformance)) {
      throw new ConversionError(
        `Invalid conformance level. Use: ${validConformance.join(', ')}`,
        ERROR_CODES.INVALID_INPUT
      );
    }

    const inputPath = this.generateTempPath('pdf');
    const outputPath = this.generateTempPath('pdf');

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      // Check if Python environment and Ghostscript are available
      await this.checkPdfaTooling();

      const pythonBin = this.getPythonBin();
      await this.runCommand(pythonBin, [
        PDF_TO_PDFA_SCRIPT,
        inputPath,
        outputPath,
        conformance
      ], {
        timeout: 300000, // 5 minutes for large PDFs
      });

      const outputBuffer = await this.readOutputBuffer(outputPath);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(inputPath, outputPath);
    }
  }

  async checkPdfaTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [PDF_TO_PDFA_SCRIPT, '--check'], {
        timeout: 30000,
      });

      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);

      if (!parsed.success) {
        throw new ConversionError(
          `PDF to PDF/A dependencies not available: ${parsed.error}`,
          ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
    } catch (err) {
      if (err instanceof ConversionError) throw err;
      throw new ConversionError(
        'PDF to PDF/A conversion service unavailable',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }

  getSupportedOptions() {
    return ['conformance'];
  }
}

module.exports = { PdfToPdfaConverter };