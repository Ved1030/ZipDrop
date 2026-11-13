export const runtime = "nodejs";
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "https://zipdrop.onrender.com";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

async function proxyConversion(req: NextRequest, endpoint: string, outputFilename: string, contentType: string) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 100 MB." },
        { status: 413 }
      );
    }

    // Forward to backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);
    
    // Forward any additional options
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

// PDF to Word
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const mode = formData.get("mode") || "editable";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const backendFormData = new FormData();
  backendFormData.append("file", file);
  backendFormData.append("mode", mode as string);

  return proxyConversion(req, "/convert/pdf-to-word", 
    (file as File).name.replace(/\.pdf$/i, ".docx"),
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}