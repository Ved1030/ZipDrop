/**
 * HTML to PDF Converter
 * Uses Playwright (Chromium) for high-fidelity HTML rendering
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');

const HTML_TO_PDF_SCRIPT = path.join(__dirname, 'html_to_pdf.py');

const HTML_SIGNATURES = [
  { offset: 0, bytes: [0x3C, 0x21, 0x44, 0x4F, 0x43, 0x54, 0x59, 0x50, 0x45], format: 'html' }, // <!DOCTYPE
  { offset: 0, bytes: [0x3C, 0x68, 0x74, 0x6D, 0x6C], format: 'html' }, // <html
  { offset: 0, bytes: [0x3C, 0x3F, 0x78, 0x6D, 0x6C], format: 'html' }, // <?xml
  { offset: 0, bytes: [0xEF, 0xBB, 0xBF, 0x3C], format: 'html' }, // UTF-8 BOM + <
];

class HtmlToPdfConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('html') || 25 * 1024 * 1024; // 25MB
  }

  async convert({ inputBuffer, outputFormat, options = {} }) {
    this.validateFileSize(inputBuffer, this.maxFileSize);

    const detectedFormat = this.validateFileSignature(inputBuffer, HTML_SIGNATURES);
    if (!detectedFormat) {
      // Also accept if it's valid HTML content
      const text = inputBuffer.toString('utf-8');
      if (!text.trim().startsWith('<') && !text.trim().startsWith('<!DOCTYPE')) {
        throw new ConversionError(
          'File is not a valid HTML document',
          ERROR_CODES.INVALID_INPUT
        );
      }
    }

    const inputPath = this.generateTempPath('html');
    const outputPath = this.generateTempPath('pdf');

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      await this.checkHtmlPdfTooling();

      const pythonBin = this.getPythonBin();
      const optionsJson = JSON.stringify(options);
      
      await this.runCommand(pythonBin, [
        HTML_TO_PDF_SCRIPT,
        inputPath,
        outputPath,
        optionsJson
      ], {
        timeout: 180000, // 3 minutes for HTML rendering
      });

      const outputBuffer = await this.readOutputBuffer(outputPath);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(inputPath, outputPath);
    }
  }

  async checkHtmlPdfTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [HTML_TO_PDF_SCRIPT, '--check'], {
        timeout: 30000,
      });

      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);

      if (!parsed.success) {
        throw new ConversionError(
          `HTML to PDF dependencies not available: ${parsed.error}`,
          ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
    } catch (err) {
      if (err instanceof ConversionError) throw err;
      throw new ConversionError(
        'HTML to PDF conversion service unavailable',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }

  getSupportedOptions() {
    return ['pageSize', 'orientation', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'printBackground', 'scale', 'timeout'];
  }
}

module.exports = { HtmlToPdfConverter };