import { Survey, SurveyPhase } from "./types";

export function getSurveyPhase(survey: Survey, now: Date): SurveyPhase {
  if (survey.status === "closed") return "closing";
  if (survey.status === "pending") return "prestart";
  if (survey.endAt && now > new Date(survey.endAt)) return "closing";
  if (survey.startAt && now < new Date(survey.startAt)) return "prestart";
  return "intro";
}
