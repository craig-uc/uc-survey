// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

process.env.TRACKING_API = "https://test-tracking.example.com/";
process.env.ACCOUNT = "test-account-id";
process.env.APPLICATION = "test-app-id";
process.env.TENANT_APP = "test-tenant-app-id";
process.env.ENVIRONMENT = "test";
process.env.JWT_SECRET_KEY = "0000000000000000000000000000000000000000000000000000000000000000";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const successPayload = {
  user: "jane@example.com",
  tenant_code: "acme",
  app_settings: {
    session_timeout: "60",
    first_name: "Jane",
    last_name: "Doe",
    full_name: "Jane Doe",
    known_as: "Jane",
    show_footer: false,
    show_menu: false,
    show_tag_line: false,
    show_person_name: false,
    tag_line: "Hello",
    application_title: "Test App",
    show_user_name: false,
  },
};

describe("POST /api/auth/signin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 when code is missing", async () => {
    const { POST } = await import("./signin");
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("returns 403 when the tracking API returns a non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Code expired" }),
      })
    );

    const { POST } = await import("./signin");
    const res = await POST(makeRequest({ code: "bad-code" }));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("logs the upstream status and body when the tracking API rejects the code", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Invalid tenant" }),
      })
    );

    const { POST } = await import("./signin");
    await POST(makeRequest({ code: "bad-code", tenantCode: "acme" }));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Sign-in upstream rejected"),
      401,
      { error: "Invalid tenant" }
    );
    consoleErrorSpy.mockRestore();
  });

  it("returns 200 with user data and sets auth_token cookie on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(successPayload),
      })
    );

    const { POST } = await import("./signin");
    const res = await POST(makeRequest({ code: "valid-code" }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user).toBe("jane@example.com");
    expect(data.tenant_code).toBe("acme");

    const cookie = res.headers.get("set-cookie");
    expect(cookie).toContain("auth_token=");
  });

  it("returns 500 when fetch throws an unexpected error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    const { POST } = await import("./signin");
    const res = await POST(makeRequest({ code: "any-code" }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("defaults tenant-code to 'urup' and userLanguage to 'en' when not provided", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(successPayload),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { POST } = await import("./signin");
    await POST(makeRequest({ code: "valid-code" }));

    const [, options] = fetchSpy.mock.calls[0];
    const upstreamBody = JSON.parse(options.body);
    expect(upstreamBody["tenant-code"]).toBe("urup");
    expect(upstreamBody.userLanguage).toBe("en");
    expect(upstreamBody.tenantCode).toBeUndefined();
    expect(upstreamBody.lang).toBeUndefined();
  });

  it("forwards the provided tenantCode and lang as tenant-code and userLanguage", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(successPayload),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { POST } = await import("./signin");
    await POST(makeRequest({ code: "valid-code", tenantCode: "acme", lang: "af" }));

    const [, options] = fetchSpy.mock.calls[0];
    const upstreamBody = JSON.parse(options.body);
    expect(upstreamBody["tenant-code"]).toBe("acme");
    expect(upstreamBody.userLanguage).toBe("af");
    expect(upstreamBody.tenantCode).toBeUndefined();
    expect(upstreamBody.lang).toBeUndefined();
  });
});
