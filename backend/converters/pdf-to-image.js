/**
 * PDF to Image Converter (JPG/PNG)
 * Uses PyMuPDF (fitz) for high-quality rasterization
 * Supports DPI control, page range, and quality settings
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');

const PDF_TO_IMAGE_SCRIPT = path.join(__dirname, 'pdf_to_image.py');

const PDF_SIGNATURES = [
  { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2D], format: 'pdf' }, // %PDF-
];

class PdfToImageConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('pdf');
  }

  async convert({ inputBuffer, outputFormat, options = {} }) {
    // outputFormat is 'jpg' or 'png'
    this.validateFileSize(inputBuffer, this.maxFileSize);

    const detectedFormat = this.validateFileSignature(inputBuffer, PDF_SIGNATURES);
    if (!detectedFormat) {
      throw new ConversionError(
        'File is not a valid PDF',
        ERROR_CODES.INVALID_INPUT
      );
    }

    const dpi = Math.min(Math.max(options.dpi || 200, 72), 600);
    const pageRange = options.pages || 'all'; // 'all', '1', '1-3', '1,3,5'
    const quality = options.quality || 90; // For JPG
    const grayscale = options.grayscale || false;

    const inputPath = this.generateTempPath('pdf');
    const outputDir = this.generateTempPath('');

    try {
      fs.writeFileSync(inputPath, inputBuffer);
      
      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      await this.checkPdfImageTooling();

      const pythonBin = this.getPythonBin();
      const result = await this.runCommand(pythonBin, [
        PDF_TO_IMAGE_SCRIPT,
        inputPath,
        outputDir,
        outputFormat,
        dpi.toString(),
        pageRange,
        quality.toString(),
        grayscale.toString()
      ], {
        timeout: 300000, // 5 minutes for high-DPI large PDFs
      });

      // Parse Python script result
      const lastLine = result.stdout.trim().split('\n').pop();
      let parsed;
      try {
        parsed = JSON.parse(lastLine);
      } catch (e) {
        throw new ConversionError(
          'Invalid response from PDF to Image converter',
          ERROR_CODES.CONVERSION_FAILED,
          { stdout: result.stdout, stderr: result.stderr }
        );
      }

      if (!parsed.success) {
        throw new ConversionError(
          parsed.error || 'PDF to Image conversion failed',
          ERROR_CODES.CONVERSION_FAILED,
          { details: parsed }
        );
      }

      // Read all output images and create ZIP if multiple pages
      const outputFiles = fs.readdirSync(outputDir)
        .filter(f => f.endsWith(`.${outputFormat}`))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || '0');
          const numB = parseInt(b.match(/\d+/)?.[0] || '0');
          return numA - numB;
        });

      if (outputFiles.length === 0) {
        throw new ConversionError(
          'No images were generated from PDF',
          ERROR_CODES.CONVERSION_FAILED
        );
      }

      if (outputFiles.length === 1) {
        // Single page - return the image directly
        const outputPath = path.join(outputDir, outputFiles[0]);
        const buffer = await this.readOutputBuffer(outputPath);
        // Cleanup after reading
        this.cleanupTempFiles(inputPath);
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
        }
        return buffer;
      } else {
        // Multiple pages - create ZIP
        const archiver = require('archiver');
        const archive = archiver('zip', { zlib: { level: 6 } });
        const chunks = [];

        return new Promise((resolve, reject) => {
          archive.on('data', (chunk) => chunks.push(chunk));
          archive.on('end', () => {
            // Cleanup after ZIP is created
            this.cleanupTempFiles(inputPath);
            if (fs.existsSync(outputDir)) {
              fs.rmSync(outputDir, { recursive: true, force: true });
            }
            resolve(Buffer.concat(chunks));
          });
          archive.on('error', (err) => {
            // Cleanup on error
            this.cleanupTempFiles(inputPath);
            if (fs.existsSync(outputDir)) {
              fs.rmSync(outputDir, { recursive: true, force: true });
            }
            reject(err);
          });

          for (const file of outputFiles) {
            const filePath = path.join(outputDir, file);
            archive.file(filePath, { name: file });
          }
          archive.finalize();
        });
      }
    } catch (err) {
      // Cleanup on any other error
      this.cleanupTempFiles(inputPath);
      if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }
      throw err;
    }
  }

  async checkPdfImageTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [PDF_TO_IMAGE_SCRIPT, '--check'], {
        timeout: 30000,
      });
      
      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);
      
      if (!parsed.success) {
        throw new ConversionError(
          `PDF to Image dependencies not available: ${parsed.error}`,
          ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
    } catch (err) {
      if (err instanceof ConversionError) throw err;
      throw new ConversionError(
        'PDF to Image conversion service unavailable',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }
}

module.exports = { PdfToImageConverter };