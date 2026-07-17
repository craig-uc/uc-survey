# Admin Routing Restructure

## Status
Accepted

## Context
Routing had grown confusing: the anonymous login flow lived at `[tenant]/[lang]/(anonymous)/admin/auth*` — so "admin" meant "login form," not "authenticated area." The actually-authenticated area lived at `[tenant]/[lang]/(authenticated)/*`, and its `home` page did double duty: it rendered a tenant picker (`TenantList`) when `tenantCode === "urup"`, or a per-tenant survey list (`SurveyListing`) for every other tenant. Every authenticated URL repeated a `tenant`/`lang` pair that a logged-in admin never needed to see or change per click — `TenantContext` and `GlobalStateContext` (both localStorage-backed) were already the real source of truth; the URL segments only ever seeded them on mount.

This pass simplifies both problems at once: move login to root as a single, tenant-agnostic entry point, and give the authenticated area its own `/admin/*` namespace with the tenant list and survey list as distinct pages.

## Decision
1. **Login moves to root** (`/`, `/signIn`, `/loginSent`) and becomes the one universal login entry point for every tenant's admins. The actual tenant is resolved server-side from the sign-in response (`data.tenant_code`, applied via `useApplySession`) — never from the URL. The login/sign-in API calls continue to send the same `tenantCode: "urup"` / `lang: "en"` defaults that were already hardcoded pre-restructure.
2. **The authenticated area moves to `/admin/*`**, dropping `tenant`/`lang` from every URL, full stop — including the survey list, which briefly kept `[tenant]` in its URL during an earlier pass of this restructure before being made tenant-agnostic like the rest of `/admin/*` (see Alternatives considered).
3. **`/admin/home` is unconditionally the tenant picker** — the old `tenantCode === "urup"` branch is gone; `SurveyListing` no longer lives on home at all.
4. **The survey list gets its own page**, `/admin/surveys` — tenant-agnostic, reading the active tenant from `TenantContext` like every other admin page. Picking a tenant from `/admin/home` now sets `TenantContext` directly (`TenantEntry`'s click handler calls `setTenant`) before navigating there, rather than encoding the choice in the URL.
5. **Out of scope, left untouched**: the anonymous respondent-facing survey route (`[tenant]/[lang]/(anonymous)/[survey]`) and the tenant-scoped language picker (`[tenant]/page.tsx`).

## Design

### Route table (before → after)
| Before | After |
|---|---|
| `[tenant]/[lang]/(anonymous)/admin/auth` (login form) | `/` |
| `[tenant]/[lang]/(anonymous)/admin/auth/signIn` (magic-link callback) | `/signIn` |
| `[tenant]/[lang]/(anonymous)/admin/auth/loginSent` (orphaned, unreferenced) | *(deleted — stays removed per `design/features/auth-flow.md`, which already documented this route as intentionally removed; the "sent" step is handled inline by `AuthFlow`)* |
| `[tenant]/[lang]/(authenticated)/home` (tenant list *or* survey list) | `/admin/home` (tenant list only) |
| *(none — new)* | `/admin/surveys` (survey list, reads active tenant from `TenantContext`) |
| `[tenant]/[lang]/(authenticated)/dashboard/[appId]` | `/admin/dashboard/[appId]` |
| `[tenant]/[lang]/(authenticated)/surveys/[surveyId]` | `/admin/surveys/[surveyId]` |

`[tenant]/[lang]/(authenticated)/layout.tsx` → `src/app/admin/layout.tsx`: identical auth guard (`useGlobalState().user`/`isHydrated`, spinner while unresolved, `Header`+`Footer`), redirect target changed from `/${tenant}/${lang}/admin/auth` to `/`.

### Ripple effects on shared components
- **`TenantEntry`** (`src/features/tenant/TenantEntry.tsx`): no longer a plain `<Link>`. It's now a button whose `onClick` calls `setTenant(tenant.slug)` (from `useTenant`) and then `router.push("/admin/surveys")` — the click both selects the active tenant and navigates, since the destination URL no longer carries the tenant itself. The `lang` prop is gone (it existed only to build the old `/${tenant.slug}/${lang}/home` href).
- **`TenantList`**: drops the now-unused `lang` prop it only ever threaded through to `TenantEntry`.
- **`SurveyListing`** (`src/features/survey-management/SurveyListing.tsx`): `goToEditor` now pushes `/admin/surveys/${survey.id}` instead of `/${tenantCode}/${lang}/surveys/${survey.id}`; `lang` prop dropped (still takes `tenantCode`, genuinely needed for the list fetch).
- **`LogoutButton`**: the post-logout redirect used to compute `/${tenant}/${lang}` (or `/${tenant}`, or `/`) — "back to this tenant's login," which no longer exists now that login is universal. It now always redirects to `/`.
- **`src/app/admin/dashboard/[appId]/page.tsx`**: its breadcrumb "Home" link was already a hardcoded `/home` (stale even before this change, since the real path was tenant/lang-scoped); it's now the *correct* absolute `/admin/home`, since that page is genuinely URL-static post-restructure.

### What didn't change
- `src/app/layout.tsx` already wraps the entire app in `TenantProvider` + `GlobalStateProvider`; no provider changes were needed for the new root-level or `/admin/*` pages.
- The anonymous survey-taking flow (`[tenant]/[lang]/(anonymous)/[survey]`), its `LangGuard`/`LangInitializer`/`TenantInitializer` scaffolding, and the tenant-scoped language picker (`[tenant]/page.tsx`) are untouched.
- `src/features/identity` (anonymous-visitor identifier tracking) is a separate concern from tenant-admin auth and wasn't touched; the new root login page keeps its existing `IdentityInitializer` usage as-is.

## Alternatives considered
- **Per-tenant login pages kept, root only as a fallback** — rejected per explicit product decision: a single universal login is simpler for an app whose tenant is resolved server-side anyway, and it removes an entire duplicate route tree (`(anonymous)/admin/auth` was already byte-for-byte identical to the old root page).
- **Keep `[tenant]/[lang]` on every admin URL, only dropping it from `home`** — rejected per explicit product decision: since tenant/lang are already carried in `TenantContext`/`GlobalStateContext`, repeating them in the URL for `dashboard`/`surveys` added no information and complicated every navigation call site for no benefit.
- **Keep `[tenant]` in the surveys-list URL (`/admin/[tenant]/surveys`)** — this was the initial design and shipped briefly, on the reasoning that the surveys-list page is the direct navigation target from the tenant picker, so encoding the chosen tenant in its URL seemed like the one place it was still useful. Reversed per explicit follow-up product decision, for full consistency with every other `/admin/*` page: `TenantEntry` now sets `TenantContext` directly on click instead of encoding the tenant in the destination URL.

## Consequences
- Deep-linking into `/admin/surveys`, `/admin/dashboard/[appId]`, or `/admin/surveys/[surveyId]` now depends on `TenantContext` already having a tenant set (from a prior login or a prior `/admin/home` pick) rather than any URL supplying it — there's no way to land directly on a specific tenant's survey list via URL alone anymore; you must go through `/admin/home` first (or already be signed in as that tenant).
- The entirely-duplicate `(anonymous)/admin/auth` and `(authenticated)/*` route trees are deleted; any future admin route addition should default to living under `/admin/*`.
- `design/survey-listing.md`'s "home/page.tsx integration" section and its editor-route example are updated in place to match (see that doc).
