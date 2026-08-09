export const runtime = "nodejs";
export const maxDuration = 60;

import mammoth from "mammoth";

export async function POST(req: Request) {
  try {
    const { fileUrl } = await req.json();
    if (!fileUrl) return Response.json({ error: "fileUrl required" }, { status: 400 });

    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) throw new Error("Empty file");

    // Check if it's a real DOCX (ZIP magic bytes: PK = 0x50 0x4B)
    const header = new Uint8Array(arrayBuffer.slice(0, 2));
    const isRealDocx = header[0] === 0x50 && header[1] === 0x4B;

    if (!isRealDocx) {
      // File is HTML disguised as .docx — extract body and return directly
      const text = new TextDecoder().decode(arrayBuffer);
      const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const html = bodyMatch ? bodyMatch[1] : `<p>${text}</p>`;
      return Response.json({ html });
    }

    // Real DOCX — convert with mammoth
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement((image) =>
          image.read("base64").then((data) => ({
            src: `data:${image.contentType};base64,${data}`,
          }))
        ),
      }
    );

    const html = result.value?.trim();
    if (!html) throw new Error("Mammoth returned empty HTML");

    return Response.json({ html });

  } catch (err: any) {
    console.error("[convert-to-html]", err.message, err.stack);
    return Response.json({ error: err.message, stack: process.env.NODE_ENV === "development" ? err.stack : undefined }, { status: 500 });
  }
}
