"use client";

import { useEffect } from "react";
import { useTenant } from "@/features/tenant";

export default function TenantInitializer({ tenant }: { tenant: string }) {
  const { setTenant } = useTenant();

  useEffect(() => {
    setTenant(tenant);
    return () => setTenant(null);
  }, [tenant, setTenant]);

  return null;
}
