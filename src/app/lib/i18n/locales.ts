export const DEFAULT_LOCALE = 'en'

export const TENANT_LOCALES: Record<string, string[]> = {
  urup: ["en", "af", "st", "tn", "xh", "zu"],
  "dpw-eu": ["en", "tr"],
  "dpw-gbl": ["fr", "de", "es", "it", "pt", "nl", "tr", "ro", "el", "sr", "uk", "pl", "hu", "sk", "sv", "en", "zh",
    "vi", "th", "id", "so", "ur", "hi", "mr", "te", "ta", "ml", "kn", "gu", "ar", "ko"
  ],
}

export const LOCALES = Array.from(new Set(Object.values(TENANT_LOCALES).flat()))

export type Locale = string

export const SUPPORTED_LOCALES = new Set<string>(LOCALES)

export const isValidLocale = (lang: string): lang is Locale =>
  SUPPORTED_LOCALES.has(lang)

export const getTenantLocales = (tenant: string): string[] => {
  return TENANT_LOCALES[tenant] || [DEFAULT_LOCALE]
}

export const isValidLocaleForTenant = (lang: string, tenant: string): boolean => {
  const locales = getTenantLocales(tenant)
  return locales.includes(lang)
}

