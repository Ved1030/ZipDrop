#!/usr/bin/env node
/**
 * Provisions backend/.venv with the Python dependencies required by
 * pdf_converter.py. Runs from npm's postinstall hook so the existing
 * Render build command provisions Python without any extra step.
 *
 * If the system Python is missing or lacks venv/pip support, this falls
 * back to uv, which can provision its own Python interpreter.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REQUIREMENTS = path.join(BACKEND_DIR, "requirements.txt");
const VENV_DIR = process.env.PDF_VENV_DIR
  ? path.resolve(process.env.PDF_VENV_DIR)
  : path.join(BACKEND_DIR, ".venv");
const IS_WINDOWS = process.platform === "win32";
const VENV_PYTHON = path.join(
  VENV_DIR,
  IS_WINDOWS ? "Scripts" : "bin",
  IS_WINDOWS ? "python.exe" : "python"
);
const STAMP = path.join(VENV_DIR, ".requirements.sha256");
const UV_BIN_DIR = path.join(BACKEND_DIR, ".uv");
const MIN_PYTHON = [3, 10];

function log(message) {
  console.log(`[python-setup] ${message}`);
}

function run(command, args, extraEnv = {}) {
  return spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
}

function capture(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    timeout: 120000,
  });
}

function requirementsHash() {
  return createHash("sha256").update(fs.readFileSync(REQUIREMENTS)).digest("hex");
}

function venvImportWorks() {
  if (!fs.existsSync(VENV_PYTHON)) return false;
  return capture(VENV_PYTHON, ["-c", "import pdf2docx"]).status === 0;
}

function venvPipWorks() {
  if (!fs.existsSync(VENV_PYTHON)) return false;
  return capture(VENV_PYTHON, ["-m", "pip", "--version"]).status === 0;
}

function stampMatches(hash) {
  if (!fs.existsSync(STAMP)) return false;
  return fs.readFileSync(STAMP, "utf8").trim() === hash;
}

function findBasePython() {
  const candidates = [];
  if (process.env.PDF_PYTHON_BIN) {
    candidates.push({ command: process.env.PDF_PYTHON_BIN, prefix: [] });
  }
  if (IS_WINDOWS) {
    candidates.push({ command: "py", prefix: ["-3"] });
    candidates.push({ command: "python", prefix: [] });
    candidates.push({ command: "python3", prefix: [] });
  } else {
    candidates.push({ command: "python3", prefix: [] });
    candidates.push({ command: "python", prefix: [] });
  }

  for (const candidate of candidates) {
    const result = capture(candidate.command, [
      ...candidate.prefix,
      "-c",
      "import sys; print('%d.%d' % sys.version_info[:2])",
    ]);
    if (result.status !== 0) continue;

    const version = (result.stdout || "").trim().split(/\r?\n/).pop();
    const [major, minor] = version.split(".").map(Number);
    log(`found Python ${version} (${candidate.command})`);
    return {
      ...candidate,
      version,
      supported: major === 3 && minor >= MIN_PYTHON[1],
    };
  }

  log("no usable system Python found");
  return null;
}

function locateUv() {
  if (capture("uv", ["--version"]).status === 0) return "uv";
  const local = path.join(UV_BIN_DIR, IS_WINDOWS ? "uv.exe" : "uv");
  if (fs.existsSync(local)) return local;
  const homeLocal = path.join(
    os.homedir(),
    ".local",
    "bin",
    IS_WINDOWS ? "uv.exe" : "uv"
  );
  return fs.existsSync(homeLocal) ? homeLocal : null;
}

function setupWithUv() {
  // Keep uv's managed interpreter inside the project: Render promotes the
  // build directory to runtime, but not the build user's home directory.
  const uvEnv = { UV_PYTHON_INSTALL_DIR: path.join(BACKEND_DIR, ".python") };
  let uv = locateUv();

  if (!uv && !IS_WINDOWS) {
    log("installing uv to provision a managed Python");
    const installer = path.join(os.tmpdir(), `uv-install-${process.pid}.sh`);
    if (run("curl", ["-LsSf", "https://astral.sh/uv/install.sh", "-o", installer]).status === 0) {
      run("sh", [installer], { UV_INSTALL_DIR: UV_BIN_DIR });
      try {
        fs.unlinkSync(installer);
      } catch {
        // installer cleanup is best-effort
      }
      uv = locateUv();
    }
  }

  if (!uv) {
    log("uv is unavailable; cannot create a Python environment");
    return false;
  }

  if (fs.existsSync(VENV_DIR)) {
    fs.rmSync(VENV_DIR, { recursive: true, force: true });
  }

  if (run(uv, ["venv", "--python", "3.12", VENV_DIR], uvEnv).status !== 0) {
    log("uv could not create the virtual environment");
    return false;
  }

  return (
    run(uv, ["pip", "install", "--python", VENV_PYTHON, "-r", REQUIREMENTS], uvEnv).status === 0
  );
}

function installRequirements() {
  log("installing requirements into the virtual environment");
  return (
    run(VENV_PYTHON, [
      "-m",
      "pip",
      "install",
      "--disable-pip-version-check",
      "-r",
      REQUIREMENTS,
    ]).status === 0
  );
}

function createVenv(basePython) {
  if (basePython?.supported) {
    log(`creating virtual environment at ${VENV_DIR}`);
    run(basePython.command, [...basePython.prefix, "-m", "venv", VENV_DIR]);
    if (venvPipWorks() && installRequirements()) return true;

    log("standard venv has no pip; trying virtualenv");
    run(basePython.command, [...basePython.prefix, "-m", "pip", "install", "--user", "virtualenv"]);
    run(basePython.command, [...basePython.prefix, "-m", "virtualenv", VENV_DIR]);
    if (venvPipWorks() && installRequirements()) return true;

    log("system Python cannot create a usable venv");
  } else if (basePython) {
    log(`Python ${basePython.version} is older than ${MIN_PYTHON.join(".")}`);
  }

  return setupWithUv();
}

function finish(hash) {
  fs.writeFileSync(STAMP, `${hash}\n`);
  const result = capture(VENV_PYTHON, [
    "-c",
    "import sys, pdf2docx; print(sys.version.split()[0])",
  ]);
  const version = (result.stdout || "").trim();
  log(`pdf2docx is installed in ${VENV_PYTHON} (Python ${version})`);
  process.exit(0);
}

if (process.env.SKIP_PYTHON_SETUP === "1") {
  log("SKIP_PYTHON_SETUP=1; skipping Python environment setup");
  process.exit(0);
}

if (!fs.existsSync(REQUIREMENTS)) {
  console.error(`[python-setup] missing ${REQUIREMENTS}`);
  process.exit(1);
}

const hash = requirementsHash();

if (venvImportWorks() && stampMatches(hash)) {
  log("Python environment already up to date");
  process.exit(0);
}

if (venvPipWorks()) {
  if (installRequirements() && venvImportWorks()) finish(hash);
}

if (createVenv(findBasePython()) && venvImportWorks()) {
  finish(hash);
}

console.error("[python-setup] failed to install the required Python dependencies");
process.exit(1);
