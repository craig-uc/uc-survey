# Generic Multi-Tenant Survey Platform — Starting Design Doc

> Status: first draft / starting point. Generalizes the DP World Working Norms Survey (see `DESIGN.md`) into a reusable, multi-tenant, multi-language survey platform on Next.js. Open decisions are flagged explicitly — this is a basis for discussion, not a final architecture.

## 1. Overview

The current app is a single-purpose, single-tenant, two-language (EN/FR) survey site with all content and flow hard-coded per deployment. This design generalizes it into a platform that can:

- Serve **many tenants** (clients), each with their own branding, domain, and survey content.
- Serve **many languages** per tenant, driven by data rather than duplicated inline translation objects.
- Support **configurable survey flows** (not a fixed 4-gate sequence) built via an **admin console**.
- Keep the **public-facing runtime as close to static/client-rendered as possible**, consistent with the current Azure Static Web Apps model, while all persistence (tenants, surveys, translations, responses) is owned by an **external API/backend service** — this app never talks to a database directly.

## 2. Goals

- Reuse this codebase across clients instead of forking it per engagement.
- Let non-developers author/edit surveys, questions, categories, and translations through an admin UI, without code changes or redeploys.
- Resolve tenant identity from **subdomain** (e.g. `dpworld.surveys.example.com`) and load that tenant's branding, active locales, and surveys at runtime.
- Preserve the existing telemetry pattern (page/device/parameter/gate/submission events) as the mechanism responses reach the backend.
- Migrate from Astro to **Next.js** (latest stable) while keeping the deployable artifact as static/pre-rendered as the platform's constraints allow.

## 3. Non-Goals (for this first draft)

- This app will **not** own a database connection or run server-side data access — all reads/writes go through an external API (same pattern as today's `PUBLIC_TRACKING_API`, generalized into a fuller CRUD + query API).
- No decision yet on identity provider for admin login (see §10 Open Decisions).
- No decision yet on whether the Admin Console ships in this same Next.js app (as a protected route group) or as a separate deployable — this draft assumes **same app, separate route group**, to be revisited.
- Custom-domain-per-tenant (vs. subdomain) is out of scope for v1, noted as a likely v2 ask.

## 4. Technology Stack (proposed)

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (latest, App Router) | Replaces Astro |
| Rendering strategy | Static export / prerendered shell + client-side data fetching | See §7 — tenant/locale/content resolution happens in the browser, matching today's client-driven model |
| UI | Tailwind CSS | Replaces Bootstrap/Sass; tenant branding (§5) maps onto Tailwind theme tokens/CSS variables |
| Language framework | Lightweight custom i18n layer (static UI strings) + API-driven content translations (survey text) | See §6 |
| State | React state/context for in-page flow; `localStorage`/`sessionStorage` for cross-page session data (tenant, locale, progress) — same pattern as today, no new state library needed yet |
| Backend | None owned by this repo — external API service (extension of today's URUP event-consumer API) | See §8 |
| Hosting | Azure Static Web Apps (or equivalent static host) if static export proves viable end-to-end; otherwise a minimal Node/Edge runtime only for what static export can't do (see §7 tension) | To be validated during technical spike |
| CI/CD | GitHub Actions, same QA/production pattern as today | Extend for per-tenant environment variables if needed |

## 5. Multi-Tenancy Model

**Resolution strategy: subdomain-based**, e.g. `dpworld.surveys.example.com`, `acme.surveys.example.com`.

- The app reads the tenant slug from `window.location.hostname` client-side (since the deployable is static, there is no server-side request to inspect at build time).
- On load, the shell calls the external API (`GET /tenants/resolve?domain={hostname}`) to fetch:
  - Tenant identity (id, display name)
  - Branding (theme colors, logo, fonts — applied as CSS variables at runtime)
  - Active locales for this tenant
  - Available survey(s) for this tenant
- **Tension to flag**: true static export cannot do server-side subdomain routing/rewriting (that typically needs Next.js Middleware running on a Node/Edge runtime). The client-side resolution above avoids needing middleware, at the cost of a brief unstyled/unbranded flash on first load and no SEO-per-tenant benefit. If per-tenant SSR or server-side rewriting is required later, this is the point where a minimal server runtime (Vercel, Azure Static Web Apps "hybrid" mode, or Container Apps) would need to be introduced. Flagged as an open decision (§10).
- DNS/cert: wildcard subdomain + wildcard TLS cert assumed; each new tenant is a DNS/config change, not a code change.

## 6. Multi-Language Model

Two distinct translation concerns, handled differently:

1. **Static UI strings** (button labels, generic chrome, error messages) — small, stable set, not tenant-specific. Ship as locale message catalogs in the app (e.g. `en.json`, `fr.json`, extendable to more locales), loaded via a lightweight i18n utility. This replaces the current pattern of duplicating `{en, fr}` objects inline in every component.
2. **Survey content translations** (survey/category/question/answer text, tenant intro/closing copy) — tenant-authored, dynamic, stored and served by the external API as part of the survey definition (see data model, §7). The app requests content already resolved to the visitor's active locale, with a documented fallback locale (e.g. tenant's default) if a translation is missing — replacing today's silent `"No translation provided"` placeholders with an explicit fallback rule.

Locale selection: same UX pattern as today (a language-picker landing step), but locale options are **driven by the tenant's active locale list**, not hard-coded to EN/FR. Selected locale persists in `localStorage` for the session, same as today.

## 7. Survey Content & Data Model

The current fixed **category → descriptor → question → answers**, hard-coded per app, generalizes into a **tenant-owned, database-backed, admin-editable** structure. The database itself is **owned and operated by the external API** (not this repo), but is specified here since the admin console needs to be designed against it.

### 7.1 Conceptual entities

| Entity | Purpose | Key fields (illustrative) |
|---|---|---|
| **Tenant** | A client organization | id, slug, subdomain, display name, branding (colors/logo/fonts), default locale, active locales |
| **Locale** | A supported language, tenant-scoped list of active locales | code (`en`, `fr`, ...), display name |
| **Survey** | A named, versioned questionnaire belonging to a tenant | id, tenant_id, name, status (draft/published/closed), version, start_at (nullable), end_at (nullable) |
| **SurveyStep** | A generalized replacement for the fixed "gate" concept — an ordered page in the survey flow | id, survey_id, order, type (`pre_start` \| `intro` \| `intake_field` \| `question_set` \| `closing`), config (JSON, type-specific) |
| **IntakeField** | Generalizes the hard-coded "location picker" into tenant-configurable custom fields collected before/alongside questions | id, step_id, field_key, field_type (select/text/radio), options[], required |
| **Category** | Grouping of questions (was hard-coded, e.g. "Communication & Collaboration") | id, survey_id, order |
| **Question** | A single survey question | id, category_id, order, answer_type (single-select/Likert-5/etc.) |
| **AnswerOption** | A selectable option for a question | id, question_id, order, value |
| **Tag / Principle** | Generalizes the current "principle" classification field into a reusable tagging concept for reporting | id, question_id, tag_key |
| **Translation** | Locale-specific text for any translatable entity (survey intro/closing copy, category label, question label, answer label, intake field label/options) | entity_type, entity_id, locale, text |
| **SurveyResponse / Event** | A submitted answer set (extends today's tracking event pattern) | id, survey_id, tenant_id, locale, respondent_session_id, answers[], submitted_at |
| **AdminUser** | A person who can author/edit surveys for a tenant | id, tenant_id (or cross-tenant for platform admins), email, role |

This is a first-pass shape, not a finalized schema — normalization, indexing, and versioning strategy (e.g. how edits to a published survey affect in-progress respondents) need a follow-up pass once the external API team scopes it.

### 7.2 Generalizing the fixed "4-gate" flow

Today's flow (Location → Intro → 38 Questions → Thank-you) becomes a **configurable ordered list of `SurveyStep`s**, each rendered by a generic step component keyed off `type`:

- `pre_start` / `intro` / `closing` — static, translated rich text.
- `intake_field` — one or more tenant-defined fields (generalizes "location," could be department, region, employee ID, etc.).
- `question_set` — one or more categories of questions, same rendering engine as today's Gate 3 but driven by fetched data instead of an inline script.

This lets a tenant have a 2-step survey or a 10-step survey without any code change — purely an admin-console/data change.

> **Note (2026-07-14):** the original draft above bundled `intro`/`closing` as a single "static" step concept. These are being split into three distinct static step types, each with its own design doc since they have different triggers and behaviour:
>
> - `pre_start` — gated on `Survey.start_at`; shown when the instance is loaded before the survey's configured start time. See [`design/survey-step-prestart.md`](survey-step-prestart.md).
> - `intro` — the survey's starting page once open; unchanged in spirit from the original draft. See [`design/survey-step-intro.md`](survey-step-intro.md).
> - `closing` — gated on `Survey.end_at`; shown once the survey's end time has been reached. See [`design/survey-step-closing.md`](survey-step-closing.md).
>
> `pre_start` and `closing` are time-gated overrides on top of the ordered step sequence (they can pre-empt whatever step a respondent would otherwise be on), rather than steps that occupy a fixed `order` position — this distinction is still open and tracked in each doc's Open Questions. `Survey.start_at`/`end_at` (nullable — no gating when absent) are added to §7.1 to support this. These three docs are intentionally light first drafts, to be expanded once the flow is worked through further.
>
> **Update (2026-07-14):** the route that resolves a tenant/slug to one of these three states (plus a not-found state for an unmatched slug) has been implemented against mock data — see [`design/survey-routing.md`](survey-routing.md) and [`design/survey-not-found.md`](survey-not-found.md). It's a partial implementation (no translations/telemetry/real API yet); the three step docs above remain `Draft` since their own open questions are still unresolved.

## 8. External API Dependency

This app is a **pure client of an external API** for everything beyond static assets and locale message catalogs. Expected endpoint groups (to be finalized with whoever owns/builds that API — likely an extension of the existing `p1-urup-api.urup.com` service):

- `GET /tenants/resolve?domain=` — tenant + branding + active locales + available surveys
- `GET /surveys/{id}?locale=` — full survey definition (steps, categories, questions, answers, translations) resolved to a locale
- `POST /events` — generalized version of today's tracking events (`access`, `device`, `parameter`, `gate`, `form`) — unchanged in spirit
- `POST /responses` — final survey submission payload
- **Admin console endpoints** (auth-protected): CRUD for tenants, surveys, steps, categories, questions, answers, translations, and admin users

Auth mechanism for admin endpoints (session/JWT/SSO) is an open decision (§10) — this app will hold whatever token/session the chosen approach requires and attach it to admin API calls.

## 9. Application Structure (proposed)

```
app/
├── (public)/
│   ├── [subdomain resolved client-side, not via route segment]
│   ├── page.tsx                Landing — language selection (locale list from tenant)
│   └── survey/[surveyId]/      Generalized "journey" — renders SurveyStep sequence
├── (admin)/
│   ├── login/
│   ├── tenants/
│   ├── surveys/[surveyId]/
│   │   ├── steps/
│   │   ├── categories/
│   │   └── questions/
│   └── translations/
├── components/
│   ├── steps/                  IntroStep, IntakeFieldStep, QuestionSetStep, ClosingStep
│   ├── admin/                  Builder UI components (forms, tables, tree/list editors)
│   └── shared/                 Branding provider, locale provider, telemetry client
└── lib/
    ├── api-client.ts           Thin wrapper around external API calls
    ├── i18n.ts                 Static UI-string catalog loader
    └── telemetry.ts            Event-posting helper (generalized from PageSetUp/DeviceDetection/ParameterRecorder)
```

## 10. Resolved Decisions

1. **Static export vs. minimal server runtime — stays fully static.** Tenant/branding/locale resolution happens client-side on load (as described in §5): fetch tenant config by hostname, then apply branding/locale and render. Accept a brief unbranded/skeleton flash on first paint as the v1 tradeoff; mitigate with a neutral loading skeleton rather than a jarring unstyled flash. No Next.js Middleware or server runtime is introduced for this. If the flash proves unacceptable once real users are on it, the escape hatch is a thin Edge Middleware layer (Vercel, or Azure Static Web Apps' hybrid Next.js support) doing only hostname→tenant rewriting — not a rebuild, an additive layer.
2. **Admin console placement — same Next.js app, same static export, separate route group (`/admin/**`).** Since the real security boundary is the external API (every CRUD call is authenticated/authorized server-side, not by this app), the admin section can be statically exported like the rest of the site: it renders a login form if no valid session token is present, and every subsequent admin API call carries that token — the API rejects unauthorized calls regardless of what the client renders. This avoids a second deployable/pipeline for v1. Revisit splitting into a separate app only if admin traffic/risk later justifies isolating build/deploy blast radius from the public survey.
3. **Admin auth mechanism — standalone login for v1 (email/password or magic link), issued and verified by the external API.** No SSO/Entra ID dependency now. Token (JWT) held in memory + short-lived, refreshed via the API — avoids relying on `localStorage` persistence for a credential given there's no server to set an `httpOnly` cookie. Entra ID (or any SSO) is a documented **upgrade path**: swap the login screen and add a federation flow on the API side; it does not require changes to the rest of the admin console.
4. **Published survey versioning — snapshot-on-start.** When a respondent starts a survey, the API returns a specific `survey_version_id`, which the client holds for the remainder of that session. Edits an admin publishes mid-survey do not change what an in-progress respondent sees; new sessions started after a publish get the new version. This matches the common pattern in form-builder tools (Typeform, Google Forms) and avoids a respondent seeing a half-old/half-new question set.
5. **External API ownership/timeline — built by the same team, same timeline, as this frontend migration.** Given that, the coordination tactic is **contract-first within the team**: agree the endpoint/schema contract in §7–8 up front (or an OpenAPI spec derived from it), and let frontend build against a mock server generated from that contract in parallel with real backend implementation, integrating as endpoints land. This isn't a cross-team dependency risk, just a sequencing discipline to avoid the frontend blocking on backend completion.
6. **Custom domains per tenant — confirmed out of scope for v1**, but the `Tenant` entity (§7.1) reserves a nullable `customDomain` field now so adding this in v2 is a resolution/DNS change, not a schema migration.
7. **Component library — move to Tailwind CSS as part of this migration.** Bootstrap/Sass is dropped rather than carried forward; per-tenant branding (§5) maps naturally onto Tailwind's token-driven theming (tenant colors/fonts as CSS variables consumed by the Tailwind theme), and it avoids overriding a second theming system (Bootstrap's Sass variables) on top of a tenant theme layer. Visual parity with the current Bootstrap-based UI is a migration task, not a redesign — components are rebuilt to look equivalent, not reimagined.

## 11. Migration Notes from Current App

| Current (Astro, DPW-specific) | Generalized (Next.js) |
|---|---|
| `index.astro` hard-coded EN/FR flags | Landing page renders locale options from resolved tenant config |
| `gate01`–`gate04.astro` fixed sequence | `SurveyStep` list rendered by a generic step component, order/config from API |
| `LocationSelection.astro` (15 hard-coded DP World sites) | Generic `intake_field` step, tenant-configurable options |
| Inline `questions` array in `gate03.astro` | `question_set` step fetching category/question/answer data from API, already locale-resolved |
| Per-component inline `{en, fr}` translation objects | Static strings → message catalogs; dynamic content → API-resolved translations |
| `localStorage` keys (`language`, `instance`, `workingNormsGate`, etc.) | Same pattern, generalized key names, now also storing resolved `tenantId`/`surveyId` |
| `PageSetUp`/`DeviceDetection`/`ParameterRecorder` Astro components firing tracking events | Equivalent React hooks/utilities in `lib/telemetry.ts`, same event shapes, generalized payload (tenant-aware) |
| Two hard-coded env-based tracking endpoints (QA/prod) | Same environment pattern, endpoint now serves full CRUD + resolve + events, not just tracking |
