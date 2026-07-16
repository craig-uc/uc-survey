# Survey Landing Route

## Status
Accepted

## Context
Tenants can run multiple concurrent surveys, each identified by a slug unique to that tenant. There was no `Survey` entity anywhere in the codebase — only a conceptual sketch in `migrationDesign.md` (external-API-backed, with translations/telemetry/an admin console — all aspirational, not built). Three Draft docs already existed for the destination steps (`design/survey-step-intro.md`, `-prestart.md`, `-closing.md`) but nothing resolved a URL to one of them, and there was no "not found" concept at all. This doc covers the route that ties those states together, using mock in-memory data since the external API/admin console described in `migrationDesign.md` don't exist yet.

## Decision
Add a route at `/<tenant>/<lang>/(anonymous)/<survey>` that:
1. Looks up whether `<tenant>` has a survey with slug `<survey>` in a mock data module.
2. If no match, renders a not-found state (see `design/survey-not-found.md`).
3. If a match exists, computes a phase from the survey's `status` and nullable `startAt`/`endAt`, and renders the matching step — `pre_start`, `intro`, or `closing` (per the three existing step docs) — at the **same URL**. No `redirect()` and no `notFound()` are used; the decision tree is resolved by conditional rendering.

## Design

### Data model (`src/features/survey/types.ts`)
```ts
type SurveyStatus = "draft" | "published" | "closed";
interface Survey {
  tenantCode: string;
  slug: string;
  status: SurveyStatus;
  startAt: string | null; // ISO datetime
  endAt: string | null;
}
type SurveyPhase = "prestart" | "intro" | "closing";
```
"Not found" is deliberately **not** a `SurveyPhase` value — it's a page-level concern (did a `findSurvey` lookup return anything at all), kept separate from phase computation over a real `Survey`.

### Mock data (`src/features/survey/mockSurveys.ts`)
`findSurvey(tenantCode: string, slug: string): Survey | undefined` — a plain array lookup scoped by both tenant and slug (two different tenants may reuse the same slug independently). Stands in for the future `GET /surveys/{id}` resolution described in `migrationDesign.md` §8.

### Phase computation (`src/features/survey/getSurveyPhase.ts`)
`getSurveyPhase(survey: Survey, now: Date): SurveyPhase`, evaluated in this fixed order (status overrides dates; deterministic even for misconfigured/contradictory data since there's no admin console yet to prevent it):

| Order | Condition | Result |
|---|---|---|
| 1 | `status === "closed"` | `closing` |
| 2 | `status === "draft"` | `prestart` |
| 3 | `endAt` set and `now > endAt` | `closing` |
| 4 | `startAt` set and `now < startAt` | `prestart` |
| 5 | otherwise | `intro` |

Boundary equality (`now === startAt` or `now === endAt`) falls through to `intro` — the source step docs use strict inequalities (`now > end_at`, `now < start_at`).

### Step components (`src/features/survey/`)
`IntroStep`, `PreStartStep`, `ClosingStep`, `NotFoundStep` — flat files (no `components/` subfolder, matching every other feature module in this repo). Each wraps `GlassPanel` with plain-English placeholder copy — no `Translation` entity, no telemetry, matching the mock/no-backend scope of this pass.

- **`IntroStep`** renders a `submit`-styled `Continue` button using the dependency-free `Button` component (`src/components/ui/Button.tsx`), not `GlassPanel`'s `navigation`/`NavButton` stack. **This button currently has no real destination** — `intake_field`/`question_set` steps don't exist yet — so it's an inert placeholder (no `onClick` side effect). Wiring it to a real next-step is follow-up work once the journey/step-sequencing design lands.
- **`PreStartStep`** takes `{ startAt: string | null; onExpire: () => void }`. A `setInterval` recomputes the remaining time every second and calls `onExpire()` once when it reaches zero (immediately, if already past at mount) — no drift correction against a server clock, which is an explicit open question in `survey-step-prestart.md` this pass does not resolve. The countdown display format (`Dd Hh Mm Ss`) is an **implementation default**, not a resolution of that doc's open "display granularity" question. When `startAt` is `null` (the `draft`-status override can produce a `prestart` phase with no scheduled date at all), it shows a generic "Check back soon." message instead of a countdown, and never calls `onExpire`.
- **`ClosingStep`** and **`NotFoundStep`** are static, terminal, no navigation.

### Route page (`src/app/[tenant]/[lang]/(anonymous)/[survey]/page.tsx`)
A **client component with synchronous params** (`{ params }: { params: { tenant: string; lang: string; survey: string } }`) — not an async server component with `Promise<params>`. This matches the only tested page pattern in the repo (`dashboard/[appId]/page.tsx`); the one pre-existing async server-component page (`src/app/[tenant]/page.tsx`) has no test coverage and no established test pattern.

Flow: `findSurvey(params.tenant, params.survey)` → if `undefined`, render `NotFoundStep`. Otherwise compute the initial phase via `getSurveyPhase(survey, new Date())`, held in local state; render the matching step. `PreStartStep`'s `onExpire` flips that state to `intro` — the same-URL, no-reload transition `survey-step-prestart.md` requires.

### Route group rename
The existing `(anonymous)` route group folder was found on disk as `(anonymous))` — a stray extra closing paren, cosmetic only (route groups aren't part of the URL; nothing in code referenced the literal path). Renamed to `(anonymous)` as part of this change, since the new `[survey]` route lives inside it.

## Alternatives considered
- **`notFound()` / `not-found.tsx`** for the missing-survey case — rejected. That mechanism changes the actual HTTP status and triggers Next's route-segment error boundary; a mock-array lookup miss is an ordinary data-not-found, not a routing failure. See `design/survey-not-found.md`.
- **Async server component with `Promise<params>`** for the route page — rejected. It would be the second async server-component page in the repo and the first with any test coverage at all; there's no established pattern for testing one, so it would need a new, unproven test approach. The synchronous client-component pattern already has a working, tested precedent.
- **Server-side `redirect()` to distinct `/prestart`, `/closing`, `/intro` URLs** — rejected per explicit product decision: the respondent stays on one URL throughout.

## Consequences
- No translations, telemetry, or real API integration yet — those remain owned by `migrationDesign.md`'s aspirational architecture.
- `IntroStep`'s Continue button doesn't go anywhere yet; needs wiring once `intake_field`/`question_set` steps exist.
- This is a **partial** implementation of the three Draft step docs (no translated content, no telemetry, open questions like clock-drift and admin-preview-bypass unresolved) — see below.

## Open questions
None of this doc's own. The three pre-existing step docs' open questions (clock-drift handling, override-vs-order-positioned semantics, admin/preview bypass, natural-vs-forced closing copy, in-progress-answer fate on force-close) remain genuinely unresolved by this pass and are intentionally not re-litigated here — see each doc directly. Those docs stay at `Status: Draft` for that reason; this doc is `Accepted` because it fully describes what's actually shipping now.
