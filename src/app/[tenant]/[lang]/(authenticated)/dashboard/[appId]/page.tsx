"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { BreadcrumbBar } from "@/components/layout/BreadcrumbBar";
import { useTenant } from "@/features/tenant";

export default function DashboardPage({ params }: { params: { appId: string } }) {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Application";
  const appId = params.appId;
  const application_id = searchParams.get("application_id");
  const { tenantCode } = useTenant();

  const breadcrumbs = [
    { label: "Home", href: "/home" },
    { label: name, href: `/dashboard/${appId}`, active: true },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <BreadcrumbBar items={breadcrumbs} />
      <div className="container mx-auto px-6 py-12 grow">
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
      </div>
    </div>
  );
}
