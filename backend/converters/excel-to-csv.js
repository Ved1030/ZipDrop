/**
 * Excel to CSV Converter
 * Uses openpyxl for CSV extraction
 * Handles multiple worksheets by creating ZIP archives
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');

const XLSX_TO_CSV_SCRIPT = path.join(__dirname, 'xlsx_to_csv.py');

const XLSX_SIGNATURES = [
  { offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04], format: 'xlsx' }, // PK (ZIP-based)
  { offset: 0, bytes: [0xD0, 0xCF, 0x11, 0xE0], format: 'xls' },  // OLE compound
];

class ExcelToCsvConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('office');
  }

  async convert({ inputBuffer, inputFormat, outputFormat, options = {} }) {
    this.validateFileSize(inputBuffer, this.maxFileSize);

    const signatures = inputFormat === 'xls' ? XLSX_SIGNATURES.slice(1) : XLSX_SIGNATURES;
    const detectedFormat = this.validateFileSignature(inputBuffer, signatures);
    if (!detectedFormat) {
      throw new ConversionError(
        `File is not a valid ${inputFormat.toUpperCase()} document`,
        ERROR_CODES.INVALID_INPUT
      );
    }

    // For XLSX to CSV, output can be CSV or ZIP
    const outputExt = 'csv'; // We'll let the Python script decide based on sheet count
    const inputExt = inputFormat === 'xls' ? 'xls' : 'xlsx';
    const inputPath = this.generateTempPath(inputExt);
    const outputPath = this.generateTempPath(outputExt);

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      await this.checkXlsxCsvTooling();

      const pythonBin = this.getPythonBin();
      await this.runCommand(pythonBin, [XLSX_TO_CSV_SCRIPT, inputPath, outputPath], {
        timeout: 180000,
      });

      const outputBuffer = await this.readOutputBuffer(outputPath);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(inputPath, outputPath);
    }
  }

  async checkXlsxCsvTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [XLSX_TO_CSV_SCRIPT, '--check'], {
        timeout: 30000,
      });

      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);

      if (!parsed.success) {
        throw new ConversionError(
          `Excel to CSV dependencies not available: ${parsed.error}`,
          ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
    } catch (err) {
      if (err instanceof ConversionError) throw err;
      throw new ConversionError(
        'Excel to CSV conversion service unavailable',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }

  getSupportedOptions() {
    return [];
  }
}

module.exports = { ExcelToCsvConverter };