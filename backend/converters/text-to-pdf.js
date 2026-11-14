/**
 * Text to PDF Converter
 * Uses ReportLab (Python) for PDF generation with Unicode support
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');

const TXT_TO_PDF_SCRIPT = path.join(__dirname, 'txt_to_pdf.py');

const TXT_SIGNATURES = [
  // Text files don't have a standard signature, so we accept any file
  // but validate it's valid text in the Python script
];

class TextToPdfConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('txt') || 10 * 1024 * 1024; // 10MB default for text
  }

  async convert({ inputBuffer, outputFormat, options = {} }) {
    this.validateFileSize(inputBuffer, this.maxFileSize);

    // Basic validation - check if it's valid text
    try {
      const text = inputBuffer.toString('utf-8');
      // Check for null bytes which would indicate binary
      if (text.includes('\0')) {
        throw new ConversionError(
          'File appears to be binary, not a text file',
          ERROR_CODES.INVALID_INPUT
        );
      }
    } catch (e) {
      if (e instanceof ConversionError) throw e;
      throw new ConversionError(
        'File is not a valid text file',
        ERROR_CODES.INVALID_INPUT
      );
    }

    const inputPath = this.generateTempPath('txt');
    const outputPath = this.generateTempPath('pdf');

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      await this.checkTxtPdfTooling();

      const pythonBin = this.getPythonBin();
      const optionsJson = JSON.stringify(options);
      
      await this.runCommand(pythonBin, [
        TXT_TO_PDF_SCRIPT,
        inputPath,
        outputPath,
        optionsJson
      ], {
        timeout: 120000,
      });

      const outputBuffer = await this.readOutputBuffer(outputPath);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(inputPath, outputPath);
    }
  }

  async checkTxtPdfTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [TXT_TO_PDF_SCRIPT, '--check'], {
        timeout: 30000,
      });

      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);

      if (!parsed.success) {
        throw new ConversionError(
          `Text to PDF dependencies not available: ${parsed.error}`,
          ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
    } catch (err) {
      if (err instanceof ConversionError) throw err;
      throw new ConversionError(
        'Text to PDF conversion service unavailable',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }

  getSupportedOptions() {
    return ['pageSize', 'orientation', 'fontSize', 'fontFamily', 'alignment', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'pageNumbers'];
  }
}

module.exports = { TextToPdfConverter };