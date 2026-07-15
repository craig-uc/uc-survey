"use client";

import { useState } from "react";
import {
  findSurvey,
  getSurveyPhase,
  IntroStep,
  PreStartStep,
  ClosingStep,
  NotFoundStep,
  SurveyPhase,
} from "@/features/survey";

interface SurveyPageProps {
  params: { tenant: string; lang: string; survey: string };
}

export default function SurveyPage({ params }: SurveyPageProps) {
  const survey = findSurvey(params.tenant, params.survey);
  const [phase, setPhase] = useState<SurveyPhase | null>(() =>
    survey ? getSurveyPhase(survey, new Date()) : null
  );

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
