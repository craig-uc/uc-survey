# Tenant Listing (urup home page)

## Status
Accepted

## Context
Tenant is purely URL-driven today (`src/features/tenant/getTenantCode.ts` defaults to `"urup"` when no segment is present) — there is no `Tenant` entity, API, or "active tenant" list anywhere in the codebase. The only trace of tenant identity is a hardcoded image map in `GlassPanel` for branding.

`"urup"` is URUP Connect's own internal tenant. Staff who log in under `/urup/...` need to manage surveys across *all* client tenants, while a regular client user logging in under their own tenant segment (e.g. `/dpw-eu/...`) only ever needs to manage their own tenant's surveys. Today `home/page.tsx` renders a hardcoded "applications" grid fetched from `/api/applications`, an endpoint that doesn't exist in this repo — that content is being replaced.

## Decision
`home/page.tsx` branches on `tenantCode`:
- `tenantCode === "urup"` → render `TenantList`, a clickable list of active tenants.
- any other tenant → render the survey listing (see `design/features/survey-listing.md`) scoped to that tenant.

Clicking a tenant entry in `TenantList` navigates to `/{tenant.slug}/{lang}/home`. For any client tenant this renders that tenant's own survey listing. `urup` now appears in its own list (see below) — clicking it navigates to `/urup/{lang}/home`, which re-renders `TenantList` itself; this is accepted as correct (a way to return to the top-level tenant list), not a bug. No new route is needed for the drill-down page; `home/page.tsx` itself is the shared entry point for both views.

Tenant data now comes from the real tenant API (`TENANT_API` + `tenant_list`), replacing the mock module originally used here. `home/page.tsx` is a `"use client"` component (it calls `useTenant()`), so `TenantList` is bundled client-side — it cannot read non-public env vars or call `TENANT_API` directly. Following the existing convention in this codebase (`src/features/language/api/field.ts` + `LanguageSelector.tsx`), the upstream call is proxied through a Next.js API route, and `TenantList` fetches that route client-side.

## Design

### Data
`src/features/tenant/types.ts`:
```ts
export interface Tenant {
  slug: string;
  name: string;
}
```
(`active` was dropped — the mock's active/inactive distinction doesn't exist upstream. `TENANT_API`'s `tenant_list` endpoint, scoped by `application`, returns only the tenants relevant to this application; there is no per-user tenant-assignment model in this codebase, and adding one is out of scope.)

`src/features/tenant/api/list.ts` (new) — server-only module:
```ts
export async function fetchTenantList(): Promise<Tenant[]>
export async function POST(): Promise<NextResponse>
```
`fetchTenantList` POSTs to `${TENANT_API}tenant_list` with body `{ type: "application", application: APPLICATION }`. Upstream response shape:
```json
[{ "guid": "acf98da63749417595e4e5242277dfd9", "name": "U·R·UP Connect", "code": "urup" }]
```
mapped to `{ slug: code, name }` with no filtering — `urup` is included in the list like any other tenant returned by the endpoint (reversed from an earlier version of this doc; the user confirmed `urup` must appear). Returns `[]` on any failure (missing env var, non-ok response, network error), logging the error server-side — no mock fallback.

`src/app/api/tenant/list/route.ts` (new): `export { POST } from "@/features/tenant/api/list";`

### Components
- `src/features/tenant/TenantList.tsx` — `"use client"`; fetches `POST /api/tenant/list` on mount, renders a `TenantEntry` per result inside a `GlassPanel`. Empty state ("No active tenants.") covers both a genuinely empty list and a failed fetch.
- `src/features/tenant/TenantEntry.tsx` — a `Link` to `/{slug}/{lang}/home` showing the tenant name; reuses the existing card styling from the current `home/page.tsx` grid (`bg-dark/40 backdrop-blur-sm border ...`).
- `src/features/tenant/index.ts` exports: `Tenant`, `TenantList`, `TenantEntry`.

### home/page.tsx
```tsx
const { tenantCode } = useTenant();
const { lang } = useParams();

if (tenantCode === "urup") {
  return <TenantList lang={lang} />;
}
return <SurveyListing tenantCode={tenantCode} lang={lang} />;
```
The `/api/applications` fetch and the "Welcome to U.R.UP Connect" hero content are removed — replaced entirely per the request ("the content of the existing page on home can be replaced with the tenant list").

### Tests
- `src/features/tenant/api/list.test.ts`: `fetchTenantList` includes `urup` (no filtering), maps upstream fields, posts the correct URL/body, returns `[]` on non-ok/network-error/missing-env; `POST` wraps it in `{ tenants }`.
- `TenantList.test.tsx`: renders an entry per tenant returned by the (mocked) `/api/tenant/list` fetch, renders empty state on an empty response, renders empty state when the fetch fails.
- `TenantEntry.test.tsx`: renders name, correct `href`.
- `home/page.test.tsx`: `tenantCode="urup"` renders `TenantList`; any other `tenantCode` renders `SurveyListing` (mock the child components to isolate the branch).

## Alternatives considered
- **Separate route for tenant drill-down (e.g. `/urup/[lang]/tenants/[slug]`)**: rejected — `home` already is the tenant-scoped landing page for every tenant; reusing it means a client tenant's own `/{slug}/{lang}/home` URL behaves identically whether reached by direct login or by drill-down from `urup`, with no duplicate page to maintain.
- **Direct server-side fetch inside `TenantList`**: rejected — `home/page.tsx` is `"use client"`, so `TenantList` is part of the client bundle and can't read `TENANT_API`/`APPLICATION` (non-public env vars aren't available in the browser). A proxy API route is required, matching the `field.ts` convention used elsewhere in this codebase.
- **Keep `mockTenants.ts` as a fallback on API failure**: rejected — the user chose to remove the mock entirely; a failed fetch renders the same "No active tenants" empty state as a genuinely empty list.
- **Per-user tenant assignment**: rejected — no user↔tenant association model exists in this codebase (`GlobalStateContext` only tracks a `user` string), and the user confirmed `"urup"` should be treated as a superadmin tenant that sees all tenants the application is scoped to.
- **Filtering `urup` out of its own list**: tried first, then reversed — the user confirmed `urup` must not be filtered and should appear in the list like any other tenant returned by the endpoint.

## Consequences
- `home/page.tsx` loses its `/api/applications` dependency (which pointed at a non-existent route) — a net simplification.
- `mockTenants.ts` / `mockTenants.test.ts` are removed; tenant data now depends on `TENANT_API` being reachable and correctly configured (`.env.local` already sets it).
- `TenantList` gains a loading window between mount and its fetch resolving — briefly renders the empty state before real data (or an empty result) arrives. Acceptable for this internal, low-traffic operator view; revisit with an explicit loading state if it proves confusing.
- Survey-listing (see `design/features/survey-listing.md`) becomes reachable both as a client tenant's own home page and as `urup`'s drill-down target — it must not assume it's only ever reached one way.
- Since `urup` appears in its own list, clicking it navigates back to `/urup/{lang}/home`, re-rendering `TenantList` — a self-loop, not a dead end.
