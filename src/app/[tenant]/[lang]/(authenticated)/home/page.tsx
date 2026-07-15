"use client";

import React from "react";
import { useTenant, TenantList } from "@/features/tenant";
import { SurveyListing } from "@/features/survey-management";

interface HomePageProps {
  params: { tenant: string; lang: string };
}

export default function RootPage({ params }: HomePageProps) {
  const { tenantCode } = useTenant();

  if (tenantCode === "urup") {
    return <TenantList lang={params.lang} />;
  }

  return <SurveyListing tenantCode={tenantCode} lang={params.lang} />;
}
