export type SurveyStatus = "pending" | "active" | "closed" | "deleted";
export type PendingSubState = "design" | "review" | "published";

export interface Survey {
  id: string;
  tenantCode: string;
  slug: string;
  name: string;
  status: SurveyStatus;
  pendingSubState?: PendingSubState;
  version: number;
  startAt: string | null;
  endAt: string | null;
}

export type SurveyPhase = "prestart" | "intro" | "closing";
