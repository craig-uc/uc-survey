import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import { StandardButton } from "./StandardButton";

const mockPathname = vi.fn().mockReturnValue("/test/en");

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

const DEFAULT_PROPS = {
  label: "Submit",
  lang: "en",
  tenantCode: "acme",
  application: "my-app",
  onClick: vi.fn<[], Promise<void>>().mockResolvedValue(undefined),
};

function stubFetch(labelMessage = "Submit") {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: labelMessage }),
    })
  );
}

describe("StandardButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/test/en");
    stubFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe("rendering", () => {
    it("renders a button element", async () => {
      render(<StandardButton {...DEFAULT_PROPS} />);
      await act(async () => {});
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("shows label prop before API responds", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<StandardButton {...DEFAULT_PROPS} label="Click me" />);
      expect(screen.getByRole("button", { name: "Click me" })).toBeTruthy();
    });

    it("applies className to the button", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<StandardButton {...DEFAULT_PROPS} className="my-class" />);
      expect(screen.getByRole("button").className).toContain("my-class");
    });

    it("is not disabled by default", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<StandardButton {...DEFAULT_PROPS} />);
      expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false);
    });

    it("is disabled when disabled prop is true", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<StandardButton {...DEFAULT_PROPS} disabled />);
      expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
    });
  });

  describe("label translation", () => {
    it("updates to API label when API responds", async () => {
      stubFetch("Inviare");
      render(<StandardButton {...DEFAULT_PROPS} label="Submit" />);
      await waitFor(() => expect(screen.getByRole("button", { name: "Inviare" })).toBeTruthy());
    });

    it("keeps label prop when API returns non-ok", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }));
      render(<StandardButton {...DEFAULT_PROPS} label="Submit" />);
      await act(async () => {});
      expect(screen.getByRole("button", { name: "Submit" })).toBeTruthy();
    });

    it("keeps label prop when API throws", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
      render(<StandardButton {...DEFAULT_PROPS} label="Submit" />);
      await act(async () => {});
      expect(screen.getByRole("button", { name: "Submit" })).toBeTruthy();
    });
  });

  describe("API fetch params", () => {
    it("sends label lowercased and trimmed with correct fields", async () => {
      render(<StandardButton {...DEFAULT_PROPS} label="  Submit  " />);
      await screen.findByRole("button");
      expect(fetch).toHaveBeenCalledWith(
        "/api/standard-button/label",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            label: "submit",
            language: "en",
            tenant_code: "acme",
            application: "my-app",
          }),
        })
      );
    });
  });

  describe("spinner behaviour", () => {
    it("disables the button and hides text when clicked", async () => {
      const onClickNeverResolves = vi.fn().mockReturnValue(new Promise(() => {}));
      render(<StandardButton {...DEFAULT_PROPS} onClick={onClickNeverResolves} />);
      await act(async () => {});
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });
      expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
      expect(screen.queryByText("Submit")).toBeNull();
    });

    it("re-enables and restores label when onClick resolves", async () => {
      let resolve!: () => void;
      const onClick = vi.fn().mockReturnValue(new Promise<void>((res) => { resolve = res; }));
      render(<StandardButton {...DEFAULT_PROPS} onClick={onClick} />);
      await act(async () => {});
      await act(async () => { fireEvent.click(screen.getByRole("button")); });
      expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
      await act(async () => { resolve(); });
      await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));
    });

    it("re-enables after onClick rejects", async () => {
      const onClick = vi.fn().mockRejectedValue(new Error("Action failed"));
      render(<StandardButton {...DEFAULT_PROPS} onClick={onClick} />);
      await act(async () => {});
      await act(async () => { fireEvent.click(screen.getByRole("button")); });
      await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));
    });

    it("stops spinner when pathname changes", async () => {
      const onClickNeverResolves = vi.fn().mockReturnValue(new Promise(() => {}));
      const { rerender } = render(<StandardButton {...DEFAULT_PROPS} onClick={onClickNeverResolves} />);
      await act(async () => {});
      await act(async () => { fireEvent.click(screen.getByRole("button")); });
      expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);

      mockPathname.mockReturnValue("/test/en/other");
      await act(async () => {
        rerender(<StandardButton {...DEFAULT_PROPS} onClick={onClickNeverResolves} />);
      });

      await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));
    });
  });
});
