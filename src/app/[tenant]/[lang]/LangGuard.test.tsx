import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import LangGuard from "./LangGuard";

const mockReplace = vi.fn();
const mockPathname = vi.fn().mockReturnValue("/acme/en/auth");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname(),
}));

vi.mock("@/app/context/GlobalStateContext", () => ({
  useGlobalState: vi.fn(),
}));

vi.mock("@/app/lib/i18n/locales", () => ({
  isValidLocaleForTenant: vi.fn(),
}));

import { isValidLocaleForTenant } from "@/app/lib/i18n/locales";

const hydratedState = { isHydrated: true };
const pendingState = { isHydrated: false };

describe("LangGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/acme/en/auth");
    vi.mocked(useGlobalState).mockReturnValue(hydratedState as ReturnType<typeof useGlobalState>);
    vi.mocked(isValidLocaleForTenant).mockReturnValue(true);
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      removeItem: vi.fn(),
      setItem: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("does not redirect when there is no stored lang", async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    await act(async () => { render(<LangGuard tenant="acme" urlLang="en" />); });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not redirect when stored lang matches URL lang", async () => {
    vi.mocked(localStorage.getItem).mockReturnValue("en");
    await act(async () => { render(<LangGuard tenant="acme" urlLang="en" />); });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects preserving path when stored lang differs from URL lang", async () => {
    mockPathname.mockReturnValue("/acme/en/auth");
    vi.mocked(localStorage.getItem).mockReturnValue("af");
    await act(async () => { render(<LangGuard tenant="acme" urlLang="en" />); });
    expect(mockReplace).toHaveBeenCalledWith("/acme/af/auth");
  });

  it("preserves deeper path segments when redirecting", async () => {
    mockPathname.mockReturnValue("/acme/en/auth/loginSent");
    vi.mocked(localStorage.getItem).mockReturnValue("af");
    await act(async () => { render(<LangGuard tenant="acme" urlLang="en" />); });
    expect(mockReplace).toHaveBeenCalledWith("/acme/af/auth/loginSent");
  });

  it("redirects to /{tenant} and clears localStorage when stored lang is not valid for tenant", async () => {
    vi.mocked(localStorage.getItem).mockReturnValue("de");
    vi.mocked(isValidLocaleForTenant).mockReturnValue(false);
    await act(async () => { render(<LangGuard tenant="acme" urlLang="en" />); });
    expect(localStorage.removeItem).toHaveBeenCalledWith("lang");
    expect(mockReplace).toHaveBeenCalledWith("/acme");
  });

  it("does not run before hydration", async () => {
    vi.mocked(useGlobalState).mockReturnValue(pendingState as ReturnType<typeof useGlobalState>);
    vi.mocked(localStorage.getItem).mockReturnValue("af");
    await act(async () => { render(<LangGuard tenant="acme" urlLang="en" />); });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
