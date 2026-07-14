import { NextRequest, NextResponse } from "next/server";

const ERROR_DEFAULTS: Record<string, string> = {
  required: "This field is required",
  max_length: "Value exceeds the maximum length",
  min_length: "Value is too short",
  invalid_format: "Invalid format",
};

export async function fetchError(tenant: string, lang: string, type: string): Promise<string> {
  const fallback = ERROR_DEFAULTS[type] ?? type;
  if (!process.env.JOURNEY_API) return fallback;

  try {
    const res = await fetch(`${process.env.JOURNEY_API}standard_error`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, language: lang, tenant_code: tenant, application: process.env.APPLICATION ?? "" }),
      cache: "no-store",
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    return ((data.message as string) ?? "").trim() || fallback;
  } catch {
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = (body.type as string) || "";
    const tenant_code = ((body.tenant_code as string) || "urup").trim() || "urup";
    const language = ((body.language as string) || "en").trim() || "en";
    const message = await fetchError(tenant_code, language, type);
    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ message: "" });
  }
}
