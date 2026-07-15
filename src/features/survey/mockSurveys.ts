import { Survey } from "./types";

export const MOCK_SURVEYS: Survey[] = [
  {
    id: "urup-engagement-2026-v1",
    tenantCode: "urup",
    slug: "engagement-2026",
    name: "Engagement Survey 2026",
    status: "active",
    version: 1,
    startAt: null,
    endAt: null,
  },
  {
    id: "urup-engagement-2026-v2",
    tenantCode: "urup",
    slug: "engagement-2026",
    name: "Engagement Survey 2026",
    status: "pending",
    pendingSubState: "design",
    version: 2,
    startAt: null,
    endAt: null,
  },
  {
    id: "dpw-eu-engagement-2026-v1",
    tenantCode: "dpw-eu",
    slug: "engagement-2026",
    name: "Engagement Survey 2026",
    status: "pending",
    pendingSubState: "design",
    version: 1,
    startAt: null,
    endAt: null,
  },
  {
    id: "urup-future-launch-v1",
    tenantCode: "urup",
    slug: "future-launch",
    name: "Future Launch",
    status: "active",
    version: 1,
    startAt: "2099-01-01T00:00:00.000Z",
    endAt: null,
  },
  {
    id: "urup-closed-survey-v1",
    tenantCode: "urup",
    slug: "closed-survey",
    name: "Closed Survey",
    status: "closed",
    version: 1,
    startAt: null,
    endAt: "2020-01-01T00:00:00.000Z",
  },
  {
    id: "urup-removed-survey-v1",
    tenantCode: "urup",
    slug: "removed-survey",
    name: "Removed Survey",
    status: "deleted",
    version: 1,
    startAt: null,
    endAt: null,
  },
];

export function findSurvey(tenantCode: string, slug: string): Survey | undefined {
  const candidates = MOCK_SURVEYS.filter(
    (survey) => survey.tenantCode === tenantCode && survey.slug === slug && survey.status !== "deleted"
  );
  if (candidates.length === 0) return undefined;

  const live = candidates.find((survey) => survey.status === "active" || survey.status === "closed");
  return live ?? candidates.sort((a, b) => b.version - a.version)[0];
}

export function listSurveysByTenant(tenantCode: string): Survey[] {
  return MOCK_SURVEYS.filter((survey) => survey.tenantCode === tenantCode);
}
