import { describe, it, expect } from "vitest";
import { getTenantCode } from "./getTenantCode";

describe("getTenantCode", () => {
  it("returns the tenant when provided", () => {
    expect(getTenantCode("nedbank")).toBe("nedbank");
  });

  it("returns 'urup' when tenant is null", () => {
    expect(getTenantCode(null)).toBe("urup");
  });

  it("returns 'urup' when tenant is undefined", () => {
    expect(getTenantCode(undefined)).toBe("urup");
  });

  it("returns 'urup' when tenant is an empty string", () => {
    expect(getTenantCode("")).toBe("urup");
  });
});
