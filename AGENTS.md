<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:testing-rules -->
# Test-First Development (TDD)

ALL AI agents working in this codebase MUST follow test-first development without exception.

## Rules

1. Write the test before writing the implementation. No new module, component, function, hook, or utility gets written without a corresponding test file created first.
2. Tests live in a `*.test.tsx` / `*.test.ts` file co-located with the source file they cover. Example: `LanguageSelector.tsx` → `LanguageSelector.test.tsx`.
3. Test coverage must cover: the happy path, at least one edge case, and at least one error or null state — for every public function or component.
4. When modifying existing code, update or extend the existing test file BEFORE touching the implementation. If no test file exists, create one as the first step.
5. Do not mark a task complete if tests are failing. Run the test suite and fix failures before wrapping up.
6. Do not delete or disable tests to make the build pass. If a test is wrong, fix the test logic — not by commenting it out or skipping it.
7. Mocks are only acceptable at true system boundaries (external APIs, third-party SDKs, browser APIs unavailable in the test runner). Never mock your own modules.

## Test stack

- Runner: Vitest (`vitest.config.mts`, jsdom environment)
- React: `@testing-library/react` — use `fireEvent` for interactions (`@testing-library/user-event` is not installed)
- Assertions: Vitest's built-in `expect` — `@testing-library/jest-dom` is not installed, so do not use its matchers
- Import from `vitest`: `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`

Read `package.json` and `vitest.config.mts` to confirm the actual installed versions before assuming any API is available.
<!-- END:testing-rules -->

<!-- BEGIN:design-doc-rules -->
# Design Documents

All significant features, architectural decisions, and non-trivial changes MUST be accompanied by a design document in the `design/` folder.

## When a design doc is required

- Any new page, major component, or user-facing feature
- Any change to routing, auth, i18n, or data-fetching strategy
- Any new integration (third-party API, service, SDK)
- Any refactor that touches more than two files
- Any decision with meaningful trade-offs (e.g. state management approach, caching strategy)

For a pure bug fix with an obvious cause and fix, a design doc is NOT required — a clear commit message is sufficient.

## File naming and location

All design docs live in `design/`. Use kebab-case: `design/tenant-routing.md`, `design/language-selector.md`.

## Required structure

Every design doc must contain these sections in order:

```
# [Feature / Decision Title]

## Status
Draft | Review | Accepted | Superseded by [link]

## Context
One paragraph: what problem this solves and why now. Include any constraints (deadline, compliance, client requirement).

## Decision
What we are doing. Be specific enough that an AI agent reading this can implement it without asking clarifying questions.

## Design
How it works — data flow, component tree, API contracts, state shape, sequence diagrams in plain text or mermaid. Include file paths for all new or changed files.

## Alternatives considered
What else was evaluated and why it was rejected.

## Consequences
What gets easier, what gets harder, what follow-up work is created.

## Open questions
Unresolved items that must be answered before implementation can start. Remove this section when all questions are answered.
```

## AI agent obligations

- Before implementing a feature covered by a design doc, read the doc and follow it. If the doc is out of date or conflicts with reality, update the doc first, then implement.
- After completing an implementation, update the design doc `Status` to `Accepted` and remove any resolved `Open questions`.
- When a design decision is superseded, do not delete the old doc — update its `Status` to `Superseded by design/new-doc.md`.
- Design docs are source of truth. If the code and the design doc disagree, flag it explicitly before proceeding.
<!-- END:design-doc-rules -->
