/**
 * Word to PDF Converter
 * Uses LibreOffice headless for high-fidelity conversion
 * Preserves fonts, layout, headers/footers, tables, images
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');

const WORD_SIGNATURES = [
  { offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04], format: 'docx' }, // PK (ZIP-based)
  { offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0], format: 'doc' },  // OLE compound
];

class WordToPdfConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('office');
    this.libreOfficePath = this.findLibreOffice();
  }

  findLibreOffice() {
    const candidates = [
      // Linux/Render
      '/usr/bin/libreoffice',
      '/usr/bin/soffice',
      // Windows
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
      // macOS
      '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    // Check if in PATH
    return 'libreoffice';
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
    const inputPath = this.generateTempPath(inputExt);
    const outputDir = this.tempDir;

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      // Check LibreOffice availability
      await this.checkLibreOffice();

      // Convert using LibreOffice headless
      await this.runCommand(this.libreOfficePath, [
        '--headless',
        '--nologo',
        '--norestore',
        '--nolockcheck',
        '--convert-to', 'pdf',
        '--outdir', outputDir,
        inputPath
      ], {
        timeout: 180000, // 3 minutes
      });

      // Find output PDF (LibreOffice names it based on input)
      const outputName = path.basename(inputPath, `.${inputExt}`) + '.pdf';
      const outputPath = path.join(outputDir, outputName);

      const outputBuffer = await this.readOutputBuffer(outputPath);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(inputPath);
      // Clean up output PDF too
      const outputName = path.basename(inputPath, `.${inputExt}`) + '.pdf';
      this.cleanupTempFiles(path.join(this.tempDir, outputName));
    }
  }

  async checkLibreOffice() {
    try {
      await this.runCommand(this.libreOfficePath, ['--version'], { timeout: 10000 });
    } catch (err) {
      throw new ConversionError(
        'LibreOffice not available for Word to PDF conversion',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }
}

module.exports = { WordToPdfConverter };