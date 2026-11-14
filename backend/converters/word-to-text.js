/**
 * Word to Text Converter
 * Uses python-docx for text extraction
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');

const DOCX_TO_TEXT_SCRIPT = path.join(__dirname, 'docx_to_text.py');

const DOCX_SIGNATURES = [
  { offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04], format: 'docx' }, // PK (ZIP-based)
  { offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0], format: 'doc' },  // OLE compound
];

class WordToTextConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('office');
  }

  async convert({ inputBuffer, outputFormat, options = {} }) {
    this.validateFileSize(inputBuffer, this.maxFileSize);

    const detectedFormat = this.validateFileSignature(inputBuffer, DOCX_SIGNATURES);
    if (!detectedFormat) {
      throw new ConversionError(
        'File is not a valid Word document (DOCX or DOC)',
        ERROR_CODES.INVALID_INPUT
      );
    }

    const inputPath = this.generateTempPath('docx');
    const outputPath = this.generateTempPath('txt');

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      await this.checkDocxTextTooling();

      const pythonBin = this.getPythonBin();
      await this.runCommand(pythonBin, [DOCX_TO_TEXT_SCRIPT, inputPath, outputPath], {
        timeout: 120000,
      });

      const outputBuffer = await this.readOutputBuffer(outputPath);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(inputPath, outputPath);
    }
  }

  async checkDocxTextTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [DOCX_TO_TEXT_SCRIPT, '--check'], {
        timeout: 30000,
      });

      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);

      if (!parsed.success) {
        throw new ConversionError(
          `Word to Text dependencies not available: ${parsed.error}`,
          ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
    } catch (err) {
      if (err instanceof ConversionError) throw err;
      throw new ConversionError(
        'Word to Text conversion service unavailable',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }

  getSupportedOptions() {
    return [];
  }
}

module.exports = { WordToTextConverter };