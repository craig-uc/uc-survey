import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import IdentityGuard from "./IdentityGuard";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: mockReplace })),
  useParams: vi.fn(() => ({ tenant: "acme" })),
}));

describe("IdentityGuard", () => {
  beforeEach(() => {
    localStorage.clear();
    mockReplace.mockClear();
  });

  it("renders children when identifier exists", async () => {
    localStorage.setItem("identifier", "anon_abc");
    render(
      <IdentityGuard>
        <div data-testid="content">Protected</div>
      </IdentityGuard>
    );
    await act(async () => {});
    expect(screen.getByTestId("content")).not.toBeNull();
  });

  it("redirects to /<tenant> when identifier is missing", async () => {
    render(
      <IdentityGuard>
        <div>Protected</div>
      </IdentityGuard>
    );
    await act(async () => {});
    expect(mockReplace).toHaveBeenCalledWith("/acme");
  });

  it("redirects to / when identifier is missing and no tenant param", async () => {
    const { useParams } = await import("next/navigation");
    vi.mocked(useParams).mockReturnValueOnce({});
    render(
      <IdentityGuard>
        <div>Protected</div>
      </IdentityGuard>
    );
    await act(async () => {});
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

});
