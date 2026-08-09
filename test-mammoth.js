const mammoth = require("mammoth");

const fileUrl = process.argv[2];
if (!fileUrl) {
  console.error("Usage: node test-mammoth.js <supabase-file-url>");
  process.exit(1);
}

(async () => {
  try {
    console.log("Fetching:", fileUrl);
    const res = await fetch(fileUrl);
    console.log("HTTP status:", res.status);
    if (!res.ok) {
      console.error("Fetch failed");
      process.exit(1);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    console.log("File size:", buf.length, "bytes");

    const header = buf.slice(0, 2);
    const isZip = header[0] === 0x50 && header[1] === 0x4b;
    console.log("ZIP/DOCX header:", isZip ? "YES (real DOCX)" : "NO (not a ZIP — likely HTML)");

    if (!isZip) {
      const text = buf.toString("utf-8").slice(0, 500);
      console.log("\nFile starts with:\n", text);
      console.log("\nConclusion: This file is HTML, not a real .docx. Mammoth cannot convert it.");
      process.exit(0);
    }

    console.log("\nRunning mammoth.convertToHtml...");
    const result = await mammoth.convertToHtml({ buffer: buf });
    console.log("HTML length:", result.value.length, "chars");
    console.log("First 300 chars:", result.value.slice(0, 300));
    console.log("\nWarnings:", result.messages);
    console.log("\nSuccess! Mammoth converted the file.");
  } catch (err) {
    console.error("\nERROR:", err.message);
    console.error(err.stack);
  }
})();
