export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  "supabase.co",
  "supabase.in",
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_HOSTS.some((host) => parsed.hostname.endsWith(host));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileUrl = searchParams.get("url");
  const filename = searchParams.get("filename") || "file";

  if (!fileUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!isAllowedUrl(fileUrl)) {
    return NextResponse.json({ error: "Invalid or unauthorized file URL" }, { status: 400 });
  }

  try {
    const response = await fetch(fileUrl, {
      headers: {
        "User-Agent": "ZipDrop/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentLength = response.headers.get("content-length");
    const arrayBuffer = await response.arrayBuffer();

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `inline; filename="${filename}"`);
    if (contentLength) headers.set("Content-Length", contentLength);
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("Access-Control-Allow-Origin", "*");

    return new NextResponse(arrayBuffer, { headers });
  } catch (error: any) {
    console.error("[proxy-file] error:", error?.message, error?.stack);
    return NextResponse.json(
      { error: "Failed to proxy file" },
      { status: 500 }
    );
  }
}

export async function HEAD(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileUrl = searchParams.get("url");

  if (!fileUrl || !isAllowedUrl(fileUrl)) {
    return NextResponse.json({ error: "Invalid or unauthorized file URL" }, { status: 400 });
  }

  try {
    const response = await fetch(fileUrl, { method: "HEAD" });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("content-type") || "application/octet-stream");
    headers.set("Content-Length", response.headers.get("content-length") || "0");
    headers.set("Access-Control-Allow-Origin", "*");

    return new NextResponse(null, { headers });
  } catch {
    return NextResponse.json({ error: "Failed to proxy file" }, { status: 500 });
  }
}