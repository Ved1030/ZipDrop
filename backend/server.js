require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const cron = require("node-cron");
const archiver = require("archiver");
const axios = require("axios");

const { createClient } = require("@supabase/supabase-js");

const File = require("./models/FileModel");

const app = express();

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

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

/* --------------------------------
   MongoDB Connection
-------------------------------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

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
  } while (await File.findOne({ file_id: code }));

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

    const newFile = new File({
      file_id: fileId,
      files: uploadedFiles,
      download_count: 0,
      expiry_time: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });

    await newFile.save();

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
   Share Text
-------------------------------- */

app.post("/share-text", async (req, res) => {
  try {
    if (!req.body.text) {
      return res.status(400).send("Text required");
    }

    const textId = await generateUniqueCode();

    const newText = new File({
      file_id: textId,
      file_name: "text",
      file_url: req.body.text,
      file_size: req.body.text.length,
      download_count: 0,
      expiry_time: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });

    await newText.save();

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
    const file = await File.findOne({ file_id: req.params.code });

    if (!file) {
      return res.status(404).json({ message: "Invalid code" });
    }

    file.download_count += 1;
    await file.save();

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

/* --------------------------------
   Server
-------------------------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});