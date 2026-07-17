import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import React from "react";
import SurveyPage from "./page";
import { findSurvey } from "@/features/survey";
import type { Survey } from "@/features/survey";

vi.mock("@/features/survey", async () => {
  const actual = await vi.importActual<typeof import("@/features/survey")>("@/features/survey");
  return {
    ...actual,
    findSurvey: vi.fn(),
  };
});

const baseParams = { tenant: "urup", lang: "en", survey: "engagement-2026" };

function surveyFixture(overrides: Partial<Survey>): Survey {
  return {
    id: "urup-engagement-2026-v1",
    tenantCode: "urup",
    slug: "engagement-2026",
    name: "Engagement Survey 2026",
    status: "active",
    version: 1,
    startAt: null,
    endAt: null,
    ...overrides,
  };
}

function renderSurveyPage() {
  return render(<SurveyPage params={Promise.resolve(baseParams)} />);
}

describe("SurveyPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders NotFoundStep when the tenant has no matching survey", async () => {
    vi.mocked(findSurvey).mockReturnValue(undefined);
    renderSurveyPage();
    expect((await screen.findByRole("heading")).textContent).toMatch(/not found/i);
  });

  it("renders PreStartStep when the survey has not started yet", async () => {
    vi.mocked(findSurvey).mockReturnValue(
      surveyFixture({ startAt: "2099-01-01T00:00:00.000Z" })
    );
    renderSurveyPage();
    expect((await screen.findByRole("heading")).textContent).toMatch(/hasn't started/i);
  });

  it("renders ClosingStep when the survey has already ended", async () => {
    vi.mocked(findSurvey).mockReturnValue(
      surveyFixture({ endAt: "2020-01-01T00:00:00.000Z" })
    );
    renderSurveyPage();
    expect((await screen.findByRole("heading")).textContent).toMatch(/closed/i);
  });

  it("renders IntroStep when the survey is currently open", async () => {
    vi.mocked(findSurvey).mockReturnValue(surveyFixture({}));
    renderSurveyPage();
    expect((await screen.findByRole("heading")).textContent).toMatch(/welcome/i);
  });

  it("transitions from PreStartStep to IntroStep at the same URL once the countdown expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    vi.mocked(findSurvey).mockReturnValue(
      surveyFixture({ startAt: "2026-01-01T00:00:02.000Z" })
    );

    renderSurveyPage();
    await act(async () => {}); // flush the params promise's microtask
    expect(screen.getByRole("heading").textContent).toMatch(/hasn't started/i);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByRole("heading").textContent).toMatch(/welcome/i);
    vi.useRealTimers();
  });
});
