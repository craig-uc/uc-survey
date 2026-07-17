"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import { useTenant } from "@/features/tenant";
import type { LogoutButtonProps } from "./types";

const BUTTON_BASE = "px-4 py-2 rounded-md font-medium transition-colors text-sm uppercase tracking-widest cursor-pointer";
const BUTTON_DEFAULT = "bg-secondary text-on-secondary hover:bg-on-secondary hover:text-secondary";
const LINK_DEFAULT = "text-secondary no-underline hover:text-primary transition-colors cursor-pointer";

export function LogoutButton({ variant = "button", label = "logout", style, className }: LogoutButtonProps) {
  const { logout, lang, isHydrated } = useGlobalState();
  const { tenant, setTenant } = useTenant();
  const router = useRouter();
  const [apiLabel, setApiLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    fetch("/api/logout/label", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: (label || "logout").toLowerCase().trim(),
        tenant_code: tenant ?? "",
        language: lang ?? "en",
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { message: string } | null) => {
        if (data?.message) setApiLabel(data.message);
      })
      .catch(() => {});
  }, [isHydrated, tenant, lang, label]);

  const displayLabel = apiLabel ?? label;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // always proceed with logout
    }

    logout();
    setTenant(null);
    localStorage.setItem("identifier", `anon_${crypto.randomUUID()}`);

    router.push("/");
  };

  if (variant === "link") {
    const cls = [style ?? LINK_DEFAULT, className].filter(Boolean).join(" ");
    return (
      <button type="button" onClick={handleLogout} className={cls}>
        {displayLabel}
      </button>
    );
  }

  if (variant === "menu") {
    return (
      <button type="button" onClick={handleLogout} className={className}>
        {displayLabel}
      </button>
    );
  }

  const cls = [BUTTON_BASE, style ?? BUTTON_DEFAULT, className].filter(Boolean).join(" ");
  return (
    <button type="button" onClick={handleLogout} className={cls}>
      {displayLabel}
    </button>
  );
}
