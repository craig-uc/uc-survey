import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.email) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    body["tenant-code"] = body.tenantCode || "urup";
    delete body.tenantCode;
    body.account = process.env.ACCOUNT;
    body.application = process.env.APPLICATION;
    body.appId = process.env.TENANT_APP;
    body.environment = process.env.ENVIRONMENT;
    body.page = "Login";
    body.userLanguage = "en";
    body.event = "login";

    const res = await fetch(process.env.TRACKING_API + "event-consumer", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-type": "application/json; charset=UTF-8" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Access prohibited" }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: "OK" }, { status: 200 });
  } catch (error) {
    console.error("Error processing login:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
