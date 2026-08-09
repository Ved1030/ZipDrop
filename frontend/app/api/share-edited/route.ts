export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { htmlToDocx } from "@/lib/editor/html-to-docx";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    const { html, filename, recipientCode } = await req.json();
    if (!html) {
      return NextResponse.json({ error: "Missing html" }, { status: 400 });
    }

    const code = recipientCode || String(Math.floor(1000 + Math.random() * 9000));
    const baseName = (filename || "document").replace(/\.[^.]+$/, "");
    const outName = baseName + "-edited.docx";

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
    const buffer = await htmlToDocx(fullHtml, outName);

    const file = new File([new Uint8Array(buffer)], outName, {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const backendForm = new FormData();
    backendForm.append("file", file, outName);
    backendForm.append("recipientCode", code);

    const res = await fetch(`${BACKEND}/resend`, {
      method: "POST",
      body: backendForm,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Backend error" }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[share-edited] error:", err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
