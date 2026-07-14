import { NextRequest, NextResponse } from "next/server";

const LABEL_DEFAULTS: Record<string, string> = {
  selectlanguage: "Select your language",
  sitetranslation: "This site has been automatically translated. Some wording may not be exact.",
};

export async function fetchField(tenant: string, lang: string, label: string): Promise<string> {
  const fallback = LABEL_DEFAULTS[label.toLowerCase()] ?? label;

  if (!process.env.JOURNEY_API) return fallback;

  try {
    const res = await fetch(`${process.env.JOURNEY_API}standard_field`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: lang, label, tenant_code: tenant, application: process.env.APPLICATION ?? "" }),
      next: { revalidate: 86400 },
    });

    if (!res.ok) return fallback;

    const data = await res.json();
    const message = ((data.message as string) ?? "").trim();
    return (LABEL_DEFAULTS[message.toLowerCase()] ?? message) || fallback;
  } catch {
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const label = (body.label as string) || "";
    const tenant_code = ((body.tenant_code as string) || "urup").trim() || "urup";
    const language = ((body.language as string) || "en").trim() || "en";

    const message = await fetchField(tenant_code, language, label);
    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ message: "" });
  }
}
