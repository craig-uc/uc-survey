// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";

process.env.TENANT_API = "https://test-tenant.example.com/";
process.env.APPLICATION = "test-app-id";

const upstreamResponse = [
  { guid: "acf98da63749417595e4e5242277dfd9", name: "U·R·UP Connect", code: "urup" },
  { guid: "b1", name: "DPW EU", code: "dpw-eu" },
  { guid: "b2", name: "Nedbank", code: "nedbank" },
];

describe("fetchTenantList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps upstream tenants to { slug, name }, including urup", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(upstreamResponse) })
    );

    const { fetchTenantList } = await import("./list");
    const tenants = await fetchTenantList();

    expect(tenants).toEqual([
      { slug: "urup", name: "U·R·UP Connect" },
      { slug: "dpw-eu", name: "DPW EU" },
      { slug: "nedbank", name: "Nedbank" },
    ]);
  });

  it("posts to TENANT_API/tenant_list with type=application and the configured APPLICATION id", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal("fetch", fetchSpy);

    const { fetchTenantList } = await import("./list");
    await fetchTenantList();

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://test-tenant.example.com/tenant_list");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ type: "application", application: "test-app-id" });
  });

  it("returns an empty array when the upstream response is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    );

    const { fetchTenantList } = await import("./list");
    expect(await fetchTenantList()).toEqual([]);
  });

  it("returns an empty array and logs when the upstream response is not ok", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) })
    );

    const { fetchTenantList } = await import("./list");
    expect(await fetchTenantList()).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("returns an empty array and logs when fetch throws", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    const { fetchTenantList } = await import("./list");
    expect(await fetchTenantList()).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

describe("POST /api/tenant/list", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the fetched tenants wrapped in { tenants }", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ guid: "b1", name: "DPW EU", code: "dpw-eu" }]),
      })
    );

    const { POST } = await import("./list");
    const res = await POST();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.tenants).toEqual([{ slug: "dpw-eu", name: "DPW EU" }]);
  });
});
