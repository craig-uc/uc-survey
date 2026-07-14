import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import GlassPanel from "./GlassPanel";

vi.mock("./NavButton", () => ({
  default: ({ type, label, href }: { type: string; label: string; href: string }) => (
    <button data-testid={`nav-${type}`} data-href={href} data-label={label}>
      {label}
    </button>
  ),
}));

describe("GlassPanel navigation", () => {
  afterEach(cleanup);

  it("renders no nav bar when navigation prop is omitted", () => {
    render(<GlassPanel />);
    expect(document.querySelector("nav")).toBeNull();
  });

  it("renders a button for each entry in buttons", () => {
    render(
      <GlassPanel
        navigation={{
          buttons: [
            { type: "back", label: "Back", href: "/page-0" },
            { type: "cancel", label: "Cancel", href: "/page-1" },
            { type: "submit", label: "Submit", href: "/done" },
          ],
        }}
      />
    );
    expect(screen.getByTestId("nav-back")).toBeTruthy();
    expect(screen.getByTestId("nav-cancel")).toBeTruthy();
    expect(screen.getByTestId("nav-submit")).toBeTruthy();
  });

  it("hides a button when show is false", () => {
    render(
      <GlassPanel
        navigation={{
          buttons: [
            { type: "back", label: "Back", href: "/page-0", show: false },
            { type: "cancel", label: "Cancel", href: "/page-2" },
          ],
        }}
      />
    );
    expect(screen.queryByTestId("nav-back")).toBeNull();
    expect(screen.getByTestId("nav-cancel")).toBeTruthy();
  });

  it("shows a button when show is explicitly true", () => {
    render(
      <GlassPanel
        navigation={{
          buttons: [{ type: "back", label: "Back", href: "/page-0", show: true }],
        }}
      />
    );
    expect(screen.getByTestId("nav-back")).toBeTruthy();
  });

  it("passes correct href and label to each button", () => {
    render(
      <GlassPanel
        navigation={{
          buttons: [
            { type: "back", label: "Back", href: "/back-page" },
            { type: "cancel", label: "Cancel", href: "/cancel-page" },
            { type: "submit", label: "Submit", href: "/submit-page" },
          ],
        }}
      />
    );
    expect(screen.getByTestId("nav-back").getAttribute("data-href")).toBe("/back-page");
    expect(screen.getByTestId("nav-cancel").getAttribute("data-href")).toBe("/cancel-page");
    expect(screen.getByTestId("nav-submit").getAttribute("data-href")).toBe("/submit-page");
    expect(screen.getByTestId("nav-back").getAttribute("data-label")).toBe("Back");
    expect(screen.getByTestId("nav-submit").getAttribute("data-label")).toBe("Submit");
  });

  it("renders only the submit button when only one entry is provided", () => {
    render(
      <GlassPanel
        navigation={{ buttons: [{ type: "submit", label: "Submit", href: "/done" }] }}
      />
    );
    expect(screen.queryByTestId("nav-back")).toBeNull();
    expect(screen.getByTestId("nav-submit")).toBeTruthy();
  });

  it("renders empty nav bar when buttons array is empty", () => {
    render(<GlassPanel navigation={{ buttons: [] }} />);
    expect(document.querySelector("nav")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
