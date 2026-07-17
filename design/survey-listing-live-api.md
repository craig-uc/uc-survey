# Survey Listing — Live API Wiring

## Status
Accepted

## Context
`design/survey-listing.md` shipped the per-tenant survey listing UI (`SurveyListing`) against an in-memory mock (`listSurveysByTenant` in `src/features/survey/mockSurveys.ts`), since no real survey API existed yet at the time. `SURVEY_API` is already defined in `.env.local` (`https://p1-urup-api.urup.com/survey-qa/`) but has never been referenced in code. This doc wires the initial survey list fetch to that real upstream, following the exact pattern already established for `TENANT_API` in `src/features/tenant/api/list.ts`.

Scope is deliberately narrow: only the initial list fetch moves to the live API. Add/Edit/Delete continue to mutate local component state only (as today) — persisting those actions requires create/update/delete API contracts that don't exist yet and are explicitly out of scope for this change.

**Authentication (added after initial implementation):** `SURVEY_API` requires the caller's session JWT — the same `auth_token` HttpOnly cookie minted by `src/features/auth/api/signin.ts` at sign-in (payload: `user`, `tenant_code`, `settings`). Since it's `HttpOnly`, only the server can read it; the `/api/survey/list` route handler reads it from the incoming request's cookies and forwards it to `SURVEY_API` as `Authorization: Bearer <token>`. No new token is minted and no claims are added to it — `tenantCode` continues to be passed exactly as before, as the `?tenantCode=` query param, independent of whatever tenant the JWT itself was issued for.

## Decision
Add a server-only fetch module `src/features/survey/api/list.ts` exposing `fetchSurveyList(tenantCode): Promise<Survey[]>`, which calls `GET {SURVEY_API}surveys?tenantCode={tenantCode}` and maps the upstream response — a bare array of DB-column-shaped records per `design/survey-data-model.md` (snake_case) — onto the existing frontend `Survey` type. Expose it to the client via a thin proxy route `src/app/api/survey/list/route.ts` (mirroring `src/app/api/tenant/list/route.ts`), since `SurveyListing` is a client component and `SURVEY_API` is a private env var that must stay server-side.

`SurveyListing.tsx` switches from a synchronous mock read (`useState(() => listSurveysByTenant(tenantCode))`) to an async fetch-on-mount (`useEffect`), matching `TenantList.tsx`'s existing fetch pattern exactly: a failed fetch or a non-OK response both resolve to an empty list — no distinct error UI, same fallback behavior already used for the tenant list.

`listSurveysByTenant` (mock) is removed — it has no remaining callers once `SurveyListing` reads from the live API. `findSurvey`/`MOCK_SURVEYS` are untouched (they still power the anonymous respondent-facing route, `design/survey-routing.md`).

## Design

### Upstream response shape
Bare JSON array, DB columns per `design/survey-data-model.md`:
```json
[{
  "id": "...", "tenant_code": "...", "name": "...", "slug": "...",
  "status": "active", "pending_sub_state": "", "version": 1,
  "start_date": null, "end_date": null
}]
```
`pending_sub_state` maps to `pendingSubState` only when non-empty, mirroring the data-model doc's note that an absent sub-state is represented as `''` at the DB/API layer but as `undefined` on the frontend type.

### `src/features/survey/api/list.ts`
```ts
interface UpstreamSurvey {
  id: string; tenant_code: string; name: string; slug: string;
  status: string; pending_sub_state: string; version: number;
  start_date: string | null; end_date: string | null;
}

export async function fetchSurveyList(tenantCode: string, token?: string): Promise<Survey[]> {
  if (!process.env.SURVEY_API) return [];
  try {
    const res = await fetch(
      `${process.env.SURVEY_API}surveys?tenantCode=${encodeURIComponent(tenantCode)}`,
      { cache: "no-store", headers: token ? { Authorization: `Bearer ${token}` } : undefined }
    );
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
```
No token present (e.g. logged-out access) → no `Authorization` header is sent at all, and `SURVEY_API` is left to reject the request however it already handles unauthenticated calls; the existing non-OK/thrown-fetch fallback (empty array) covers that case without any new branching.

### `src/app/api/survey/list/route.ts`
```ts
export { GET } from "@/features/survey/api/list";
```

### `SurveyListing.tsx`
Replaces the mock `useState` initializer with a `useEffect` fetch to `/api/survey/list?tenantCode={tenantCode}`, re-fetching if `tenantCode` changes (component-per-tenant today, but keeps the effect correct). Everything downstream — sections, permissions, add/edit/delete handlers — is unchanged.

### Tests
- `src/features/survey/api/list.test.ts` (new, `@vitest-environment node`): mirrors `tenant/api/list.test.ts` — mapping (including omitting `pendingSubState` when blank), correct URL/query construction, empty-upstream, non-OK, and thrown-fetch cases; plus a `GET` handler test asserting the `{ surveys }` envelope. Auth coverage added: `fetchSurveyList` sends/omits the `Authorization` header correctly, and the `GET` handler (built with `next/server`'s `NextRequest` so cookies can be set on the test request) forwards/omits it based on the presence of the `auth_token` cookie.
- `SurveyListing.test.tsx`: swaps the `listSurveysByTenant` mock for a global `fetch` stub (mirroring `TenantList.test.tsx`), adds a case for the fetch-failure → empty-sections fallback.
- `mockSurveys.test.ts`: removes the `listSurveysByTenant` describe block; `findSurvey` cases untouched.

## Alternatives considered
- **Fetch `SURVEY_API` directly from `SurveyListing`** — rejected. It's a `"use client"` component; `SURVEY_API` is a private (non-`NEXT_PUBLIC_`) env var and must stay server-side, exactly as already decided for `TENANT_API`.
- **Wire create/edit/delete to the API in this same pass** — rejected per explicit scope decision: those need create/update/delete API contracts nobody has specified yet; bundling them in would be scope creep beyond what was asked.
- **Distinct error UI for fetch failure vs. a genuinely-empty tenant** — rejected for consistency with the existing `TenantList` behavior, which already collapses both cases to the same empty state.

## Consequences
- `SurveyListing` now depends on `SURVEY_API` being reachable; if unset or unreachable, tenants see an empty survey list with no explicit error messaging (matches existing `TenantList` behavior/precedent).
- `listSurveysByTenant` is removed as dead code; any future need to re-derive a full tenant-scoped list from the mock module would need to be re-added deliberately.
- The real upstream field-naming/shape is inferred from `design/survey-data-model.md`, not yet confirmed against a live endpoint — if the actual API differs, `mapSurvey` in `src/features/survey/api/list.ts` is the single place to correct it.
- `/api/survey/list` now depends on an `auth_token` cookie being present to authenticate to `SURVEY_API`; an anonymous or expired-session request still resolves (no new error path), it will just get whatever empty/rejected response `SURVEY_API` returns for unauthenticated calls.
- The same `Authorization: Bearer` forwarding pattern is now the template to reuse if/when other client-facing API routes in this app need to call an authenticated upstream on the user's behalf.
