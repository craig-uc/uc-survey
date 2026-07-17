"use client";

import { useTenant } from "@/features/tenant";
import { SurveyListing } from "@/features/survey-management";
import { BreadcrumbBar } from "@/components/layout/BreadcrumbBar";

export default function SurveysPage() {
  const { tenantCode } = useTenant();

  const breadcrumbs = [
    { label: "Home", href: "/admin/home" },
    { label: "Surveys", href: "/admin/surveys", active: true },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <BreadcrumbBar items={breadcrumbs} />
      <SurveyListing tenantCode={tenantCode} />
    </div>
  );
}
