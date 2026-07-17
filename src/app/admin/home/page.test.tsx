import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import React from "react";
import AdminHomePage from "./page";
import { GlobalStateProvider } from "@/app/context/GlobalStateContext";

vi.mock("@/features/tenant", () => ({
  TenantList: () => <div data-testid="tenant-list">TenantList</div>,
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

describe("AdminHomePage", () => {
  afterEach(() => {
    cleanup();
  });

  it("always renders the tenant list", async () => {
    render(<AdminHomePage />, { wrapper: Wrapper });
    await act(async () => {});

    expect(screen.getByTestId("tenant-list")).toBeTruthy();
  });

  it("renders a breadcrumb bar with Home as the active item", async () => {
    render(<AdminHomePage />, { wrapper: Wrapper });
    await act(async () => {});

    const homeLink = screen.getByText("Home");
    expect(homeLink.closest("a")?.getAttribute("href")).toBe("/admin/home");
    expect(homeLink.className).toContain("text-primary");
  });
});
