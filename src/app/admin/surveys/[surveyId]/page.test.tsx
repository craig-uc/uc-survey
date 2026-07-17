import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import SurveyEditorPage from "./page";
import { GlobalStateProvider } from "@/app/context/GlobalStateContext";
import { vi } from "vitest";

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

describe("SurveyEditorPage", () => {
  afterEach(cleanup);

  it("renders a coming-soon heading", async () => {
    render(<SurveyEditorPage params={Promise.resolve({ surveyId: "urup-untitled-1" })} />, { wrapper: Wrapper });
    expect(await screen.findByRole("heading")).toBeTruthy();
    expect(screen.getByRole("heading").textContent).toMatch(/coming soon/i);
  });

  it("shows the survey id being edited", async () => {
    render(<SurveyEditorPage params={Promise.resolve({ surveyId: "urup-untitled-1" })} />, { wrapper: Wrapper });
    await screen.findByRole("heading");
    expect(screen.getAllByText(/urup-untitled-1/).length).toBeGreaterThan(0);
  });

  it("renders breadcrumbs with Home, Surveys, and the active survey id", async () => {
    render(<SurveyEditorPage params={Promise.resolve({ surveyId: "urup-untitled-1" })} />, { wrapper: Wrapper });
    await screen.findByRole("heading");

    const homeLink = screen.getByText("Home");
    expect(homeLink.closest("a")?.getAttribute("href")).toBe("/admin/home");

    const surveysLink = screen.getByText("Surveys");
    expect(surveysLink.closest("a")?.getAttribute("href")).toBe("/admin/surveys");

    const surveyIdLinks = screen.getAllByText("urup-untitled-1");
    const breadcrumbLink = surveyIdLinks.find((el) => el.closest("nav"));
    expect(breadcrumbLink).toBeTruthy();
    expect(breadcrumbLink?.closest("a")?.getAttribute("href")).toBe("/admin/surveys/urup-untitled-1");
    expect(breadcrumbLink?.className).toContain("text-primary");
  });
});
