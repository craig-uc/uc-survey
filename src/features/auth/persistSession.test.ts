import { describe, it, expect, beforeEach } from "vitest";
import { persistSessionToStorage } from "./persistSession";
import type { AuthSessionData } from "./types";

function makeData(overrides: Partial<AuthSessionData["app_settings"]> = {}): AuthSessionData {
  return {
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
      ...overrides,
    },
  };
}

describe("persistSessionToStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("writes user identity and display settings to their expected localStorage keys", () => {
    persistSessionToStorage(makeData());

    expect(localStorage.getItem("user")).toBe("jane@example.com");
    expect(localStorage.getItem("f")).toBe("Jane");
    expect(localStorage.getItem("l")).toBe("Smith");
    expect(localStorage.getItem("fn")).toBe("Jane Smith");
    expect(localStorage.getItem("k")).toBe("Janey");
    expect(localStorage.getItem("tagLine")).toBe("1");
    expect(localStorage.getItem("tag")).toBe("Data-driven decisions");
    expect(localStorage.getItem("footer")).toBe("1");
    expect(localStorage.getItem("menu")).toBe("0");
    expect(localStorage.getItem("personName")).toBe("1");
    expect(localStorage.getItem("title")).toBe("My Analytics App");
  });

  it("writes '0' flags when the corresponding display setting is false", () => {
    persistSessionToStorage(
      makeData({ show_tag_line: false, show_footer: false, show_menu: true, show_person_name: false })
    );

    expect(localStorage.getItem("tagLine")).toBe("0");
    expect(localStorage.getItem("footer")).toBe("0");
    expect(localStorage.getItem("menu")).toBe("1");
    expect(localStorage.getItem("personName")).toBe("0");
  });

  it("writes empty strings as-is without throwing when text fields are blank", () => {
    expect(() =>
      persistSessionToStorage(
        makeData({ first_name: "", last_name: "", full_name: "", known_as: "", tag_line: "", application_title: "" })
      )
    ).not.toThrow();

    expect(localStorage.getItem("f")).toBe("");
    expect(localStorage.getItem("title")).toBe("");
  });

  // AuthSessionData carries no language field yet, so this is a temporary fix to stop
  // LangGuard bouncing a freshly-authenticated user to language selection when a stale
  // "lang" value from a previous tenant/session is invalid for the tenant they just signed into.
  it("sets lang to en so LangGuard doesn't redirect the freshly-authenticated user to language selection", () => {
    persistSessionToStorage(makeData());

    expect(localStorage.getItem("lang")).toBe("en");
  });

  it("overwrites a stale/invalid pre-existing lang value with en", () => {
    localStorage.setItem("lang", "af");

    persistSessionToStorage(makeData());

    expect(localStorage.getItem("lang")).toBe("en");
  });
});
