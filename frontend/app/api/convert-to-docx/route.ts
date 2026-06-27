export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { html, filename } = await req.json();
    if (!html) {
      return NextResponse.json({ error: "Missing html" }, { status: 400 });
    }

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;

    const htmlDocx = await import("html-docx-js");
    const docxBlob = htmlDocx.asBlob(fullHtml);

    const fname = (filename || "document").replace(/\.html?$/, "") + "-edited.docx";
    const arrayBuffer = await docxBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fname}"`,
      },
    });
  } catch (err: any) {
    console.error("[convert-to-docx] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
