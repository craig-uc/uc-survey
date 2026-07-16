# Survey Not Found

## Status
Accepted

## Context
The survey landing route (`design/survey-routing.md`) resolves `/<tenant>/<lang>/(anonymous)/<survey>` against a mock data lookup keyed on tenant + slug. Unlike the `pre_start`/`intro`/`closing` steps — which only apply to a `Survey` that was actually found — there was no defined behaviour for a tenant/slug combination that matches no survey at all (a typo'd link, a survey removed from the mock data, a slug meant for a different tenant).

## Decision
When `findSurvey(tenantCode, slug)` returns `undefined`, render a `NotFoundStep`: a static, translated-later message telling the visitor no survey matches this link, at the **same URL** — not a redirect, and not Next's `notFound()`/`not-found.tsx` 404 mechanism.

## Design
- **Component**: `NotFoundStep` (`src/features/survey/NotFoundStep.tsx`) — wraps `GlassPanel`, heading + explanatory body copy, no navigation (terminal, like `ClosingStep`).
- **Trigger**: the route page (`src/app/[tenant]/[lang]/(anonymous)/[survey]/page.tsx`) checks `findSurvey(...)` before computing any phase; a miss short-circuits straight to `NotFoundStep` without ever calling `getSurveyPhase`.
- **Copy**: plain English placeholder text for now — no `Translation` entity exists yet (see `survey-routing.md`'s Consequences).

## Alternatives considered
- **Next's `notFound()` function + a `not-found.tsx` file** — rejected. That mechanism is for genuine routing failures (a URL segment Next can't resolve at all) and changes the actual HTTP response status. A tenant/slug pair simply not existing in the survey data is an ordinary data-lookup miss — the route itself resolved fine, the *business data* didn't match. Using `notFound()` here would conflate the two and make the not-found state behave inconsistently with the other three states (which are all same-URL conditional renders, no navigation).
- **Redirect to a shared `/not-found` page** — rejected for the same reason the other three states don't redirect: keeps the respondent on one URL.

## Consequences
- No real distinction yet between "survey never existed," "survey existed but was deleted," and "wrong tenant" — all three collapse to the same generic message. Revisit if product wants tenant-specific or reason-specific copy later.
- No telemetry event fires on a not-found hit yet — same gap as the other three steps (see `survey-routing.md`).

## Open questions
None.
