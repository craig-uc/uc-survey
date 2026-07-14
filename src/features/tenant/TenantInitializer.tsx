"use client";

import { useEffect } from "react";
import { useTenant } from "./useTenant";

export default function TenantInitializer({ tenant }: { tenant: string }) {
  const { setTenant } = useTenant();

  useEffect(() => {
    setTenant(tenant);
  }, [tenant, setTenant]);

  return null;
}
