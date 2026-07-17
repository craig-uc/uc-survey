import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import AdminLayout from "./layout";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@/app/context/GlobalStateContext", () => ({
  useGlobalState: vi.fn(),
}));

vi.mock("@/components/layout/Header", () => ({
  Header: () => <div>Header</div>,
}));

vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <div>Footer</div>,
}));

describe("AdminLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects to the root login page when hydrated with no user", async () => {
    vi.mocked(useGlobalState).mockReturnValue({ user: null, isHydrated: true } as ReturnType<typeof useGlobalState>);

    await act(async () => {
      render(<AdminLayout>{"child content"}</AdminLayout>);
    });

    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("does not redirect once hydrated with a signed-in user, and renders children", async () => {
    vi.mocked(useGlobalState).mockReturnValue({ user: "someone", isHydrated: true } as ReturnType<typeof useGlobalState>);

    const renderResult = render(<AdminLayout>{"child content"}</AdminLayout>);
    await act(async () => {});

    expect(mockReplace).not.toHaveBeenCalled();
    expect(renderResult.getByText("child content")).not.toBeNull();
  });

  it("does not redirect before hydration completes, even without a user", async () => {
    vi.mocked(useGlobalState).mockReturnValue({ user: null, isHydrated: false } as ReturnType<typeof useGlobalState>);

    await act(async () => {
      render(<AdminLayout>{"child content"}</AdminLayout>);
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
