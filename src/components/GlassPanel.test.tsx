import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GlassPanel from "./GlassPanel";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={typeof src === "string" ? src : "mock-image"} alt={alt} />
  ),
}));

vi.mock("@/app/context/GlobalStateContext", () => ({
  useGlobalState: () => ({ lang: "en", isHydrated: true }),
}));

vi.mock("@/features/tenant", () => ({
  useTenant: () => ({ tenant: "urup", tenantCode: "urup" }),
}));

vi.mock("./NavButton", () => ({
  default: ({
    type,
    label,
    onClick,
    loading,
  }: {
    type: string;
    label: string;
    onClick?: () => void;
    loading?: boolean;
  }) => (
    <button data-loading={loading ? "true" : "false"} onClick={onClick}>
      {label}
    </button>
  ),
}));

describe("GlassPanel", () => {
  it("renders children in the content area", () => {
    render(
      <GlassPanel>
        <p>Hello</p>
      </GlassPanel>
    );
    expect(screen.getByText("Hello")).not.toBeNull();
  });

  it("does not render the navigation footer when navigation is omitted", () => {
    render(
      <GlassPanel>
        <p>Hello</p>
      </GlassPanel>
    );
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("renders nav buttons from the navigation config", () => {
    render(
      <GlassPanel
        navigation={{ buttons: [{ type: "submit", label: "Login", href: "#" }] }}
      >
        <p>Hello</p>
      </GlassPanel>
    );
    expect(screen.getByRole("button", { name: "Login" })).not.toBeNull();
  });

  it("filters out buttons with show: false", () => {
    render(
      <GlassPanel
        navigation={{
          buttons: [{ type: "submit", label: "Login", href: "#", show: false }],
        }}
      >
        <p>Hello</p>
      </GlassPanel>
    );
    expect(screen.queryByRole("button", { name: "Login" })).toBeNull();
  });

  it("passes loading through to the rendered NavButton", () => {
    render(
      <GlassPanel
        navigation={{
          buttons: [{ type: "submit", label: "Login", href: "#", loading: true }],
        }}
      >
        <p>Hello</p>
      </GlassPanel>
    );
    expect(screen.getByRole("button", { name: "Login" }).dataset.loading).toBe("true");
  });

  it("defaults to the floating layout's sizing classes when layout is omitted", () => {
    const { container } = render(
      <GlassPanel>
        <p>Hello</p>
      </GlassPanel>
    );
    const shell = container.firstElementChild as HTMLElement;
    expect(shell.className).toContain("w-[95vw]");
    expect(shell.className).toContain("rounded-2xl");
  });

  it("fills the page and caps content at 80% width when layout is admin", () => {
    const { container } = render(
      <GlassPanel layout="admin">
        <p>Hello</p>
      </GlassPanel>
    );
    const shell = container.firstElementChild as HTMLElement;
    expect(shell.className).toContain("w-full");
    expect(shell.className).toContain("flex-1");
    expect(shell.className).not.toContain("w-[95vw]");

    const contentWrapper = screen.getByText("Hello").parentElement as HTMLElement;
    expect(contentWrapper.className).toContain("max-w-[80%]");
    expect(contentWrapper.className).toContain("mx-auto");
  });

  it("renders the admin layout without crashing when children is omitted", () => {
    const { container } = render(<GlassPanel layout="admin" />);
    const shell = container.firstElementChild as HTMLElement;
    expect(shell.className).toContain("w-full");
  });
});
