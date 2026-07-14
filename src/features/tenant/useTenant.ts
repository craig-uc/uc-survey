"use client";

import { useTenantContext } from "./TenantContext";

export function useTenant() {
  return useTenantContext();
}
