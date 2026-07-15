import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import SurveyEditorPage from "./page";

describe("SurveyEditorPage", () => {
  afterEach(cleanup);

  it("renders a coming-soon heading", () => {
    render(<SurveyEditorPage params={{ tenant: "urup", lang: "en", surveyId: "urup-untitled-1" }} />);
    expect(screen.getByRole("heading").textContent).toMatch(/coming soon/i);
  });

  it("shows the survey id being edited", () => {
    render(<SurveyEditorPage params={{ tenant: "urup", lang: "en", surveyId: "urup-untitled-1" }} />);
    expect(screen.getByText(/urup-untitled-1/)).toBeTruthy();
  });
});
