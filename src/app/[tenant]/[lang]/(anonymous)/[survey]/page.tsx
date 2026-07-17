"use client";

import { useEffect, useState } from "react";
import {
  findSurvey,
  getSurveyPhase,
  IntroStep,
  PreStartStep,
  ClosingStep,
  NotFoundStep,
  Survey,
  SurveyPhase,
} from "@/features/survey";

interface SurveyPageProps {
  params: Promise<{ tenant: string; lang: string; survey: string }>;
}

export default function SurveyPage({ params }: SurveyPageProps) {
  const [resolved, setResolved] = useState(false);
  const [survey, setSurvey] = useState<Survey | undefined>(undefined);
  const [phase, setPhase] = useState<SurveyPhase | null>(null);

  useEffect(() => {
    let cancelled = false;

    params.then(({ tenant, survey: slug }) => {
      if (cancelled) return;
      const found = findSurvey(tenant, slug);
      setSurvey(found);
      setPhase(found ? getSurveyPhase(found, new Date()) : null);
      setResolved(true);
    });

    return () => {
      cancelled = true;
    };
  }, [params]);

  if (!resolved) {
    return null;
  }

  if (!survey || phase === null) {
    return <NotFoundStep />;
  }

  if (phase === "prestart") {
    return <PreStartStep startAt={survey.startAt} onExpire={() => setPhase("intro")} />;
  }

  if (phase === "closing") {
    return <ClosingStep />;
  }

  return <IntroStep />;
}
