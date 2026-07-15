import { Survey } from "@/features/survey";

export function createNewVersion(survey: Survey): Survey {
  const version = survey.version + 1;
  return {
    ...survey,
    id: `${survey.tenantCode}-${survey.slug}-v${version}`,
    version,
    status: "pending",
    pendingSubState: "design",
    startAt: null,
    endAt: null,
  };
}
