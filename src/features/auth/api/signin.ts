import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.code) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    body["tenant-code"] = body.tenantCode || "urup";
    delete body.tenantCode;
    body.userLanguage = body.lang || "en";
    delete body.lang;
    body.account = process.env.ACCOUNT;
    body.application = process.env.APPLICATION;
    body.appId = process.env.TENANT_APP;
    body.environment = process.env.ENVIRONMENT;
    body.page = "SignIn";
    body.event = "login-code";

    const upstream = await fetch(process.env.TRACKING_API + "event-consumer", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-type": "application/json; charset=UTF-8" },
      cache: "no-store",
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error("Sign-in upstream rejected the code:", upstream.status, data);
      return NextResponse.json(
        { error: "Code has expired or has already been used" },
        { status: 403 }
      );
    }

    const token = await new SignJWT({
      user: data.user,
      tenant_code: data.tenant_code,
      settings: data.app_settings,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(data.app_settings.session_timeout + "m")
      .sign(secret);

    const response = NextResponse.json(
      {
        user: data.user,
        tenant_code: data.tenant_code,
        app_settings: data.app_settings,
        success: true,
        message: "OK",
      },
      { status: 200 }
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error processing sign-in:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
