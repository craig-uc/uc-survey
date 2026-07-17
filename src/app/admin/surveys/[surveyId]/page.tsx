"use client";

import { useEffect, useState } from "react";
import GlassPanel from "@/components/GlassPanel";
import { BreadcrumbBar } from "@/components/layout/BreadcrumbBar";

interface SurveyEditorPageProps {
  params: Promise<{ surveyId: string }>;
}

export default function SurveyEditorPage({ params }: SurveyEditorPageProps) {
  const [surveyId, setSurveyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    params.then((resolved) => {
      if (!cancelled) setSurveyId(resolved.surveyId);
    });

    return () => {
      cancelled = true;
    };
  }, [params]);

  if (surveyId === null) {
    return null;
  }

  const breadcrumbs = [
    { label: "Home", href: "/admin/home" },
    { label: "Surveys", href: "/admin/surveys" },
    { label: surveyId, href: `/admin/surveys/${surveyId}`, active: true },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <BreadcrumbBar items={breadcrumbs} />
      <GlassPanel>
        <div className="flex flex-col items-center justify-center min-h-full gap-4 text-center">
          <h1 className="text-3xl font-bold">Survey editor coming soon</h1>
          <p>Editing survey {surveyId}.</p>
        </div>
      </GlassPanel>
    </div>
  );
}
