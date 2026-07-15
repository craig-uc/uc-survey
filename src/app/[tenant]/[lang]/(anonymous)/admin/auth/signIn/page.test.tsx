import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import SignInPage from "./page";
import type { AuthSessionData } from "@/features/auth";

const mockUseSearchParams = vi.fn();
const mockUseParams = vi.fn();
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
  useParams: () => mockUseParams(),
  useRouter: () => ({ push: mockPush }),
}));

const mockApplySession = vi.fn();
vi.mock("@/features/auth", () => ({
  AuthFlow: (props: {
    code?: string;
    onSignInSuccess?: (data: AuthSessionData) => void;
    onSignInError?: () => void;
  }) => (
    <div data-testid="auth-flow" data-code={props.code ?? ""}>
      AuthFlow
      <button onClick={() => props.onSignInSuccess?.({ user: "u1", tenant_code: "acme", app_settings: {} as never })}>
        trigger-success
      </button>
      <button onClick={() => props.onSignInError?.()}>trigger-error</button>
    </div>
  ),
  useApplySession: () => mockApplySession,
}));

vi.mock("@/components/GlassPanel", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="glass-panel">{children}</div>,
}));

describe("SignInPage", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockApplySession.mockClear();
    mockUseParams.mockReturnValue({ tenant: "acme", lang: "en" });
  });

  it("passes the code query param through to AuthFlow", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("code=abc123"));

    render(<SignInPage />);

    const authFlow = await screen.findByTestId("auth-flow");
    expect(authFlow.dataset.code).toBe("abc123");
  });

  it("falls back to NoCode when no code is present in the URL", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));

    render(<SignInPage />);

    const authFlow = await screen.findByTestId("auth-flow");
    expect(authFlow.dataset.code).toBe("NoCode");
  });

  it("applies the session data and redirects to the tenant/lang home page on sign-in success", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("code=abc123"));

    render(<SignInPage />);
    fireEvent.click(await screen.findByText("trigger-success"));

    expect(mockApplySession).toHaveBeenCalledWith({ user: "u1", tenant_code: "acme", app_settings: {} });
    expect(mockPush).toHaveBeenCalledWith("/acme/en/home");
  });

  it("redirects to the login page on sign-in error", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("code=bad-code"));

    render(<SignInPage />);
    fireEvent.click(await screen.findByText("trigger-error"));

    expect(mockPush).toHaveBeenCalledWith("/acme/en/admin/auth");
  });
});
