/**
 * Office to PDF Converter (Excel, PowerPoint)
 * Uses LibreOffice headless for high-fidelity conversion
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

const EXCEL_SIGNATURES = [
  { offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04], format: 'xlsx' }, // PK (ZIP-based)
  { offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0], format: 'xls' },  // OLE compound
];

const PPT_SIGNATURES = [
  { offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04], format: 'pptx' }, // PK (ZIP-based)
  { offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0], format: 'ppt' },  // OLE compound
];

class OfficeToPdfConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('office');
  }

  getSignatures(inputFormat) {
    if (inputFormat === 'xlsx' || inputFormat === 'xls') return EXCEL_SIGNATURES;
    if (inputFormat === 'pptx' || inputFormat === 'ppt') return PPT_SIGNATURES;
    return [];
  }

  async convert({ inputBuffer, inputFormat, outputFormat, options = {} }) {
    this.validateFileSize(inputBuffer, this.maxFileSize);

    const signatures = this.getSignatures(inputFormat);
    const detectedFormat = this.validateFileSignature(inputBuffer, signatures);
    if (!detectedFormat) {
      throw new ConversionError(
        `File is not a valid ${inputFormat.toUpperCase()} document`,
        ERROR_CODES.INVALID_INPUT
      );
    }

    const inputExt = inputFormat === 'xls' || inputFormat === 'ppt' ? inputFormat : inputFormat.replace('x', '');
    const workDir = this.generateTempWorkDir();
    const inputPath = path.join(workDir, `input.${inputExt}`);
    const outputPath = path.join(workDir, 'input.pdf');
    const profileDir = path.join(workDir, 'profile');

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      const executable = requireLibreOffice('Office to PDF');
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

module.exports = { OfficeToPdfConverter };
