/**
 * Image to PDF Converter
 * Converts JPG, PNG, WebP, SVG to PDF
 * Uses img2pdf (Python) for lossless conversion where possible
 * For multiple images, creates a multi-page PDF
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');

const IMAGE_TO_PDF_SCRIPT = path.join(__dirname, 'image_to_pdf.py');

const IMAGE_SIGNATURES = [
  { offset: 0, bytes: [0xFF, 0xD8, 0xFF], format: 'jpg' },
  { offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], format: 'png' },
  { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46], format: 'webp' }, // RIFF (check WEBP at offset 8)
  { offset: 0, bytes: [0x3C, 0x3F, 0x78, 0x6D, 0x6C], format: 'svg' }, // <?xml
  { offset: 0, bytes: [0x3C, 0x73, 0x76, 0x67], format: 'svg' }, // <svg
];

class ImageToPdfConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('image');
  }

  async convert({ inputBuffer, inputFormat, outputFormat, options = {} }) {
    // Handle both single image and multiple images
    const buffers = Array.isArray(inputBuffer) ? inputBuffer : [inputBuffer];
    const formats = Array.isArray(inputFormat) ? inputFormat : [inputFormat];

    if (buffers.length !== formats.length) {
      throw new ConversionError(
        'Buffer and format arrays must have same length',
        ERROR_CODES.INVALID_INPUT
      );
    }

    // Validate each image
    for (let i = 0; i < buffers.length; i++) {
      this.validateFileSize(buffers[i], this.maxFileSize);
      const detectedFormat = this.validateFileSignature(buffers[i], IMAGE_SIGNATURES);
      if (!detectedFormat) {
        throw new ConversionError(
          `File ${i + 1} is not a valid image`,
          ERROR_CODES.INVALID_INPUT
        );
      }
    }

    const inputPaths = [];
    try {
      // Write all images to temp files
      for (let i = 0; i < buffers.length; i++) {
        const ext = formats[i] === 'jpg' ? 'jpg' : formats[i];
        const inputPath = this.generateTempPath(ext);
        fs.writeFileSync(inputPath, buffers[i]);
        inputPaths.push(inputPath);
      }

      const outputPath = this.generateTempPath('pdf');

      await this.checkImagePdfTooling();

      const pythonBin = this.getPythonBin();
      await this.runCommand(pythonBin, [
        IMAGE_TO_PDF_SCRIPT,
        ...inputPaths,
        outputPath,
        options.pageSize || 'A4',
        (options.orientation || 'portrait'),
        (options.margin || '0').toString(),
      ], {
        timeout: 120000,
      });

      const outputBuffer = await this.readOutputBuffer(outputPath);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(...inputPaths);
    }
  }

  async checkImagePdfTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [IMAGE_TO_PDF_SCRIPT, '--check'], {
        timeout: 30000,
      });
      
      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);
      
      if (!parsed.success) {
        throw new ConversionError(
          `Image to PDF dependencies not available: ${parsed.error}`,
          ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
    } catch (err) {
      if (err instanceof ConversionError) throw err;
      throw new ConversionError(
        'Image to PDF conversion service unavailable',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }
}

module.exports = { ImageToPdfConverter };