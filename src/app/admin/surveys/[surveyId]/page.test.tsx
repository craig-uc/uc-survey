import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import SurveyEditorPage from "./page";

describe("SurveyEditorPage", () => {
  afterEach(cleanup);

  it("renders a coming-soon heading", async () => {
    render(<SurveyEditorPage params={Promise.resolve({ surveyId: "urup-untitled-1" })} />);
    expect(await screen.findByRole("heading")).toBeTruthy();
    expect(screen.getByRole("heading").textContent).toMatch(/coming soon/i);
  });

  it("shows the survey id being edited", async () => {
    render(<SurveyEditorPage params={Promise.resolve({ surveyId: "urup-untitled-1" })} />);
    expect(await screen.findByText(/urup-untitled-1/)).toBeTruthy();
  });
});
