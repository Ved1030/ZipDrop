/* ─────────────────────────────────────────────────────────
   openFileInEditor.ts
   Fetches the file from its Supabase URL, parses it by
   extension using the appropriate library, then opens a
   full self-contained ZipDrop editor in a new browser tab.
   Used by ZDOpenEditButton and ZDFormatPreviewCard.
   ───────────────────────────────────────────────────────── */

import { buildEditorPage } from "./buildEditorPage";

/* ── CDN script loader ──────────────────────────────────── */

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve();
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // fail silently — we'll show "unsupported"
    document.head.appendChild(s);
  });
}

/* ── Main export ─────────────────────────────────────────── */

export async function openFileInEditor(file: {
  file_name: string;
  file_url: string;
  file_size?: number;
}): Promise<void> {
  const ext = (file.file_name.split(".").pop() ?? "").toLowerCase();
  let content = "";
  let fileType = "unsupported";

  try {
    const response = await fetch(file.file_url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();

    /* ── .docx / .doc ── mammoth.js ── */
    if (["docx", "doc"].includes(ext)) {
      await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"
      );
      const mammoth = (window as any).mammoth;
      if (mammoth) {
        const result = await mammoth.convertToHtml({ arrayBuffer });
        content = result.value || "<p>(empty document)</p>";
      } else {
        content = "<p>⚠️ Could not load mammoth.js. Try again in a moment.</p>";
      }
      fileType = "doc";

    /* ── .xlsx / .xls ── SheetJS ── */
    } else if (["xlsx", "xls"].includes(ext)) {
      await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
      );
      const XLSX = (window as any).XLSX;
      if (XLSX) {
        const wb = XLSX.read(arrayBuffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        content = JSON.stringify(data);
      } else {
        content = JSON.stringify([["⚠️ SheetJS failed to load"]]);
      }
      fileType = "sheet";

    /* ── .pdf — read-only view ── */
    } else if (ext === "pdf") {
      content = file.file_url; // pass URL so download link works
      fileType = "pdf";

    /* ── images ── convert to data URL ── */
    } else if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
      const blob = new Blob([arrayBuffer]);
      content = await new Promise<string>((res) => {
        const fr = new FileReader();
        fr.onload = (e) => res((e.target?.result as string) ?? "");
        fr.readAsDataURL(blob);
      });
      fileType = "image";

    /* ── code files ── */
    } else if (
      ["py", "js", "ts", "jsx", "tsx", "json", "html", "css"].includes(ext)
    ) {
      content = new TextDecoder().decode(arrayBuffer);
      fileType = "code";

    /* ── plain text / markdown ── */
    } else if (["txt", "md", "csv"].includes(ext)) {
      content = new TextDecoder().decode(arrayBuffer);
      fileType = "text";

    /* ── everything else ── */
    } else {
      fileType = "unsupported";
    }
  } catch (err) {
    console.error("[ZipDrop Editor] Failed to load file:", err);
    fileType = "unsupported";
  }

  /* ── Open tab ── */
  const editorTab = window.open("", "_blank");
  if (!editorTab) {
    alert(
      "Popup was blocked.\nPlease allow popups for this site and click Open & Edit again."
    );
    return;
  }

  const pageHTML = buildEditorPage(
    file.file_name,
    fileType,
    content,
    file.file_size
  );

  editorTab.document.open();
  editorTab.document.write(pageHTML);
  editorTab.document.close();
}
