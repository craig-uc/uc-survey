import { describe, it, expect } from "vitest";
import { createNewVersion } from "./createNewVersion";
import { Survey } from "@/features/survey";

const active: Survey = {
  id: "urup-engagement-2026-v1",
  tenantCode: "urup",
  slug: "engagement-2026",
  name: "Engagement 2026",
  status: "active",
  version: 1,
  startAt: null,
  endAt: null,
};

describe("createNewVersion", () => {
  it("bumps the version and resets status to pending/design", () => {
    const next = createNewVersion(active);
    expect(next.version).toBe(2);
    expect(next.status).toBe("pending");
    expect(next.pendingSubState).toBe("design");
  });

  it("keeps the same tenant and slug so it supersedes the same survey", () => {
    const next = createNewVersion(active);
    expect(next.tenantCode).toBe(active.tenantCode);
    expect(next.slug).toBe(active.slug);
  });

  it("does not mutate the original survey record", () => {
    const next = createNewVersion(active);
    expect(active.status).toBe("active");
    expect(active.version).toBe(1);
    expect(next).not.toBe(active);
  });

  it("clears startAt/endAt on the new draft version", () => {
    const dated: Survey = { ...active, startAt: "2026-01-01T00:00:00.000Z", endAt: "2026-02-01T00:00:00.000Z" };
    const next = createNewVersion(dated);
    expect(next.startAt).toBeNull();
    expect(next.endAt).toBeNull();
  });

  it("assigns a new id distinct from the original", () => {
    const next = createNewVersion(active);
    expect(next.id).not.toBe(active.id);
  });
});
