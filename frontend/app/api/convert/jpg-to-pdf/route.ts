export const runtime = "nodejs";
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "https://zipdrop.onrender.com";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

async function proxyConversion(req: NextRequest, endpoint: string, outputFilename: string, contentType: string) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25 MB." },
        { status: 413 }
      );
    }

    const backendFormData = new FormData();
    backendFormData.append("file", file);
    
    for (const [key, value] of formData.entries()) {
      if (key !== "file") {
        backendFormData.append(key, value as string);
      }
    }

    const response = await fetch(`${API}${endpoint}`, {
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
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${outputFilename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error(`[${endpoint}] error:`, error?.message, error?.stack);
    return NextResponse.json(
      { error: "Conversion failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  return proxyConversion(req, "/convert/jpg-to-pdf",
    (file as File).name.replace(/\.(jpg|jpeg)$/i, ".pdf"),
    "application/pdf"
  );
}