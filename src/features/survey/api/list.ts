import { NextRequest, NextResponse } from "next/server";
import { Survey, SurveyStatus, PendingSubState } from "../types";

interface UpstreamSurvey {
  id: string;
  tenant_code: string;
  name: string;
  slug: string;
  status: string;
  pending_sub_state: string;
  version: number;
  start_date: string | null;
  end_date: string | null;
}

function mapSurvey(survey: UpstreamSurvey): Survey {
  return {
    id: survey.id,
    tenantCode: survey.tenant_code,
    name: survey.name,
    slug: survey.slug,
    status: survey.status as SurveyStatus,
    ...(survey.pending_sub_state ? { pendingSubState: survey.pending_sub_state as PendingSubState } : {}),
    version: survey.version,
    startAt: survey.start_date,
    endAt: survey.end_date,
  };
}

export async function fetchSurveyList(tenantCode: string, token?: string): Promise<Survey[]> {
  if (!process.env.SURVEY_API) return [];

  try {
    const res = await fetch(`${process.env.SURVEY_API}surveys?tenantCode=${encodeURIComponent(tenantCode)}`, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!res.ok) {
      console.error("Survey list upstream rejected the request:", res.status);
      return [];
    }

    const data: UpstreamSurvey[] = await res.json();
    return data.map(mapSurvey);
  } catch (error) {
    console.error("Error fetching survey list:", error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const tenantCode = request.nextUrl.searchParams.get("tenantCode") ?? "";
  const token = request.cookies.get("auth_token")?.value;
  const surveys = await fetchSurveyList(tenantCode, token);
  return NextResponse.json({ surveys });
}
