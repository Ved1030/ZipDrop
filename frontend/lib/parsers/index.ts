export class DocxParser {
  async parse(data: ArrayBuffer): Promise<string> {
    const mammoth = await import("mammoth");
    const buffer = Buffer.from(data);
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement((image) =>
          image.read("base64").then((imgData) => ({
            src: `data:${image.contentType};base64,${imgData}`,
          }))
        ),
      }
    );
    return result.value || "";
  }
}

export class TxtParser {
  async parse(data: ArrayBuffer): Promise<string> {
    const text = new TextDecoder("utf-8").decode(data);
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");
    return `<p>${escaped}</p>`;
  }
}

export class MarkdownParser {
  async parse(data: ArrayBuffer): Promise<string> {
    const text = new TextDecoder("utf-8").decode(data);
    let html = text;
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
    html = html.replace(/`(.+?)`/g, "<code>$1</code>");
    html = html.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2">$1</a>'
    );
    html = html.replace(/^[-*] (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>[\s\S]*<\/li>)/g, "<ul>$1</ul>");
    html = html.replace(/^---$/gm, "<hr>");
    html = html.replace(/\n\n/g, "</p><p>");
    html = `<p>${html}</p>`;
    html = html.replace(
      /<p><(h[1-6]|ul|ol|hr|blockquote|pre)/g,
      "<$1"
    );
    html = html.replace(
      /<\/(h[1-6]|ul|ol|hr|blockquote|pre)><\/p>/g,
      "</$1>"
    );
    return html;
  }
}

export function getParserForFormat(format: string) {
  const ext = format.toLowerCase().replace(".", "");
  switch (ext) {
    case "docx":
    case "doc":
      return new DocxParser();
    case "txt":
      return new TxtParser();
    case "md":
    case "markdown":
      return new MarkdownParser();
    default:
      return new TxtParser();
  }
}
