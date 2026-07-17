import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import SurveysPage from "./page";
import { useTenant } from "@/features/tenant";
import { GlobalStateProvider } from "@/app/context/GlobalStateContext";

vi.mock("@/features/tenant", () => ({
  useTenant: vi.fn(),
}));

vi.mock("@/features/survey-management", () => ({
  SurveyListing: ({ tenantCode }: { tenantCode: string }) => (
    <div data-testid="survey-listing">SurveyListing tenantCode={tenantCode}</div>
  ),
}));

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ setTheme: vi.fn(), theme: "dark" })),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return <GlobalStateProvider>{children}</GlobalStateProvider>;
}

describe("Admin SurveysPage", () => {
  afterEach(cleanup);

  it("renders the survey listing for the currently active tenant", async () => {
    vi.mocked(useTenant).mockReturnValue({ tenant: "dpw-eu", tenantCode: "dpw-eu", setTenant: vi.fn() });
    render(<SurveysPage />, { wrapper: Wrapper });
    await act(async () => {});

    const listing = screen.getByTestId("survey-listing");
    expect(listing.textContent).toContain("dpw-eu");
  });

  it("falls back to the urup tenant code when no tenant is active", async () => {
    vi.mocked(useTenant).mockReturnValue({ tenant: null, tenantCode: "urup", setTenant: vi.fn() });
    render(<SurveysPage />, { wrapper: Wrapper });
    await act(async () => {});

    const listing = screen.getByTestId("survey-listing");
    expect(listing.textContent).toContain("urup");
  });

  it("renders breadcrumbs with Home and an active Surveys item", async () => {
    vi.mocked(useTenant).mockReturnValue({ tenant: "dpw-eu", tenantCode: "dpw-eu", setTenant: vi.fn() });
    render(<SurveysPage />, { wrapper: Wrapper });
    await act(async () => {});

    const homeLink = screen.getByText("Home");
    expect(homeLink.closest("a")?.getAttribute("href")).toBe("/admin/home");

    const surveysLink = screen.getByText("Surveys");
    expect(surveysLink.closest("a")?.getAttribute("href")).toBe("/admin/surveys");
    expect(surveysLink.className).toContain("text-primary");
  });
});
