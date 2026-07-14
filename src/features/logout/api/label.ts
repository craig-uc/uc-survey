import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const label = ((body.label as string) || "logout").toLowerCase().trim();
    const tenant_code = (body.tenant_code as string) ?? "";
    const language = (body.language as string) ?? "en";

    const res = await fetch(`${process.env.JOURNEY_API}standard_button`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        tenant_code,
        application: process.env.APPLICATION,
        language,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Translation unavailable" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ message: (data.message as string) ?? label });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
