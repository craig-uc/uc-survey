import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import SignInPage from "./page";
import type { AuthSessionData } from "@/features/auth";

const mockUseSearchParams = vi.fn();
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({ push: mockPush }),
}));

const mockApplySession = vi.fn();
vi.mock("@/features/auth", () => ({
  AuthFlow: (props: {
    code?: string;
    tenantCode?: string;
    lang?: string;
    onSignInSuccess?: (data: AuthSessionData) => void;
    onSignInError?: () => void;
  }) => (
    <div
      data-testid="auth-flow"
      data-code={props.code ?? ""}
      data-tenant-code={props.tenantCode ?? ""}
      data-lang={props.lang ?? ""}
    >
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
  });

  it("passes the token query param through to AuthFlow as the code", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("token=abc123"));

    render(<SignInPage />);

    const authFlow = await screen.findByTestId("auth-flow");
    expect(authFlow.dataset.code).toBe("abc123");
  });

  it("falls back to NoCode when no token is present in the URL", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));

    render(<SignInPage />);

    const authFlow = await screen.findByTestId("auth-flow");
    expect(authFlow.dataset.code).toBe("NoCode");
  });

  it("ignores a code param, since the magic link uses token", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("code=abc123"));

    render(<SignInPage />);

    const authFlow = await screen.findByTestId("auth-flow");
    expect(authFlow.dataset.code).toBe("NoCode");
  });

  it("passes the fixed urup/en tenant and language to AuthFlow", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("token=abc123"));

    render(<SignInPage />);

    const authFlow = await screen.findByTestId("auth-flow");
    expect(authFlow.dataset.tenantCode).toBe("urup");
    expect(authFlow.dataset.lang).toBe("en");
  });

  it("applies the session data and redirects to the admin home page on sign-in success", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("token=abc123"));

    render(<SignInPage />);
    fireEvent.click(await screen.findByText("trigger-success"));

    expect(mockApplySession).toHaveBeenCalledWith({ user: "u1", tenant_code: "acme", app_settings: {} });
    expect(mockPush).toHaveBeenCalledWith("/admin/home");
  });

  it("redirects to the root login page on sign-in error", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("token=bad-code"));

    render(<SignInPage />);
    fireEvent.click(await screen.findByText("trigger-error"));

    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
