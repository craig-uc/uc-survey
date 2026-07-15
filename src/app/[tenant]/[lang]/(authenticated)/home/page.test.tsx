import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import RootPage from "./page";
import { useTenant } from "@/features/tenant";

vi.mock("@/features/tenant", async () => {
  const actual = await vi.importActual<typeof import("@/features/tenant")>("@/features/tenant");
  return {
    ...actual,
    useTenant: vi.fn(),
    TenantList: ({ lang }: { lang: string }) => <div data-testid="tenant-list">TenantList lang={lang}</div>,
  };
});

vi.mock("@/features/survey-management", () => ({
  SurveyListing: ({ tenantCode, lang }: { tenantCode: string; lang: string }) => (
    <div data-testid="survey-listing">
      SurveyListing tenantCode={tenantCode} lang={lang}
    </div>
  ),
}));

describe("Home page", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the tenant list for the urup tenant", () => {
    vi.mocked(useTenant).mockReturnValue({ tenant: "urup", tenantCode: "urup", setTenant: vi.fn() });
    render(<RootPage params={{ tenant: "urup", lang: "en" }} />);

    expect(screen.getByTestId("tenant-list")).toBeTruthy();
    expect(screen.queryByTestId("survey-listing")).toBeNull();
  });

  it("renders the survey listing for any other tenant", () => {
    vi.mocked(useTenant).mockReturnValue({ tenant: "dpw-eu", tenantCode: "dpw-eu", setTenant: vi.fn() });
    render(<RootPage params={{ tenant: "dpw-eu", lang: "en" }} />);

    expect(screen.getByTestId("survey-listing")).toBeTruthy();
    expect(screen.queryByTestId("tenant-list")).toBeNull();
  });

  it("passes the current tenant and language down to the survey listing", () => {
    vi.mocked(useTenant).mockReturnValue({ tenant: "nedbank", tenantCode: "nedbank", setTenant: vi.fn() });
    render(<RootPage params={{ tenant: "nedbank", lang: "fr" }} />);

    expect(screen.getByTestId("survey-listing").textContent).toContain("nedbank");
    expect(screen.getByTestId("survey-listing").textContent).toContain("fr");
  });
});
