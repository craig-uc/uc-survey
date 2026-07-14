import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const label = ((body.label as string) || "").toLowerCase().trim();
    const tenant_code = (body.tenant_code as string) ?? "";
    const language = (body.language as string) ?? "en";
    const application = (body.application as string) ?? "";

    if (!process.env.JOURNEY_API) {
      console.log(`JOURNEY_API is not defined; returning label as-is: "${label}"`);
      return NextResponse.json({ message: label });
    }

    const res = await fetch(`${process.env.JOURNEY_API}standard_button`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, tenant_code, application, language }),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ message: label });
    }

    const data = await res.json();
    return NextResponse.json({ message: (data.message as string) ?? label });
  } catch {
    return NextResponse.json({ message: "" });
  }
}
