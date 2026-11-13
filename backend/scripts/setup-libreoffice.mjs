/**
 * Provisions LibreOffice for Linux deployments.
 *
 * Render's native runtime is Debian 12 and does not include LibreOffice or the
 * X11/NSS/CUPS libraries the portable AppImage links against. This script:
 *   1. Uses a system LibreOffice when one is available and working.
 *   2. Otherwise extracts the official portable AppImage.
 *   3. Bundles the Debian runtime libraries the AppImage needs into
 *      backend/.libreoffice/deps.
 *   4. Runs a real DOCX -> PDF smoke conversion before letting the build pass.
 *
 * Windows skips this script and uses the installed soffice.exe.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORTABLE_DIR = path.join(BACKEND_DIR, ".libreoffice");
const EXTRACTED_DIR = path.join(PORTABLE_DIR, "squashfs-root");
const APP_RUN = path.join(EXTRACTED_DIR, "AppRun");
const DEPS_DIR = path.join(PORTABLE_DIR, "deps");
const HOME_DIR = path.join(PORTABLE_DIR, "home");
const FONTCONFIG_DIR = path.join(PORTABLE_DIR, "fontconfig");
const FONTCONFIG_FILE = path.join(FONTCONFIG_DIR, "fonts.conf");
const MANIFEST_PATH = path.join(PORTABLE_DIR, "manifest.json");
const TMP_DIR = path.join(PORTABLE_DIR, "tmp");
const DOWNLOAD_URL =
  process.env.LIBREOFFICE_APPIMAGE_URL ||
  "https://appimages.libreitalia.org/LibreOffice-26.8.3.1.basic-x86_64.AppImage";
const DEBIAN_SUITE = process.env.LIBREOFFICE_DEBIAN_SUITE || "bookworm";

const SKIP_PACKAGES = new Set(["libc6", "libc-bin", "libc-dev-bin"]);

const KNOWN_PACKAGES = {
  "libXinerama.so.1": "libxinerama1",
  "libX11.so.6": "libx11-6",
  "libX11-xcb.so.1": "libx11-xcb1",
  "libXau.so.6": "libxau6",
  "libXdmcp.so.6": "libxdmcp6",
  "libXext.so.6": "libxext6",
  "libXrender.so.1": "libxrender1",
  "libxcb.so.1": "libxcb1",
  "libxcb-render.so.0": "libxcb-render0",
  "libxcb-shm.so.0": "libxcb-shm0",
  "libz.so.1": "zlib1g",
  "libstdc++.so.6": "libstdc++6",
  "libgcc_s.so.1": "libgcc-s1",
  "libcups.so.2": "libcups2",
  "libdbus-1.so.3": "libdbus-1-3",
  "libavahi-client.so.3": "libavahi-client3",
  "libavahi-common.so.3": "libavahi-common3",
  "libnss3.so": "libnss3",
  "libssl3.so": "libnss3",
  "libnssutil3.so": "libnss3",
  "libsmime3.so": "libnss3",
  "libsoftokn3.so": "libnss3",
  "libfreebl3.so": "libnss3",
  "libnspr4.so": "libnspr4",
  "libplds4.so": "libnspr4",
  "libplc4.so": "libnspr4",
  "libfontconfig.so.1": "libfontconfig1",
  "libfreetype.so.6": "libfreetype6",
  "libcairo.so.2": "libcairo2",
  "libglib-2.0.so.0": "libglib2.0-0",
  "libgio-2.0.so.0": "libglib2.0-0",
  "libgobject-2.0.so.0": "libglib2.0-0",
  "libgmodule-2.0.so.0": "libglib2.0-0",
  "libpango-1.0.so.0": "libpango-1.0-0",
  "libgdk_pixbuf-2.0.so.0": "libgdk-pixbuf-2.0-0",
  "libharfbuzz.so.0": "libharfbuzz0b",
  "libbsd.so.0": "libbsd0",
  "libmd.so.0": "libmd0",
  "libsystemd.so.0": "libsystemd0",
  "libgssapi_krb5.so.2": "libgssapi-krb5-2",
  "libpixman-1.so.0": "libpixman-1-0",
  "libpng16.so.16": "libpng16-16",
  "libmount.so.1": "libmount1",
  "libselinux.so.1": "libselinux1",
  "libffi.so.8": "libffi8",
  "libpcre2-8.so.0": "libpcre2-8-0",
  "libgnutls.so.30": "libgnutls30",
  "libexpat.so.1": "libexpat1",
  "libbrotlidec.so.1": "libbrotli1",
  "libbrotlicommon.so.1": "libbrotli1",
  "libcap.so.2": "libcap2",
  "libkrb5.so.3": "libkrb5-3",
  "libk5crypto.so.3": "libk5crypto3",
  "libcom_err.so.2": "libcom-err2",
  "libkrb5support.so.0": "libkrb5support0",
  "libblkid.so.1": "libblkid1",
  "libp11-kit.so.0": "libp11-kit0",
  "libidn2.so.0": "libidn2-0",
  "libunistring.so.2": "libunistring2",
  "libtasn1.so.6": "libtasn1-6",
  "libnettle.so.8": "libnettle8",
  "libhogweed.so.6": "libhogweed6",
  "libgmp.so.10": "libgmp10",
  "libkeyutils.so.1": "libkeyutils1",
};

const PRELOAD_PACKAGES = [
  "fontconfig-config",
  "fonts-dejavu-core",
  "libnss3",
  "libnspr4",
  "libx11-6",
  "libxinerama1",
  "libxext6",
  "libxrender1",
  "libxcb1",
  "libcups2",
  "libdbus-1-3",
  "libglib2.0-0",
  "libcairo2",
  "libpango-1.0-0",
  "libgdk-pixbuf-2.0-0",
  "libharfbuzz0b",
  "libfontconfig1",
  "libfreetype6",
];

const FODT_TEXT = `<?xml version="1.0" encoding="UTF-8"?>
<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.3" office:mimetype="application/vnd.oasis.opendocument.text">
<office:body><office:text><text:p>ZipDrop smoke test</text:p></office:text></office:body>
</office:document>
`;

let PROGRAM_DIR = null;

const log = (message) => console.log(`[libreoffice-setup] ${message}`);
const warn = (message) => console.warn(`[libreoffice-setup] ${message}`);

function isExecutableFile(candidate) {
  try {
    const stat = fs.statSync(candidate);
    if (!stat.isFile()) return false;
    fs.accessSync(candidate, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function findNixStoreLibreOffice() {
  const store = "/nix/store";
  try {
    const entries = fs
      .readdirSync(store)
      .filter((entry) => /-libreoffice-[\d]/.test(entry))
      .sort()
      .reverse();
    for (const entry of entries) {
      for (const candidate of [
        path.join(store, entry, "bin", "soffice"),
        path.join(store, entry, "lib", "libreoffice", "program", "soffice"),
      ]) {
        if (isExecutableFile(candidate)) return candidate;
      }
    }
  } catch {
    // /nix/store is absent on Render
  }
  return null;
}

function findSystemLibreOffice() {
  const candidates = [];
  if (process.env.LIBREOFFICE_PATH) {
    candidates.push(path.resolve(process.env.LIBREOFFICE_PATH));
  }

  const names = ["soffice", "libreoffice"];
  for (const directory of (process.env.PATH || "").split(":")) {
    if (!directory) continue;
    for (const name of names) {
      candidates.push(path.join(directory, name));
    }
  }

  for (const directory of [
    "/nix/var/nix/profiles/default/bin",
    path.join(os.homedir(), ".nix-profile", "bin"),
    "/run/current-system/sw/bin",
  ]) {
    for (const name of names) {
      candidates.push(path.join(directory, name));
    }
  }

  candidates.push(
    "/usr/bin/soffice",
    "/usr/bin/libreoffice",
    "/usr/local/bin/soffice",
    "/snap/bin/libreoffice",
    "/opt/libreoffice/program/soffice"
  );

  for (const candidate of candidates) {
    if (isExecutableFile(candidate)) return candidate;
  }

  return findNixStoreLibreOffice();
}

function verifySystemLibreOffice(executable) {
  const result = spawnSync(executable, ["--version"], {
    encoding: "utf8",
    timeout: 30000,
    env: { ...process.env, SAL_USE_VCLPLUGIN: "svp" },
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  if (result.status === 0 && /LibreOffice\s+[\d.]+/i.test(output)) {
    log(`using system LibreOffice: ${output.split(/\r?\n/)[0]}`);
    return true;
  }
  warn(
    `system LibreOffice at ${executable} failed --version (${
      output.split(/\r?\n/)[0] || `exit ${result.status}`
    }); falling back to the portable build`
  );
  return false;
}

function download(url, destination, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;
    const request = client.get(
      url,
      { headers: { "User-Agent": "ZipDrop/1.0" } },
      (response) => {
        const { statusCode, headers } = response;
        if ([301, 302, 303, 307, 308].includes(statusCode) && headers.location) {
          response.resume();
          if (redirectsLeft === 0) {
            reject(new Error("Too many redirects"));
            return;
          }
          resolve(
            download(new URL(headers.location, url).href, destination, redirectsLeft - 1)
          );
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
      }
    );
    request.setTimeout(180000, () => {
      request.destroy(new Error("Download stalled for 3 minutes"));
    });
    request.on("error", reject);
  });
}

function fetchText(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;
    const request = client.get(
      url,
      { headers: { "User-Agent": "ZipDrop/1.0" } },
      (response) => {
        const { statusCode, headers } = response;
        if ([301, 302, 303, 307, 308].includes(statusCode) && headers.location) {
          response.resume();
          if (redirectsLeft === 0) {
            reject(new Error("Too many redirects"));
            return;
          }
          resolve(fetchText(new URL(headers.location, url).href, redirectsLeft - 1));
          return;
        }
        if (statusCode !== 200) {
          response.resume();
          reject(new Error(`HTTP ${statusCode}`));
          return;
        }
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
          if (body.length > 2 * 1024 * 1024) request.destroy(new Error("Response too large"));
        });
        response.on("end", () => resolve(body));
        response.on("error", reject);
      }
    );
    request.setTimeout(60000, () => request.destroy(new Error("Request timed out")));
    request.on("error", reject);
  });
}

function toDebianHttps(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith("debian.org")) {
      return `https://deb.debian.org${parsed.pathname}`;
    }
    return parsed.href.replace(/^http:/, "https:");
  } catch {
    return url;
  }
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchTextWithRetry(url, attempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fetchText(url);
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await sleep(2000 * (attempt + 1));
    }
  }
  throw lastError;
}

async function downloadWithRetry(url, destination, attempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await download(url, destination);
      return;
    } catch (error) {
      lastError = error;
      fs.rmSync(destination, { force: true });
      if (attempt < attempts - 1) await sleep(2000 * (attempt + 1));
    }
  }
  throw lastError;
}

async function downloadPackageDeb(pkg) {
  let page;
  try {
    page = await fetchTextWithRetry(
      `https://packages.debian.org/${DEBIAN_SUITE}/amd64/${pkg}/download`
    );
  } catch (error) {
    warn(`could not resolve package ${pkg}: ${error.message}`);
    return null;
  }

  const urls = [...page.matchAll(/href="(https?:\/\/[^"]+\.deb)"/g)].map((match) => match[1]);
  if (!urls.length) {
    warn(`no .deb URL found for ${pkg}`);
    return null;
  }

  const url = toDebianHttps(urls[0]);
  const destination = path.join(TMP_DIR, path.basename(new URL(url).pathname));
  try {
    await downloadWithRetry(url, destination);
    return destination;
  } catch (error) {
    fs.rmSync(destination, { force: true });
    warn(`download failed for ${pkg}: ${error.message}`);
    return null;
  }
}

function debContains(debPath, soname) {
  const result = spawnSync("dpkg-deb", ["-c", debPath], {
    encoding: "utf8",
    timeout: 60000,
  });
  return result.status === 0 && (result.stdout || "").includes(soname);
}

function extractDeb(debPath) {
  fs.mkdirSync(DEPS_DIR, { recursive: true });
  const result = spawnSync("dpkg-deb", ["-x", debPath, DEPS_DIR], {
    encoding: "utf8",
    timeout: 120000,
  });
  if (result.status !== 0) {
    throw new Error(`dpkg-deb failed: ${(result.stderr || "").trim()}`);
  }
}

async function installPackage(pkg, soname, installed) {
  if (!pkg || installed.has(pkg) || SKIP_PACKAGES.has(pkg)) return false;
  const deb = await downloadPackageDeb(pkg);
  if (!deb) return false;

  try {
    if (soname && !debContains(deb, soname)) {
      warn(`${pkg} does not contain ${soname}`);
      return false;
    }
    extractDeb(deb);
    installed.add(pkg);
    log(`bundled ${pkg}${soname ? ` for ${soname}` : ""}`);
    return true;
  } finally {
    fs.rmSync(deb, { force: true });
  }
}

function packageForPath(file) {
  let real = file;
  try {
    real = fs.realpathSync(file);
  } catch {
    // keep the original path
  }
  const result = spawnSync("dpkg", ["-S", real], { encoding: "utf8", timeout: 30000 });
  if (result.status !== 0) return null;
  const line = (result.stdout || "").split(/\r?\n/).find(Boolean);
  return line ? line.split(":")[0] : null;
}

function parseLdd(output) {
  const systemPaths = new Set();
  const missing = new Set();

  for (const line of output.split(/\r?\n/)) {
    if (line.includes("=> not found")) {
      const soname = line.trim().split(/\s+/)[0];
      if (soname) missing.add(soname);
      continue;
    }
    const match = line.match(/^\s*(\S+)\s+=>\s+(\S+)/);
    if (!match) continue;
    const resolved = match[2];
    if (resolved.startsWith(DEPS_DIR) || resolved.startsWith(PORTABLE_DIR)) continue;
    if (resolved.startsWith("/lib/") || resolved.startsWith("/usr/lib/")) {
      systemPaths.add(resolved);
    }
  }

  return { systemPaths: [...systemPaths], missing: [...missing] };
}

function parseMissingLibraries(stderr) {
  const missing = new Set();
  const pattern = /error while loading shared libraries: ([^:\s]+)/g;
  let match;
  while ((match = pattern.exec(stderr))) {
    missing.add(match[1]);
  }
  return [...missing];
}

function depsLibraryDirectories() {
  return [
    path.join(DEPS_DIR, "usr", "lib", "x86_64-linux-gnu"),
    path.join(DEPS_DIR, "lib", "x86_64-linux-gnu"),
    path.join(DEPS_DIR, "usr", "lib", "x86_64-linux-gnu", "nss"),
    path.join(DEPS_DIR, "lib", "x86_64-linux-gnu", "nss"),
    path.join(DEPS_DIR, "usr", "lib"),
    path.join(DEPS_DIR, "lib"),
  ].filter((directory) => fs.existsSync(directory));
}

function writeFontConfig() {
  const fontDirectories = [
    path.join(DEPS_DIR, "usr", "share", "fonts"),
    path.join(DEPS_DIR, "usr", "local", "share", "fonts"),
  ].filter((directory) => fs.existsSync(directory));
  const confDirectory = path.join(DEPS_DIR, "etc", "fonts", "conf.d");

  if (!fontDirectories.length && !fs.existsSync(confDirectory)) {
    fs.rmSync(FONTCONFIG_FILE, { force: true });
    return;
  }

  fs.mkdirSync(FONTCONFIG_DIR, { recursive: true });
  fs.mkdirSync(path.join(PORTABLE_DIR, "fontconfig-cache"), { recursive: true });

  const lines = ['<?xml version="1.0"?>', "<fontconfig>"];
  for (const directory of fontDirectories) {
    lines.push(`  <dir>${directory}</dir>`);
  }
  lines.push(`  <cachedir>${path.join(PORTABLE_DIR, "fontconfig-cache")}</cachedir>`);
  if (fs.existsSync(confDirectory)) {
    lines.push(`  <include ignore_missing="yes">${confDirectory}</include>`);
  }
  lines.push("</fontconfig>", "");

  fs.writeFileSync(FONTCONFIG_FILE, lines.join("\n"));
}

function portableEnv(extra = {}) {
  const programLibraries = PROGRAM_DIR
    ? [PROGRAM_DIR, path.join(PROGRAM_DIR, "..", "ure", "lib")].filter((directory) =>
        fs.existsSync(directory)
      )
    : [];
  const libraryPath = [...depsLibraryDirectories(), ...programLibraries]
    .filter((directory) => fs.existsSync(directory))
    .concat(process.env.LD_LIBRARY_PATH ? [process.env.LD_LIBRARY_PATH] : []);

  return {
    ...process.env,
    ...extra,
    SAL_USE_VCLPLUGIN: "svp",
    HOME: HOME_DIR,
    TMPDIR: process.env.TMPDIR || os.tmpdir(),
    XDG_CACHE_HOME: path.join(HOME_DIR, ".cache"),
    ...(fs.existsSync(FONTCONFIG_FILE)
      ? { FONTCONFIG_FILE, FONTCONFIG_PATH: FONTCONFIG_DIR }
      : {}),
    LD_LIBRARY_PATH: libraryPath.join(":"),
  };
}

function runLdd(binary) {
  const result = spawnSync("ldd", [binary], {
    encoding: "utf8",
    timeout: 60000,
    env: portableEnv(),
  });
  return `${result.stdout || ""}${result.stderr || ""}`;
}

async function installForSoname(soname, installed) {
  const candidates = [];
  if (KNOWN_PACKAGES[soname]) {
    candidates.push(KNOWN_PACKAGES[soname]);
  }

  if (!candidates.length) {
    try {
      const html = await fetchTextWithRetry(
        `https://packages.debian.org/search?searchon=contents&keywords=${encodeURIComponent(
          soname
        )}&mode=exactfilename&suite=${DEBIAN_SUITE}&arch=amd64`
      );
      const names = [...html.matchAll(new RegExp(`href="/${DEBIAN_SUITE}/([^"/]+)"`, "g"))]
        .map((match) => match[1])
        .filter(
          (name) =>
            !name.startsWith("search") &&
            !name.startsWith("lib32") &&
            !name.startsWith("lib64") &&
            !name.endsWith("-dev") &&
            !name.endsWith("-dbg") &&
            !name.endsWith("-dbgsym") &&
            name.startsWith("lib")
        );
      for (const name of names) {
        if (!candidates.includes(name)) candidates.push(name);
        if (candidates.length >= 8) break;
      }
    } catch (error) {
      warn(`could not search a package for ${soname}: ${error.message}`);
    }
  }

  for (const pkg of candidates) {
    if (installed.has(pkg)) continue;
    if (await installPackage(pkg, soname, installed)) return true;
  }

  warn(`no Debian package provided ${soname}`);
  return false;
}

async function installLddDependencies({ executable, programDir }, installed) {
  const binaries = [
    executable,
    path.join(programDir, "oosplash"),
    path.join(programDir, "soffice.bin"),
    path.join(programDir, "libmergedlo.so"),
  ].filter((candidate) => fs.existsSync(candidate));

  let added = false;

  for (const binary of binaries) {
    const { systemPaths, missing } = parseLdd(runLdd(binary));

    for (const soname of missing) {
      if (await installForSoname(soname, installed)) added = true;
    }

    for (const file of systemPaths) {
      const pkg = packageForPath(file);
      if (!pkg || installed.has(pkg) || SKIP_PACKAGES.has(pkg)) continue;
      if (await installPackage(pkg, path.basename(file), installed)) added = true;
    }
  }

  return added;
}

function runVersion(executable) {
  const result = spawnSync(executable, ["--version"], {
    encoding: "utf8",
    timeout: 60000,
    env: portableEnv(),
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  const match = output.match(/LibreOffice\s+([\d.]+)/i);
  if (result.status !== 0 || !match) {
    throw new Error(
      `LibreOffice version probe failed: ${output.split(/\r?\n/)[0] || `exit ${result.status}`}`
    );
  }
  return { version: match[1], line: output.split(/\r?\n/)[0] };
}

function runSmokeConversion(executable) {
  const smokeDir = path.join(TMP_DIR, "smoke");
  fs.rmSync(smokeDir, { recursive: true, force: true });
  fs.mkdirSync(smokeDir, { recursive: true });

  const fixture = path.resolve(
    BACKEND_DIR,
    "..",
    "eval-word2pdf",
    "fixtures",
    "01_simple_text.docx"
  );
  let inputPath;
  if (fs.existsSync(fixture)) {
    inputPath = path.join(smokeDir, "smoke.docx");
    fs.copyFileSync(fixture, inputPath);
  } else {
    inputPath = path.join(smokeDir, "smoke.fodt");
    fs.writeFileSync(inputPath, FODT_TEXT);
  }

  const profileDir = path.join(smokeDir, "profile");
  const outputDir = path.join(smokeDir, "out");
  fs.mkdirSync(outputDir, { recursive: true });

  const result = spawnSync(
    executable,
    [
      "--headless",
      "--nologo",
      "--nodefault",
      "--norestore",
      "--nolockcheck",
      `-env:UserInstallation=${pathToFileURL(profileDir).href}`,
      "--convert-to",
      "pdf",
      "--outdir",
      outputDir,
      inputPath,
    ],
    {
      encoding: "utf8",
      timeout: 180000,
      env: portableEnv(),
      cwd: smokeDir,
    }
  );

  const outputPath = path.join(outputDir, `${path.parse(inputPath).name}.pdf`);
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  const ok =
    result.status === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000;

  if (ok) {
    log(`smoke conversion OK (${fs.statSync(outputPath).size} bytes)`);
  } else {
    warn(`smoke conversion failed: ${output.split(/\r?\n/)[0] || `exit ${result.status}`}`);
  }

  fs.rmSync(smokeDir, { recursive: true, force: true });
  return { ok, output, status: result.status };
}

function writeManifest(executable, version) {
  fs.writeFileSync(
    MANIFEST_PATH,
    `${JSON.stringify(
      {
        executable,
        depsDir: DEPS_DIR,
        version,
        fontConfig: FONTCONFIG_FILE,
        installedAt: new Date().toISOString(),
      },
      null,
      2
    )}\n`
  );
}

function findPortableProgram() {
  const optDirectory = path.join(EXTRACTED_DIR, "opt");
  if (!fs.existsSync(optDirectory)) return null;

  for (const entry of fs.readdirSync(optDirectory)) {
    const programDir = path.join(optDirectory, entry, "program");
    const executable = path.join(programDir, "soffice");
    if (isExecutableFile(executable)) {
      return { executable, programDir };
    }
  }

  return null;
}

async function preparePortableRuntime(portable) {
  PROGRAM_DIR = portable.programDir;
  fs.mkdirSync(DEPS_DIR, { recursive: true });
  fs.mkdirSync(HOME_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const installed = new Set();
  for (const pkg of PRELOAD_PACKAGES) {
    await installPackage(pkg, null, installed);
  }
  writeFontConfig();

  for (let round = 0; round < 8; round++) {
    await installLddDependencies(portable, installed);
    writeFontConfig();

    const smoke = runSmokeConversion(portable.executable);
    if (smoke.ok) {
      const version = runVersion(portable.executable);
      writeManifest(portable.executable, version.version);
      log(`LibreOffice ${version.line} ready at ${portable.executable}`);
      return;
    }

    const missing = parseMissingLibraries(smoke.output);
    if (!missing.length) {
      throw new Error(
        `LibreOffice smoke conversion failed: ${
          smoke.output.split(/\r?\n/)[0] || `exit ${smoke.status}`
        }`
      );
    }

    let progressed = false;
    for (const soname of missing) {
      if (await installForSoname(soname, installed)) progressed = true;
    }
    if (!progressed) {
      throw new Error(`LibreOffice libraries could not be resolved: ${missing.join(", ")}`);
    }
  }

  throw new Error("LibreOffice dependency installation did not converge");
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

  const system = findSystemLibreOffice();
  if (system && verifySystemLibreOffice(system)) {
    log(`system LibreOffice is usable at ${system}`);
    return;
  }

  fs.mkdirSync(DEPS_DIR, { recursive: true });
  fs.mkdirSync(HOME_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });
  writeFontConfig();

  const existing = findPortableProgram();
  if (existing) {
    PROGRAM_DIR = existing.programDir;
    try {
      const version = runVersion(existing.executable);
      const smoke = runSmokeConversion(existing.executable);
      if (smoke.ok) {
        writeManifest(existing.executable, version.version);
        log(`portable LibreOffice already ready at ${existing.executable}`);
        return;
      }
      warn("existing portable LibreOffice failed its smoke conversion; repairing dependencies");
    } catch (error) {
      warn(`existing portable LibreOffice is unusable: ${error.message}`);
    }
  }

  if (!existing) {
    fs.mkdirSync(PORTABLE_DIR, { recursive: true });
    const appImagePath = path.join(PORTABLE_DIR, "LibreOffice.AppImage");

    if (!fs.existsSync(appImagePath)) {
      log(`downloading ${DOWNLOAD_URL}`);
      try {
        await downloadWithRetry(DOWNLOAD_URL, appImagePath);
      } catch (error) {
        fs.rmSync(appImagePath, { force: true });
        throw error;
      }
    }
    fs.chmodSync(appImagePath, 0o755);

    fs.rmSync(EXTRACTED_DIR, { recursive: true, force: true });
    log("extracting AppImage (no root or FUSE required)");
    const extraction = spawnSync(appImagePath, ["--appimage-extract"], {
      cwd: PORTABLE_DIR,
      env: { ...process.env, HOME: process.env.HOME || PORTABLE_DIR },
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      timeout: 10 * 60 * 1000,
    });

    if (extraction.status !== 0 || !isExecutableFile(APP_RUN)) {
      const details = (extraction.stderr || extraction.stdout || "")
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(-5)
        .join(" | ");
      throw new Error(
        `AppImage extraction failed (status ${extraction.status}); expected ${APP_RUN}${
          details ? `: ${details}` : ""
        }`
      );
    }
    log("AppImage extracted");

    fs.rmSync(appImagePath, { force: true });
  }

  const portable = findPortableProgram();
  if (!portable) {
    throw new Error(`portable LibreOffice program not found under ${EXTRACTED_DIR}`);
  }

  await preparePortableRuntime(portable);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`[libreoffice-setup] ERROR: ${error.message}`);
    process.exit(1);
  });
