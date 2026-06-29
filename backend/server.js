require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const cron = require("node-cron");
const archiver = require("archiver");
const axios = require("axios");

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
   Receive Data
-------------------------------- */

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

