export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import {
  convertPdfToDocx,
  PdfConversionError,
} from "@/lib/pdf/to-docx";

const MAX_PDF_BYTES = 50 * 1024 * 1024;

function safeBaseName(name: string): string {
  const base = (name || "document")
    .replace(/\.pdf$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .trim();
  return (base || "document").slice(0, 120);
}

export async function POST(req: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Missing PDF file" },
        { status: 400 }
      );
    }
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "The PDF file is empty" }, { status: 400 });
    }

    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: "PDF is too large to convert. The maximum size is 50 MB." },
        { status: 413 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const signature = new TextDecoder("latin1").decode(bytes.slice(0, 5));
    if (signature !== "%PDF-") {
      return NextResponse.json(
        { error: "This file is not a valid PDF." },
        { status: 400 }
      );
    }

    const docx = await convertPdfToDocx(bytes);
    const filename = `${safeBaseName(file.name)}.docx`;
    const body = new ArrayBuffer(docx.byteLength);
    new Uint8Array(body).set(docx);

    return new NextResponse(body, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    if (error instanceof PdfConversionError) {
      const status = error.code === "PASSWORD_PROTECTED" ? 422 : 400;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status }
      );
    }

    console.error("[convert-pdf-to-docx] error:", error?.message, error?.stack);
    return NextResponse.json(
      { error: "PDF conversion failed. Please try again." },
      { status: 500 }
    );
  }
}
