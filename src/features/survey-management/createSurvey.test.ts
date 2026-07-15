import { describe, it, expect } from "vitest";
import { createSurvey } from "./createSurvey";

describe("createSurvey", () => {
  it("creates a pending/design survey at version 1 for the given tenant", () => {
    const survey = createSurvey("dpw-eu");
    expect(survey.tenantCode).toBe("dpw-eu");
    expect(survey.status).toBe("pending");
    expect(survey.pendingSubState).toBe("design");
    expect(survey.version).toBe(1);
  });

  it("starts with no start/end date", () => {
    const survey = createSurvey("dpw-eu");
    expect(survey.startAt).toBeNull();
    expect(survey.endAt).toBeNull();
  });

  it("generates a unique id per call, even for the same tenant", () => {
    const a = createSurvey("dpw-eu");
    const b = createSurvey("dpw-eu");
    expect(a.id).not.toBe(b.id);
  });
});
