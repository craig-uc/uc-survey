import { Tenant } from "./types";

export const MOCK_TENANTS: Tenant[] = [
  { slug: "dpw-apac", name: "DPW APAC", active: true },
  { slug: "dpw-eu", name: "DPW EU", active: true },
  { slug: "dpw-gbl", name: "DPW Global", active: true },
  { slug: "dpw-ssa", name: "DPW SSA", active: true },
  { slug: "nedbank", name: "Nedbank", active: true },
  { slug: "t3", name: "T3", active: false },
];

export function listActiveTenants(): Tenant[] {
  return MOCK_TENANTS.filter((tenant) => tenant.active);
}
