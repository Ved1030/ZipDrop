export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { htmlToDocx } from "@/lib/editor/html-to-docx";

function extractBodyContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const content = bodyMatch ? bodyMatch[1] : html;
  return content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
}

export async function POST(req: NextRequest) {
  try {
    const { html, filename, styles } = await req.json();
    if (!html) {
      return NextResponse.json({ error: "Missing html" }, { status: 400 });
    }

    const content = extractBodyContent(html);
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${content}</body></html>`;
    const buffer = await htmlToDocx(fullHtml, filename, styles);

    const fname = (filename || "document").replace(/\.html?$/, "") + ".docx";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fname}"`,
      },
    });
  } catch (err: any) {
    console.error("[convert-to-docx] error:", err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
