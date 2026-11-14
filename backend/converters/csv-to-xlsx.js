/**
 * CSV to Excel Converter
 * Uses openpyxl (Python) for CSV parsing and XLSX generation
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');

const CSV_TO_XLSX_SCRIPT = path.join(__dirname, 'csv_to_xlsx.py');

const CSV_SIGNATURES = [
  // CSV files don't have a standard signature
];

class CsvToXlsxConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('csv') || 50 * 1024 * 1024; // 50MB
  }

  async convert({ inputBuffer, outputFormat, options = {} }) {
    this.validateFileSize(inputBuffer, this.maxFileSize);

    // Basic validation - check if it's valid CSV text
    try {
      const text = inputBuffer.toString('utf-8');
      if (text.includes('\0')) {
        throw new ConversionError(
          'File appears to be binary, not a CSV file',
          ERROR_CODES.INVALID_INPUT
        );
      }
      // Check if it has at least some CSV-like structure
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length === 0) {
        throw new ConversionError(
          'CSV file is empty',
          ERROR_CODES.INVALID_INPUT
        );
      }
    } catch (e) {
      if (e instanceof ConversionError) throw e;
      throw new ConversionError(
        'File is not a valid CSV file',
        ERROR_CODES.INVALID_INPUT
      );
    }

    const inputPath = this.generateTempPath('csv');
    const outputPath = this.generateTempPath('xlsx');

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      await this.checkCsvXlsxTooling();

      const pythonBin = this.getPythonBin();
      const optionsJson = JSON.stringify(options);
      
      await this.runCommand(pythonBin, [
        CSV_TO_XLSX_SCRIPT,
        inputPath,
        outputPath,
        optionsJson
      ], {
        timeout: 180000, // 3 minutes for large CSV files
      });

      const outputBuffer = await this.readOutputBuffer(outputPath);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(inputPath, outputPath);
    }
  }

  async checkCsvXlsxTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [CSV_TO_XLSX_SCRIPT, '--check'], {
        timeout: 30000,
      });

      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);

      if (!parsed.success) {
        throw new ConversionError(
          `CSV to Excel dependencies not available: ${parsed.error}`,
          ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
    } catch (err) {
      if (err instanceof ConversionError) throw err;
      throw new ConversionError(
        'CSV to Excel conversion service unavailable',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }

  getSupportedOptions() {
    return ['encoding', 'delimiter', 'sheetName', 'hasHeader', 'skipRows', 'maxRows'];
  }
}

module.exports = { CsvToXlsxConverter };