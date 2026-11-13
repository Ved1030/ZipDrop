/**
 * Shared LibreOffice discovery and headless execution.
 *
 * LibreOffice on Windows is a GUI-subsystem launcher (soffice.exe): when its
 * stdio is piped it can stay alive indefinitely, so version probes use the
 * console wrapper (soffice.com) when available and are always non-fatal.
 */

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { pathToFileURL } = require('url');
const { ConversionError, ERROR_CODES } = require('./types');

const IS_WINDOWS = process.platform === 'win32';
const VERSION_TIMEOUT_MS = 15000;
const CONVERSION_TIMEOUT_MS = 180000;

let cached = null;

function executableExists(candidate) {
  try {
    const stat = fs.statSync(candidate);
    if (!stat.isFile()) return false;
    if (!IS_WINDOWS) fs.accessSync(candidate, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveExecutable(candidate) {
  if (!candidate) return null;
  const absolute = path.resolve(candidate);
  if (!executableExists(absolute)) return null;
  try {
    return fs.realpathSync.native(absolute);
  } catch {
    return absolute;
  }
}

function getPathDirectories() {
  const raw = process.env.PATH || "";
  const delimiter = IS_WINDOWS ? ";" : ":";
  return raw.split(delimiter).map((entry) => entry.trim().replace(/^"|"$/g, "")).filter(Boolean);
}

function getSearchNames() {
  if (IS_WINDOWS) {
    return ["soffice.exe", "soffice.com"];
  }
  return ["soffice", "libreoffice"];
}

function getCommonPaths() {
  if (IS_WINDOWS) {
    const programFiles = process.env.ProgramFiles || "C:\\Program Files";
    const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
    const localAppData = process.env.LOCALAPPDATA || "";
    return [
      path.join(programFiles, "LibreOffice", "program", "soffice.exe"),
      path.join(programFilesX86, "LibreOffice", "program", "soffice.exe"),
      localAppData && path.join(localAppData, "Programs", "LibreOffice", "program", "soffice.exe"),
    ].filter(Boolean);
  }

  return [
    "/usr/bin/soffice",
    "/usr/bin/libreoffice",
    "/usr/local/bin/soffice",
    "/snap/bin/libreoffice",
    "/opt/libreoffice/program/soffice",
    path.join(__dirname, "..", ".libreoffice", "squashfs-root", "AppRun"),
    path.join(__dirname, "..", ".libreoffice", "program", "soffice"),
  ];
}

function collectCandidates() {
  const candidates = [];
  const seen = new Set();
  const push = (candidate, source) => {
    if (!candidate) return;
    const key = IS_WINDOWS ? candidate.toLowerCase() : candidate;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ path: candidate, source });
  };

  const envPath = process.env.LIBREOFFICE_PATH;
  if (envPath) {
    if (executableExists(path.resolve(envPath))) {
      push(envPath, "LIBREOFFICE_PATH");
    } else {
      console.warn(
        `[LibreOffice] LIBREOFFICE_PATH is set but does not point to an executable file: ${envPath}`
      );
    }
  }

  const names = getSearchNames();
  const pathDirectories = getPathDirectories();
  for (const name of names) {
    for (const directory of pathDirectories) {
      push(path.join(directory, name), "PATH");
    }
  }

  for (const candidate of getCommonPaths()) {
    push(candidate, "common path");
  }

  return candidates;
}

function detectLibreOffice({ force = false } = {}) {
  if (cached && !force) return cached;

  const candidates = collectCandidates();
  const checked = [];
  let found = null;

  for (const candidate of candidates) {
    checked.push(candidate.path);
    const resolved = resolveExecutable(candidate.path);
    if (!resolved) continue;
    if (IS_WINDOWS && /soffice\.com$/i.test(resolved)) {
      const exeSibling = path.join(path.dirname(resolved), "soffice.exe");
      if (executableExists(exeSibling)) continue;
    }
    found = { executable: resolved, source: candidate.source };
    break;
  }

  cached = {
    ...(found || { executable: null, source: null }),
    checked,
  };
  return cached;
}

function getVersionProbeExecutable(executable) {
  if (!IS_WINDOWS) return executable;
  const consoleWrapper = path.join(path.dirname(executable), "soffice.com");
  if (executableExists(consoleWrapper)) return consoleWrapper;
  return executable;
}

function runProcess(command, args, { timeoutMs }) {
  return new Promise((resolve, reject) => {
    let proc;
    const env = { ...process.env };
    if (process.platform === "linux") {
      env.SAL_USE_VCLPLUGIN = "svp";
    }
    try {
      proc = spawn(command, args, {
        env,
        windowsHide: true,
        detached: !IS_WINDOWS,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      reject(error);
      return;
    }

    let stdout = "";
    let stderr = "";
    let settled = false;

    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };

    const timer = setTimeout(() => {
      killProcessTree(proc.pid);
      const error = new Error(`LibreOffice timed out after ${Math.round(timeoutMs / 1000)}s`);
      error.timedOut = true;
      error.stderr = stderr;
      settle(reject, error);
    }, timeoutMs);

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("error", (error) => {
      settle(reject, error);
    });

    proc.on("close", (code, signal) => {
      settle(resolve, { code, signal, stdout, stderr });
    });
  });
}

function killProcessTree(pid) {
  if (!pid) return;
  if (IS_WINDOWS) {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
    return;
  }
  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // process already exited
    }
  }
}

function parseVersion(output) {
  const match = output.match(/LibreOffice\s+([\d.]+)/i);
  return match ? match[1] : null;
}

async function queryVersion(executable) {
  const probeExecutable = getVersionProbeExecutable(executable);
  try {
    const result = await runProcess(probeExecutable, ["--version"], {
      timeoutMs: VERSION_TIMEOUT_MS,
    });
    const version = parseVersion(result.stdout) || parseVersion(result.stderr);
    return {
      ok: result.code === 0 && Boolean(version),
      version,
      exitCode: result.code,
      error: result.code === 0 ? null : `version command exited with code ${result.code}`,
    };
  } catch (error) {
    return { ok: false, version: null, exitCode: null, error: error.message };
  }
}

async function logDiagnostics(logger = console) {
  const detection = detectLibreOffice();
  logger.log(`[LibreOffice] OS: ${process.platform} ${process.arch}`);

  if (!detection.executable) {
    logger.error("[LibreOffice] Executable not found. Checked:");
    for (const candidate of detection.checked) logger.error(`[LibreOffice]   - ${candidate}`);
    logger.error(
      "[LibreOffice] Set LIBREOFFICE_PATH or install LibreOffice (soffice) on the server."
    );
    cached.diagnostics = { version: null, versionOk: false };
    return { ok: false, version: null };
  }

  logger.log(
    `[LibreOffice] Executable: ${detection.executable} (found via ${detection.source})`
  );

  const version = await queryVersion(detection.executable);
  if (version.ok) {
    logger.log(`[LibreOffice] Version: ${version.version}`);
  } else {
    logger.warn(
      `[LibreOffice] Version check failed (${version.error}); conversion will still be attempted.`
    );
  }
  cached.diagnostics = { version: version.version, versionOk: version.ok };
  return { ok: true, version: version.version };
}

function getStatus() {
  const detection = detectLibreOffice();
  const diagnostics = cached && cached.diagnostics ? cached.diagnostics : {};
  return {
    available: Boolean(detection.executable),
    version: diagnostics.version || null,
    versionOk: Boolean(diagnostics.versionOk),
    source: detection.source,
    checkedCount: detection.checked.length,
  };
}

function buildProfileArgument(profileDir) {
  const profileUrl = pathToFileURL(path.resolve(profileDir)).href;
  return `-env:UserInstallation=${profileUrl}`;
}

function requireLibreOffice(conversionName) {
  const detection = detectLibreOffice();
  if (detection.executable) return detection.executable;

  console.error(
    `[LibreOffice] ${conversionName}: no executable found. Checked ${detection.checked.length} path(s):\n` +
      detection.checked.map((candidate) => `  - ${candidate}`).join("\n")
  );
  throw new ConversionError(
    `LibreOffice not available for ${conversionName} conversion`,
    ERROR_CODES.MISSING_DEPENDENCY
  );
}

async function convertToPdf({ executable, inputPath, outputDir, profileDir, timeoutMs = CONVERSION_TIMEOUT_MS }) {
  const args = [
    "--headless",
    "--nologo",
    "--nodefault",
    "--norestore",
    "--nolockcheck",
    buildProfileArgument(profileDir),
    "--convert-to",
    "pdf",
    "--outdir",
    outputDir,
    inputPath,
  ];

  let result;
  try {
    result = await runProcess(executable, args, { timeoutMs });
  } catch (error) {
    if (error.timedOut) {
      throw new ConversionError(
        "PDF conversion timed out",
        ERROR_CODES.CONVERSION_FAILED,
        { stderr: error.stderr }
      );
    }
    throw new ConversionError(
      "PDF conversion service unavailable",
      ERROR_CODES.MISSING_DEPENDENCY,
      { error: error.message }
    );
  }

  if (result.code !== 0) {
    console.error(
      `[LibreOffice] Conversion failed (code=${result.code} signal=${result.signal}): ${result.stderr || result.stdout}`
    );
    throw new ConversionError(
      "PDF conversion failed",
      ERROR_CODES.CONVERSION_FAILED,
      { code: result.code, signal: result.signal, stderr: result.stderr }
    );
  }

  return result;
}

function validatePdfBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new ConversionError("Conversion produced an empty PDF", ERROR_CODES.CONVERSION_FAILED);
  }
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new ConversionError("Conversion produced an invalid PDF", ERROR_CODES.CONVERSION_FAILED);
  }
  const trailer = buffer.subarray(Math.max(0, buffer.length - 2048)).toString("latin1");
  if (!trailer.includes("%%EOF")) {
    throw new ConversionError("Conversion produced a truncated PDF", ERROR_CODES.CONVERSION_FAILED);
  }
}

module.exports = {
  detectLibreOffice,
  logDiagnostics,
  getStatus,
  requireLibreOffice,
  convertToPdf,
  validatePdfBuffer,
  buildProfileArgument,
  CONVERSION_TIMEOUT_MS,
};
