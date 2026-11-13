/**
 * Base Converter Class
 * Provides common utilities for all converters
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const { ConversionError, ERROR_CODES, FILE_SIZE_LIMITS, MIME_TYPES, SUPPORTED_FORMATS } = require('./types');

class BaseConverter {
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

  generateTempProfileDir() {
    const profileDir = path.join(this.tempDir, `lo-profile-${uuidv4()}`);
    fs.mkdirSync(profileDir, { recursive: true });
    return profileDir;
  }

  generateTempWorkDir() {
    const workDir = path.join(this.tempDir, `convert-${uuidv4()}`);
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
        console.warn(`[Converter] Failed to cleanup temp file ${filePath}:`, err.message);
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
      const CREATE_NO_WINDOW = 0x08000000;
      spawnOptions.windowsVerbatimArguments = false;
      spawnOptions.windowsHide = true;
      // Use spawnSync-compatible creationflags via child_process.spawn options
      // Note: Node.js doesn't expose creationflags directly in spawn options,
      // but windowsHide: true achieves the same effect in modern Node.js
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
          reject(new ConversionError(
            `Command failed with code ${code}: ${stderr}`,
            ERROR_CODES.CONVERSION_FAILED,
            { command, args, code, stderr }
          ));
        } else {
          resolve({ stdout, stderr, code });
        }
      });

      proc.on('error', (err) => {
        reject(new ConversionError(
          `Failed to spawn process: ${err.message}`,
          ERROR_CODES.CONVERSION_FAILED,
          { command, args, error: err.message }
        ));
      });
    });
  }

  async runPythonScript(scriptPath, args = []) {
    const pythonBin = this.getPythonBin();
    return this.runCommand(pythonBin, [scriptPath, ...args]);
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
      throw new ConversionError(
        `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)} MB`,
        ERROR_CODES.FILE_TOO_LARGE,
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
      throw new ConversionError(
        'Output file was not created',
        ERROR_CODES.CONVERSION_FAILED
      );
    }
    const buffer = fs.readFileSync(outputPath);
    if (buffer.length === 0) {
      throw new ConversionError(
        'Conversion produced empty output',
        ERROR_CODES.CONVERSION_FAILED
      );
    }
    return buffer;
  }

  // Shared methods from ConverterInterface
  getMaxFileSize(format) {
    return FILE_SIZE_LIMITS[format] || FILE_SIZE_LIMITS.default;
  }

  getMimeType(format) {
    return MIME_TYPES[format] || 'application/octet-stream';
  }

  getSupportedOutputFormats(inputFormat) {
    return SUPPORTED_FORMATS[inputFormat] || [];
  }

  isConversionSupported(inputFormat, outputFormat) {
    const supported = this.getSupportedOutputFormats(inputFormat);
    return supported.includes(outputFormat);
  }
}

module.exports = { BaseConverter };