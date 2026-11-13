/**
 * Office to PDF Converter (Excel, PowerPoint)
 * Uses LibreOffice headless for high-fidelity conversion
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');

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
    this.libreOfficePath = this.findLibreOffice();
  }

  findLibreOffice() {
    const candidates = [
      '/usr/bin/libreoffice',
      '/usr/bin/soffice',
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
      '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return 'libreoffice';
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
    const inputPath = this.generateTempPath(inputExt);
    const outputDir = this.tempDir;

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      await this.checkLibreOffice();

      // Build LibreOffice arguments
      const args = [
        '--headless',
        '--nologo',
        '--norestore',
        '--nolockcheck',
        '--convert-to', 'pdf',
        '--outdir', outputDir,
      ];

      // Add Excel-specific options
      if (inputFormat === 'xlsx' || inputFormat === 'xls') {
        // Could add filter options for sheet selection, print area, etc.
      }

      args.push(inputPath);

      await this.runCommand(this.libreOfficePath, args, {
        timeout: 180000,
      });

      // Find output PDF
      const outputName = path.basename(inputPath, `.${inputExt}`) + '.pdf';
      const outputPath = path.join(outputDir, outputName);

      const outputBuffer = await this.readOutputBuffer(outputPath);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(inputPath);
      const outputName = path.basename(inputPath, `.${inputExt}`) + '.pdf';
      this.cleanupTempFiles(path.join(this.tempDir, outputName));
    }
  }

  async checkLibreOffice() {
    try {
      await this.runCommand(this.libreOfficePath, ['--version'], { timeout: 10000 });
    } catch (err) {
      throw new ConversionError(
        'LibreOffice not available for Office to PDF conversion',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }
}

module.exports = { OfficeToPdfConverter };