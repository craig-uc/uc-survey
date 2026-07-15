import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import { useTenant } from "@/features/tenant";
import { useApplySession } from "./useApplySession";
import type { AuthSessionData } from "./types";

vi.mock("@/app/context/GlobalStateContext", () => ({
  useGlobalState: vi.fn(),
}));
vi.mock("@/features/tenant", () => ({
  useTenant: vi.fn(),
}));

const mockSetUser = vi.fn();
const mockSetShowTag = vi.fn();
const mockSetShowFooter = vi.fn();
const mockSetShowMenu = vi.fn();
const mockSetShowPersonName = vi.fn();
const mockSetTenant = vi.fn();

const sessionData: AuthSessionData = {
  user: "jane@example.com",
  tenant_code: "acme",
  app_settings: {
    show_tag_line: true,
    show_footer: true,
    show_menu: false,
    show_person_name: true,
    show_user_name: true,
    first_name: "Jane",
    full_name: "Jane Smith",
    known_as: "Janey",
    last_name: "Smith",
    tag_line: "Data-driven decisions",
    application_title: "My Analytics App",
  },
};

function TestConsumer({ data }: { data: AuthSessionData }) {
  const applySession = useApplySession();
  return <button onClick={() => applySession(data)}>apply</button>;
}

describe("useApplySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(useGlobalState).mockReturnValue({
      user: null,
      setUser: mockSetUser,
      lang: "en",
      setLang: vi.fn(),
      showTag: false,
      setShowTag: mockSetShowTag,
      showFooter: false,
      setShowFooter: mockSetShowFooter,
      showMenu: false,
      setShowMenu: mockSetShowMenu,
      showPersonName: false,
      setShowPersonName: mockSetShowPersonName,
      isHydrated: true,
      logout: vi.fn(),
    });
    vi.mocked(useTenant).mockReturnValue({ tenant: null, tenantCode: "urup", setTenant: mockSetTenant });
  });

  it("applies user and tenant state, and the app_settings display flags, from session data", () => {
    render(<TestConsumer data={sessionData} />);
    fireEvent.click(screen.getByRole("button"));

    expect(mockSetUser).toHaveBeenCalledWith("jane@example.com");
    expect(mockSetTenant).toHaveBeenCalledWith("acme");
    expect(mockSetShowTag).toHaveBeenCalledWith(true);
    expect(mockSetShowFooter).toHaveBeenCalledWith(true);
    expect(mockSetShowMenu).toHaveBeenCalledWith(false);
    expect(mockSetShowPersonName).toHaveBeenCalledWith(true);
  });

  it("persists the same session data to localStorage", () => {
    render(<TestConsumer data={sessionData} />);
    fireEvent.click(screen.getByRole("button"));

    expect(localStorage.getItem("user")).toBe("jane@example.com");
    expect(localStorage.getItem("fn")).toBe("Jane Smith");
    expect(localStorage.getItem("title")).toBe("My Analytics App");
    expect(localStorage.getItem("lang")).toBe("en");
  });

  it("reflects display flags being off without throwing", () => {
    const offData: AuthSessionData = {
      ...sessionData,
      app_settings: { ...sessionData.app_settings, show_menu: true, show_footer: false },
    };

    render(<TestConsumer data={offData} />);
    expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();

    expect(mockSetShowMenu).toHaveBeenCalledWith(true);
    expect(mockSetShowFooter).toHaveBeenCalledWith(false);
  });
});
