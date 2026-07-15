import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import TenantEntry from "./TenantEntry";

describe("TenantEntry", () => {
  afterEach(cleanup);

  it("renders the tenant name", () => {
    render(<TenantEntry tenant={{ slug: "dpw-eu", name: "DPW EU", active: true }} lang="en" />);
    expect(screen.getByText("DPW EU")).toBeTruthy();
  });

  it("links to the tenant's own home page in the current language", () => {
    render(<TenantEntry tenant={{ slug: "dpw-eu", name: "DPW EU", active: true }} lang="en" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/dpw-eu/en/home");
  });

  it("links using the language passed in, not a hardcoded default", () => {
    render(<TenantEntry tenant={{ slug: "nedbank", name: "Nedbank", active: true }} lang="fr" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/nedbank/fr/home");
  });
});
