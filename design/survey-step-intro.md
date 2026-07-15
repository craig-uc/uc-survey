# Survey Step — Intro

## Status
Draft

## Context
`migrationDesign.md` §7.2 originally bundled `intro`/`closing` as one combined "static text" step concept. Splitting them out (see the note in that section) gives `intro` its own doc, since its trigger and position in the flow differ from `closing` and the new `pre_start` step. `intro` is the direct generalization of the current app's intro gate — the starting page of an open survey.

## Decision
`intro` is a `SurveyStep` of type `intro`: the first step a respondent sees once the survey is open (i.e. once any `pre_start` gate has passed, or immediately if `Survey.start_at` is unset). It renders tenant-authored, translated rich text with a single "Continue" action into the rest of the flow (`intake_field`/`question_set` steps, per the `order` of remaining `SurveyStep`s).

## Design
- **Data**: intro copy (heading/body, rich text) authored per-survey, resolved to the visitor's locale via the `Translation` entity, same mechanism as other step content in §7.1/§7.2.
- **Component**: `IntroStep` (`components/steps/`) — renders the translated content inside `GlassPanel`, with a `submit`-type nav button (per `design/components/glass-panel.md`) advancing to the next step in the `SurveyStep` order.
- **Position**: always the first entry a respondent reaches in the ordered step list once the survey is open — not time-gated itself (that's `pre_start`'s job).
- **Telemetry**: page-view event, consistent with today's `PageSetUp` pattern for the existing intro gate.

## Alternatives considered
- **Keep `intro`/`closing` as a single generic "static" step type** (the original §7.2 draft) — rejected per the splitting note: the two have different gating logic (`intro` has none beyond `pre_start` having passed; `closing` is time-gated on `end_at`) and diverging content needs, so a shared type would carry unused fields either way.

## Consequences
- Minimal — this is the least-changed of the three steps relative to today's existing intro gate; mostly a rename/generalization of existing behaviour onto the new `SurveyStep` model.

## Open questions
- None yet — flagged for expansion once the overall step-sequencing/journey-loader design is worked through (see `survey-step-prestart.md` and `survey-step-closing.md` for the related open questions on step ordering).
