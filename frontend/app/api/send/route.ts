import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const recipientCode = formData.get("recipientCode");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const backendForm = new FormData();
    backendForm.append("file", file, file.name);
    if (recipientCode) {
      backendForm.append("recipientCode", recipientCode.toString());
    }

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
    console.error("[api/send] error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
