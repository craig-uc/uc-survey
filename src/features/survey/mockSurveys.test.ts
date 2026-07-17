import { describe, it, expect } from "vitest";
import { findSurvey } from "./mockSurveys";

describe("findSurvey", () => {
  it("returns the survey matching both tenant and slug", () => {
    const survey = findSurvey("urup", "engagement-2026");
    expect(survey).toBeDefined();
    expect(survey?.tenantCode).toBe("urup");
    expect(survey?.slug).toBe("engagement-2026");
  });

  it("scopes lookup by tenant — the same slug under a different tenant returns that tenant's own survey", () => {
    // "engagement-2026" exists for both "urup" and "dpw-eu" with different status,
    // proving lookup can't just be a global slug index.
    const urupSurvey = findSurvey("urup", "engagement-2026");
    const dpwSurvey = findSurvey("dpw-eu", "engagement-2026");

    expect(urupSurvey?.tenantCode).toBe("urup");
    expect(dpwSurvey?.tenantCode).toBe("dpw-eu");
    expect(urupSurvey?.status).not.toBe(dpwSurvey?.status);
  });

  it("returns undefined when the slug belongs to a different tenant only", () => {
    // "closed-survey" only exists under "urup".
    const survey = findSurvey("dpw-eu", "closed-survey");
    expect(survey).toBeUndefined();
  });

  it("returns undefined when the tenant exists but the slug does not", () => {
    const survey = findSurvey("urup", "no-such-survey");
    expect(survey).toBeUndefined();
  });

  it("returns undefined for a completely unknown tenant", () => {
    const survey = findSurvey("not-a-real-tenant", "engagement-2026");
    expect(survey).toBeUndefined();
  });

  it("resolves to the live (active) version even when a newer pending draft exists for the same slug", () => {
    // "urup"/"engagement-2026" has an active v1 and a pending-design v2 (an in-progress edit).
    const survey = findSurvey("urup", "engagement-2026");
    expect(survey?.status).toBe("active");
    expect(survey?.version).toBe(1);
  });

  it("falls back to the highest-version pending record when the slug has never gone live", () => {
    // "dpw-eu"/"engagement-2026" only has a pending-design v1 — never published, so it's shown as "coming soon".
    const survey = findSurvey("dpw-eu", "engagement-2026");
    expect(survey?.status).toBe("pending");
    expect(survey?.version).toBe(1);
  });

  it("excludes deleted surveys entirely, behaving as not found", () => {
    const survey = findSurvey("urup", "removed-survey");
    expect(survey).toBeUndefined();
  });
});
