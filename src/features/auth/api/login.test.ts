// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./login";

process.env.TRACKING_API = "https://test-tracking.example.com/";
process.env.ACCOUNT = "test-account-id";
process.env.APPLICATION = "test-app-id";
process.env.TENANT_APP = "test-tenant-app-id";
process.env.ENVIRONMENT = "test";

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ redirectUrl: "https://app.example.com/acme/en/admin/auth/signIn" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("required");
  });

  it("returns 400 when redirectUrl is missing", async () => {
    const res = await POST(makeRequest({ email: "user@example.com" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("required");
  });

  it("returns 200 when tracking API responds with ok, forwarding redirectUrl upstream", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fetchSpy);

    const res = await POST(
      makeRequest({
        email: "user@example.com",
        redirectUrl: "https://app.example.com/acme/en/admin/auth/signIn",
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const [, options] = fetchSpy.mock.calls[0];
    const forwardedBody = JSON.parse(options.body);
    expect(forwardedBody.redirectUrl).toBe("https://app.example.com/acme/en/admin/auth/signIn");
  });

  it("returns 403 when tracking API responds with a non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) })
    );

    const res = await POST(
      makeRequest({
        email: "user@example.com",
        redirectUrl: "https://app.example.com/acme/en/admin/auth/signIn",
      })
    );
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("returns 500 when fetch throws an unexpected error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));

    const res = await POST(
      makeRequest({
        email: "user@example.com",
        redirectUrl: "https://app.example.com/acme/en/admin/auth/signIn",
      })
    );
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });
});
