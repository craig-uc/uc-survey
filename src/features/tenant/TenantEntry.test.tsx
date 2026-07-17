import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import TenantEntry from "./TenantEntry";
import { useTenant } from "./useTenant";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSetTenant = vi.fn();
vi.mock("./useTenant", () => ({
  useTenant: vi.fn(),
}));

describe("TenantEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTenant).mockReturnValue({ tenant: null, tenantCode: "urup", setTenant: mockSetTenant });
  });

  afterEach(cleanup);

  it("renders the tenant name", () => {
    render(<TenantEntry tenant={{ slug: "dpw-eu", name: "DPW EU" }} />);
    expect(screen.getByText("DPW EU")).toBeTruthy();
  });

  it("sets the active tenant and navigates to the tenant-agnostic survey list on click", () => {
    render(<TenantEntry tenant={{ slug: "dpw-eu", name: "DPW EU" }} />);
    fireEvent.click(screen.getByRole("button"));

    expect(mockSetTenant).toHaveBeenCalledWith("dpw-eu");
    expect(mockPush).toHaveBeenCalledWith("/admin/surveys");
  });

  it("sets whichever tenant slug is passed in", () => {
    render(<TenantEntry tenant={{ slug: "nedbank", name: "Nedbank" }} />);
    fireEvent.click(screen.getByRole("button"));

    expect(mockSetTenant).toHaveBeenCalledWith("nedbank");
    expect(mockPush).toHaveBeenCalledWith("/admin/surveys");
  });
});
