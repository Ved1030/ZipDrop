/**
 * Provisions a portable LibreOffice for Linux builds that cannot install
 * system packages (for example Render's native runtime).
 *
 * The AppImage is extracted without root or FUSE; the resulting
 * squashfs-root/AppRun is picked up by converters/libreoffice.js.
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORTABLE_DIR = path.join(BACKEND_DIR, ".libreoffice");
const EXTRACTED_DIR = path.join(PORTABLE_DIR, "squashfs-root");
const APP_RUN = path.join(EXTRACTED_DIR, "AppRun");
const DOWNLOAD_URL =
  process.env.LIBREOFFICE_APPIMAGE_URL ||
  "https://appimages.libreitalia.org/LibreOffice-26.8.3.1.basic-x86_64.AppImage";

const log = (message) => console.log(`[libreoffice-setup] ${message}`);
const warn = (message) => console.warn(`[libreoffice-setup] ${message}`);

function isExecutableFile(candidate) {
  try {
    return fs.statSync(candidate).isFile();
  } catch {
    return false;
  }
}

function findSystemLibreOffice() {
  if (process.env.LIBREOFFICE_PATH && isExecutableFile(path.resolve(process.env.LIBREOFFICE_PATH))) {
    return process.env.LIBREOFFICE_PATH;
  }

  const names = ["soffice", "libreoffice"];
  for (const directory of (process.env.PATH || "").split(":")) {
    if (!directory) continue;
    for (const name of names) {
      const candidate = path.join(directory, name);
      if (isExecutableFile(candidate)) return candidate;
    }
  }

  for (const candidate of [
    "/usr/bin/soffice",
    "/usr/bin/libreoffice",
    "/usr/local/bin/soffice",
    "/snap/bin/libreoffice",
    "/opt/libreoffice/program/soffice",
  ]) {
    if (isExecutableFile(candidate)) return candidate;
  }

  return null;
}

function download(url, destination, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { "User-Agent": "ZipDrop/1.0" } }, (response) => {
        const { statusCode, headers } = response;
        if ([301, 302, 303, 307, 308].includes(statusCode) && headers.location) {
          response.resume();
          if (redirectsLeft === 0) {
            reject(new Error("Too many redirects"));
            return;
          }
          resolve(download(new URL(headers.location, url).href, destination, redirectsLeft - 1));
          return;
        }
        if (statusCode !== 200) {
          response.resume();
          reject(new Error(`Download failed with HTTP ${statusCode}`));
          return;
        }

        const total = Number(headers["content-length"] || 0);
        let received = 0;
        let lastLog = 0;
        const file = fs.createWriteStream(destination);

        response.on("data", (chunk) => {
          received += chunk.length;
          if (received - lastLog >= 50 * 1024 * 1024) {
            lastLog = received;
            const percent = total ? ` (${Math.round((received / total) * 100)}%)` : "";
            log(`downloaded ${Math.round(received / 1024 / 1024)} MB${percent}`);
          }
        });
        response.on("error", reject);
        response.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
        file.on("error", reject);
      });
    request.setTimeout(180000, () => {
      request.destroy(new Error("Download stalled for 3 minutes"));
    });
    request.on("error", reject);
  });
}

async function main() {
  if (process.platform !== "linux") {
    log(`skipped on ${process.platform}; install LibreOffice manually or set LIBREOFFICE_PATH`);
    return;
  }

  if (process.env.SKIP_LIBREOFFICE_INSTALL === "1") {
    log("SKIP_LIBREOFFICE_INSTALL=1, skipping");
    return;
  }

  if (isExecutableFile(APP_RUN)) {
    log(`portable LibreOffice already extracted at ${APP_RUN}`);
    return;
  }

  const system = findSystemLibreOffice();
  if (system) {
    log(`system LibreOffice found at ${system}; portable install not needed`);
    return;
  }

  fs.mkdirSync(PORTABLE_DIR, { recursive: true });
  const appImagePath = path.join(PORTABLE_DIR, "LibreOffice.AppImage");

  log(`no LibreOffice found; downloading ${DOWNLOAD_URL}`);
  await download(DOWNLOAD_URL, appImagePath);
  fs.chmodSync(appImagePath, 0o755);

  log("extracting AppImage (no root or FUSE required)");
  const extraction = spawnSync(appImagePath, ["--appimage-extract"], {
    cwd: PORTABLE_DIR,
    env: { ...process.env, HOME: process.env.HOME || PORTABLE_DIR },
    stdio: "inherit",
    timeout: 10 * 60 * 1000,
  });

  if (extraction.status !== 0 || !isExecutableFile(APP_RUN)) {
    throw new Error(
      `AppImage extraction failed (status ${extraction.status}); expected ${APP_RUN}`
    );
  }

  fs.rmSync(appImagePath, { force: true });

  const version = spawnSync(APP_RUN, ["--version"], {
    env: { ...process.env, HOME: process.env.HOME || PORTABLE_DIR, SAL_USE_VCLPLUGIN: "svp" },
    encoding: "utf8",
    timeout: 60 * 1000,
  });
  const output = `${version.stdout || ""}${version.stderr || ""}`.trim();
  if (output) log(`installed: ${output.split(/\r?\n/)[0]}`);
  log(`portable LibreOffice ready at ${APP_RUN}`);
}

main().catch((error) => {
  console.error(`[libreoffice-setup] ERROR: ${error.message}`);
  process.exit(1);
});
