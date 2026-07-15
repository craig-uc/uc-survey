# Survey Listing (per-tenant home page)

## Status
Accepted

## Context
Every non-`urup` tenant needs a home page listing their surveys grouped by lifecycle state, with an "add new survey" action, and edit/delete actions gated by state. The existing `Survey` model (`src/features/survey/types.ts`) only has `status: "draft" | "published" | "closed"` with no versioning and no concept of an approval workflow — it was built purely to drive the anonymous respondent-facing flow (`(anonymous)/[survey]/page.tsx` → `getSurveyPhase`). This feature requires extending that model without breaking the respondent flow.

Required states per the request: **Active**, **Pending** (sub-states: design → review → published), **Closed**, **Deleted**. Rules:
- Closed and Deleted surveys cannot be edited.
- Active surveys can be edited, but editing must produce a new version rather than mutating the live one.
- Pending-published, Closed, and Active surveys cannot be deleted (only Pending-design and Pending-review can be).

## Decision
Extend `Survey` with `status: "pending" | "active" | "closed" | "deleted"`, an optional `pendingSubState: "design" | "review" | "published"` (present only when `status === "pending"`), a `version: number`, and an `id`/`name` for admin display and lookup. `"draft"` is renamed to `"pending"` (defaulting to sub-state `"design"`) and `"published"` is renamed to `"active"` — this is a rename, not a new orthogonal concept, since both described "is this survey live for respondents".

**Versioning**: editing an `active` survey creates a new `Survey` record — same `tenantCode`/`slug`, `version: activeVersion + 1`, `status: "pending"`, `pendingSubState: "design"` — and leaves the original `active` record untouched. The public respondent-facing lookup (`findSurvey`) continues to resolve to the currently-active (or closed) record until the new version itself reaches `active`, at which point the old version's own status is left as-is for history (it is not auto-closed by this feature — no requirement specifies that transition, so it's out of scope here). Editing a `pending` survey (design/review) edits that same record in place — no version bump, since it has never gone live.

**Edit/delete permissions**, centralized in `src/features/survey-management/permissions.ts` so the rule lives in exactly one place:
```ts
canEdit(survey)   → status is "active" or "pending"   (closed/deleted → false)
canDelete(survey) → status === "pending" && pendingSubState !== "published"
```

## Design

### Data model
`src/features/survey/types.ts`:
```ts
export type SurveyStatus = "pending" | "active" | "closed" | "deleted";
export type PendingSubState = "design" | "review" | "published";
export type SurveyPhase = "prestart" | "intro" | "closing";

export interface Survey {
  id: string;
  tenantCode: string;
  slug: string;
  name: string;
  status: SurveyStatus;
  pendingSubState?: PendingSubState; // set iff status === "pending"
  version: number;
  startAt: string | null;
  endAt: string | null;
}
```

`getSurveyPhase.ts` mapping updates 1:1 with the rename (`"draft"`→`"pending"`, `"published"`→`"active"`); `"deleted"` is never passed in (see below) so it needs no explicit branch.

`findSurvey(tenantCode, slug)` in `mockSurveys.ts` must resolve multiple version records sharing a slug to the one respondents should see:
```ts
export function findSurvey(tenantCode: string, slug: string): Survey | undefined {
  const candidates = MOCK_SURVEYS.filter(
    (s) => s.tenantCode === tenantCode && s.slug === slug && s.status !== "deleted"
  );
  if (candidates.length === 0) return undefined;
  const live = candidates.find((s) => s.status === "active" || s.status === "closed");
  return live ?? candidates.sort((a, b) => b.version - a.version)[0];
}
```
Rationale: deleted is always excluded (not-found). If a live (active/closed) version exists, it wins even if a newer pending draft exists for the same slug — a draft edit must never hijack the public URL. If nothing has ever gone live, the highest-version pending record shows (preserves today's "draft shows prestart / coming soon" behavior).

### New feature: `src/features/survey-management/`
- `listSurveysByTenant(tenantCode): Survey[]` — filters `MOCK_SURVEYS` by tenant (excludes nothing; Deleted surveys still appear in their own "Deleted" tab).
- `permissions.ts` — `canEdit`, `canDelete` as above.
- `createNewVersion(survey): Survey` — the version-bump helper described above, used by the edit action on an `active` survey.
- `SurveyListing.tsx` — renders four sections/tabs (Active, Pending, Closed, Deleted) via `GlassPanel`, each survey row showing name, version, and (for Pending) its sub-state badge. Edit button visible iff `canEdit`; Delete button visible iff `canDelete`. An "Add new survey" button always visible.
- `NewSurveyButton.tsx` — on click, creates a new `Survey` (`status: "pending"`, `pendingSubState: "design"`, `version: 1`) and navigates to `/{tenant}/{lang}/surveys/{id}`.
- `EditSurveyButton.tsx` — on click: if `status === "active"`, calls `createNewVersion` first and navigates to the new record's edit URL; if `status === "pending"`, navigates straight to its edit URL.

### New route (placeholder editor)
`src/app/[tenant]/[lang]/(authenticated)/surveys/[surveyId]/page.tsx` — a stub `GlassPanel` page ("Survey editor coming soon", shows the survey id/name/version). The actual editor UI is out of scope for this feature per the confirmed scope decision — a separate design doc covers it when built.

### home/page.tsx integration
For any `tenantCode !== "urup"`, `home/page.tsx` renders `<SurveyListing tenantCode={tenantCode} />` (see `design/features/tenant-listing.md` for the branching logic).

### Tests
- `mockSurveys.test.ts` / `getSurveyPhase.test.ts`: update fixtures for the renamed statuses (`pending`/`active`) and extend with version/deleted/pending-published cases — including a same-slug two-version scenario (old `active` v1 + new `pending` v2) proving `findSurvey` still resolves to v1.
- `permissions.test.ts`: table-driven — every `status`/`pendingSubState` combination against `canEdit`/`canDelete`.
- `createNewVersion.test.ts`: happy path (bumps version, resets to pending/design), edge case (only callable conceptually on active — test documents behavior if called on a non-active survey is not a supported input, so no defensive branch is added per YAGNI — the button only ever calls it when `status === "active"`).
- `SurveyListing.test.tsx`: renders surveys grouped into the correct section by status; edit/delete buttons appear/disappear per permission rules; empty-section state; "Add new survey" always rendered.
- `NewSurveyButton.test.tsx`, `EditSurveyButton.test.tsx`: navigation target assertions, version-bump-on-active-edit behavior.

## Alternatives considered
- **Keep `pending`-published as a fourth top-level status instead of a sub-state of Pending**: rejected — the user explicitly confirmed Pending is a workflow gate with design/review/published as its sub-states, i.e. "published" here means "approved, waiting to go live", not "live".
- **Auto-close the old version when a new version goes active**: rejected — not specified by the request; adding it now would be scope creep beyond what was asked, and is a natural, isolated follow-up once real backend/versioning exists.
- **Mutate the active survey in place on edit**: rejected — the request explicitly requires a new version on edit of an active survey.
- **Full survey editor in this feature**: rejected — user confirmed a placeholder route is sufficient for now.

## Consequences
- Anonymous respondent-flow fixtures/tests must be updated for the `draft`→`pending`, `published`→`active` rename — no behavioral change for respondents, but every test referencing the old string literals needs updating.
- `MOCK_SURVEYS` gains `id`/`name`/`version` on every entry; any other code reading `Survey` objects (none currently outside `features/survey`) is unaffected.
- Opens the door for a real survey editor and a real "close superseded version" workflow as follow-up work, without needing another data-model migration.
