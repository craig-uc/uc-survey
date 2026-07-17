import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import SurveysPage from "./page";
import { useTenant } from "@/features/tenant";

vi.mock("@/features/tenant", () => ({
  useTenant: vi.fn(),
}));

vi.mock("@/features/survey-management", () => ({
  SurveyListing: ({ tenantCode }: { tenantCode: string }) => (
    <div data-testid="survey-listing">SurveyListing tenantCode={tenantCode}</div>
  ),
}));

describe("Admin SurveysPage", () => {
  afterEach(cleanup);

  it("renders the survey listing for the currently active tenant", () => {
    vi.mocked(useTenant).mockReturnValue({ tenant: "dpw-eu", tenantCode: "dpw-eu", setTenant: vi.fn() });
    render(<SurveysPage />);

    const listing = screen.getByTestId("survey-listing");
    expect(listing.textContent).toContain("dpw-eu");
  });

  it("falls back to the urup tenant code when no tenant is active", () => {
    vi.mocked(useTenant).mockReturnValue({ tenant: null, tenantCode: "urup", setTenant: vi.fn() });
    render(<SurveysPage />);

    const listing = screen.getByTestId("survey-listing");
    expect(listing.textContent).toContain("urup");
  });
});
