import React from "react";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import TenantList from "./TenantList";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("./useTenant", () => ({
  useTenant: () => ({ tenant: null, tenantCode: "urup", setTenant: vi.fn() }),
}));

describe("TenantList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders an entry for every tenant returned by the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            tenants: [
              { slug: "dpw-eu", name: "DPW EU" },
              { slug: "nedbank", name: "Nedbank" },
            ],
          }),
      })
    );

    render(<TenantList />);

    expect(await screen.findByText("DPW EU")).toBeTruthy();
    expect(screen.getByText("Nedbank")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("posts to /api/tenant/list", () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ tenants: [] }) });
    vi.stubGlobal("fetch", fetchSpy);

    render(<TenantList />);

    expect(fetchSpy).toHaveBeenCalledWith("/api/tenant/list", expect.objectContaining({ method: "POST" }));
  });

  it("renders an empty state when the API returns no tenants", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ tenants: [] }) })
    );

    render(<TenantList />);

    expect(await screen.findByText(/no active tenants/i)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders an empty state when the fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    render(<TenantList />);

    expect(await screen.findByText(/no active tenants/i)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
