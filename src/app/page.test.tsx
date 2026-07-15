import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RootPage from "./page";
import type { AuthStep } from "@/features/auth";

vi.mock("@/features/identity", () => ({
  IdentityInitializer: () => null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/auth", () => ({
  AuthFlow: React.forwardRef(function MockAuthFlow(
    props: {
      onStepChange?: (step: AuthStep) => void;
      onSubmittingChange?: (submitting: boolean) => void;
    },
    ref: React.Ref<{ submitLogin: () => Promise<false> }>
  ) {
    React.useImperativeHandle(ref, () => ({ submitLogin: vi.fn().mockResolvedValue(false) }));
    return (
      <div data-testid="auth-flow">
        <button onClick={() => props.onStepChange?.("sent")}>go-sent</button>
        <button onClick={() => props.onStepChange?.("login")}>go-login</button>
        <button onClick={() => props.onSubmittingChange?.(true)}>go-busy</button>
        <button onClick={() => props.onSubmittingChange?.(false)}>go-idle</button>
      </div>
    );
  }),
}));

interface MockButtonConfig {
  type: string;
  label: string;
  show?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

vi.mock("@/components/GlassPanel", () => ({
  default: ({
    children,
    navigation,
  }: {
    children: React.ReactNode;
    navigation?: { buttons: MockButtonConfig[] };
  }) => (
    <div>
      {children}
      <nav>
        {navigation?.buttons
          .filter((b) => b.show !== false)
          .map((b) => (
            <button key={b.type} disabled={b.loading} onClick={b.onClick}>
              {b.label}
            </button>
          ))}
      </nav>
    </div>
  ),
}));

describe("RootPage", () => {
  it("shows the Login nav button by default", () => {
    render(<RootPage />);
    expect(screen.getByRole("button", { name: "Login" })).not.toBeNull();
  });

  it("hides the Login nav button once AuthFlow reports the 'sent' step", () => {
    render(<RootPage />);
    fireEvent.click(screen.getByText("go-sent"));

    expect(screen.queryByRole("button", { name: "Login" })).toBeNull();
  });

  it("shows the Login nav button again if the step returns to 'login'", () => {
    render(<RootPage />);
    fireEvent.click(screen.getByText("go-sent"));
    fireEvent.click(screen.getByText("go-login"));

    expect(screen.getByRole("button", { name: "Login" })).not.toBeNull();
  });

  it("is not disabled by default", () => {
    render(<RootPage />);
    expect(screen.getByRole("button", { name: "Login" }).hasAttribute("disabled")).toBe(false);
  });

  it("disables the Login nav button once AuthFlow reports submitting", () => {
    render(<RootPage />);
    fireEvent.click(screen.getByText("go-busy"));

    expect(screen.getByRole("button", { name: "Login" }).hasAttribute("disabled")).toBe(true);
  });

  it("re-enables the Login nav button once AuthFlow reports submitting has finished", () => {
    render(<RootPage />);
    fireEvent.click(screen.getByText("go-busy"));
    fireEvent.click(screen.getByText("go-idle"));

    expect(screen.getByRole("button", { name: "Login" }).hasAttribute("disabled")).toBe(false);
  });
});
