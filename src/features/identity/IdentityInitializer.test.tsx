import { describe, it, expect, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import React from "react";
import IdentityInitializer from "./IdentityInitializer";

describe("IdentityInitializer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders nothing", async () => {
    const { container } = render(<IdentityInitializer />);
    await act(async () => {});
    expect(container.firstChild).toBeNull();
  });

  it("sets an anonymous identifier when none exists and no user is stored", async () => {
    render(<IdentityInitializer />);
    await act(async () => {});
    const id = localStorage.getItem("identifier");
    expect(id).not.toBeNull();
    expect(id!.startsWith("anon_")).toBe(true);
  });

  it("uses the stored user value as the identifier when present", async () => {
    localStorage.setItem("user", "jane@example.com");
    render(<IdentityInitializer />);
    await act(async () => {});
    expect(localStorage.getItem("identifier")).toBe("jane@example.com");
  });

  it("does not overwrite an existing identifier", async () => {
    localStorage.setItem("identifier", "existing-id");
    render(<IdentityInitializer />);
    await act(async () => {});
    expect(localStorage.getItem("identifier")).toBe("existing-id");
  });
});
