"use client";

import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface TenantState {
  tenant: string | null;
  tenantCode: string;
  setTenant: (tenant: string | null) => void;
}

const TenantContext = createContext<TenantState | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenantState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    const saved = localStorage.getItem("tenant");
    if (saved) setTenantState(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (tenant) {
      localStorage.setItem("tenant", tenant);
      setTheme(tenant);
    } else {
      localStorage.removeItem("tenant");
      setTheme("dark");
    }
  }, [tenant, hydrated, setTheme]);

  function setTenant(value: string | null) {
    setTenantState(value);
  }

  return (
    <TenantContext.Provider value={{ tenant, tenantCode: tenant ?? "urup", setTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenantContext must be used within a TenantProvider");
  return ctx;
}
