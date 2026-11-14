require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const cron = require("node-cron");
const archiver = require("archiver");
const axios = require("axios");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const { createClient } = require("@supabase/supabase-js");

const FileModel = require("./models/FileModel");

const app = express();

/* --------------------------------
   In-memory store fallback
-------------------------------- */

class MemoryStore {
  constructor() { this._data = new Map(); }
  async findOne(query) {
    for (const v of this._data.values()) {
      if (Object.keys(query).every(k => v[k] === query[k])) return v;
    }
    return null;
  }
  async save(doc) {
    this._data.set(doc.file_id, doc);
    return doc;
  }
  async stats() {
    let files = 0;
    for (const v of this._data.values()) {
      if (Array.isArray(v.files)) files += v.files.length;
      else if (v.file_name !== "text") files += 1;
    }
    return { files, transfers: this._data.size };
  }
}

let store;

function mongoWrapper(model) {
  const fallback = new MemoryStore();
  let useFallback = false;
  return {
    async findOne(query) {
      if (useFallback) return fallback.findOne(query);
      try {
        return await model.findOne(query);
      } catch (err) {
        console.log("MongoDB query failed — switching to in-memory store");
        useFallback = true;
        return fallback.findOne(query);
      }
    },
    async save(doc) {
      if (useFallback) return fallback.save(doc);
      try {
        if (typeof doc.save === "function") return await doc.save();
        return await new model(doc).save();
      } catch (err) {
        console.log("MongoDB save failed — switching to in-memory store");
        useFallback = true;
        return fallback.save(doc);
      }
    },
    async stats() {
      if (useFallback) return fallback.stats();
      try {
        const transfers = await model.countDocuments({});
        const result = await model.aggregate([
          { $project: { n: { $size: { $ifNull: ["$files", []] } } } },
          { $group: { _id: null, files: { $sum: "$n" } } },
        ]);
        return { files: result[0]?.files || 0, transfers };
      } catch (err) {
        console.log("MongoDB stats failed — switching to in-memory store");
        useFallback = true;
        return fallback.stats();
      }
    },
  };
}

/* --------------------------------
   Supabase Configuration
-------------------------------- */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/* --------------------------------
   Middleware
------------------------------ */


const corsOptions = {
  origin: true,
  credentials: true,
  exposedHeaders: [
    "X-Original-Size",
    "X-Compressed-Size", 
    "X-Bytes-Saved",
    "X-Reduction-Percent",
    "X-Page-Count",
    "X-Width",
    "X-Height",
    "X-Compression-Level",
    "X-Compression-Mode",
    "X-Quality",
    "X-Compression-Method",
    "X-Warning",
    "X-Total-Files",
    "X-Successful",
    "X-Failed",
    "X-Total-Original-Size",
    "X-Total-Compressed-Size",
    "X-Total-Bytes-Saved",
    "X-Total-Reduction-Percent",
    "Content-Disposition"
  ]
};

app.use(cors(corsOptions));

app.use(express.json());

/* --------------------------------
   MongoDB Connection (with fallback)
-------------------------------- */

async function initStore() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("MongoDB Connected");
    store = mongoWrapper(FileModel);
  } catch (err) {
    console.log("MongoDB unavailable — using in-memory store");
    store = new MemoryStore();
  }
}
initStore().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

/* --------------------------------
   Multer Configuration
-------------------------------- */

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 },
});

/* --------------------------------
   Generate Unique 4 Digit Code
-------------------------------- */

async function generateUniqueCode() {
  let code;

  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (await store.findOne({ file_id: code }));

  return code;
}

/* --------------------------------
   Test Route
-------------------------------- */

app.get("/", (req, res) => {
  res.send("File Sharing API Running");
});

/* --------------------------------
   Public Stats
-------------------------------- */

app.get("/stats", async (req, res) => {
  try {
    const { files, transfers } = await store.stats();
    res.set("Cache-Control", "public, max-age=60");
    res.json({ files, transfers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Stats unavailable" });
  }
});

/* --------------------------------
   Upload Files
-------------------------------- */

app.post("/upload", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const fileId = await generateUniqueCode();
    const uploadedFiles = [];

    for (const file of req.files) {
      const fileName = `${Date.now()}-${file.originalname}`;

      const { error } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Supabase upload failed" });
      }

      const fileUrl =
        `${process.env.SUPABASE_URL}/storage/v1/object/public/` +
        `${process.env.SUPABASE_BUCKET}/${fileName}`;

      uploadedFiles.push({
        file_name: file.originalname,
        file_url: fileUrl,
        file_size: file.size,
      });
    }

    const newFile = {
      file_id: fileId,
      files: uploadedFiles,
      download_count: 0,
      expiry_time: new Date(Date.now() + 48 * 60 * 60 * 1000),
    };

    await store.save(newFile);

    res.json({
      message: "Files uploaded successfully",
      code: fileId,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Upload failed");
  }
});

/* --------------------------------
   Resend (upload with specific code)
------------------------------- */

app.post("/resend", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let fileId = req.body.recipientCode;
    if (!fileId || !/^\d{4}$/.test(fileId)) {
      fileId = await generateUniqueCode();
    } else {
      const exists = await store.findOne({ file_id: fileId });
      if (exists) {
        fileId = await generateUniqueCode();
      }
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Supabase upload failed" });
    }

    const fileUrl =
      `${process.env.SUPABASE_URL}/storage/v1/object/public/` +
      `${process.env.SUPABASE_BUCKET}/${fileName}`;

    const newFile = {
      file_id: fileId,
      files: [{
        file_name: req.file.originalname,
        file_url: fileUrl,
        file_size: req.file.size,
      }],
      download_count: 0,
      expiry_time: new Date(Date.now() + 48 * 60 * 60 * 1000),
    };

    await store.save(newFile);

    res.json({
      message: "File resent successfully",
      code: fileId,
      files: [{
        file_name: req.file.originalname,
        file_url: fileUrl,
        file_size: req.file.size,
      }],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Resend failed" });
  }
});

/* --------------------------------
   Share Text
------------------------------- */

app.post("/share-text", async (req, res) => {
  try {
    if (!req.body.text) {
      return res.status(400).send("Text required");
    }

    const textId = await generateUniqueCode();

    const newText = {
      file_id: textId,
      file_name: "text",
      file_url: req.body.text,
      file_size: req.body.text.length,
      download_count: 0,
      expiry_time: new Date(Date.now() + 48 * 60 * 60 * 1000),
    };

    await store.save(newText);

    res.json({
      message: "Text shared successfully",
      code: textId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Text sharing failed");
  }
});

/* --------------------------------
   Convert PDF to DOCX (High-fidelity)
-------------------------------- */

/* --------------------------------
   Python environment for PDF conversion
-------------------------------- */

const PDF_SCRIPT_PATH = path.join(__dirname, "pdf_converter.py");
const PDF_VENV_PYTHON = path.join(
  __dirname,
  ".venv",
  process.platform === "win32" ? "Scripts" : "bin",
  process.platform === "win32" ? "python.exe" : "python"
);

function resolvePdfPython() {
  if (process.env.PDF_PYTHON_BIN) return process.env.PDF_PYTHON_BIN;
  if (fs.existsSync(PDF_VENV_PYTHON)) return PDF_VENV_PYTHON;
  return process.platform === "win32" ? "python" : "python3";
}

const PDF_PYTHON_BIN = resolvePdfPython();

if (!process.env.PDF_PYTHON_BIN && !fs.existsSync(PDF_VENV_PYTHON)) {
  console.warn(
    "[PDF-to-DOCX] backend/.venv is missing; falling back to system Python. Run `npm install` in backend to provision it."
  );
}

const pdfTooling = {
  checked: false,
  ok: false,
  pythonVersion: null,
  pdf2docxVersion: null,
  error: null,
};

function lastJsonLine(text) {
  const lines = text.trim().split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line.startsWith("{")) continue;
    try {
      return JSON.parse(line);
    } catch {
      // keep scanning towards the start of stdout
    }
  }
  return null;
}

function checkPdfTooling() {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (status) => {
      if (settled) return;
      settled = true;
      Object.assign(pdfTooling, status, { checked: true });

      console.log(`[PDF-to-DOCX] Python interpreter: ${PDF_PYTHON_BIN}`);
      if (pdfTooling.ok) {
        console.log(
          `[PDF-to-DOCX] pdf2docx ${pdfTooling.pdf2docxVersion} import OK (Python ${pdfTooling.pythonVersion})`
        );
      } else {
        console.error(`[PDF-to-DOCX] Dependency check failed: ${pdfTooling.error}`);
      }
      resolve(pdfTooling);
    };

    const proc = spawn(PDF_PYTHON_BIN, [PDF_SCRIPT_PATH, "--check"], {
      env: { ...process.env, PYTHONUNBUFFERED: "1", PYTHONIOENCODING: "utf-8" },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("error", (err) => {
      finish({ ok: false, error: `could not start interpreter: ${err.message}` });
    });

    proc.on("close", (code) => {
      const result = lastJsonLine(stdout);
      if (result && result.success) {
        finish({
          ok: true,
          pythonVersion: result.python_version || null,
          pdf2docxVersion: result.pdf2docx_version || "installed",
          error: null,
        });
        return;
      }

      const stderrLine = stderr.trim().split(/\r?\n/).filter(Boolean).pop();
      finish({
        ok: false,
        error: result?.error || stderrLine || `interpreter exited with code ${code}`,
      });
    });
  });
}

checkPdfTooling().catch(() => {});

function convertPdfToDocx(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(PDF_PYTHON_BIN, [PDF_SCRIPT_PATH, inputPath, outputPath], {
      env: { ...process.env, PYTHONUNBUFFERED: "1", PYTHONIOENCODING: "utf-8" },
    });
    
    let stdout = "";
    let stderr = "";
    
    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("[PDF-to-DOCX] Python process exited with code:", code);
        console.error("[PDF-to-DOCX] stderr:", stderr);
        reject(new Error(`Conversion failed with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        const result = lastJsonLine(stdout);
        if (!result) {
          throw new Error("Converter did not return JSON");
        }

        if (result.success) {
          resolve(result.output_path);
        } else {
          reject(new Error(result.error || "Unknown conversion error"));
        }
      } catch (parseError) {
        console.error("[PDF-to-DOCX] Failed to parse result:", stdout);
        reject(new Error("Conversion failed: invalid response from converter"));
      }
    });
    
    pythonProcess.on("error", (err) => {
      console.error("[PDF-to-DOCX] Failed to spawn Python process:", err);
      reject(new Error("Conversion service unavailable"));
    });
  });
}

app.post("/convert-pdf-to-docx", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "File must be a PDF" });
    }
    
    const inputPath = path.join(__dirname, "temp", `${Date.now()}-${req.file.originalname}`);
    const outputPath = path.join(__dirname, "temp", `${Date.now()}-${req.file.originalname.replace(/\.pdf$/i, ".docx")}`);
    
    const tempDir = path.dirname(inputPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(inputPath, req.file.buffer);
    
    try {
      console.log("[PDF-to-DOCX] Starting conversion for:", req.file.originalname);
      await convertPdfToDocx(inputPath, outputPath);
      console.log("[PDF-to-DOCX] Conversion completed");
      
      const docxBuffer = fs.readFileSync(outputPath);
      
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
      
      const filename = req.file.originalname.replace(/\.pdf$/i, ".docx");
      
      res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": docxBuffer.length,
      });
      
      res.send(docxBuffer);
    } catch (convError) {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      throw convError;
    }
  } catch (error) {
    console.error("[PDF-to-DOCX] Error:", error.message);
    res.status(500).json({ error: error.message || "PDF conversion failed" });
  }
});

/* --------------------------------
   PDF conversion health
------------------------------- */

app.get("/health/pdf-to-docx", (req, res) => {
  res.status(pdfTooling.ok ? 200 : 503).json({
    ok: pdfTooling.ok,
    checked: pdfTooling.checked,
    dependency: "pdf2docx",
    version: pdfTooling.pdf2docxVersion,
    python_version: pdfTooling.pythonVersion,
    interpreter: path.basename(PDF_PYTHON_BIN),
  });
});

/* --------------------------------
   Conversion Router & Endpoints
------------------------------- */

const { getRouter } = require("./converters");
const libreoffice = require("./converters/libreoffice");
const router = getRouter();

/* LibreOffice startup diagnostics (non-fatal) */
libreoffice.logDiagnostics().catch((error) => {
  console.error("[LibreOffice] Diagnostic check failed:", error.message);
});

/* Health check for all conversions */
app.get("/health/conversions", (req, res) => {
  const conversions = router.getSupportedConversions();
  res.json({
    conversions: conversions.map(c => ({
      key: c.key,
      input: c.inputFormat,
      output: c.outputFormat,
      category: c.category,
    })),
    categories: router.getCategories(),
  });
});

/* Path-safe LibreOffice health check */
app.get("/health/word-to-pdf", (req, res) => {
  const status = libreoffice.getStatus();
  const healthy = status.available && status.conversionOk !== false;
  res.status(healthy ? 200 : 503).json({
    ok: healthy,
    dependency: "libreoffice",
    version: status.version,
    version_ok: status.versionOk,
    conversion_ok: status.conversionOk,
    conversion_error: status.conversionError,
    detected_via: status.source,
    portable: status.portable,
  });
});

/* Generic conversion endpoint */
async function handleConversion(req, res, conversionKey) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Parse conversion key to get input/output formats
    const match = conversionKey.match(/^(.+)-to-(.+)$/);
    if (!match) {
      return res.status(400).json({ error: "Invalid conversion key" });
    }

    const [, inputFormat, outputFormat] = match;
    const options = { ...req.body };
    
    // Convert string options to proper types
    if (options.dpi) options.dpi = parseInt(options.dpi);
    if (options.quality) options.quality = parseInt(options.quality);
    if (options.grayscale) options.grayscale = options.grayscale === 'true';
    if (options.printBackground) options.printBackground = options.printBackground === 'true';
    if (options.pages) options.pages = options.pages;
    if (options.mode) options.mode = options.mode;

    const outputBuffer = await router.convert({
      inputBuffer: req.file.buffer,
      inputFormat,
      outputFormat,
      options,
    });

    // Detect if result is a ZIP file (PK header) - but exclude Office formats which are ZIP-based
    const isZipFormat = ['xlsx', 'docx', 'pptx'].includes(outputFormat);
    const isZip = !isZipFormat && outputBuffer.length >= 4 && 
      outputBuffer[0] === 0x50 && outputBuffer[1] === 0x4B && 
      (outputBuffer[2] === 0x03 || outputBuffer[2] === 0x05 || outputBuffer[2] === 0x07);

    let filename, mimeType;
    
    if (isZip) {
      // Multi-file output (e.g., HTML with assets, multiple CSV sheets)
      const baseName = req.file.originalname.replace(
        new RegExp(`\\.${inputFormat}$`, 'i'),
        ''
      );
      filename = `${baseName}_${outputFormat}.zip`;
      mimeType = 'application/zip';
    } else {
      // Single file output
      filename = req.file.originalname.replace(
        new RegExp(`\\.${inputFormat}$`, 'i'),
        `.${outputFormat}`
      );
      mimeType = router.getConverter(conversionKey).getMimeType(outputFormat);
    }

    res.set({
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": outputBuffer.length,
    });

    res.send(outputBuffer);
  } catch (error) {
    console.error(`[${conversionKey}] Error:`, error.message);
    const status = error.code === 'INVALID_INPUT' || error.code === 'UNSUPPORTED_FORMAT' ? 400 :
                   error.code === 'FILE_TOO_LARGE' ? 413 :
                   error.code === 'MISSING_DEPENDENCY' ? 503 : 500;
    res.status(status).json({ 
      error: error.message || "Conversion failed",
      code: error.code,
      ...(error.details && error.details.safeDetail
        ? { detail: error.details.safeDetail }
        : {})
    });
  }
}

/* Phase 1 Conversion Endpoints */

// PDF to Word (with mode option)
app.post("/convert/pdf-to-word", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'pdf-to-docx');
});

// Word to PDF
app.post("/convert/word-to-pdf", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'docx-to-pdf');
});

// Excel to PDF
app.post("/convert/excel-to-pdf", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'xlsx-to-pdf');
});

// PowerPoint to PDF
app.post("/convert/powerpoint-to-pdf", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'pptx-to-pdf');
});

// PDF to JPG
app.post("/convert/pdf-to-jpg", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'pdf-to-jpg');
});

// PDF to PNG
app.post("/convert/pdf-to-png", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'pdf-to-png');
});

// PDF to Excel
app.post("/convert/pdf-to-excel", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'pdf-to-xlsx');
});

// PDF to PowerPoint
app.post("/convert/pdf-to-powerpoint", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'pdf-to-pptx');
});

// PDF to Text
app.post("/convert/pdf-to-text", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'pdf-to-txt');
});

// PDF to HTML
app.post("/convert/pdf-to-html", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'pdf-to-html');
});

// PDF to PDF/A
app.post("/convert/pdf-to-pdfa", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'pdf-to-pdfa');
});

// Word to Text
app.post("/convert/word-to-text", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'docx-to-txt');
});

// Word to HTML
app.post("/convert/word-to-html", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'docx-to-html');
});

// Excel to CSV
app.post("/convert/excel-to-csv", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'xlsx-to-csv');
});

// Text to PDF
app.post("/convert/text-to-pdf", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'txt-to-pdf');
});

// HTML to PDF
app.post("/convert/html-to-pdf", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'html-to-pdf');
});

// CSV to Excel
app.post("/convert/csv-to-excel", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'csv-to-xlsx');
});

// RTF to Word
app.post("/convert/rtf-to-word", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'rtf-to-docx');
});

// JPG to PDF
app.post("/convert/jpg-to-pdf", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'jpg-to-pdf');
});

// PNG to PDF
app.post("/convert/png-to-pdf", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'png-to-pdf');
});

// Multiple images to PDF
app.post("/convert/images-to-pdf", upload.array("files", 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const options = { ...req.body };
    if (options.pageSize) options.pageSize = options.pageSize;
    if (options.orientation) options.orientation = options.orientation;
    if (options.margin) options.margin = parseFloat(options.margin);

    const buffers = req.files.map(f => f.buffer);
    const formats = req.files.map(f => {
      const ext = f.originalname.split('.').pop().toLowerCase();
      return ext === 'jpeg' ? 'jpg' : ext;
    });

    const outputBuffer = await router.convertMultiple({
      inputBuffers: buffers,
      inputFormats: formats,
      outputFormat: 'pdf',
      options,
    });

    const filename = 'converted.pdf';

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": outputBuffer.length,
    });

    res.send(outputBuffer);
  } catch (error) {
    console.error("[images-to-pdf] Error:", error.message);
    const status = error.code === 'INVALID_INPUT' || error.code === 'UNSUPPORTED_FORMAT' ? 400 :
                   error.code === 'FILE_TOO_LARGE' ? 413 :
                   error.code === 'MISSING_DEPENDENCY' ? 503 : 500;
    res.status(status).json({ 
      error: error.message || "Conversion failed",
      code: error.code 
    });
  }
});

/* Image to Image Conversion Endpoints */

// JPG to PNG
app.post("/convert/jpg-to-png", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'jpg-to-png');
});

// PNG to JPG
app.post("/convert/png-to-jpg", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'png-to-jpg');
});

// WEBP to JPG
app.post("/convert/webp-to-jpg", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'webp-to-jpg');
});

// JPG to WEBP
app.post("/convert/jpg-to-webp", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'jpg-to-webp');
});

// PNG to WEBP
app.post("/convert/png-to-webp", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'png-to-webp');
});

// SVG to PNG
app.post("/convert/svg-to-png", upload.single("file"), async (req, res) => {
  await handleConversion(req, res, 'svg-to-png');
});

/* --------------------------------
   Compression Router & Endpoints
------------------------------ */

const { getCompressionRouter } = require("./compression");
const compressionRouter = getCompressionRouter();

/* Compression health check */
app.get("/health/compression", async (req, res) => {
  try {
    // Check PDF compressor
    const pdfCompressor = compressionRouter.getCompressor('pdf');
    await pdfCompressor.checkPDFCompressorTooling();
    
    // Check image compressor
    const jpgCompressor = compressionRouter.getCompressor('jpg');
    await jpgCompressor.checkImageCompressorTooling();

    res.json({
      ok: true,
      pdf: { ok: true },
      image: { ok: true },
      bulk: { ok: true },
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: error.message,
    });
  }
});

/* Generic compression endpoint */
async function handleCompression(req, res, format) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const options = { ...req.body };
    
    // Convert string options to proper types
    if (options.quality) options.quality = options.quality; // Keep as string for preset handling
    if (options.level) options.level = options.level;
    if (options.mode) options.mode = options.mode;
    if (options.progressive) options.progressive = options.progressive === 'true';
    if (options.useOxipng) options.useOxipng = options.useOxipng === 'true';
    if (options.allowAnimated) options.allowAnimated = options.allowAnimated === 'true';
    if (options.width) options.width = parseInt(options.width);
    if (options.height) options.height = parseInt(options.height);

    const result = await compressionRouter.compress({
      inputBuffer: req.file.buffer,
      inputFormat: format,
      options,
    });

    // Determine filename
    const baseName = req.file.originalname.replace(
      new RegExp(`\\.${format}$`, 'i'),
      ''
    );
    const filename = `${baseName}_compressed.${format === 'jpeg' ? 'jpg' : format}`;
    const mimeType = compressionRouter.getCompressor(format).getMimeType(format);

    // Send compressed file with stats in headers
    res.set({
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": result.buffer.length,
      "X-Original-Size": result.stats.originalSize,
      "X-Compressed-Size": result.stats.compressedSize,
      "X-Bytes-Saved": result.stats.bytesSaved,
      "X-Reduction-Percent": result.stats.reductionPercent,
    });

    // Add format-specific headers
    if (result.stats.pageCount) {
      res.set("X-Page-Count", result.stats.pageCount);
    }
    if (result.stats.width && result.stats.height) {
      res.set("X-Width", result.stats.width);
      res.set("X-Height", result.stats.height);
    }
    if (result.stats.level) {
      res.set("X-Compression-Level", result.stats.level);
    }
    if (result.stats.mode) {
      res.set("X-Compression-Mode", result.stats.mode);
    }
    if (result.stats.quality) {
      res.set("X-Quality", result.stats.quality);
    }
    if (result.stats.method) {
      res.set("X-Compression-Method", result.stats.method);
    }
    if (result.stats.warning) {
      res.set("X-Warning", result.stats.warning);
    }

    res.send(result.buffer);
  } catch (error) {
    console.error(`[compress/${format}] Error:`, error.message);
    const status = error.code === 'INVALID_INPUT' || error.code === 'UNSUPPORTED_FORMAT' ? 400 :
                   error.code === 'FILE_TOO_LARGE' ? 413 :
                   error.code === 'PASSWORD_PROTECTED' ? 400 :
                   error.code === 'CORRUPTED_FILE' ? 400 :
                   error.code === 'MISSING_DEPENDENCY' ? 503 : 500;
    res.status(status).json({ 
      error: error.message || "Compression failed",
      code: error.code,
      ...(error.details && { detail: error.details })
    });
  }
}

/* Compression Endpoints */

// PDF Compression
app.post("/compress/pdf", upload.single("file"), async (req, res) => {
  await handleCompression(req, res, 'pdf');
});

// JPG Compression
app.post("/compress/jpg", upload.single("file"), async (req, res) => {
  await handleCompression(req, res, 'jpg');
});

// PNG Compression
app.post("/compress/png", upload.single("file"), async (req, res) => {
  await handleCompression(req, res, 'png');
});

// WEBP Compression
app.post("/compress/webp", upload.single("file"), async (req, res) => {
  await handleCompression(req, res, 'webp');
});

/* Bulk Image Compression */
app.post("/compress/images/bulk", upload.array("files", 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const options = { ...req.body };
    if (options.quality) options.quality = options.quality;
    if (options.mode) options.mode = options.mode;
    if (options.progressive) options.progressive = options.progressive === 'true';
    if (options.useOxipng) options.useOxipng = options.useOxipng === 'true';
    if (options.allowAnimated) options.allowAnimated = options.allowAnimated === 'true';

    // Prepare files array for bulk compressor
    const files = req.files.map(f => {
      const ext = f.originalname.split('.').pop().toLowerCase();
      const format = ext === 'jpeg' ? 'jpg' : ext;
      return {
        buffer: f.buffer,
        originalName: f.originalname,
        format,
      };
    });

    // Validate formats
    const supportedFormats = compressionRouter.getBulkSupportedFormats();
    const invalidFiles = files.filter(f => !supportedFormats.includes(f.format));
    if (invalidFiles.length > 0) {
      return res.status(400).json({
        error: `Unsupported file formats: ${invalidFiles.map(f => f.originalName).join(', ')}`,
        code: 'UNSUPPORTED_FORMAT',
        unsupportedFiles: invalidFiles.map(f => f.originalName),
      });
    }

    const result = await compressionRouter.compressBulk({ files, options });

    // Send ZIP file with stats in headers
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="compressed_images.zip"`,
      "Content-Length": result.zipBuffer.length,
      "X-Total-Files": result.stats.totalFiles,
      "X-Successful": result.stats.successful,
      "X-Failed": result.stats.failed,
      "X-Total-Original-Size": result.stats.totalOriginalSize,
      "X-Total-Compressed-Size": result.stats.totalCompressedSize,
      "X-Total-Bytes-Saved": result.stats.totalBytesSaved,
      "X-Total-Reduction-Percent": result.stats.totalReductionPercent,
    });

    res.send(result.zipBuffer);
  } catch (error) {
    console.error("[compress/images/bulk] Error:", error.message);
    const status = error.code === 'INVALID_INPUT' || error.code === 'UNSUPPORTED_FORMAT' ? 400 :
                   error.code === 'FILE_TOO_LARGE' ? 413 :
                   error.code === 'MISSING_DEPENDENCY' ? 503 :
                   error.code === 'ZIP_CREATION_FAILED' ? 500 : 500;
    res.status(status).json({ 
      error: error.message || "Bulk compression failed",
      code: error.code,
      ...(error.details && { detail: error.details })
    });
  }
});

/* --------------------------------
   Receive Data
------------------------------ */

app.get("/receive/:code", async (req, res) => {
  try {
    const file = await store.findOne({ file_id: req.params.code });

    if (!file) {
      return res.status(404).json({ message: "Invalid code" });
    }

    file.download_count += 1;
    await store.save(file);

    if (file.file_name === "text") {
      return res.json({
        type: "text",
        text: file.file_url,
      });
    }

    return res.json({
      type: "files",
      files: file.files,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving data");
  }
});

