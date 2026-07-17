"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BreadcrumbBar } from "@/components/layout/BreadcrumbBar";
import { useTenant } from "@/features/tenant";
import GlassPanel from "@/components/GlassPanel";

export default function DashboardPage({ params }: { params: Promise<{ appId: string }> }) {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Application";
  const [appId, setAppId] = useState<string | null>(null);
  const application_id = searchParams.get("application_id");
  const { tenantCode } = useTenant();

  useEffect(() => {
    let cancelled = false;

    params.then((resolved) => {
      if (!cancelled) setAppId(resolved.appId);
    });

    return () => {
      cancelled = true;
    };
  }, [params]);

  const breadcrumbs = [
    { label: "Home", href: "/admin/home" },
    { label: name, href: `/admin/dashboard/${appId}`, active: true },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <BreadcrumbBar items={breadcrumbs} />
      <GlassPanel layout="admin">
        <h1 className="text-4xl font-bold text-light mb-6 font-custom tracking-tight text-center">
          {name}
        </h1>
        <div className="bg-dark/40 backdrop-blur-sm border border-light/10 rounded-2xl p-8 text-center mb-8">
          <p className="text-light/70 text-lg">
            Welcome to the dashboard for <strong>{name}</strong>.
          </p>
          <div className="mt-8 text-xs text-light/30">
            <p>App ID: {appId}</p>
            {application_id && <p>Application ID: {application_id}</p>}
          </div>
        </div>

        {application_id && (
          <div className="mt-8">
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
