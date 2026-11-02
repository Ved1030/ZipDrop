import { NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/stats`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return NextResponse.json({ visible: false });
    }

    const data = await res.json();
    const files = Number(data.files);
    const transfers = Number(data.transfers);

    if (!Number.isFinite(files) || !Number.isFinite(transfers)) {
      return NextResponse.json({ visible: false });
    }

    if (files < 100 || transfers < 50) {
      return NextResponse.json({ visible: false });
    }

    return NextResponse.json({ visible: true, files, transfers });
  } catch {
    return NextResponse.json({ visible: false });
  }
}
