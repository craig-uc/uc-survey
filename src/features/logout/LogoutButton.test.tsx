import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import { useTenant } from "@/features/tenant";
import { LogoutButton } from "./LogoutButton";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock("@/app/context/GlobalStateContext", () => ({
  useGlobalState: vi.fn(),
}));
vi.mock("@/features/tenant", () => ({
  useTenant: vi.fn(),
}));

const mockLogout = vi.fn();
const mockSetTenant = vi.fn();

const defaultState = {
  lang: "en",
  isHydrated: true,
  user: null as string | null,
  setUser: vi.fn(),
  logout: mockLogout,
  showTag: false,
  setShowTag: vi.fn(),
  showFooter: false,
  setShowFooter: vi.fn(),
  showMenu: false,
  setShowMenu: vi.fn(),
  showPersonName: false,
  setShowPersonName: vi.fn(),
  setLang: vi.fn(),
};

const defaultTenant = {
  tenant: "acme",
  tenantCode: "acme",
  setTenant: mockSetTenant,
};

function stubFetch(labelMessage = "Logout", logoutOk = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string) => {
      if (url === "/api/logout/label") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: labelMessage }),
        });
      }
      return Promise.resolve({
        ok: logoutOk,
        json: () => Promise.resolve({}),
      });
    })
  );
}

describe("LogoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(useGlobalState).mockReturnValue(defaultState);
    vi.mocked(useTenant).mockReturnValue(defaultTenant);
    stubFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe("rendering", () => {
    it("renders as a button by default", async () => {
      render(<LogoutButton />);
      await act(async () => {});
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("renders with default label 'logout' when no label is provided", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<LogoutButton />);
      expect(screen.getByRole("button", { name: /logout/i })).toBeTruthy();
    });

    it("renders the link variant", async () => {
      render(<LogoutButton variant="link" label="Sign out" />);
      await act(async () => {});
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("renders the menu variant", async () => {
      render(<LogoutButton variant="menu" label="Sign out" className="menu-item" />);
      await act(async () => {});
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("menu-item");
    });

    it("button variant applies default secondary classes", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<LogoutButton />);
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("bg-secondary");
      expect(btn.className).toContain("text-on-secondary");
    });

    it("button variant uses style prop when provided", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<LogoutButton style="bg-danger text-light" />);
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("bg-danger");
      expect(btn.className).not.toContain("bg-secondary");
    });

    it("link variant applies default link classes", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<LogoutButton variant="link" />);
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("text-secondary");
      expect(btn.className).toContain("hover:text-primary");
    });

    it("menu variant applies no preset classes", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<LogoutButton variant="menu" />);
      const btn = screen.getByRole("button");
      expect(btn.className).not.toContain("bg-secondary");
      expect(btn.className).not.toContain("text-secondary");
    });
  });

  describe("label behaviour", () => {
    it("shows prop label before API responds", () => {
      vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
      render(<LogoutButton label="Sign Out" />);
      expect(screen.getByRole("button", { name: "Sign Out" })).toBeTruthy();
    });

    it("updates to API label when API responds", async () => {
      stubFetch("Afmeld");
      render(<LogoutButton label="Sign Out" />);
      await waitFor(() => expect(screen.getByRole("button", { name: "Afmeld" })).toBeTruthy());
    });

    it("keeps prop label when API fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) })
      );
      render(<LogoutButton label="Sign Out" />);
      await act(async () => {});
      expect(screen.getByRole("button", { name: "Sign Out" })).toBeTruthy();
    });

    it("keeps prop label when API throws", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
      render(<LogoutButton label="Sign Out" />);
      await act(async () => {});
      expect(screen.getByRole("button", { name: "Sign Out" })).toBeTruthy();
    });

    it("does not fetch before hydration", () => {
      vi.mocked(useGlobalState).mockReturnValue({ ...defaultState, isHydrated: false });
      render(<LogoutButton />);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("API fetch params", () => {
    it("sends label lowercased and trimmed", async () => {
      render(<LogoutButton label="  Sign Out  " />);
      await screen.findByRole("button");
      expect(fetch).toHaveBeenCalledWith(
        "/api/logout/label",
        expect.objectContaining({
          body: JSON.stringify({ label: "sign out", tenant_code: "acme", language: "en" }),
        })
      );
    });

    it("sends empty tenant_code when tenant is null", async () => {
      vi.mocked(useTenant).mockReturnValue({ ...defaultTenant, tenant: null, tenantCode: "urup" });
      render(<LogoutButton />);
      await screen.findByRole("button");
      expect(fetch).toHaveBeenCalledWith(
        "/api/logout/label",
        expect.objectContaining({
          body: JSON.stringify({ label: "logout", tenant_code: "", language: "en" }),
        })
      );
    });

    it("defaults language to 'en' when lang is null", async () => {
      vi.mocked(useGlobalState).mockReturnValue({ ...defaultState, lang: null });
      render(<LogoutButton />);
      await screen.findByRole("button");
      expect(fetch).toHaveBeenCalledWith(
        "/api/logout/label",
        expect.objectContaining({
          body: JSON.stringify({ label: "logout", tenant_code: "acme", language: "en" }),
        })
      );
    });

    it("uses 'logout' as label when no label prop is provided", async () => {
      render(<LogoutButton />);
      await screen.findByRole("button");
      expect(fetch).toHaveBeenCalledWith(
        "/api/logout/label",
        expect.objectContaining({
          body: JSON.stringify({ label: "logout", tenant_code: "acme", language: "en" }),
        })
      );
    });
  });

  describe("logout flow", () => {
    it("calls POST /api/auth/logout on click", async () => {
      render(<LogoutButton />);
      await act(async () => {});
      await act(async () => { fireEvent.click(screen.getByRole("button")); });
      expect(fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    });

    it("calls logout() and setTenant(null) on click", async () => {
      render(<LogoutButton />);
      await act(async () => {});
      await act(async () => { fireEvent.click(screen.getByRole("button")); });
      expect(mockLogout).toHaveBeenCalled();
      expect(mockSetTenant).toHaveBeenCalledWith(null);
    });

    it("still logs out when the logout API call fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) => {
          if (url === "/api/logout/label") return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: "Logout" }) });
          return Promise.reject(new Error("Network error"));
        })
      );
      render(<LogoutButton />);
      await act(async () => {});
      await act(async () => { fireEvent.click(screen.getByRole("button")); });
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe("redirect after logout", () => {
    it("redirects to /{tenant}/{lang} when both are set", async () => {
      vi.mocked(useGlobalState).mockReturnValue({ ...defaultState, lang: "af" });
      vi.mocked(useTenant).mockReturnValue({ ...defaultTenant, tenant: "acme" });
      render(<LogoutButton />);
      await act(async () => {});
      await act(async () => { fireEvent.click(screen.getByRole("button")); });
      expect(mockPush).toHaveBeenCalledWith("/acme/af");
    });

    it("redirects to /{tenant} when lang is null", async () => {
      vi.mocked(useGlobalState).mockReturnValue({ ...defaultState, lang: null });
      vi.mocked(useTenant).mockReturnValue({ ...defaultTenant, tenant: "acme" });
      render(<LogoutButton />);
      await act(async () => {});
      await act(async () => { fireEvent.click(screen.getByRole("button")); });
      expect(mockPush).toHaveBeenCalledWith("/acme");
    });

    it("redirects to / when tenant is null", async () => {
      vi.mocked(useTenant).mockReturnValue({ ...defaultTenant, tenant: null });
      render(<LogoutButton />);
      await act(async () => {});
      await act(async () => { fireEvent.click(screen.getByRole("button")); });
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});
