import { describe, it, expect } from "vitest";
import { canEdit, canDelete } from "./permissions";
import { Survey } from "@/features/survey";

function survey(overrides: Partial<Survey>): Survey {
  return {
    id: "s1",
    tenantCode: "urup",
    slug: "s",
    name: "S",
    status: "pending",
    pendingSubState: "design",
    version: 1,
    startAt: null,
    endAt: null,
    ...overrides,
  };
}

describe("canEdit", () => {
  it("allows editing an active survey", () => {
    expect(canEdit(survey({ status: "active" }))).toBe(true);
  });

  it("allows editing a pending survey in any sub-state", () => {
    expect(canEdit(survey({ status: "pending", pendingSubState: "design" }))).toBe(true);
    expect(canEdit(survey({ status: "pending", pendingSubState: "review" }))).toBe(true);
    expect(canEdit(survey({ status: "pending", pendingSubState: "published" }))).toBe(true);
  });

  it("forbids editing a closed survey", () => {
    expect(canEdit(survey({ status: "closed" }))).toBe(false);
  });

  it("forbids editing a deleted survey", () => {
    expect(canEdit(survey({ status: "deleted" }))).toBe(false);
  });
});

describe("canDelete", () => {
  it("allows deleting a pending-design survey", () => {
    expect(canDelete(survey({ status: "pending", pendingSubState: "design" }))).toBe(true);
  });

  it("allows deleting a pending-review survey", () => {
    expect(canDelete(survey({ status: "pending", pendingSubState: "review" }))).toBe(true);
  });

  it("forbids deleting a pending-published survey", () => {
    expect(canDelete(survey({ status: "pending", pendingSubState: "published" }))).toBe(false);
  });

  it("forbids deleting an active survey", () => {
    expect(canDelete(survey({ status: "active" }))).toBe(false);
  });

  it("forbids deleting a closed survey", () => {
    expect(canDelete(survey({ status: "closed" }))).toBe(false);
  });

  it("forbids deleting an already-deleted survey", () => {
    expect(canDelete(survey({ status: "deleted" }))).toBe(false);
  });
});
