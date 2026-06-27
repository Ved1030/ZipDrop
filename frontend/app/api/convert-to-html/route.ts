export const runtime = "nodejs";
export const maxDuration = 60;

import mammoth from "mammoth";

export async function POST(req: Request) {
  try {
    const { fileUrl } = await req.json();

    // Fetch the docx from Supabase
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);  // Buffer needs Node.js runtime

    // Convert with mammoth
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

    if (!result.value || result.value.trim() === "") {
      throw new Error("Mammoth returned empty HTML");
    }

    return Response.json({ html: result.value });

  } catch (err: any) {
    console.error("[convert-to-html]", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
