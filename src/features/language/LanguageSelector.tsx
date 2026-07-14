"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTenantLocales, isValidLocale } from "@/app/lib/i18n/locales";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import type { EnLabels } from "./LanguagePage";

interface Props {
  page: string;
  version: string;
  destination?: string;
  showSiteTranslation?: boolean;
  enLabels?: EnLabels;
}

const labelCache = new Map<string, string>();

export function clearLabelCache() {
  labelCache.clear();
}

async function fetchLabel(tenant: string, lang: string | null, label: string): Promise<string | null> {
  const key = `${tenant}:${lang ?? "en"}:${label}`;
  if (labelCache.has(key)) return labelCache.get(key)!;
  try {
    const res = await fetch("/api/language/field", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_code: tenant, language: lang, label }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.message) labelCache.set(key, data.message);
    return data?.message ?? null;
  } catch {
    return null;
  }
}

export default function LanguageSelector({ page, version, destination, showSiteTranslation = false, enLabels }: Props) {
  const { tenant } = useParams<{ tenant: string }>();
  const router = useRouter();
  const { lang: savedLang, user, isHydrated } = useGlobalState();
  const [title, setTitle] = useState(enLabels?.selectLanguage ?? "Select your language");
  const [siteTranslation, setSiteTranslation] = useState(enLabels?.siteTranslation ?? "");

  const locales = useMemo(() => getTenantLocales(tenant), [tenant]);

  const detected = useMemo(() => {
    if (!isHydrated) return null;
    const explicit = localStorage.getItem("lang");
    if (explicit && isValidLocale(explicit)) return explicit;
    const browserLang = navigator.language.split("-")[0];
    if (isValidLocale(browserLang)) return browserLang;
    return null;
  }, [isHydrated]);

  useEffect(() => {
    if (!enLabels || !tenant) return;
    labelCache.set(`${tenant}:en:selectLanguage`, enLabels.selectLanguage);
    labelCache.set(`${tenant}:en:siteTranslation`, enLabels.siteTranslation);
  }, [tenant, enLabels]);

  useEffect(() => {
    if (!tenant || !isHydrated) return;
    const effectiveLang = savedLang ?? detected ?? "en";
    if (effectiveLang === "en" && enLabels) return;
    fetchLabel(tenant, effectiveLang, "selectLanguage")
      .then((msg) => { if (msg) setTitle(msg); })
      .catch(() => {});
  }, [tenant, isHydrated, savedLang, detected, enLabels]);

  useEffect(() => {
    if (!showSiteTranslation || !tenant || !isHydrated) return;
    const effectiveLang = savedLang ?? detected ?? "en";
    if (effectiveLang === "en" && enLabels) return;
    fetchLabel(tenant, effectiveLang, "siteTranslation")
      .then((msg) => { if (msg) setSiteTranslation(msg); })
      .catch(() => {});
  }, [showSiteTranslation, tenant, isHydrated, savedLang, detected, enLabels]);

  function nativeName(locale: string): string {
    try {
      return new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? locale;
    } catch {
      return locale;
    }
  }

  function handleSelect(locale: string) {
    localStorage.setItem("lang", locale);
    if (user) {
      fetch("/api/track/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_code: tenant,
          page,
          identifier: user,
          pageVersion: version,
          language: locale,
        }),
      }).catch(() => {});
    }
    router.push(destination ? `/${tenant}/${locale}/${destination}` : `/${tenant}/${locale}`);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-light/70 text-3xl font-bold" id="languageTitle">{title}</span>
      <div className="flex flex-wrap justify-center gap-3">
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => handleSelect(locale)}
            className={`px-6 py-2 rounded-full font-medium transition-colors cursor-pointer text-light ${
              locale === detected
                ? "bg-light/50 ring-2 ring-light"
                : "bg-light/20 hover:bg-light/40"
            }`}
          >
            {nativeName(locale)}
          </button>
        ))}
      </div>
      {showSiteTranslation && siteTranslation && (
        <p className="text-light/60 text-sm text-center mt-2">{siteTranslation}</p>
      )}
    </div>
  );
}
