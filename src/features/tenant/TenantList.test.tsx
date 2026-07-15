import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import TenantList from "./TenantList";
import { listActiveTenants } from "./mockTenants";

vi.mock("./mockTenants", async () => {
  const actual = await vi.importActual<typeof import("./mockTenants")>("./mockTenants");
  return { ...actual, listActiveTenants: vi.fn() };
});

describe("TenantList", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders an entry for every active tenant", () => {
    vi.mocked(listActiveTenants).mockReturnValue([
      { slug: "dpw-eu", name: "DPW EU", active: true },
      { slug: "nedbank", name: "Nedbank", active: true },
    ]);
    render(<TenantList lang="en" />);
    expect(screen.getByText("DPW EU")).toBeTruthy();
    expect(screen.getByText("Nedbank")).toBeTruthy();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("renders an empty state when there are no active tenants", () => {
    vi.mocked(listActiveTenants).mockReturnValue([]);
    render(<TenantList lang="en" />);
    expect(screen.getByText(/no active tenants/i)).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
