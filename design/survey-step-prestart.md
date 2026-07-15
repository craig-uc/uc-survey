# Survey Step — Pre-Start

## Status
Draft

## Context
The generalized survey flow (`migrationDesign.md` §7) needs a way to stop respondents from entering a survey before it is officially open. Today's app has no concept of a scheduled start time at all — every gate is reachable as soon as it's deployed. As tenants move to scheduled campaign launches (e.g. "opens Monday 09:00"), an instance loaded early needs to show something other than the intro/question flow. This doc splits `pre_start` out of the original combined `intro`/`closing` "static step" idea in `migrationDesign.md` §7.2 into its own step type.

## Decision
Add `Survey.start_at` (nullable timestamp). When a survey is loaded and `now < start_at`, render a `pre_start` step instead of the normal step sequence: tenant-authored, translated text plus a live countdown to `start_at`. When the countdown reaches zero, the app transitions itself to the `intro` step without requiring a manual reload.

No `start_at` set means no pre-start gating — the survey is reachable immediately, same as today.

## Design
- **Data**: `Survey.start_at` (ISO datetime, nullable). Pre-start copy (heading/body) is authored per-survey and translated via the existing `Translation` entity, keyed to this step similar to other static steps.
- **Gating point**: the top-level journey loader (whatever resolves `GET /surveys/{id}?locale=` and decides what to render) compares current time to `start_at` before rendering the ordered `SurveyStep` list. If `now < start_at`, it renders `PreStartStep` instead of the step sequence.
- **Component**: `PreStartStep` (`components/steps/`) — renders the translated text, then a client-side countdown computed from `start_at` (e.g. `setInterval` tick, `start_at - now`).
- **Transition on zero**: once the countdown hits zero, flip local state to render the normal step sequence (starting at `intro`) — no server round-trip or page reload needed, since `start_at` was already known client-side.
- **Telemetry**: page-view event only (consistent with today's `PageSetUp` pattern) — no form fields, no submission on this step.

## Alternatives considered
- **Static "come back later" message, no countdown** — rejected: worse UX than a live countdown, no added simplicity.
- **Server-side gating via Next.js Middleware** — rejected: contradicts the "stays fully static" decision in §10.1 of `migrationDesign.md`; the client already needs `start_at` to render the countdown, so client-side gating is no additional exposure.

## Consequences
- External API needs to expose `start_at` on the survey resource.
- Countdown accuracy depends on the visitor's local clock — see Open Questions.

## Open questions
- Clock-drift handling: do we trust `navigator` clock as-is, or reconcile against server time (e.g. an offset returned alongside the survey payload) to avoid a respondent with a fast/slow clock seeing an incorrect countdown?
- Is `pre_start` a fixed override (like `closing`) rather than an `order`-positioned `SurveyStep`, or does it still occupy a slot in the ordered list? Tentatively an override — needs confirming against `intake_field`/`question_set` ordering once the journey loader is designed.
- Should admin/preview links bypass the pre-start gate entirely?
- Exact countdown display format (days/hours/minutes/seconds granularity, localization of duration units).
