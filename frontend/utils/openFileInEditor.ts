import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { buildEditorPage } from "./buildEditorPage";

export async function openFileInEditor(file: {
  file_name: string;
  file_url: string;
  file_size?: number;
  recipient_code?: string;
}): Promise<void> {
  const ext = (file.file_name.split(".").pop() ?? "").toLowerCase();
  let content = "";
  let fileType: string = "unsupported";
  let fileUrl = "";

  try {
    if (["docx", "doc"].includes(ext)) {
      fileType = "doc";
      fileUrl = file.file_url;
    } else {
      const response = await fetch(file.file_url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();

      if (["xlsx", "xls"].includes(ext)) {
        const wb = XLSX.read(arrayBuffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        content = JSON.stringify(data);
        fileType = "sheet";
      } else if (ext === "pdf") {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(new Blob([arrayBuffer]));
        });
        content = dataUrl;
        fileType = "pdf";
      } else if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(new Blob([arrayBuffer]));
        });
        content = dataUrl;
        fileType = "image";
      } else if (["py", "js", "ts", "jsx", "tsx", "json", "html", "css"].includes(ext)) {
        content = new TextDecoder().decode(arrayBuffer);
        fileType = "code";
      } else if (["txt", "md", "csv"].includes(ext)) {
        content = new TextDecoder().decode(arrayBuffer);
        fileType = "text";
      } else {
        fileType = "unsupported";
      }
    }
  } catch (err) {
    console.error("[ZipDrop Editor] Failed to load file:", err);
    fileType = "unsupported";
  }

  const libs: Record<string, any> = {};
  libs.mammoth = mammoth;
  libs.XLSX = XLSX;
  libs.pdfWorkerUrl = window.location.origin + "/pdf.worker.min.js";
  (window as any).__zdEditorLibs = libs;

  const editorTab = window.open("", "_blank");
  if (!editorTab) {
    alert("Popup was blocked.\nPlease allow popups for this site and click Open & Edit again.");
    return;
  }

  const pageHTML = buildEditorPage(
    file.file_name,
    fileType,
    content,
    file.file_size,
    file.recipient_code,
    fileUrl
  );

  const blob = new Blob([pageHTML], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  editorTab.location.href = url;
}
