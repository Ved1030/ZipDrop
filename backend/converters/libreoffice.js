/**
 * Shared LibreOffice discovery and headless execution.
 *
 * LibreOffice on Windows is a GUI-subsystem launcher (soffice.exe): when its
 * stdio is piped it can stay alive indefinitely, so version probes use the
 * console wrapper (soffice.com) when available and are always non-fatal.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { pathToFileURL } = require('url');
const { ConversionError, ERROR_CODES } = require('./types');

const IS_WINDOWS = process.platform === 'win32';
const VERSION_TIMEOUT_MS = 15000;
const CONVERSION_TIMEOUT_MS = 180000;
const PORTABLE_DIR = path.join(__dirname, '..', '.libreoffice');
const PORTABLE_DEPS_DIR = path.join(PORTABLE_DIR, 'deps');
const PORTABLE_MANIFEST = path.join(PORTABLE_DIR, 'manifest.json');

let cached = null;
let portableManifestCache;

function readPortableManifest() {
  if (portableManifestCache !== undefined) return portableManifestCache;
  try {
    portableManifestCache = JSON.parse(fs.readFileSync(PORTABLE_MANIFEST, 'utf8'));
  } catch {
    portableManifestCache = null;
  }
  return portableManifestCache;
}

function findPortableExecutable() {
  const manifest = readPortableManifest();
  if (manifest && manifest.executable && executableExists(manifest.executable)) {
    return manifest.executable;
  }

  const optDirectory = path.join(PORTABLE_DIR, 'squashfs-root', 'opt');
  try {
    for (const entry of fs.readdirSync(optDirectory)) {
      const candidate = path.join(optDirectory, entry, 'program', 'soffice');
      if (executableExists(candidate)) return candidate;
    }
  } catch {
    // portable runtime is not installed
  }
  return null;
}

function isPortableExecutable(executable) {
  if (!executable) return false;
  const portableRoot = path.resolve(PORTABLE_DIR) + path.sep;
  try {
    return fs.realpathSync(executable).startsWith(portableRoot);
  } catch {
    return path.resolve(executable).startsWith(portableRoot);
  }
}

function getPortableDepsDir(executable) {
  if (!executable || !isPortableExecutable(executable)) return null;
  const manifest = readPortableManifest();
  for (const candidate of [manifest && manifest.depsDir, PORTABLE_DEPS_DIR]) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function findNixStoreLibreOffice() {
  if (IS_WINDOWS) return null;
  try {
    const entries = fs
      .readdirSync('/nix/store')
      .filter((entry) => /-libreoffice-[\d]/.test(entry))
      .sort()
      .reverse();
    for (const entry of entries) {
      for (const candidate of [
        path.join('/nix/store', entry, 'bin', 'soffice'),
        path.join('/nix/store', entry, 'lib', 'libreoffice', 'program', 'soffice'),
      ]) {
        if (executableExists(candidate)) return candidate;
      }
    }
  } catch {
    // /nix/store is absent outside Nix environments
  }
  return null;
}

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
    "/nix/var/nix/profiles/default/bin/soffice",
    path.join(os.homedir(), ".nix-profile", "bin", "soffice"),
    "/run/current-system/sw/bin/soffice",
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

  const portable = findPortableExecutable();
  if (portable) {
    push(portable, "portable");
  }

  const nixStore = findNixStoreLibreOffice();
  if (nixStore) {
    push(nixStore, "nix store");
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

function ensureWritableDirectory(preferred, fallback) {
  const candidates = [preferred, fallback, path.join(os.tmpdir(), "zipdrop-lo-home")].filter(Boolean);
  for (const directory of candidates) {
    try {
      fs.mkdirSync(directory, { recursive: true });
      fs.accessSync(directory, fs.constants.W_OK);
      return directory;
    } catch {
      // try the next candidate
    }
  }
  return os.tmpdir();
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function writeRuntimeFontConfig(depsDir, baseDir) {
  const confDirectory = path.join(depsDir, "etc", "fonts", "conf.d");
  const fontDirectories = [
    path.join(depsDir, "usr", "share", "fonts"),
    path.join(depsDir, "usr", "local", "share", "fonts"),
    "/usr/share/fonts",
    "/usr/local/share/fonts",
  ].filter((directory) => fs.existsSync(directory));

  if (!fontDirectories.length && !fs.existsSync(confDirectory)) return null;

  try {
    const configDirectory = path.join(baseDir, "fontconfig");
    const cacheDirectory = path.join(configDirectory, "cache");
    fs.mkdirSync(cacheDirectory, { recursive: true });

    const lines = ['<?xml version="1.0"?>', "<fontconfig>"];
    for (const directory of fontDirectories) {
      lines.push(`  <dir>${escapeXml(directory)}</dir>`);
    }
    lines.push(`  <cachedir>${escapeXml(cacheDirectory)}</cachedir>`);
    if (fs.existsSync(confDirectory)) {
      lines.push(`  <include ignore_missing="yes">${escapeXml(confDirectory)}</include>`);
    }
    lines.push("</fontconfig>", "");

    const configFile = path.join(configDirectory, "fonts.conf");
    fs.writeFileSync(configFile, lines.join("\n"));
    return configFile;
  } catch (error) {
    console.warn(`[LibreOffice] Could not prepare font configuration: ${error.message}`);
    return null;
  }
}

function getPortableLibraryDirectories(depsDir, executable) {
  const programDir = path.dirname(executable);
  return [
    path.join(depsDir, "usr", "lib", "x86_64-linux-gnu"),
    path.join(depsDir, "lib", "x86_64-linux-gnu"),
    path.join(depsDir, "usr", "lib", "x86_64-linux-gnu", "nss"),
    path.join(depsDir, "lib", "x86_64-linux-gnu", "nss"),
    path.join(depsDir, "usr", "lib"),
    path.join(depsDir, "lib"),
    programDir,
    path.join(programDir, "..", "ure", "lib"),
  ].filter((directory) => fs.existsSync(directory));
}

function buildProcessEnv(executable, profileDir) {
  const env = { ...process.env };

  if (process.platform === "linux") {
    env.SAL_USE_VCLPLUGIN = "svp";
    env.LANG = env.LANG || "C.UTF-8";
  }

  if (IS_WINDOWS) return env;

  const baseDir = profileDir
    ? path.dirname(profileDir)
    : path.join(os.tmpdir(), "zipdrop-lo");
  const depsDir = getPortableDepsDir(executable);
  const home = depsDir
    ? ensureWritableDirectory(path.join(baseDir, "home"), env.HOME)
    : ensureWritableDirectory(env.HOME, path.join(baseDir, "home"));
  const cacheHome = path.join(home, ".cache");

  env.HOME = home;
  env.XDG_CACHE_HOME = cacheHome;
  env.TMPDIR = ensureWritableDirectory(env.TMPDIR, os.tmpdir());

  try {
    fs.mkdirSync(cacheHome, { recursive: true });
  } catch {
    // non-fatal; LibreOffice falls back to its own defaults
  }

  if (depsDir) {
    const libraryDirectories = getPortableLibraryDirectories(depsDir, executable);
    env.LD_LIBRARY_PATH = [...libraryDirectories, env.LD_LIBRARY_PATH]
      .filter(Boolean)
      .join(":");

    const fontConfig = writeRuntimeFontConfig(depsDir, baseDir);
    if (fontConfig) {
      env.FONTCONFIG_FILE = fontConfig;
      env.FONTCONFIG_PATH = path.dirname(fontConfig);
    }
  }

  return env;
}

function extractMissingLibraries(stderr = "") {
  const missing = new Set();
  const pattern = /error while loading shared libraries: ([^:\s]+)/g;
  let match;
  while ((match = pattern.exec(stderr))) {
    missing.add(match[1]);
  }
  return [...missing];
}

function runProcess(command, args, { timeoutMs, profileDir } = {}) {
  return new Promise((resolve, reject) => {
    let proc;
    const env = buildProcessEnv(command, profileDir);
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
      stderr: result.stderr,
      error: result.code === 0 ? null : `version command exited with code ${result.code}`,
    };
  } catch (error) {
    return {
      ok: false,
      version: null,
      exitCode: null,
      stderr: error.stderr || "",
      error: error.message,
    };
  }
}

async function verifyConversion() {
  const detection = detectLibreOffice();
  if (!detection.executable) {
    return { ok: false, error: "LibreOffice is not available" };
  }

  const fixture = path.resolve(
    __dirname,
    "..",
    "..",
    "eval-word2pdf",
    "fixtures",
    "01_simple_text.docx"
  );
  if (!fs.existsSync(fixture)) {
    return { ok: null, error: null };
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "zipdrop-lo-smoke-"));
  const profileDir = path.join(workDir, "profile");
  const inputPath = path.join(workDir, "smoke.docx");

  try {
    fs.copyFileSync(fixture, inputPath);
    await convertToPdf({
      executable: detection.executable,
      inputPath,
      outputDir: workDir,
      profileDir,
      timeoutMs: 120000,
    });
    validatePdfBuffer(fs.readFileSync(path.join(workDir, "smoke.pdf")));
    return { ok: true, error: null };
  } catch (error) {
    const detail =
      error && error.details && error.details.safeDetail
        ? error.details.safeDetail
        : "Conversion smoke test failed";
    return { ok: false, error: detail };
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

async function logDiagnostics(logger = console) {
  const detection = detectLibreOffice();
  const diagnostics = {
    version: null,
    versionOk: false,
    conversionOk: null,
    conversionError: null,
    portable: isPortableExecutable(detection.executable),
    depsDir: getPortableDepsDir(detection.executable),
  };

  logger.log(`[LibreOffice] OS: ${process.platform} ${process.arch}`);
  logger.log(`[LibreOffice] Temp directory: ${os.tmpdir()}`);

  if (!detection.executable) {
    logger.error("[LibreOffice] Executable not found. Checked:");
    for (const candidate of detection.checked) logger.error(`[LibreOffice]   - ${candidate}`);
    logger.error(
      "[LibreOffice] Set LIBREOFFICE_PATH or install LibreOffice (soffice) on the server."
    );
    cached.diagnostics = diagnostics;
    return { ok: false, version: null };
  }

  logger.log(
    `[LibreOffice] Executable: ${detection.executable} (found via ${detection.source})`
  );
  if (diagnostics.portable) {
    logger.log(
      `[LibreOffice] Portable runtime; bundled libraries: ${diagnostics.depsDir || "none"}`
    );
  }

  const version = await queryVersion(detection.executable);
  diagnostics.version = version.version;
  diagnostics.versionOk = version.ok;

  if (version.ok) {
    logger.log(`[LibreOffice] Version: ${version.version}`);
  } else {
    const firstErrorLine = (version.stderr || "").trim().split(/\r?\n/)[0];
    logger.warn(
      `[LibreOffice] Version check failed (${version.error}${
        firstErrorLine ? `: ${firstErrorLine}` : ""
      }); attempting a smoke conversion anyway.`
    );
  }

  const conversion = await verifyConversion();
  diagnostics.conversionOk = conversion.ok;
  diagnostics.conversionError = conversion.error;

  if (conversion.ok) {
    logger.log("[LibreOffice] Conversion smoke test: ok");
  } else if (conversion.ok === false) {
    logger.warn(`[LibreOffice] Conversion smoke test failed: ${conversion.error}`);
  } else {
    logger.log("[LibreOffice] Conversion smoke test skipped (fixture unavailable)");
  }

  cached.diagnostics = diagnostics;
  return { ok: true, version: version.version };
}

function getStatus() {
  const detection = detectLibreOffice();
  const diagnostics = cached && cached.diagnostics ? cached.diagnostics : {};
  return {
    available: Boolean(detection.executable),
    version: diagnostics.version || null,
    versionOk: Boolean(diagnostics.versionOk),
    conversionOk:
      diagnostics.conversionOk === undefined ? null : diagnostics.conversionOk,
    conversionError: diagnostics.conversionError || null,
    portable: Boolean(diagnostics.portable),
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
    result = await runProcess(executable, args, { timeoutMs, profileDir });
  } catch (error) {
    if (error.timedOut) {
      throw new ConversionError(
        "PDF conversion timed out",
        ERROR_CODES.CONVERSION_FAILED,
        { stderr: error.stderr, safeDetail: "LibreOffice timed out" }
      );
    }
    throw new ConversionError(
      "PDF conversion service unavailable",
      ERROR_CODES.MISSING_DEPENDENCY,
      { error: error.message, safeDetail: "LibreOffice could not be started" }
    );
  }

  if (result.code !== 0) {
    const missingLibraries = extractMissingLibraries(result.stderr);
    const safeDetail = missingLibraries.length
      ? `Missing runtime library: ${missingLibraries.join(", ")}`
      : `LibreOffice exited with code ${result.code}`;

    console.error(
      `[LibreOffice] Conversion failed (code=${result.code} signal=${result.signal}): ${
        result.stderr || result.stdout
      }`
    );
    throw new ConversionError(
      missingLibraries.length
        ? "Document conversion is temporarily unavailable"
        : "PDF conversion failed",
      missingLibraries.length ? ERROR_CODES.MISSING_DEPENDENCY : ERROR_CODES.CONVERSION_FAILED,
      {
        code: result.code,
        signal: result.signal,
        stderr: result.stderr,
        safeDetail,
      }
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
  verifyConversion,
  requireLibreOffice,
  convertToPdf,
  validatePdfBuffer,
  buildProfileArgument,
  CONVERSION_TIMEOUT_MS,
};
