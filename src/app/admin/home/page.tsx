"use client";

import { TenantList } from "@/features/tenant";
import { BreadcrumbBar } from "@/components/layout/BreadcrumbBar";
import GlassPanel from "@/components/GlassPanel";

export default function AdminHomePage() {
  const breadcrumbs = [{ label: "Home", href: "/admin/home", active: true }];

  return (
    <div className="flex flex-col min-h-full">
      <BreadcrumbBar items={breadcrumbs} />
      <GlassPanel layout="admin">
        <TenantList />
      </GlassPanel>
    </div>
  );
}
