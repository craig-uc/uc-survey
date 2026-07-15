# Survey Step — Closing

## Status
Draft

## Context
`migrationDesign.md` §7.2 originally bundled `intro`/`closing` as one combined "static text" step concept. Splitting them out (see the note in that section) gives `closing` its own doc. Unlike today's fixed "Thank-you" gate (reached only after submission), the generalized platform also needs a hard cut-off: once a survey's scheduled end time passes, the survey should stop accepting responses even for a respondent mid-flow.

## Decision
Add `Survey.end_at` (nullable timestamp). `closing` is a `SurveyStep` of type `closing`, rendered in two cases:
1. **Natural completion** — a respondent finishes the last `question_set` step and submits, same as today's Thank-you gate.
2. **Time-based force-close** — `now > end_at`, which overrides whatever step the respondent would otherwise be on, even mid-survey.

No `end_at` set means no time-based gating — `closing` is only reached via natural completion, same as today.

## Design
- **Data**: `Survey.end_at` (ISO datetime, nullable). Closing copy (heading/body) authored per-survey, translated via `Translation`, same as other static steps.
- **Gating point**: same journey loader that checks `start_at` for `pre_start` also checks `end_at` before rendering any requested step — if `now > end_at`, render `ClosingStep` regardless of which step was requested/in-progress.
- **Component**: `ClosingStep` (`components/steps/`) — renders the translated content; no further navigation (terminal step).
- **Telemetry**: page-view/completion event, generalized from today's tracking pattern — distinguishing a natural-completion closing view from a force-closed one is an open question (see below), since it affects whether a "submission" event should fire.

## Alternatives considered
- **Single `closing` variant with no distinction between natural-completion and time-forced** — plausible simplification, but risks conflating "you finished" with "the survey ended before you finished," which are different messages to a respondent. Left open below rather than decided now.

## Consequences
- External API needs to expose `end_at` on the survey resource.
- Any in-progress response state (partial answers) for a respondent who gets force-closed needs a defined fate (discarded vs. partial-submit) — not yet designed.

## Open questions
- Does natural-completion `closing` and time-forced `closing` share the same copy/content, or does the tenant author two variants (e.g. "Thank you for completing the survey" vs. "This survey has now closed")?
- What happens to an in-progress respondent's unsaved answers when force-closed mid-`question_set` — silently discarded, or a partial submission recorded?
- Is `closing` (time-forced case) an override like `pre_start`, or does it only ever apply at the natural end of the `order`ed sequence? Tentatively: override for the time-forced case, fixed-position for the natural-completion case — needs reconciling once the journey loader is designed.
- Should a force-closed respondent's session be able to resume if `end_at` is later extended by an admin before they'd have naturally finished?
