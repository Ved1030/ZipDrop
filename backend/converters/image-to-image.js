/**
 * Image to Image Converter
 * Converts between JPG, PNG, WEBP, SVG formats
 * Uses Pillow (Python) for high-quality conversions
 */

const fs = require('fs');
const path = require('path');
const { BaseConverter } = require('./base');
const { ConversionError, ERROR_CODES } = require('./types');

const IMAGE_TO_IMAGE_SCRIPT = path.join(__dirname, 'image_to_image.py');

const IMAGE_SIGNATURES = [
  { offset: 0, bytes: [0xFF, 0xD8, 0xFF], format: 'jpg' },
  { offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], format: 'png' },
  { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46], format: 'webp' }, // RIFF (check WEBP at offset 8)
  { offset: 0, bytes: [0x3C, 0x3F, 0x78, 0x6D, 0x6C], format: 'svg' }, // <?xml
  { offset: 0, bytes: [0x3C, 0x73, 0x76, 0x67], format: 'svg' }, // <svg
  { offset: 0, bytes: [0xFF, 0xFE, 0x3C, 0x00], format: 'svg' }, // UTF-16 LE BOM + <svg
  { offset: 0, bytes: [0xFE, 0xFF, 0x00, 0x3C], format: 'svg' }, // UTF-16 BE BOM + <svg
];

const SUPPORTED_INPUT_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
const SUPPORTED_OUTPUT_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];

class ImageToImageConverter extends BaseConverter {
  constructor() {
    super();
    this.maxFileSize = this.getMaxFileSize('image');
  }

  getSignatures(inputFormat) {
    // For SVG, check both XML and <svg signatures
    if (inputFormat === 'svg') {
      return IMAGE_SIGNATURES.filter(s => s.format === 'svg');
    }
    // For others, check their specific signatures
    return IMAGE_SIGNATURES.filter(s => s.format === inputFormat || (inputFormat === 'jpg' && s.format === 'jpeg') || (inputFormat === 'jpeg' && s.format === 'jpg'));
  }

  async convert({ inputBuffer, inputFormat, outputFormat, options = {} }) {
    // Normalize format names
    const normInput = inputFormat === 'jpeg' ? 'jpg' : inputFormat;
    const normOutput = outputFormat === 'jpeg' ? 'jpg' : outputFormat;

    this.validateFileSize(inputBuffer, this.maxFileSize);

    // Validate input format
    if (!SUPPORTED_INPUT_FORMATS.includes(normInput)) {
      throw new ConversionError(
        `Unsupported input format: ${inputFormat}`,
        ERROR_CODES.UNSUPPORTED_FORMAT
      );
    }

    // Validate output format
    if (!SUPPORTED_OUTPUT_FORMATS.includes(normOutput)) {
      throw new ConversionError(
        `Unsupported output format: ${outputFormat}`,
        ERROR_CODES.UNSUPPORTED_FORMAT
      );
    }

    // Validate file signature
    const signatures = this.getSignatures(normInput);
    const detectedFormat = this.validateFileSignature(inputBuffer, signatures);
    if (!detectedFormat) {
      throw new ConversionError(
        `File is not a valid ${inputFormat.toUpperCase()} image`,
        ERROR_CODES.INVALID_INPUT
      );
    }

    // Get options
    const quality = Math.min(Math.max(options.quality || 90, 1), 100);
    const lossless = options.lossless === true || options.lossless === 'true';
    const width = options.width ? parseInt(options.width) : null;
    const height = options.height ? parseInt(options.height) : null;
    const backgroundColor = options.backgroundColor || null;

    const inputExt = normInput === 'jpg' ? 'jpg' : normInput;
    const outputExt = normOutput === 'jpg' ? 'jpg' : normOutput;

    const inputPath = this.generateTempPath(inputExt);
    const outputPath = this.generateTempPath(outputExt);

    try {
      fs.writeFileSync(inputPath, inputBuffer);

      await this.checkImageImageTooling();

      const pythonBin = this.getPythonBin();
      const result = await this.runCommand(pythonBin, [
        IMAGE_TO_IMAGE_SCRIPT,
        inputPath,
        outputPath,
        normInput,
        normOutput,
        quality.toString(),
        lossless.toString(),
        width ? width.toString() : '',
        height ? height.toString() : '',
        backgroundColor || ''
      ], {
        timeout: 120000,
      });

      // Parse Python script result
      const lastLine = result.stdout.trim().split('\n').pop();
      let parsed;
      try {
        parsed = JSON.parse(lastLine);
      } catch (e) {
        throw new ConversionError(
          'Invalid response from Image to Image converter',
          ERROR_CODES.CONVERSION_FAILED,
          { stdout: result.stdout, stderr: result.stderr }
        );
      }

      if (!parsed.success) {
        const errorCode = parsed.code === 'INVALID_INPUT' ? ERROR_CODES.INVALID_INPUT :
                         parsed.code === 'UNSUPPORTED_FORMAT' ? ERROR_CODES.UNSUPPORTED_FORMAT :
                         ERROR_CODES.CONVERSION_FAILED;
        throw new ConversionError(
          parsed.error || 'Image to Image conversion failed',
          errorCode,
          { details: parsed }
        );
      }

      const outputBuffer = await this.readOutputBuffer(outputPath);
      return outputBuffer;
    } finally {
      this.cleanupTempFiles(inputPath, outputPath);
    }
  }

  async checkImageImageTooling() {
    const pythonBin = this.getPythonBin();
    try {
      const result = await this.runCommand(pythonBin, [IMAGE_TO_IMAGE_SCRIPT, '--check'], {
        timeout: 30000,
      });

      const lastLine = result.stdout.trim().split('\n').pop();
      const parsed = JSON.parse(lastLine);

      if (!parsed.success) {
        throw new ConversionError(
          `Image to Image dependencies not available: ${parsed.error}`,
          ERROR_CODES.MISSING_DEPENDENCY,
          { details: parsed }
        );
      }
    } catch (err) {
      if (err instanceof ConversionError) throw err;
      throw new ConversionError(
        'Image to Image conversion service unavailable',
        ERROR_CODES.MISSING_DEPENDENCY,
        { originalError: err.message }
      );
    }
  }
}

module.exports = { ImageToImageConverter };