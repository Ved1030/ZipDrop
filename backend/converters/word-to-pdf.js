/**
 * Word to PDF Converter
 * Uses LibreOffice headless for high-fidelity conversion
 * Preserves fonts, layout, headers/footers, tables, images
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');
const {
  requireLibreOffice,
  convertToPdf,
  validatePdfBuffer,
} = require('./libreoffice');

const WORD_SIGNATURES = [
  { offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04], format: 'docx' }, // PK (ZIP-based)
  { offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0], format: 'doc' },  // OLE compound
];

class WordToPdfConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('office');
  }

  async convert({ inputBuffer, inputFormat, outputFormat, options = {} }) {
    this.validateFileSize(inputBuffer, this.maxFileSize);

    const detectedFormat = this.validateFileSignature(inputBuffer, WORD_SIGNATURES);
    if (!detectedFormat) {
      throw new ConversionError(
        'File is not a valid Word document (DOCX or DOC)',
        ERROR_CODES.INVALID_INPUT
      );
    }

    const inputExt = inputFormat === 'doc' ? 'doc' : 'docx';
    const workDir = this.generateTempWorkDir();
    const inputPath = path.join(workDir, `input.${inputExt}`);
    const outputPath = path.join(workDir, 'input.pdf');
    const profileDir = path.join(workDir, 'profile');

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      const executable = requireLibreOffice('Word to PDF');
      await convertToPdf({
        executable,
        inputPath,
        outputDir: workDir,
        profileDir,
      });

      const outputBuffer = await this.readOutputBuffer(outputPath);
      validatePdfBuffer(outputBuffer);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(workDir);
    }
  }
}

module.exports = { WordToPdfConverter };
