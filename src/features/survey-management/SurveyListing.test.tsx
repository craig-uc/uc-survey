import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import SurveyListing from "./SurveyListing";
import { Survey } from "@/features/survey";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function stubSurveyFetch(surveys: Survey[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ surveys }) })
  );
}

function survey(overrides: Partial<Survey>): Survey {
  return {
    id: "s1",
    tenantCode: "dpw-eu",
    slug: "s",
    name: "Untitled",
    status: "pending",
    pendingSubState: "design",
    version: 1,
    startAt: null,
    endAt: null,
    ...overrides,
  };
}

const ACTIVE = survey({ id: "active-1", name: "Active Survey", status: "active", version: 1 });
const PENDING_DESIGN = survey({ id: "pending-1", name: "Draft Survey", status: "pending", pendingSubState: "design", version: 1 });
const PENDING_PUBLISHED = survey({ id: "pending-2", name: "Ready Survey", status: "pending", pendingSubState: "published", version: 1 });
const CLOSED = survey({ id: "closed-1", name: "Closed Survey", status: "closed", version: 1 });
const DELETED = survey({ id: "deleted-1", name: "Removed Survey", status: "deleted", version: 1 });

describe("SurveyListing", () => {
  beforeEach(() => {
    stubSurveyFetch([ACTIVE, PENDING_DESIGN, PENDING_PUBLISHED, CLOSED, DELETED]);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("fetches surveys for the given tenant from the survey list API", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ surveys: [] }) });
    vi.stubGlobal("fetch", fetchSpy);

    render(<SurveyListing tenantCode="dpw-eu" />);

    await screen.findByText(/no active surveys/i);
    expect(fetchSpy).toHaveBeenCalledWith("/api/survey/list?tenantCode=dpw-eu");
  });

  it("groups surveys into their matching section", async () => {
    render(<SurveyListing tenantCode="dpw-eu" />);

    expect(await within(screen.getByTestId("section-active")).findByText(/Active Survey/)).toBeTruthy();
    expect(within(screen.getByTestId("section-pending")).getByText(/Draft Survey/)).toBeTruthy();
    expect(within(screen.getByTestId("section-pending")).getByText(/Ready Survey/)).toBeTruthy();
    expect(within(screen.getByTestId("section-closed")).getByText(/Closed Survey/)).toBeTruthy();
    expect(within(screen.getByTestId("section-deleted")).getByText(/Removed Survey/)).toBeTruthy();
  });

  it("shows the pending sub-state next to pending surveys", async () => {
    render(<SurveyListing tenantCode="dpw-eu" />);
    expect(await within(screen.getByTestId("section-pending")).findByText(/design/i)).toBeTruthy();
    expect(within(screen.getByTestId("section-pending")).getByText(/published/i)).toBeTruthy();
  });

  it("shows an empty-state message for a section with no surveys", async () => {
    stubSurveyFetch([ACTIVE]);
    render(<SurveyListing tenantCode="dpw-eu" />);
    expect(await within(screen.getByTestId("section-closed")).findByText(/no closed surveys/i)).toBeTruthy();
  });

  it("shows an empty list for every section when the fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));
    render(<SurveyListing tenantCode="dpw-eu" />);
    expect(await within(screen.getByTestId("section-active")).findByText(/no active surveys/i)).toBeTruthy();
  });

  it("shows Edit for active and pending surveys, but not closed or deleted", async () => {
    render(<SurveyListing tenantCode="dpw-eu" />);
    await screen.findByTestId("row-active-1");
    expect(within(screen.getByTestId("row-active-1")).queryByRole("button", { name: /edit/i })).toBeTruthy();
    expect(within(screen.getByTestId("row-pending-1")).queryByRole("button", { name: /edit/i })).toBeTruthy();
    expect(within(screen.getByTestId("row-closed-1")).queryByRole("button", { name: /edit/i })).toBeNull();
    expect(within(screen.getByTestId("row-deleted-1")).queryByRole("button", { name: /edit/i })).toBeNull();
  });

  it("shows Delete only for pending-design and pending-review surveys", async () => {
    render(<SurveyListing tenantCode="dpw-eu" />);
    await screen.findByTestId("row-pending-1");
    expect(within(screen.getByTestId("row-pending-1")).queryByRole("button", { name: /delete/i })).toBeTruthy();
    expect(within(screen.getByTestId("row-pending-2")).queryByRole("button", { name: /delete/i })).toBeNull();
    expect(within(screen.getByTestId("row-active-1")).queryByRole("button", { name: /delete/i })).toBeNull();
    expect(within(screen.getByTestId("row-closed-1")).queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("navigates straight to the editor when editing a pending survey", async () => {
    render(<SurveyListing tenantCode="dpw-eu" />);
    await screen.findByTestId("row-pending-1");
    fireEvent.click(within(screen.getByTestId("row-pending-1")).getByRole("button", { name: /edit/i }));
    expect(mockPush).toHaveBeenCalledWith("/admin/surveys/pending-1");
  });

  it("bumps the version and moves it into Pending when editing an active survey", async () => {
    render(<SurveyListing tenantCode="dpw-eu" />);
    await screen.findByTestId("row-active-1");
    fireEvent.click(within(screen.getByTestId("row-active-1")).getByRole("button", { name: /edit/i }));

    // original active record is untouched and still shown in Active
    expect(within(screen.getByTestId("section-active")).getByText(/Active Survey/)).toBeTruthy();
    // a new v2 pending/design row now exists
    const pendingSection = screen.getByTestId("section-pending");
    expect(within(pendingSection).getByText(/Active Survey/)).toBeTruthy();
    expect(within(pendingSection).getByText(/v2/)).toBeTruthy();
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush.mock.calls[0][0]).toMatch(/^\/admin\/surveys\//);
  });

  it("moves a survey to Deleted when Delete is clicked", async () => {
    render(<SurveyListing tenantCode="dpw-eu" />);
    await screen.findByTestId("row-pending-1");
    fireEvent.click(within(screen.getByTestId("row-pending-1")).getByRole("button", { name: /delete/i }));

    expect(within(screen.getByTestId("section-pending")).queryByTestId("row-pending-1")).toBeNull();
    expect(within(screen.getByTestId("section-deleted")).getByText(/Draft Survey/)).toBeTruthy();
  });

  it("creates and navigates to a new survey when 'Add new survey' is clicked", async () => {
    render(<SurveyListing tenantCode="dpw-eu" />);
    await screen.findByTestId("row-pending-1");
    fireEvent.click(screen.getByRole("button", { name: /add new survey/i }));

    const pendingSection = screen.getByTestId("section-pending");
    // two pre-existing pending rows + one newly created one
    expect(within(pendingSection).getAllByRole("listitem").length).toBe(3);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush.mock.calls[0][0]).toMatch(/^\/admin\/surveys\//);
  });
});
