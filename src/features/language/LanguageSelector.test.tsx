import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, cleanup, fireEvent, screen } from "@testing-library/react";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import { useParams, useRouter } from "next/navigation";
import LanguageSelector, { clearLabelCache } from "./LanguageSelector";

vi.mock("@/app/context/GlobalStateContext", () => ({
  useGlobalState: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock("@/app/lib/i18n/locales", () => ({
  getTenantLocales: vi.fn(() => ["en", "af"]),
  isValidLocale: vi.fn((l: string) => ["en", "af"].includes(l)),
}));

const mockPush = vi.fn();

const defaultState = {
  lang: "en",
  isHydrated: true,
  user: "user-uuid-123",
  setLang: vi.fn(),
  setUser: vi.fn(),
};

describe("LanguageSelector tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearLabelCache();
    vi.mocked(useGlobalState).mockReturnValue(defaultState);
    vi.mocked(useParams).mockReturnValue({ tenant: "acme" });
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as ReturnType<typeof useRouter>);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    );
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("fires POST to /api/track/language with correct payload when a language button is clicked", async () => {
    const { getAllByRole } = render(<LanguageSelector page="landing" version="1" />);

    const buttons = getAllByRole("button");
    fireEvent.click(buttons[1]); // click "af"

    await waitFor(() => {
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const trackCall = calls.find(([url]) => url === "/api/track/language");
      expect(trackCall).toBeDefined();
      const body = JSON.parse(trackCall![1].body);
      expect(body).toMatchObject({
        account_code: "acme",
        page: "landing",
        identifier: "user-uuid-123",
        pageVersion: "1",
        language: "af",
      });
    });
  });

  it("navigates to the selected locale after click", async () => {
    const { getAllByRole } = render(<LanguageSelector page="landing" version="1" />);

    const buttons = getAllByRole("button");
    fireEvent.click(buttons[0]); // click "en"

    expect(mockPush).toHaveBeenCalledWith("/acme/en");
  });

  it("persists selected locale to localStorage before navigating", () => {
    const { getAllByRole } = render(<LanguageSelector page="landing" version="1" />);
    const buttons = getAllByRole("button");
    fireEvent.click(buttons[1]); // click "af"
    expect(localStorage.setItem).toHaveBeenCalledWith("lang", "af");
  });

  it("navigates to destination path when destination prop is provided", () => {
    const { getAllByRole } = render(<LanguageSelector page="landing" version="1" destination="auth" />);
    const buttons = getAllByRole("button");
    fireEvent.click(buttons[0]); // click "en"
    expect(mockPush).toHaveBeenCalledWith("/acme/en/auth");
  });

  it("does not fire tracking when user is null", async () => {
    vi.mocked(useGlobalState).mockReturnValue({ ...defaultState, user: null });

    const { getAllByRole } = render(<LanguageSelector page="landing" version="1" />);
    const buttons = getAllByRole("button");
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const trackCall = calls.find(([url]) => url === "/api/track/language");
      expect(trackCall).toBeUndefined();
    });
  });

  it("fetches title from /api/language/field with label selectLanguage", async () => {
    render(<LanguageSelector page="landing" version="1" />);

    await waitFor(() => {
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const fieldCall = calls.find(([url]) => url === "/api/language/field");
      expect(fieldCall).toBeDefined();
      const body = JSON.parse(fieldCall![1].body);
      expect(body.label).toBe("selectLanguage");
      expect(body.tenant_code).toBe("acme");
    });
  });
});

describe("LanguageSelector site translation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearLabelCache();
    vi.mocked(useGlobalState).mockReturnValue(defaultState);
    vi.mocked(useParams).mockReturnValue({ tenant: "acme" });
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as ReturnType<typeof useRouter>);
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("does not render siteTranslation paragraph when showSiteTranslation is false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ message: "Translated text" }) })
    );
    render(<LanguageSelector page="landing" version="1" />);

    await waitFor(() => {
      expect(screen.queryByText("Translated text")).toBeNull();
    });
  });

  it("fetches siteTranslation and renders it when showSiteTranslation is true", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string, opts: RequestInit) => {
        const body = JSON.parse(opts.body as string);
        if (url === "/api/language/field" && body.label === "siteTranslation") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: "This site has been automatically translated. Some wording may not be exact." }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      })
    );

    render(<LanguageSelector page="landing" version="1" showSiteTranslation />);

    await waitFor(() => {
      expect(
        screen.getByText("This site has been automatically translated. Some wording may not be exact.")
      ).toBeTruthy();
    });
  });

  it("does not render siteTranslation paragraph when message is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ message: "" }) })
    );

    render(<LanguageSelector page="landing" version="1" showSiteTranslation />);

    await waitFor(() => {
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const fieldCall = calls.find(([url]) => url === "/api/language/field");
      expect(fieldCall).toBeDefined();
    });

    const para = screen.queryByRole("paragraph");
    expect(para).toBeNull();
  });

  it("fires siteTranslation fetch with correct label and tenant_code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    );

    render(<LanguageSelector page="landing" version="1" showSiteTranslation />);

    await waitFor(() => {
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls;
      const siteCall = calls.find(([url, opts]) => {
        if (url !== "/api/language/field") return false;
        const body = JSON.parse(opts.body);
        return body.label === "siteTranslation";
      });
      expect(siteCall).toBeDefined();
      const body = JSON.parse(siteCall![1].body);
      expect(body.tenant_code).toBe("acme");
    });
  });
});
