import React, { createRef } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import { StandardInput } from "./StandardInput";

vi.mock("@/app/context/GlobalStateContext", () => ({
  useGlobalState: () => ({ lang: "en", isHydrated: true }),
}));

vi.mock("@/features/tenant", () => ({
  useTenant: () => ({ tenantCode: "acme" }),
}));

const DEFAULT_PROPS = {
  label: "Email",
  name: "email",
};

function stubFetch(responses: { field?: string; error?: string } = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url === "/api/standard-input/field") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: responses.field ?? "" }),
        });
      }
      if (url === "/api/standard-input/error") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: responses.error ?? "" }),
        });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    })
  );
}

describe("StandardInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    stubFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe("rendering", () => {
    it("renders an input element", async () => {
      render(<StandardInput {...DEFAULT_PROPS} />);
      await act(async () => {});
      expect(screen.getByRole("textbox")).toBeTruthy();
    });

    it("renders a label for the input", async () => {
      render(<StandardInput {...DEFAULT_PROPS} label="Email" />);
      await act(async () => {});
      expect(screen.getByLabelText("Email")).toBeTruthy();
    });

    it("applies type prop to the input", () => {
      stubFetch();
      render(<StandardInput {...DEFAULT_PROPS} type="password" />);
      const input = document.querySelector("input");
      expect(input?.type).toBe("password");
    });

    it("applies maxLength prop to the input", () => {
      render(<StandardInput {...DEFAULT_PROPS} maxLength={10} />);
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.maxLength).toBe(10);
    });

    it("applies className to the input", () => {
      render(<StandardInput {...DEFAULT_PROPS} className="my-class" />);
      const input = document.querySelector("input");
      expect(input?.className).toContain("my-class");
    });

    it("forwards ref to the input element", () => {
      const ref = createRef<HTMLInputElement>();
      render(<StandardInput {...DEFAULT_PROPS} ref={ref} />);
      expect(ref.current?.tagName).toBe("INPUT");
    });
  });

  describe("label translation", () => {
    it("shows prop label before API responds", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<StandardInput {...DEFAULT_PROPS} label="Email" />);
      expect(screen.getByText("Email")).toBeTruthy();
    });

    it("updates label from API response", async () => {
      stubFetch({ field: "Courrier électronique" });
      render(<StandardInput {...DEFAULT_PROPS} label="Email" />);
      await waitFor(() => expect(screen.getByText("Courrier électronique")).toBeTruthy());
    });

    it("keeps prop label when API returns no message", async () => {
      stubFetch({ field: "" });
      render(<StandardInput {...DEFAULT_PROPS} label="Email" />);
      await act(async () => {});
      expect(screen.getByText("Email")).toBeTruthy();
    });

    it("keeps prop label when API returns non-ok", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }));
      render(<StandardInput {...DEFAULT_PROPS} label="Email" />);
      await act(async () => {});
      expect(screen.getByText("Email")).toBeTruthy();
    });
  });

  describe("placeholder translation", () => {
    it("fetches translated placeholder when placeholder prop is provided", async () => {
      stubFetch({ field: "Enter your email" });
      render(<StandardInput {...DEFAULT_PROPS} placeholder="email_placeholder" />);
      await waitFor(() => {
        const input = document.querySelector("input") as HTMLInputElement;
        expect(input.placeholder).toBe("Enter your email");
      });
    });

    it("does not fetch placeholder when placeholder prop is absent", async () => {
      render(<StandardInput {...DEFAULT_PROPS} />);
      await act(async () => {});
      const fetchMock = fetch as ReturnType<typeof vi.fn>;
      const placeholderCalls = fetchMock.mock.calls.filter(
        ([url]: [string]) => url === "/api/standard-input/field"
      );
      expect(placeholderCalls.length).toBe(1); // only label fetch
    });
  });

  describe("value and localStorage", () => {
    it("starts empty when no value prop and nothing in localStorage", () => {
      render(<StandardInput {...DEFAULT_PROPS} />);
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("starts with value prop when provided", () => {
      render(<StandardInput {...DEFAULT_PROPS} value="test@example.com" />);
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.value).toBe("test@example.com");
    });

    it("loads value from localStorage when no value prop", async () => {
      localStorage.setItem("email", "stored@example.com");
      render(<StandardInput {...DEFAULT_PROPS} />);
      await act(async () => {});
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.value).toBe("stored@example.com");
    });

    it("uses value prop instead of localStorage when both are present", async () => {
      localStorage.setItem("email", "stored@example.com");
      render(<StandardInput {...DEFAULT_PROPS} value="prop@example.com" />);
      await act(async () => {});
      const input = document.querySelector("input") as HTMLInputElement;
      expect(input.value).toBe("prop@example.com");
    });

    it("saves value to localStorage on blur", async () => {
      render(<StandardInput {...DEFAULT_PROPS} />);
      const input = document.querySelector("input") as HTMLInputElement;
      await act(async () => { fireEvent.change(input, { target: { value: "new@example.com" } }); });
      await act(async () => { fireEvent.blur(input); });
      expect(localStorage.getItem("email")).toBe("new@example.com");
    });
  });

  describe("onChange callback", () => {
    it("calls onChange with the current value on input change", async () => {
      const onChange = vi.fn();
      render(<StandardInput {...DEFAULT_PROPS} onChange={onChange} />);
      const input = document.querySelector("input") as HTMLInputElement;
      await act(async () => { fireEvent.change(input, { target: { value: "hello" } }); });
      expect(onChange).toHaveBeenCalledWith("hello");
    });

    it("calls onChange with stored localStorage value on mount", async () => {
      const onChange = vi.fn();
      localStorage.setItem("email", "stored@example.com");
      render(<StandardInput {...DEFAULT_PROPS} onChange={onChange} />);
      await act(async () => {});
      expect(onChange).toHaveBeenCalledWith("stored@example.com");
    });
  });

  describe("validation", () => {
    it("does not show error before blur", async () => {
      stubFetch({ error: "This field is required" });
      render(<StandardInput {...DEFAULT_PROPS} required />);
      await act(async () => {});
      expect(screen.queryByText("This field is required")).toBeNull();
    });

    it("shows error from API when required field is blurred empty", async () => {
      stubFetch({ error: "This field is required" });
      render(<StandardInput {...DEFAULT_PROPS} required />);
      await act(async () => {});
      const input = document.querySelector("input") as HTMLInputElement;
      await act(async () => { fireEvent.blur(input); });
      await waitFor(() => expect(screen.getByText("This field is required")).toBeTruthy());
    });

    it("shows error via validation.required rule", async () => {
      stubFetch({ error: "Required" });
      render(<StandardInput {...DEFAULT_PROPS} validation={{ required: true }} />);
      const input = document.querySelector("input") as HTMLInputElement;
      await act(async () => { fireEvent.blur(input); });
      await waitFor(() => expect(screen.getByText("Required")).toBeTruthy());
    });

    it("shows error when maxLength is exceeded on blur", async () => {
      stubFetch({ error: "Too long" });
      render(<StandardInput {...DEFAULT_PROPS} maxLength={5} />);
      const input = document.querySelector("input") as HTMLInputElement;
      await act(async () => { fireEvent.change(input, { target: { value: "toolong" } }); });
      await act(async () => { fireEvent.blur(input); });
      await waitFor(() => expect(screen.getByText("Too long")).toBeTruthy());
    });

    it("shows error when minLength rule is violated on blur", async () => {
      stubFetch({ error: "Too short" });
      render(<StandardInput {...DEFAULT_PROPS} validation={{ minLength: 5 }} />);
      const input = document.querySelector("input") as HTMLInputElement;
      await act(async () => { fireEvent.change(input, { target: { value: "ab" } }); });
      await act(async () => { fireEvent.blur(input); });
      await waitFor(() => expect(screen.getByText("Too short")).toBeTruthy());
    });

    it("shows error when pattern rule is violated on blur", async () => {
      stubFetch({ error: "Invalid format" });
      render(<StandardInput {...DEFAULT_PROPS} validation={{ pattern: /^\d+$/ }} />);
      const input = document.querySelector("input") as HTMLInputElement;
      await act(async () => { fireEvent.change(input, { target: { value: "abc" } }); });
      await act(async () => { fireEvent.blur(input); });
      await waitFor(() => expect(screen.getByText("Invalid format")).toBeTruthy());
    });

    it("clears error when field becomes valid on next blur", async () => {
      stubFetch({ error: "This field is required" });
      render(<StandardInput {...DEFAULT_PROPS} required />);
      const input = document.querySelector("input") as HTMLInputElement;
      await act(async () => { fireEvent.blur(input); });
      await waitFor(() => expect(screen.getByText("This field is required")).toBeTruthy());

      await act(async () => { fireEvent.change(input, { target: { value: "valid" } }); });
      await act(async () => { fireEvent.blur(input); });
      await waitFor(() => expect(screen.queryByText("This field is required")).toBeNull());
    });

    it("applies danger border class when error is present", async () => {
      stubFetch({ error: "This field is required" });
      render(<StandardInput {...DEFAULT_PROPS} required />);
      const input = document.querySelector("input") as HTMLInputElement;
      await act(async () => { fireEvent.blur(input); });
      await waitFor(() => expect(input.className).toContain("border-danger"));
    });

    it("falls back to error type string when API returns no message", async () => {
      stubFetch({ error: "" });
      render(<StandardInput {...DEFAULT_PROPS} required />);
      const input = document.querySelector("input") as HTMLInputElement;
      await act(async () => { fireEvent.blur(input); });
      await waitFor(() => expect(screen.getByText("required")).toBeTruthy());
    });

    it("sends correct error type to /api/standard-input/error", async () => {
      stubFetch({ error: "This field is required" });
      render(<StandardInput {...DEFAULT_PROPS} required />);
      const input = document.querySelector("input") as HTMLInputElement;
      await act(async () => { fireEvent.blur(input); });
      await waitFor(() => {
        const fetchMock = fetch as ReturnType<typeof vi.fn>;
        const errorCall = fetchMock.mock.calls.find(([url]: [string]) => url === "/api/standard-input/error");
        expect(JSON.parse(errorCall[1].body)).toMatchObject({ type: "required", language: "en", tenant_code: "acme" });
      });
    });
  });
});
