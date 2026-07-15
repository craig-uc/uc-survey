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
      expect(screen.queryByRole("button", { name: /login/i })).toBeNull();
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

    it("includes a redirectUrl pointing at the signIn callback alongside the current path", async () => {
      history.pushState({}, "", "/acme/en/admin/auth");
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "OK" }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      render(<AuthFlow />);
      await act(async () => {});

      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "user@example.com" },
      });

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /login/i }).closest("form")!);
      });

      await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
      const [, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.redirectUrl).toBe(`${window.location.origin}/acme/en/admin/auth/signIn`);
    });

    it("does not produce a double slash when the current path already ends in /", async () => {
      history.pushState({}, "", "/acme/en/admin/auth/");
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "OK" }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      render(<AuthFlow />);
      await act(async () => {});

      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "user@example.com" },
      });

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /login/i }).closest("form")!);
      });

      await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
      const [, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.redirectUrl).toBe(`${window.location.origin}/acme/en/admin/auth/signIn`);
    });

    it("submits the login when Enter is pressed in the email field", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "OK" }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      render(<AuthFlow />);
      await act(async () => {});

      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "user@example.com" },
      });

      await act(async () => {
        fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", code: "Enter" });
      });

      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
      expect(screen.getByText(/An email with the login link/i)).not.toBeNull();
    });

    it("submits the login via Enter even when the visible button is hidden", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "OK" }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      render(<AuthFlow hideLoginButton />);
      await act(async () => {});

      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "user@example.com" },
      });

      await act(async () => {
        fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", code: "Enter" });
      });

      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    });

    it("does not submit when a non-Enter key is pressed", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);

      render(<AuthFlow />);
      await act(async () => {});

      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "user@example.com" },
      });

      await act(async () => {
        fireEvent.keyDown(screen.getByRole("textbox"), { key: "a", code: "KeyA" });
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("does not call the login API when Enter is pressed with an empty email", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);

      render(<AuthFlow />);
      await act(async () => {});

      await act(async () => {
        fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", code: "Enter" });
      });

      expect(fetchSpy).not.toHaveBeenCalled();
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

    it("includes tenantCode and lang in the sign-in request body when provided", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user: "u1", tenant_code: "acme", app_settings: {} }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      render(<AuthFlow code="valid-code" tenantCode="acme" lang="af" />);

      await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
      const [, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body).toEqual({ code: "valid-code", tenantCode: "acme", lang: "af" });
    });

    it("omits tenantCode and lang from the sign-in request body when not provided", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user: "u1", tenant_code: "acme", app_settings: {} }),
      });
      vi.stubGlobal("fetch", fetchSpy);

      render(<AuthFlow code="valid-code" />);

      await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
      const [, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body).toEqual({ code: "valid-code" });
    });
  });

  describe("onStepChange", () => {
    it("is called with 'login' on initial mount when no code is provided", async () => {
      const onStepChange = vi.fn();
      render(<AuthFlow onStepChange={onStepChange} />);
      await act(async () => {});

      expect(onStepChange).toHaveBeenCalledWith("login");
    });

    it("is called with 'signing-in' on initial mount when a code is provided", async () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      const onStepChange = vi.fn();
      render(<AuthFlow code="pending-code" onStepChange={onStepChange} />);
      await act(async () => {});

      expect(onStepChange).toHaveBeenCalledWith("signing-in");
    });

    it("is called with 'sent' after a successful login submission", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ message: "OK" }),
        })
      );
      const onStepChange = vi.fn();

      render(<AuthFlow onStepChange={onStepChange} />);
      await act(async () => {});

      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "user@example.com" },
      });

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /login/i }).closest("form")!);
      });

      await waitFor(() => expect(onStepChange).toHaveBeenCalledWith("sent"));
    });

    it("does not throw when onStepChange is not provided", async () => {
      expect(() => render(<AuthFlow />)).not.toThrow();
    });
  });

  describe("onSubmittingChange", () => {
    it("is called with false on initial mount", async () => {
      const onSubmittingChange = vi.fn();
      render(<AuthFlow onSubmittingChange={onSubmittingChange} />);
      await act(async () => {});

      expect(onSubmittingChange).toHaveBeenCalledWith(false);
    });

    it("reports true while submitting via the inline button, then false once it settles", async () => {
      let resolveFetch!: (value: unknown) => void;
      vi.stubGlobal(
        "fetch",
        vi.fn().mockReturnValue(
          new Promise((res) => {
            resolveFetch = res;
          })
        )
      );
      const onSubmittingChange = vi.fn();

      render(<AuthFlow onSubmittingChange={onSubmittingChange} />);
      await act(async () => {});

      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "user@example.com" },
      });

      await act(async () => {
        fireEvent.submit(screen.getByRole("button", { name: /login/i }).closest("form")!);
      });

      expect(onSubmittingChange).toHaveBeenLastCalledWith(true);

      await act(async () => {
        resolveFetch({ ok: true, json: () => Promise.resolve({ message: "OK" }) });
      });

      await waitFor(() => expect(onSubmittingChange).toHaveBeenLastCalledWith(false));
    });

    it("reports true while submitting via Enter, then false once it settles", async () => {
      let resolveFetch!: (value: unknown) => void;
      vi.stubGlobal(
        "fetch",
        vi.fn().mockReturnValue(
          new Promise((res) => {
            resolveFetch = res;
          })
        )
      );
      const onSubmittingChange = vi.fn();

      render(<AuthFlow hideLoginButton onSubmittingChange={onSubmittingChange} />);
      await act(async () => {});

      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "user@example.com" },
      });

      await act(async () => {
        fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", code: "Enter" });
      });

      expect(onSubmittingChange).toHaveBeenLastCalledWith(true);

      await act(async () => {
        resolveFetch({ ok: true, json: () => Promise.resolve({ message: "OK" }) });
      });

      await waitFor(() => expect(onSubmittingChange).toHaveBeenLastCalledWith(false));
    });

    it("does not throw when onSubmittingChange is not provided", async () => {
      expect(() => render(<AuthFlow />)).not.toThrow();
    });
  });

});
