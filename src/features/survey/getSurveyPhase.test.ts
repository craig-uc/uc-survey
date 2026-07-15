import { describe, it, expect } from "vitest";
import { getSurveyPhase } from "./getSurveyPhase";
import { Survey } from "./types";

const NOW = new Date("2026-06-15T12:00:00.000Z");
const PAST = "2026-01-01T00:00:00.000Z";
const FUTURE = "2099-01-01T00:00:00.000Z";

function survey(overrides: Partial<Survey>): Survey {
  return {
    id: "s1",
    tenantCode: "urup",
    slug: "test-survey",
    name: "Test Survey",
    status: "active",
    version: 1,
    startAt: null,
    endAt: null,
    ...overrides,
  };
}

describe("getSurveyPhase", () => {
  it("returns 'intro' for an active survey with no start/end dates", () => {
    expect(getSurveyPhase(survey({}), NOW)).toBe("intro");
  });

  it("returns 'intro' for an active survey currently inside its start/end window", () => {
    expect(getSurveyPhase(survey({ startAt: PAST, endAt: FUTURE }), NOW)).toBe("intro");
  });

  it("returns 'intro' when only startAt is set and it has already passed", () => {
    expect(getSurveyPhase(survey({ startAt: PAST, endAt: null }), NOW)).toBe("intro");
  });

  it("returns 'intro' when only endAt is set and it has not yet passed", () => {
    expect(getSurveyPhase(survey({ startAt: null, endAt: FUTURE }), NOW)).toBe("intro");
  });

  it("returns 'prestart' when now is before startAt", () => {
    expect(getSurveyPhase(survey({ startAt: FUTURE }), NOW)).toBe("prestart");
  });

  it("returns 'closing' when now is after endAt", () => {
    expect(getSurveyPhase(survey({ endAt: PAST }), NOW)).toBe("closing");
  });

  it("returns 'closing' when both startAt and endAt are in the past", () => {
    expect(getSurveyPhase(survey({ startAt: PAST, endAt: PAST }), NOW)).toBe("closing");
  });

  it("returns 'prestart' when both startAt and endAt are in the future", () => {
    expect(getSurveyPhase(survey({ startAt: FUTURE, endAt: FUTURE }), NOW)).toBe("prestart");
  });

  it("treats exact equality at startAt as already open (boundary falls through to intro)", () => {
    expect(getSurveyPhase(survey({ startAt: NOW.toISOString() }), NOW)).toBe("intro");
  });

  it("treats exact equality at endAt as not yet closed (boundary falls through to intro)", () => {
    expect(getSurveyPhase(survey({ endAt: NOW.toISOString() }), NOW)).toBe("intro");
  });

  it("returns 'closing' for status 'closed' even when startAt is still in the future", () => {
    expect(getSurveyPhase(survey({ status: "closed", startAt: FUTURE, endAt: null }), NOW)).toBe("closing");
  });

  it("returns 'prestart' for status 'pending' even when endAt is already in the past", () => {
    expect(
      getSurveyPhase(survey({ status: "pending", pendingSubState: "design", startAt: null, endAt: PAST }), NOW)
    ).toBe("prestart");
  });

  it("returns 'prestart' for a pending survey regardless of its sub-state", () => {
    expect(getSurveyPhase(survey({ status: "pending", pendingSubState: "published" }), NOW)).toBe("prestart");
  });

  it("resolves contradictory data (startAt after endAt) deterministically via the fixed check order", () => {
    // endAt in the past is checked before startAt in the future, so this resolves to 'closing'.
    expect(getSurveyPhase(survey({ startAt: FUTURE, endAt: PAST }), NOW)).toBe("closing");
  });
});
