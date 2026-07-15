import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import NotFoundStep from "./NotFoundStep";

describe("NotFoundStep", () => {
  afterEach(cleanup);

  it("renders a heading indicating the survey could not be found", () => {
    render(<NotFoundStep />);
    expect(screen.getByRole("heading").textContent).toMatch(/not found/i);
  });

  it("renders explanatory body copy", () => {
    render(<NotFoundStep />);
    expect(screen.getByText(/check the url/i)).toBeTruthy();
  });

  it("does not render any navigation buttons — this is a terminal state", () => {
    render(<NotFoundStep />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
