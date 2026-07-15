import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ClosingStep from "./ClosingStep";

describe("ClosingStep", () => {
  afterEach(cleanup);

  it("renders a heading indicating the survey has closed", () => {
    render(<ClosingStep />);
    expect(screen.getByRole("heading").textContent).toMatch(/closed/i);
  });

  it("renders explanatory body copy", () => {
    render(<ClosingStep />);
    expect(screen.getByText(/no longer/i)).toBeTruthy();
  });

  it("does not render any navigation buttons — this is a terminal step", () => {
    render(<ClosingStep />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
