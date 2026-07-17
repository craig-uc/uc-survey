"use client";

import { useEffect, useState } from "react";
import GlassPanel from "@/components/GlassPanel";
import TenantEntry from "./TenantEntry";
import { Tenant } from "./types";

export default function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/tenant/list", { method: "POST" })
      .then((res) => (res.ok ? res.json() : { tenants: [] }))
      .then((data) => {
        if (!cancelled) setTenants(data.tenants ?? []);
      })
      .catch(() => {
        if (!cancelled) setTenants([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GlassPanel>
      <h2 className="text-2xl font-bold text-light mb-6 text-center">Select a tenant</h2>
      {tenants.length === 0 ? (
        <div className="text-center text-light/50 py-20 bg-dark/20 rounded-xl border border-light/5">
          No active tenants.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {tenants.map((tenant) => (
            <TenantEntry key={tenant.slug} tenant={tenant} />
          ))}
        </div>
      )}
    </GlassPanel>
  );
}
