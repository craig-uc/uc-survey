import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIdentity } from "./useIdentity";

describe("useIdentity", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null identifier and isAnonymous=true when nothing is stored", async () => {
    const { result } = renderHook(() => useIdentity());
    await act(async () => {});
    expect(result.current.identifier).toBeNull();
    expect(result.current.isAnonymous).toBe(true);
  });

  it("returns the identifier and isAnonymous=true for an anon_ prefixed value", async () => {
    localStorage.setItem("identifier", "anon_550e8400");
    const { result } = renderHook(() => useIdentity());
    await act(async () => {});
    expect(result.current.identifier).toBe("anon_550e8400");
    expect(result.current.isAnonymous).toBe(true);
  });

  it("returns the identifier and isAnonymous=false for an authenticated user", async () => {
    localStorage.setItem("identifier", "jane@example.com");
    const { result } = renderHook(() => useIdentity());
    await act(async () => {});
    expect(result.current.identifier).toBe("jane@example.com");
    expect(result.current.isAnonymous).toBe(false);
  });
});
