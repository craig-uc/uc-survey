import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import { useTenant } from "@/features/tenant";
import NavButton from "./NavButton";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/test",
}));

vi.mock("@/app/context/GlobalStateContext", () => ({
  useGlobalState: vi.fn(),
}));

vi.mock("@/features/tenant", () => ({
  useTenant: vi.fn(),
}));

const defaultState = {
  lang: "en",
  setLang: vi.fn(),
  user: null as string | null,
  setUser: vi.fn(),
};

const defaultTenant = {
  tenant: "urup",
  tenantCode: "urup",
  setTenant: vi.fn(),
};

describe("NavButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGlobalState).mockReturnValue(defaultState);
    vi.mocked(useTenant).mockReturnValue(defaultTenant);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "Next" }),
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe("label behaviour", () => {
    it("renders immediately with prop label before API responds", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<NavButton type="next" label="Next" href="/page-2" />);
      expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
    });

    it("updates to API label when the API responds", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ message: "Volgende" }),
        })
      );
      render(<NavButton type="next" label="Next" href="/page-2" />);
      expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
      await waitFor(() => expect(screen.getByRole("button", { name: "Volgende" })).toBeTruthy());
    });

    it("falls back to prop label when API returns no message", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({ error: "Not found" }),
        })
      );
      render(<NavButton type="submit" label="Submit" href="/done" />);
      await waitFor(() => expect(screen.getByRole("button", { name: "Submit" })).toBeTruthy());
    });
  });

  describe("API fetch params", () => {
    it("sends label lowercased and trimmed to /api/standard-button/label", async () => {
      vi.mocked(useGlobalState).mockReturnValue({ ...defaultState, lang: "af" });
      vi.mocked(useTenant).mockReturnValue({ ...defaultTenant, tenantCode: "urup" });
      render(<NavButton type="back" label="  Back  " href="/page-0" />);
      await screen.findByRole("button");
      expect(fetch).toHaveBeenCalledWith(
        "/api/standard-button/label",
        expect.objectContaining({
          body: JSON.stringify({
            label: "back",
            language: "af",
            tenant_code: "urup",
            application: "",
          }),
        })
      );
    });

    it("uses empty string for tenant_code when tenantCode is null", async () => {
      vi.mocked(useTenant).mockReturnValue({ tenant: null, tenantCode: null as unknown as string, setTenant: vi.fn() });
      render(<NavButton type="next" label="Next" href="/page-2" />);
      await waitFor(() =>
        expect(fetch).toHaveBeenCalledWith(
          "/api/standard-button/label",
          expect.objectContaining({
            body: JSON.stringify({ label: "next", language: "en", tenant_code: "", application: "" }),
          })
        )
      );
    });
  });

  describe("navigation", () => {
    it("navigates to href when clicked", async () => {
      render(<NavButton type="next" label="Next" href="/page-2" />);
      await screen.findByRole("button");
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/page-2"));
    });

    it("does not navigate when onClick returns false", async () => {
      const onClick = vi.fn().mockResolvedValue(false);
      render(<NavButton type="next" label="Next" href="/page-2" onClick={onClick} />);
      await screen.findByRole("button");
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      await waitFor(() => expect(onClick).toHaveBeenCalled());
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("navigates when onClick returns true", async () => {
      const onClick = vi.fn().mockResolvedValue(true);
      render(<NavButton type="next" label="Next" href="/page-2" onClick={onClick} />);
      await screen.findByRole("button");
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/page-2"));
    });
  });

  describe("style", () => {
    it("applies primary style for submit type by default", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<NavButton type="submit" label="Submit" href="/done" />);
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("bg-primary");
      expect(btn.className).toContain("text-on-primary");
    });

    it("applies secondary style for back type by default", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<NavButton type="back" label="Back" href="/prev" />);
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("bg-secondary");
      expect(btn.className).toContain("text-on-secondary");
    });

    it("applies secondary style for cancel type by default", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<NavButton type="cancel" label="Cancel" href="/cancel" />);
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("bg-secondary");
    });

    it("overrides default style when style prop is provided", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<NavButton type="back" label="Back" href="/prev" style="primary" />);
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("bg-primary");
    });

    it("applies custom CSS string directly when style is not primary or secondary", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<NavButton type="alert" label="Alert" href="/alert" style="bg-danger text-light" />);
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("bg-danger");
      expect(btn.className).toContain("text-light");
    });
  });
});
