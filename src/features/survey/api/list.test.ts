// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

process.env.SURVEY_API = "https://test-survey.example.com/";

const upstreamResponse = [
  {
    id: "s1",
    tenant_code: "dpw-eu",
    name: "Engagement Survey",
    slug: "engagement",
    status: "active",
    pending_sub_state: "",
    version: 1,
    start_date: null,
    end_date: null,
  },
  {
    id: "s2",
    tenant_code: "dpw-eu",
    name: "Onboarding Survey",
    slug: "onboarding",
    status: "pending",
    pending_sub_state: "design",
    version: 2,
    start_date: "2026-01-01T00:00:00.000Z",
    end_date: null,
  },
];

describe("fetchSurveyList", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps upstream surveys to the frontend Survey shape, omitting pendingSubState when blank", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(upstreamResponse) })
    );

    const { fetchSurveyList } = await import("./list");
    const surveys = await fetchSurveyList("dpw-eu");

    expect(surveys).toEqual([
      {
        id: "s1",
        tenantCode: "dpw-eu",
        name: "Engagement Survey",
        slug: "engagement",
        status: "active",
        version: 1,
        startAt: null,
        endAt: null,
      },
      {
        id: "s2",
        tenantCode: "dpw-eu",
        name: "Onboarding Survey",
        slug: "onboarding",
        status: "pending",
        pendingSubState: "design",
        version: 2,
        startAt: "2026-01-01T00:00:00.000Z",
        endAt: null,
      },
    ]);
  });

  it("calls SURVEY_API/surveys with the tenantCode query param", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal("fetch", fetchSpy);

    const { fetchSurveyList } = await import("./list");
    await fetchSurveyList("dpw-eu");

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://test-survey.example.com/surveys?tenantCode=dpw-eu");
  });

  it("returns an empty array when the upstream response is empty", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }));

    const { fetchSurveyList } = await import("./list");
    expect(await fetchSurveyList("dpw-eu")).toEqual([]);
  });

  it("returns an empty array and logs when the upstream response is not ok", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) })
    );

    const { fetchSurveyList } = await import("./list");
    expect(await fetchSurveyList("dpw-eu")).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("returns an empty array and logs when fetch throws", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    const { fetchSurveyList } = await import("./list");
    expect(await fetchSurveyList("dpw-eu")).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("returns an empty array when SURVEY_API is not configured", async () => {
    vi.stubEnv("SURVEY_API", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { fetchSurveyList } = await import("./list");
    expect(await fetchSurveyList("dpw-eu")).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();

    vi.stubEnv("SURVEY_API", "https://test-survey.example.com/");
  });

  it("sends the token as a Bearer Authorization header when provided", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal("fetch", fetchSpy);

    const { fetchSurveyList } = await import("./list");
    await fetchSurveyList("dpw-eu", "test-jwt-token");

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.headers).toEqual({ Authorization: "Bearer test-jwt-token" });
  });

  it("omits the Authorization header when no token is provided", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal("fetch", fetchSpy);

    const { fetchSurveyList } = await import("./list");
    await fetchSurveyList("dpw-eu");

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.headers).toBeUndefined();
  });
});

describe("GET /api/survey/list", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the fetched surveys wrapped in { surveys }", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(upstreamResponse) })
    );

    const { GET } = await import("./list");
    const res = await GET(new NextRequest("http://localhost/api/survey/list?tenantCode=dpw-eu"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.surveys).toHaveLength(2);
    expect(data.surveys[0].tenantCode).toBe("dpw-eu");
  });

  it("passes an empty tenantCode through when the query param is missing", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal("fetch", fetchSpy);

    const { GET } = await import("./list");
    await GET(new NextRequest("http://localhost/api/survey/list"));

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://test-survey.example.com/surveys?tenantCode=");
  });

  it("forwards the auth_token cookie as a Bearer Authorization header to the upstream", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal("fetch", fetchSpy);

    const { GET } = await import("./list");
    await GET(
      new NextRequest("http://localhost/api/survey/list?tenantCode=dpw-eu", {
        headers: { cookie: "auth_token=test-jwt-token" },
      })
    );

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.headers).toEqual({ Authorization: "Bearer test-jwt-token" });
  });

  it("omits the Authorization header when there is no auth_token cookie", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal("fetch", fetchSpy);

    const { GET } = await import("./list");
    await GET(new NextRequest("http://localhost/api/survey/list?tenantCode=dpw-eu"));

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.headers).toBeUndefined();
  });
});
