import { describe, it, expect } from "vitest";
import { listActiveTenants } from "./mockTenants";

describe("listActiveTenants", () => {
  it("returns only tenants marked active", () => {
    const tenants = listActiveTenants();
    expect(tenants.length).toBeGreaterThan(0);
    expect(tenants.every((t) => t.active)).toBe(true);
  });

  it("excludes inactive tenants", () => {
    const tenants = listActiveTenants();
    expect(tenants.find((t) => !t.active)).toBeUndefined();
  });

  it("does not include the urup operator tenant in the list", () => {
    const tenants = listActiveTenants();
    expect(tenants.find((t) => t.slug === "urup")).toBeUndefined();
  });
});
