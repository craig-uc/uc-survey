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

Clicking a tenant entry in `TenantList` navigates to `/{tenant.slug}/{lang}/home`, which — because that tenant's slug is never `"urup"` — renders that tenant's own survey listing. No new route is needed for the drill-down page; `home/page.tsx` itself is the shared entry point for both views.

Tenant data is backed by a new mock module (`src/features/tenant/mockTenants.ts`), following the same pattern as `src/features/survey/mockSurveys.ts`, until a real tenant API/backend exists. The list shows every tenant with `active: true` — there is no per-user tenant-assignment model in this codebase, and adding one is out of scope. `"urup"` itself is excluded from its own list (it's the operator tenant, not a client to manage).

## Design

### Data
`src/features/tenant/types.ts` (new):
```ts
export interface Tenant {
  slug: string;
  name: string;
  active: boolean;
}
```

`src/features/tenant/mockTenants.ts` (new):
```ts
export const MOCK_TENANTS: Tenant[] = [
  { slug: "dpw-apac", name: "DPW APAC", active: true },
  { slug: "dpw-eu", name: "DPW EU", active: true },
  { slug: "dpw-gbl", name: "DPW Global", active: true },
  { slug: "dpw-ssa", name: "DPW SSA", active: true },
  { slug: "nedbank", name: "Nedbank", active: true },
  { slug: "t3", name: "T3", active: false },
];

export function listActiveTenants(): Tenant[] {
  return MOCK_TENANTS.filter((t) => t.active);
}
```
(Slugs reuse the same set already present in `GlassPanel`'s tenant image map, minus `urup`/`dark`, which aren't client tenants.)

### Components
- `src/features/tenant/TenantList.tsx` — calls `listActiveTenants()`, renders a `TenantEntry` per result inside a `GlassPanel`. Empty state: "No active tenants."
- `src/features/tenant/TenantEntry.tsx` — a `Link` to `/{slug}/{lang}/home` showing the tenant name; reuses the existing card styling from the current `home/page.tsx` grid (`bg-dark/40 backdrop-blur-sm border ...`).
- `src/features/tenant/index.ts` gains exports: `Tenant`, `listActiveTenants`, `TenantList`, `TenantEntry`.

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
- `TenantList.test.tsx`: renders all active tenants, excludes inactive ones, renders empty state when none active, each entry links to the right href.
- `TenantEntry.test.tsx`: renders name, correct `href`.
- `home/page.test.tsx`: `tenantCode="urup"` renders `TenantList`; any other `tenantCode` renders `SurveyListing` (mock the child components to isolate the branch).

## Alternatives considered
- **Separate route for tenant drill-down (e.g. `/urup/[lang]/tenants/[slug]`)**: rejected — `home` already is the tenant-scoped landing page for every tenant; reusing it means a client tenant's own `/{slug}/{lang}/home` URL behaves identically whether reached by direct login or by drill-down from `urup`, with no duplicate page to maintain.
- **Real `/api/tenants` route**: rejected for now, matching the user's preference to follow the existing `mockSurveys.ts` pattern; swapping the mock module for a real API later doesn't change any consuming component's interface.
- **Per-user tenant assignment**: rejected — no user↔tenant association model exists in this codebase (`GlobalStateContext` only tracks a `user` string), and the user confirmed `"urup"` should be treated as a superadmin tenant that sees all active tenants.

## Consequences
- `home/page.tsx` loses its `/api/applications` dependency (which pointed at a non-existent route) — a net simplification.
- Introduces the first `Tenant` type/mock-data pattern in the codebase; a future real backend integration replaces `mockTenants.ts` only.
- Survey-listing (see `design/features/survey-listing.md`) becomes reachable both as a client tenant's own home page and as `urup`'s drill-down target — it must not assume it's only ever reached one way.
