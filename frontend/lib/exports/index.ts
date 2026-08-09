function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportDocx(
  html: string,
  fileName: string
): Promise<void> {
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
  const res = await fetch("/api/convert-to-docx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html: fullHtml, filename: fileName }),
  });
  if (!res.ok) throw new Error("Failed to export DOCX");
  const blob = await res.blob();
  const outName = fileName.replace(/\.[^.]+$/, "") + ".docx";
  triggerDownload(blob, outName);
}

export function exportTxt(html: string, fileName: string): void {
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  div.querySelectorAll("p").forEach((p) =>
    p.insertAdjacentText("beforeend", "\n\n")
  );
  const text = div.textContent || "";
  const blob = new Blob([text], {
    type: "text/plain;charset=utf-8",
  });
  const outName = fileName.replace(/\.[^.]+$/, "") + ".txt";
  triggerDownload(blob, outName);
}

export async function exportMarkdown(
  html: string,
  fileName: string
): Promise<void> {
  const TurndownService = (await import("turndown")).default;
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  const md = turndown.turndown(html);
  const blob = new Blob([md], {
    type: "text/markdown;charset=utf-8",
  });
  const outName = fileName.replace(/\.[^.]+$/, "") + ".md";
  triggerDownload(blob, outName);
}

export function exportHtml(html: string, fileName: string): void {
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${fileName}</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6;color:#333}</style>
</head><body>${html}</body></html>`;
  const blob = new Blob([fullHtml], {
    type: "text/html;charset=utf-8",
  });
  const outName = fileName.replace(/\.[^.]+$/, "") + ".html";
  triggerDownload(blob, outName);
}

export async function downloadFile(
  format: string,
  html: string,
  fileName: string
): Promise<void> {
  switch (format) {
    case "docx":
      return exportDocx(html, fileName);
    case "txt":
      return exportTxt(html, fileName);
    case "md":
      return exportMarkdown(html, fileName);
    case "html":
      return exportHtml(html, fileName);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
