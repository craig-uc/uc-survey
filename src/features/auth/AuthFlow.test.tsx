import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import React from "react";
import AuthFlow from "./AuthFlow";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock("@/app/context/GlobalStateContext", () => ({
  useGlobalState: () => ({ lang: "en", isHydrated: false }),
}));

vi.mock("@/features/tenant", () => ({
  useTenant: () => ({ tenantCode: "test" }),
}));

describe("AuthFlow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("login step", () => {
    it("renders an email input and a login button", async () => {
      render(<AuthFlow />);
      await act(async () => {});
      expect(screen.getByRole("textbox")).not.toBeNull();
      expect(screen.getByRole("button", { name: /login/i })).not.toBeNull();
    });

    it("does not call the login API when email is empty", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);

      render(<AuthFlow />);
      await act(async () => {});

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /login/i }).closest("form")!);
      });

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(screen.getByRole("textbox")).not.toBeNull();
    });

    it("transitions to the sent step on successful API response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ message: "OK" }),
        })
      );

      render(<AuthFlow />);
      await act(async () => {});

      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "user@example.com" },
      });

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /login/i }).closest("form")!);
      });

      await waitFor(() => {
        expect(screen.getByText(/An email with the login link/i)).not.toBeNull();
      });
    });

    it("shows an error status when the login API returns an error", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          statusText: "Forbidden",
          json: () => Promise.resolve({ error: "Access denied" }),
        })
      );

      render(<AuthFlow />);
      await act(async () => {});

      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "user@example.com" },
      });

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /login/i }).closest("form")!);
      });

      await waitFor(() => {
        expect(screen.getByText(/Error:.*Access denied/i)).not.toBeNull();
      });
    });

    it("shows a network error message when fetch rejects", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

      render(<AuthFlow />);
      await act(async () => {});

      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "user@example.com" },
      });

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /login/i }).closest("form")!);
      });

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).not.toBeNull();
      });
    });
  });

  describe("signing-in step", () => {
    it("calls onSignInSuccess with API data on successful sign-in", async () => {
      const mockData = { user: "u1", tenant_code: "acme", app_settings: {} };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockData),
        })
      );

      const onSignInSuccess = vi.fn();
      render(<AuthFlow code="valid-code" onSignInSuccess={onSignInSuccess} />);

      await waitFor(() => {
        expect(onSignInSuccess).toHaveBeenCalledWith(mockData);
      });
    });

    it("calls onSignInError when the sign-in API returns an error", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({ error: "Invalid code" }),
        })
      );

      const onSignInError = vi.fn();
      render(<AuthFlow code="bad-code" onSignInError={onSignInError} />);

      await waitFor(() => {
        expect(onSignInError).toHaveBeenCalled();
      });
    });

    it("calls onSignInError when fetch rejects during sign-in", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

      const onSignInError = vi.fn();
      render(<AuthFlow code="any-code" onSignInError={onSignInError} />);

      await waitFor(() => {
        expect(onSignInError).toHaveBeenCalled();
      });
    });

    it("renders the spinner while signing in", async () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<AuthFlow code="pending-code" />);
      await act(async () => {});
      expect(screen.getByRole("status")).not.toBeNull();
      expect(screen.getByText("Finalizing...")).not.toBeNull();
    });
  });

});
