"use client";

import { useTenant } from "@/features/tenant";
import { SurveyListing } from "@/features/survey-management";

export default function SurveysPage() {
  const { tenantCode } = useTenant();

  return <SurveyListing tenantCode={tenantCode} />;
}
