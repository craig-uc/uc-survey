import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import IntroStep from "./IntroStep";

describe("IntroStep", () => {
  afterEach(cleanup);

  it("renders a welcome heading", () => {
    render(<IntroStep />);
    expect(screen.getByRole("heading").textContent).toMatch(/welcome/i);
  });

  it("renders a Continue button", () => {
    render(<IntroStep />);
    expect(screen.getByRole("button", { name: /continue/i })).toBeTruthy();
  });

  it("clicking Continue does not throw — no destination step exists yet", () => {
    render(<IntroStep />);
    expect(() => fireEvent.click(screen.getByRole("button", { name: /continue/i }))).not.toThrow();
  });
});
