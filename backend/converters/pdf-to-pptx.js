/**
 * PDF to PowerPoint Converter
 * Uses PyMuPDF (fitz) for extraction and python-pptx for PPTX generation
 * Supports two modes: Visual Fidelity and Editable
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');

const PDF_TO_PPTX_SCRIPT = path.join(__dirname, 'pdf_to_pptx.py');

const PDF_SIGNATURES = [
  { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2D], format: 'pdf' }, // %PDF-
];

class PdfToPptxConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('pdf');
  }

  async convert({ inputBuffer, outputFormat, options = {} }) {
    const mode = options.mode || 'editable'; // 'editable' | 'visual-fidelity'
    const dpi = Math.min(Math.max(options.dpi || 200, 72), 600);

    this.validateFileSize(inputBuffer, this.maxFileSize);

    const detectedFormat = this.validateFileSignature(inputBuffer, PDF_SIGNATURES);
    if (!detectedFormat) {
      throw new ConversionError(
        'File is not a valid PDF',
        ERROR_CODES.INVALID_INPUT
      );
    }

    if (!['editable', 'visual-fidelity'].includes(mode)) {
      throw new ConversionError(
        "Invalid mode. Use 'editable' or 'visual-fidelity'",
        ERROR_CODES.INVALID_INPUT
      );
    }

    const inputPath = this.generateTempPath('pdf');
    const outputPath = this.generateTempPath('pptx');

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      // Check if Python environment and dependencies are available
      await this.checkPdfPptxTooling();

      const pythonBin = this.getPythonBin();
      await this.runCommand(pythonBin, [
        PDF_TO_PPTX_SCRIPT,
        inputPath,
        outputPath,
        mode,
        dpi.toString()
      ], {
        timeout: 300000, // 5 minutes for high-DPI large PDFs
      });

      const outputBuffer = await this.readOutputBuffer(outputPath);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(inputPath, outputPath);
    }
  }

  async checkPdfPptxTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [PDF_TO_PPTX_SCRIPT, '--check'], {
        timeout: 30000,
      });

      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);

      if (!parsed.success) {
        throw new ConversionError(
          `PDF to PowerPoint dependencies not available: ${parsed.error}`,
          ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
    } catch (err) {
      if (err instanceof ConversionError) throw err;
      throw new ConversionError(
        'PDF to PowerPoint conversion service unavailable',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }

  getSupportedModes() {
    return ['editable', 'visual-fidelity'];
  }

  getSupportedOptions() {
    return ['mode', 'dpi'];
  }
}

module.exports = { PdfToPptxConverter };