"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import { isValidLocaleForTenant } from "@/app/lib/i18n/locales";

export default function LangGuard({ tenant, urlLang }: { tenant: string; urlLang: string }) {
  const { isHydrated } = useGlobalState();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;

    const storedLang = localStorage.getItem("lang");
    if (!storedLang) return;

    if (!isValidLocaleForTenant(storedLang, tenant)) {
      localStorage.removeItem("lang");
      router.replace(`/${tenant}`);
      return;
    }

    if (storedLang !== urlLang) {
      const prefix = `/${tenant}/${urlLang}`;
      const suffix = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : "";
      router.replace(`/${tenant}/${storedLang}${suffix}`);
    }
  }, [isHydrated, tenant, urlLang, router, pathname]);

  return null;
}
