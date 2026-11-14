/**
 * RTF to Word Converter
 * Uses LibreOffice headless for high-fidelity RTF to DOCX conversion
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');
const {
  requireLibreOffice,
  convertToPdf, // We'll reuse the conversion logic but for DOCX
} = require('./libreoffice');

const RTF_TO_DOCX_SCRIPT = path.join(__dirname, 'rtf_to_docx.py');

const RTF_SIGNATURES = [
  { offset: 0, bytes: [0x7B, 0x5C, 0x72, 0x74, 0x66], format: 'rtf' }, // {\rtf
  { offset: 0, bytes: [0x7B, 0x5C, 0x72, 0x74, 0x66, 0x31], format: 'rtf' }, // {\rtf1
];

class RtfToDocxConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('rtf') || 50 * 1024 * 1024; // 50MB
  }

  async convert({ inputBuffer, outputFormat, options = {} }) {
    this.validateFileSize(inputBuffer, this.maxFileSize);

    const detectedFormat = this.validateFileSignature(inputBuffer, RTF_SIGNATURES);
    if (!detectedFormat) {
      throw new ConversionError(
        'File is not a valid RTF document',
        ERROR_CODES.INVALID_INPUT
      );
    }

    const inputPath = this.generateTempPath('rtf');
    const outputPath = this.generateTempPath('docx');

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      await this.checkRtfDocxTooling();

      const pythonBin = this.getPythonBin();
      const optionsJson = JSON.stringify(options);
      
      await this.runCommand(pythonBin, [
        RTF_TO_DOCX_SCRIPT,
        inputPath,
        outputPath,
        optionsJson
      ], {
        timeout: 180000, // 3 minutes for LibreOffice conversion
      });

      const outputBuffer = await this.readOutputBuffer(outputPath);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(inputPath, outputPath);
    }
  }

  async checkRtfDocxTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [RTF_TO_DOCX_SCRIPT, '--check'], {
        timeout: 30000,
      });

      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);

      if (!parsed.success) {
        throw new ConversionError(
          `RTF to Word dependencies not available: ${parsed.error}`,
          ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
    } catch (err) {
      if (err instanceof ConversionError) throw err;
      throw new ConversionError(
        'RTF to Word conversion service unavailable',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }

  getSupportedOptions() {
    return ['timeout'];
  }
}

module.exports = { RtfToDocxConverter };