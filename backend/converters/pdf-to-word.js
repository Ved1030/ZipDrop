/**
 * PDF to Word Converter
 * Uses pdf2docx (Python) for high-fidelity layout preservation
 * Supports two modes: editable and visual-fidelity
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');

const PDF_CONVERTER_SCRIPT = path.join(__dirname, '..', 'pdf_converter.py');

const PDF_SIGNATURES = [
  { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2D], format: 'pdf' }, // %PDF-
];

class PdfToWordConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('pdf');
  }

  async convert({ inputBuffer, outputFormat, options = {} }) {
    const mode = options.mode || 'editable'; // 'editable' | 'visual-fidelity'
    
    this.validateFileSize(inputBuffer, this.maxFileSize);
    
    const detectedFormat = this.validateFileSignature(inputBuffer, PDF_SIGNATURES);
    if (!detectedFormat) {
      throw new ConversionError(
        'File is not a valid PDF',
        ERROR_CODES.INVALID_INPUT
      );
    }

    const inputPath = this.generateTempPath('pdf');
    const outputPath = this.generateTempPath('docx');

    try {
      fs.writeFileSync(inputPath, inputBuffer);
      
      // Check if Python environment and pdf2docx are available
      await this.checkPdfTooling();
      
      // Run conversion with mode parameter
      const pythonBin = this.getPythonBin();
      await this.runCommand(pythonBin, [PDF_CONVERTER_SCRIPT, inputPath, outputPath, mode], {
        timeout: 180000, // 3 minutes for large PDFs
      });

      const outputBuffer = await this.readOutputBuffer(outputPath);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(inputPath, outputPath);
    }
  }

  async checkPdfTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [PDF_CONVERTER_SCRIPT, '--check'], {
        timeout: 30000,
      });
      
      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);
      
      if (!parsed.success) {
        throw new ConversionError(
          `PDF conversion dependencies not available: ${parsed.error}`,
          ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
    } catch (err) {
      if (err instanceof ConversionError) throw err;
      throw new ConversionError(
        'PDF conversion service unavailable',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }

  getSupportedModes() {
    return ['editable', 'visual-fidelity'];
  }
}

module.exports = { PdfToWordConverter };