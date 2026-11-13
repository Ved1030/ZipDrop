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
-------------------------------- */


app.use(cors());

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
-------------------------------- */

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
   Receive Data
------------------------------- */

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

