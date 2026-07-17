import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import AdminHomePage from "./page";

vi.mock("@/features/tenant", () => ({
  TenantList: () => <div data-testid="tenant-list">TenantList</div>,
}));

describe("AdminHomePage", () => {
  afterEach(() => {
    cleanup();
  });

  it("always renders the tenant list", () => {
    render(<AdminHomePage />);

    expect(screen.getByTestId("tenant-list")).toBeTruthy();
  });
});
