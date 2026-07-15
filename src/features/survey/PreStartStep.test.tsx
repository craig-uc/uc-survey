import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import PreStartStep from "./PreStartStep";

describe("PreStartStep", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders a heading indicating the survey hasn't started yet", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    render(<PreStartStep startAt="2026-01-01T00:10:00.000Z" onExpire={vi.fn()} />);
    expect(screen.getByRole("heading").textContent).toMatch(/hasn't started/i);
  });

  it("renders a live countdown that ticks down as time passes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    render(<PreStartStep startAt="2026-01-01T00:00:10.000Z" onExpire={vi.fn()} />);

    expect(screen.getByText(/0h 0m 10s/)).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByText(/0h 0m 6s/)).toBeTruthy();
  });

  it("calls onExpire exactly once when the countdown reaches zero", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const onExpire = vi.fn();
    render(<PreStartStep startAt="2026-01-01T00:00:03.000Z" onExpire={onExpire} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("calls onExpire immediately when startAt is already in the past at mount", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:10.000Z"));
    const onExpire = vi.fn();
    render(<PreStartStep startAt="2026-01-01T00:00:00.000Z" onExpire={onExpire} />);

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("shows a generic message and never calls onExpire when startAt is null (e.g. a draft survey with no scheduled date)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const onExpire = vi.fn();
    render(<PreStartStep startAt={null} onExpire={onExpire} />);

    expect(screen.getByRole("heading").textContent).toMatch(/hasn't started/i);
    expect(screen.queryByText(/\d+h \d+m \d+s/)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onExpire).not.toHaveBeenCalled();
  });
});
