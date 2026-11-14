/**
 * Base Compressor Class
 * Provides common utilities for all compressors
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const {
  CompressionError,
  COMPRESSION_ERROR_CODES,
  COMPRESSION_FILE_SIZE_LIMITS,
  COMPRESSION_MIME_TYPES,
} = require('./types');

class BaseCompressor {
  constructor() {
    this.tempDir = path.join(__dirname, '..', 'temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  generateTempPath(extension) {
    if (!extension) {
      return path.join(this.tempDir, uuidv4());
    }
    return path.join(this.tempDir, `${uuidv4()}.${extension}`);
  }

  generateTempWorkDir() {
    const workDir = path.join(this.tempDir, `compress-${uuidv4()}`);
    fs.mkdirSync(workDir, { recursive: true });
    return workDir;
  }

  cleanupTempFiles(...paths) {
    for (const filePath of paths) {
      try {
        if (filePath && fs.existsSync(filePath)) {
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
        }
      } catch (err) {
        console.warn(`[Compressor] Failed to cleanup temp file ${filePath}:`, err.message);
      }
    }
  }

  getSpawnOptions(options = {}) {
    const spawnOptions = {
      env: { ...process.env, ...options.env },
      cwd: options.cwd || process.cwd(),
      timeout: options.timeout || 120000,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    };

    if (process.platform === 'win32') {
      spawnOptions.windowsVerbatimArguments = false;
      spawnOptions.windowsHide = true;
    }

    return spawnOptions;
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const spawnOptions = this.getSpawnOptions(options);
      const proc = spawn(command, args, spawnOptions);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new CompressionError(
            `Command failed with code ${code}: ${stderr}`,
            COMPRESSION_ERROR_CODES.COMPRESSION_FAILED,
            { command, args, code, stderr }
          ));
        } else {
          resolve({ stdout, stderr, code });
        }
      });

      proc.on('error', (err) => {
        reject(new CompressionError(
          `Failed to spawn process: ${err.message}`,
          COMPRESSION_ERROR_CODES.COMPRESSION_FAILED,
          { command, args, error: err.message }
        ));
      });
    });
  }

  getPythonBin() {
    const venvPython = path.join(__dirname, '..', '.venv', 'bin', 'python');
    if (fs.existsSync(venvPython)) return venvPython;
    
    const venvPythonWin = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe');
    if (fs.existsSync(venvPythonWin)) return venvPythonWin;
    
    return process.platform === 'win32' ? 'python' : 'python3';
  }

  validateFileSize(buffer, maxSize) {
    if (buffer.length > maxSize) {
      throw new CompressionError(
        `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)} MB`,
        COMPRESSION_ERROR_CODES.FILE_TOO_LARGE,
        { size: buffer.length, maxSize }
      );
    }
  }

  validateFileSignature(buffer, signatures) {
    for (const { offset, bytes, format } of signatures) {
      const slice = buffer.slice(offset, offset + bytes.length);
      if (slice.equals(Buffer.from(bytes))) {
        return format;
      }
    }
    return null;
  }

  async readOutputBuffer(outputPath) {
    if (!fs.existsSync(outputPath)) {
      throw new CompressionError(
        'Output file was not created',
        COMPRESSION_ERROR_CODES.COMPRESSION_FAILED
      );
    }
    const buffer = fs.readFileSync(outputPath);
    if (buffer.length === 0) {
      throw new CompressionError(
        'Compression produced empty output',
        COMPRESSION_ERROR_CODES.COMPRESSION_FAILED
      );
    }
    return buffer;
  }

  getMaxFileSize(format) {
    return COMPRESSION_FILE_SIZE_LIMITS[format] || COMPRESSION_FILE_SIZE_LIMITS.default;
  }

  getMimeType(format) {
    return COMPRESSION_MIME_TYPES[format] || 'application/octet-stream';
  }

  /**
   * Validate input before compression
   * Returns validation result with warnings/errors
   */
  validateInput(buffer, format) {
    const result = {
      valid: true,
      warnings: [],
      errors: [],
      metadata: {}
    };

    // Check file size
    const maxSize = this.getMaxFileSize(format);
    if (buffer.length > maxSize) {
      result.valid = false;
      result.errors.push(`File size ${buffer.length} bytes exceeds limit of ${maxSize} bytes`);
    }

    // Check for empty file
    if (buffer.length === 0) {
      result.valid = false;
      result.errors.push('File is empty');
    }

    // Format-specific validation
    if (format === 'pdf') {
      // Check PDF header
      if (buffer.length < 5 || !buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
        result.valid = false;
        result.errors.push('Invalid PDF file signature');
      }
    } else if (['jpg', 'jpeg'].includes(format)) {
      // Check JPEG signature (FF D8 FF)
      if (buffer.length < 3 || buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
        result.warnings.push('File may not be a valid JPEG');
      }
    } else if (format === 'png') {
      // Check PNG signature
      const pngSig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      if (buffer.length < 8 || !buffer.subarray(0, 8).equals(pngSig)) {
        result.warnings.push('File may not be a valid PNG');
      }
    } else if (format === 'webp') {
      // Check WEBP signature (RIFF....WEBP)
      if (buffer.length < 12 || 
          buffer.subarray(0, 4).equals(Buffer.from('RIFF')) === false ||
          buffer.subarray(8, 12).equals(Buffer.from('WEBP')) === false) {
        result.warnings.push('File may not be a valid WEBP');
      }
    }

    // Extract basic metadata
    result.metadata.size = buffer.length;
    result.metadata.format = format;

    return result;
  }

  /**
   * Validate output after compression
   * Returns validation result with comparison stats
   */
  validateOutput(originalBuffer, compressedBuffer, format) {
    const originalSize = originalBuffer.length;
    const compressedSize = compressedBuffer.length;
    const bytesSaved = originalSize - compressedSize;
    const reductionPercent = originalSize > 0 ? ((bytesSaved / originalSize) * 100) : 0;
    const isSmaller = compressedSize < originalSize;

    const result = {
      valid: true,
      originalSize,
      compressedSize,
      bytesSaved,
      reductionPercent: Math.round(reductionPercent * 100) / 100,
      isSmaller,
      warnings: [],
      errors: []
    };

    // Check for empty output
    if (compressedSize === 0) {
      result.valid = false;
      result.errors.push('Compressed output is empty');
      return result;
    }

    // Check if output is larger than input
    if (!isSmaller) {
      result.warnings.push(`Compression increased file size by ${Math.abs(bytesSaved)} bytes (${Math.abs(result.reductionPercent).toFixed(2)}%)`);
    }

    // Check for minimal reduction (less than 1%)
    if (isSmaller && reductionPercent < 1) {
      result.warnings.push(`Minimal size reduction (${reductionPercent.toFixed(2)}%) - file may already be optimized`);
    }

    // Format-specific output validation
    if (format === 'pdf') {
      if (compressedBuffer.length < 5 || !compressedBuffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
        result.valid = false;
        result.errors.push('Output is not a valid PDF');
      }
    } else if (['jpg', 'jpeg'].includes(format)) {
      if (compressedBuffer.length < 3 || 
          compressedBuffer[0] !== 0xFF || compressedBuffer[1] !== 0xD8 || compressedBuffer[2] !== 0xFF) {
        result.warnings.push('Output may not be a valid JPEG');
      }
    } else if (format === 'png') {
      const pngSig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      if (compressedBuffer.length < 8 || !compressedBuffer.subarray(0, 8).equals(pngSig)) {
        result.warnings.push('Output may not be a valid PNG');
      }
    } else if (format === 'webp') {
      if (compressedBuffer.length < 12 || 
          compressedBuffer.subarray(0, 4).equals(Buffer.from('RIFF')) === false ||
          compressedBuffer.subarray(8, 12).equals(Buffer.from('WEBP')) === false) {
        result.warnings.push('Output may not be a valid WEBP');
      }
    }

    return result;
  }

  /**
   * Smart fallback: if compression doesn't reduce size, try alternative or return original
   */
  async smartCompress(compressFn, originalBuffer, format, alternatives = []) {
    // Try primary compression
    const primaryResult = await compressFn(originalBuffer);
    
    if (!primaryResult.success) {
      throw new Error(primaryResult.error || 'Primary compression failed');
    }

    const primaryOutput = primaryResult.buffer;
    const validation = this.validateOutput(originalBuffer, primaryOutput, format);

    // If primary compression worked and reduced size, return it
    if (validation.isSmaller && validation.valid) {
      return {
        ...primaryResult,
        validation,
        fallbackUsed: false
      };
    }

    // Primary didn't reduce size - try alternatives
    if (alternatives.length > 0) {
      for (const alt of alternatives) {
        try {
          const altResult = await alt(originalBuffer);
          if (altResult.success) {
            const altValidation = this.validateOutput(originalBuffer, altResult.buffer, format);
            if (altValidation.isSmaller && altValidation.valid) {
              return {
                ...altResult,
                validation: altValidation,
                fallbackUsed: true,
                fallbackMethod: altResult.method || 'alternative'
              };
            }
          }
        } catch (e) {
          console.warn(`Alternative compression failed:`, e.message);
        }
      }
    }

    // If all attempts failed to reduce size, return original with warning
    return {
      buffer: originalBuffer,
      stats: {
        originalSize: originalBuffer.length,
        compressedSize: originalBuffer.length,
        bytesSaved: 0,
        reductionPercent: 0,
        smaller: false,
        warning: validation.warnings[0] || 'File could not be compressed further'
      },
      validation,
      fallbackUsed: true,
      fallbackMethod: 'original'
    };
  }
}

module.exports = { BaseCompressor };