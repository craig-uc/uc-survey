import { Survey } from "@/features/survey";

export function canEdit(survey: Survey): boolean {
  return survey.status === "active" || survey.status === "pending";
}

export function canDelete(survey: Survey): boolean {
  return survey.status === "pending" && survey.pendingSubState !== "published";
}
