export const runtime = "nodejs";
export const maxDuration = 180;

import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "https://zipdrop.onrender.com";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 20;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files. Maximum is ${MAX_FILES}.` },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" is too large. Maximum size is 25 MB.` },
          { status: 413 }
        );
      }
    }

    const backendFormData = new FormData();
    for (const file of files) {
      backendFormData.append("files", file);
    }
    
    for (const [key, value] of formData.entries()) {
      if (key !== "files") {
        backendFormData.append(key, value as string);
      }
    }

    const response = await fetch(`${API}/convert/images-to-pdf`, {
      method: "POST",
      body: backendFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || `Conversion failed: ${response.status}` },
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="images-to-pdf.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("[images-to-pdf] error:", error?.message, error?.stack);
    return NextResponse.json(
      { error: "Conversion failed. Please try again." },
      { status: 500 }
    );
  }
}