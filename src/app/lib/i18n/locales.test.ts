import {describe, it, expect} from "vitest";
import {
  isValidLocale,
  DEFAULT_LOCALE,
  LOCALES,
  getTenantLocales,
  isValidLocaleForTenant
} from "./locales";

describe("isValidLocale", () => {
  it.each(LOCALES)("returns true for supported locale '%s'", (locale) => {
    expect(isValidLocale(locale)).toBe(true);
  });

  it("returns false for an unsupported locale", () => {
    expect(isValidLocale("xx")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isValidLocale("")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isValidLocale("EN")).toBe(false);
  });
});

describe("getTenantLocales", () => {
  it("returns correct locales for urup", () => {
    expect(getTenantLocales("urup")).toEqual(["en", "af", "st", "tn", "xh", "zu"]);
  });

  it("returns correct locales for dpw-gbl", () => {
    expect(getTenantLocales("dpw-gbl")).toEqual(["fr", "de", "es", "it", "pt", "nl", "tr", "ro", "el", "sr", "uk", "pl", "hu", "sk", "sv", "en", "zh", "vi", "th", "id", "so", "ur", "hi", "mr", "te", "ta", "ml", "kn", "gu", "ar", "ko",]);
  });

  it("returns default locale for unknown tenant", () => {
    expect(getTenantLocales("unknown")).toEqual([DEFAULT_LOCALE]);
  });
});

describe("isValidLocaleForTenant", () => {
  it("validates locale for specific tenant", () => {
    expect(isValidLocaleForTenant("en", "urup")).toBe(true);
    expect(isValidLocaleForTenant("af", "urup")).toBe(true);
    expect(isValidLocaleForTenant("fr", "urup")).toBe(false);

    expect(isValidLocaleForTenant("en", "dpw-gbl")).toBe(true);
    expect(isValidLocaleForTenant("fr", "dpw-gbl")).toBe(true);
    expect(isValidLocaleForTenant("af", "dpw-gbl")).toBe(false);
  });
});

describe("DEFAULT_LOCALE", () => {
  it("equals 'en'", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("is itself a valid locale", () => {
    expect(isValidLocale(DEFAULT_LOCALE)).toBe(true);
  });
});

