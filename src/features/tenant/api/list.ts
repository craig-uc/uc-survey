import { NextResponse } from "next/server";
import { Tenant } from "../types";

interface UpstreamTenant {
  guid: string;
  name: string;
  code: string;
}

export async function fetchTenantList(): Promise<Tenant[]> {
  if (!process.env.TENANT_API) return [];

  try {
    const res = await fetch(`${process.env.TENANT_API}tenant_list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "application", application: process.env.APPLICATION }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Tenant list upstream rejected the request:", res.status);
      return [];
    }

    const data: UpstreamTenant[] = await res.json();
    return data.map((tenant) => ({ slug: tenant.code, name: tenant.name }));
  } catch (error) {
    console.error("Error fetching tenant list:", error);
    return [];
  }
}

export async function POST() {
  const tenants = await fetchTenantList();
  return NextResponse.json({ tenants });
}
