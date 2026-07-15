import { Survey } from "@/features/survey";

let counter = 0;

export function createSurvey(tenantCode: string): Survey {
  counter += 1;
  return {
    id: `${tenantCode}-untitled-${counter}`,
    tenantCode,
    slug: `untitled-${counter}`,
    name: "Untitled survey",
    status: "pending",
    pendingSubState: "design",
    version: 1,
    startAt: null,
    endAt: null,
  };
}
