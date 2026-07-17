# Tenant Listing (urup home page)

## Status
Accepted — the routes below moved per `design/admin-routing-restructure.md`: the branch on `home/page.tsx` no longer exists (that page is now `/admin/home`, unconditionally `TenantList`), and clicking a tenant now sets `TenantContext` and navigates to the tenant-agnostic survey-list page (`/admin/surveys`) rather than back into `home`. The tenant data model, API, and component split described below are otherwise unchanged.

## Context
Tenant is purely URL-driven today (`src/features/tenant/getTenantCode.ts` defaults to `"urup"` when no segment is present) — there is no `Tenant` entity, API, or "active tenant" list anywhere in the codebase. The only trace of tenant identity is a hardcoded image map in `GlassPanel` for branding.

`"urup"` is URUP Connect's own internal tenant. Staff who log in under `/urup/...` need to manage surveys across *all* client tenants, while a regular client user logging in under their own tenant segment (e.g. `/dpw-eu/...`) only ever needs to manage their own tenant's surveys. Today `home/page.tsx` renders a hardcoded "applications" grid fetched from `/api/applications`, an endpoint that doesn't exist in this repo — that content is being replaced.

## Decision
`/admin/home` unconditionally renders `TenantList` — every signed-in admin, `urup` included, lands on the tenant picker (see `design/admin-routing-restructure.md`; the old `tenantCode === "urup"` branch on a shared `home` page is gone).

Clicking a tenant entry in `TenantList` sets `TenantContext` to that tenant (`setTenant(tenant.slug)`) and navigates to `/admin/surveys`, the tenant-agnostic survey-list page (see `design/survey-listing.md`) — not back into `home`. `urup` still appears in its own list (see below); clicking it now sets the tenant to `urup` and takes you to its own survey list at `/admin/surveys`, same as any other tenant, rather than looping back to the picker.

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
- `src/features/tenant/TenantList.tsx` — `"use client"`; fetches `POST /api/tenant/list` on mount, renders a `TenantEntry` per result inside a `GlassPanel`. Empty state ("No active tenants.") covers both a genuinely empty list and a failed fetch. No longer takes a `lang` prop (dropped post-restructure — it only ever existed to build the old `/{slug}/{lang}/home` href).
- `src/features/tenant/TenantEntry.tsx` — a button (not a `Link` — the destination URL no longer encodes the tenant) showing the tenant name; on click, calls `setTenant(tenant.slug)` then `router.push("/admin/surveys")`. Reuses the existing card styling from the original `home/page.tsx` grid (`bg-dark/40 backdrop-blur-sm border ...`).
- `src/features/tenant/index.ts` exports: `Tenant`, `TenantList`, `TenantEntry`.

### src/app/admin/home/page.tsx
```tsx
export default function AdminHomePage() {
  return <TenantList />;
}
```
Unconditional — no tenant/lang branching (see Decision above). This replaced the original hardcoded "applications" grid fetched from a non-existent `/api/applications` endpoint, and later the `tenantCode === "urup"` branch shared with `SurveyListing`.

### Tests
- `src/features/tenant/api/list.test.ts`: `fetchTenantList` includes `urup` (no filtering), maps upstream fields, posts the correct URL/body, returns `[]` on non-ok/network-error/missing-env; `POST` wraps it in `{ tenants }`.
- `TenantList.test.tsx`: renders an entry per tenant returned by the (mocked) `/api/tenant/list` fetch, renders empty state on an empty response, renders empty state when the fetch fails.
- `TenantEntry.test.tsx`: renders name; clicking sets the tenant in context and navigates to `/admin/surveys`.
- `src/app/admin/home/page.test.tsx`: renders `TenantList` unconditionally.

## Alternatives considered
- **Separate route for tenant drill-down (e.g. `/urup/[lang]/tenants/[slug]`)**: originally rejected in favor of reusing `home` for both the picker and a client tenant's own survey listing; superseded by `design/admin-routing-restructure.md`, which gives the survey list its own tenant-agnostic page (`/admin/surveys`) precisely so `home` doesn't have to double as both.
- **Direct server-side fetch inside `TenantList`**: rejected — `TenantList` is `"use client"` and can't read `TENANT_API`/`APPLICATION` (non-public env vars aren't available in the browser). A proxy API route is required, matching the `field.ts` convention used elsewhere in this codebase.
- **Keep `mockTenants.ts` as a fallback on API failure**: rejected — the user chose to remove the mock entirely; a failed fetch renders the same "No active tenants" empty state as a genuinely empty list.
- **Per-user tenant assignment**: rejected — no user↔tenant association model exists in this codebase (`GlobalStateContext` only tracks a `user` string), and the user confirmed `"urup"` should be treated as a superadmin tenant that sees all tenants the application is scoped to.
- **Filtering `urup` out of its own list**: tried first, then reversed — the user confirmed `urup` must not be filtered and should appear in the list like any other tenant returned by the endpoint.

## Consequences
- `mockTenants.ts` / `mockTenants.test.ts` are removed; tenant data now depends on `TENANT_API` being reachable and correctly configured (`.env.local` already sets it).
- `TenantList` gains a loading window between mount and its fetch resolving — briefly renders the empty state before real data (or an empty result) arrives. Acceptable for this internal, low-traffic operator view; revisit with an explicit loading state if it proves confusing.
- Since `urup` appears in its own list, clicking it now lands on `urup`'s own survey list rather than looping back to the picker — no self-loop.
