export const runtime = "nodejs";
export const maxDuration = 60;

import mammoth from "mammoth";

export async function POST(req: Request) {
  console.log("[convert-to-html] route hit");

  try {
    const body = await req.json();
    console.log("[convert-to-html] request body:", JSON.stringify(body));

    const { fileUrl } = body;

    if (!fileUrl) {
      console.error("[convert-to-html] no fileUrl in request body");
      return Response.json({ error: "fileUrl is required" }, { status: 400 });
    }

    console.log("[convert-to-html] fetching:", fileUrl);
    const response = await fetch(fileUrl);
    console.log("[convert-to-html] fetch status:", response.status, response.ok);

    if (!response.ok) {
      throw new Error(`Supabase fetch failed: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log("[convert-to-html] arrayBuffer size:", arrayBuffer.byteLength);

    if (arrayBuffer.byteLength === 0) {
      throw new Error("File is empty — 0 bytes from Supabase");
    }

    // Check DOCX magic bytes (PK header = valid ZIP/DOCX)
    const header = new Uint8Array(arrayBuffer.slice(0, 2));
    const isValidDocx = header[0] === 0x50 && header[1] === 0x4B;
    console.log("[convert-to-html] is valid DOCX:", isValidDocx, "header:", header[0], header[1]);

    if (!isValidDocx) {
      // File is HTML disguised as .docx — return it directly
      const html = new TextDecoder().decode(arrayBuffer);
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const content = bodyMatch ? bodyMatch[1] : html;
      console.log("[convert-to-html] not a real DOCX, returning as HTML directly");
      return Response.json({ html: content, warning: "File was HTML not DOCX" });
    }

    const buffer = Buffer.from(arrayBuffer);
    console.log("[convert-to-html] running mammoth...");

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

    console.log("[convert-to-html] mammoth html length:", result.value.length);
    console.log("[convert-to-html] mammoth messages:", result.messages);

    if (!result.value || result.value.trim() === "") {
      throw new Error("Mammoth returned empty HTML — file may be corrupted");
    }

    return Response.json({ html: result.value });

  } catch (err: any) {
    console.error("[convert-to-html] FATAL ERROR:", err.message, err.stack);
    return Response.json(
      { error: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
