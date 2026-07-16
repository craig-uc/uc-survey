# Survey Persisted Data Model (DB Schema)

## Status
Accepted

## Context
`Survey` is the primary object in this platform, but no persisted schema has ever been specified — only a frontend TS shape (`src/features/survey/types.ts`) used against mock data, and a conceptual sketch in `design/migrationDesign.md` §7.1. Per `migrationDesign.md`, the real database is owned and operated by the external API (this repo never connects to it directly), but that schema still needs to be specified here since the API/admin console will be built against it.

This doc formalizes the core of the `Survey` record: `name` (displayable, required), `description` (optional), `slug` (required, unique per tenant, used in the respondent-facing URL — see `design/survey-routing.md`), `startAt`/`endAt` (UTC, required at the application layer), and the lifecycle fields already established for the frontend/admin listing feature — `status`, `pendingSubState`, `version` (see `design/survey-listing.md`). Target engine is MySQL 8.4. Validation (required-ness, format, date-range rules) is owned entirely by the UI and the external API — the DB schema itself carries no `NOT NULL`/`CHECK` constraints tied to business rules; columns default to type-appropriate blanks instead (empty string for text, `NULL` for dates, `1` for the initial version).

## Decision
Specify a `surveys` MySQL table with a UUID primary key (referenced directly in the UI — e.g. in admin edit URLs — so it must not be easily guessable/enumerable the way a sequential int would be), a plain string `tenant_code` column (no `tenants` table exists in this system — tenant identity is resolved from the URL segment at the application layer, same as the existing `getTenantCode()` convention in `design/features/tenant.md`), the core content/date fields, the three lifecycle fields, and `created_at`/`updated_at` audit timestamps.

One deliberate carve-out from "no DB validation," confirmed to stay: a **unique index on `(tenant_code, slug)`**. This is treated as *structural integrity* (two rows that would make `findSurvey(tenantCode, slug)` ambiguous), not *business-rule validation* (required-ness, format, date logic).

## Design

### Table: `surveys`

```sql
CREATE TABLE surveys (
  id                CHAR(36)     NOT NULL,
  tenant_code       VARCHAR(50)  NOT NULL DEFAULT '',
  name              VARCHAR(255) NOT NULL DEFAULT '',
  description       TEXT         NOT NULL DEFAULT '',
  slug              VARCHAR(150) NOT NULL DEFAULT '',
  status            VARCHAR(20)  NOT NULL DEFAULT '',
  pending_sub_state VARCHAR(20)  NOT NULL DEFAULT '',
  version           INT          NOT NULL DEFAULT 1,
  start_date        DATETIME     NULL     DEFAULT NULL,
  end_date          DATETIME     NULL     DEFAULT NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE INDEX uq_surveys_tenant_slug (tenant_code, slug),
  INDEX idx_surveys_tenant_code (tenant_code)
);
```

### Column notes

| Column | Type | Default | Rationale |
|---|---|---|---|
| `id` | `CHAR(36)` | none — app-generated | UUID primary key, referenced directly in the UI (e.g. admin edit URLs), so it must not be sequentially guessable. Stored as a canonical `8-4-4-4-12` string, not `BINARY(16)`, so it round-trips to/from the API and UI with zero conversion. **MySQL cannot generate this as a column `DEFAULT`** — `UUID()` is non-deterministic and MySQL disallows non-deterministic expressions as a regular-column default, so the API layer must generate the UUID (e.g. via `UUID()` in the insert statement, or app-side) before every insert. See Alternatives considered. |
| `tenant_code` | `VARCHAR(50)` | `''` | Tenant identity as a plain string sourced from the URL (`/{tenant}/...`), matching `getTenantCode()` — no `tenants` table to reference, so no FK. |
| `name` | `VARCHAR(255)` | `''` | Displayable title. Required at the app/API layer; DB has no `NOT NULL`-with-business-meaning constraint, just the string-blank convention. |
| `description` | `TEXT` | `''` | Optional at the app layer. Still follows the blanket "strings default to blank" rule rather than allowing `NULL`, so the column never needs a null-check — an absent description is just an empty string. MySQL 8.4 supports a literal default on `TEXT` (available since 8.0.13). |
| `slug` | `VARCHAR(150)` | `''` | The URL-identifying reference, unique per tenant. Required at the app/API layer. |
| `status` | `VARCHAR(20)` | `''` | Mirrors the frontend `SurveyStatus` union (`pending`/`active`/`closed`/`deleted`, `design/survey-listing.md`). Stored as a plain string, not a MySQL `ENUM`, so adding a new status value is a pure application-layer change, never a schema migration. |
| `pending_sub_state` | `VARCHAR(20)` | `''` | Mirrors `PendingSubState` (`design`/`review`/`published`), meaningful only when `status = 'pending'`. Follows the same blank-default convention as every other string column rather than allowing `NULL` — the app treats an empty string as "not applicable," same as it would treat a `NULL`. |
| `version` | `INT` | `1` | Every survey starts at version 1; editing an `active` survey creates a new row at `version + 1` per `design/survey-listing.md`'s versioning model. |
| `start_date` / `end_date` | `DATETIME` | `NULL` | Stored and read as UTC by convention — `DATETIME` (not `TIMESTAMP`) so MySQL never implicitly converts based on a connection's session `time_zone`; see Alternatives considered. Required at the app/API layer, but nullable in the DB per instruction (dates default to `NULL`). |
| `created_at` / `updated_at` | `DATETIME` | `CURRENT_TIMESTAMP` | Standard audit columns, not requested explicitly but confirmed in scope. Same UTC-by-convention rule applies — the connection/application must write UTC. |

### Mapping to the existing frontend type
`src/features/survey/types.ts` currently has `id: string`, `tenantCode`, `slug`, `name`, `status`, `pendingSubState`, `version`, `startAt`/`endAt` (nullable strings). Every field now has a direct column counterpart: `id` (UUID string, no conversion needed), `tenant_code`/`name`/`slug`/`status`/`pending_sub_state`/`version`/`start_date`/`end_date` map 1:1 to `tenantCode`/`name`/`slug`/`status`/`pendingSubState`/`version`/`startAt`/`endAt`. `pendingSubState` is `?:` (optional) on the frontend type but always present as `''` when not applicable in the DB — the API layer should omit it from the JSON payload (or map `''` → `undefined`) when `status !== 'pending'`, to preserve the existing frontend contract.

## Alternatives considered
- **`INT UNSIGNED AUTO_INCREMENT` primary key** (the original draft of this doc) — rejected per your explicit instruction: the id is referenced directly in the UI (e.g. admin edit URLs), and a sequential int makes surveys trivially enumerable/guessable by walking the counter. A UUID removes that.
- **`BINARY(16)` storage for the UUID** (via `UUID_TO_BIN()`/`BIN_TO_UUID()`) instead of `CHAR(36)` — considered, rejected for this pass. `BINARY(16)` halves storage and indexes faster at large scale, but requires a conversion function on every read/write path and every ad-hoc query. Given this is a survey platform (not an internet-scale table), `CHAR(36)` is chosen for simplicity — it's exactly the string the UI/API already pass around, with zero conversion. Revisit if `surveys` ever approaches a row count where index size becomes a measured problem.
- **DB-generated UUID default** (e.g. `DEFAULT (UUID())`) — not possible in MySQL: `UUID()` is non-deterministic, and MySQL only permits deterministic expressions (plus the special-cased `CURRENT_TIMESTAMP`) as a regular column's `DEFAULT`. The API must generate the id and supply it on `INSERT`.
- **`TIMESTAMP` instead of `DATETIME`** for the date columns — rejected. MySQL `TIMESTAMP` implicitly converts on both write and read based on the connection/session `time_zone`, which risks silent drift away from UTC if any client or server config ever runs with a non-UTC session zone. `DATETIME` stores the literal value with no implicit conversion, so "always UTC" is enforced purely by application convention — a deliberate, documented trade-off rather than relying on server configuration to stay correct.
- **FK to a `tenants` table** — rejected per your explicit answer: no `tenants` table exists in this system yet; tenant identity is a routing-derived string, consistent with the existing `getTenantCode()` pattern rather than a new relational dependency.
- **`NOT NULL`/`CHECK` constraints for the "required" business fields** (`name`, `slug`, `start_date`, `end_date`) — rejected per your explicit instruction that the DB performs no validation; required-ness is enforced in the UI and the external API only.
- **`NULL` default for optional/required strings instead of blank** — rejected per your explicit instruction; all string columns default to `''`, regardless of whether the field is optional (`description`, `pending_sub_state`) or required (`name`, `slug`, `status`) at the application layer, since the DB doesn't distinguish the two.
- **MySQL `ENUM` for `status`/`pending_sub_state`** — rejected. An `ENUM` is itself a DB-level validation constraint (an insert with an out-of-range value fails), which conflicts with "no validation on DB"; a plain `VARCHAR` keeps the value set entirely an application-layer concern.
- **No unique index at all on `(tenant_code, slug)`**, treating "no DB validation" literally with zero exceptions — considered, not chosen (confirmed to keep the index). Without it, nothing at the DB layer prevents two concurrent API requests from creating duplicate `(tenant_code, slug)` rows, which would make `findSurvey` ambiguous (see `design/survey-routing.md`, `design/survey-listing.md`).

## Consequences
- Uniqueness of `(tenant_code, slug)` is the one DB-level constraint this table carries, despite "no validation on DB" — a confirmed, deliberate exception.
- The API is now responsible for UUID generation on insert (MySQL cannot default-generate it) — a code-level requirement for whoever implements the API, not something this schema enforces.
- `status`/`pending_sub_state` are unconstrained strings — the DB will silently accept any value, including ones the frontend's `SurveyStatus`/`PendingSubState` unions don't recognize. Keeping the value set in sync is entirely an API/application discipline.
- All UTC-correctness rests on application discipline (always write/read UTC through `DATETIME` columns) rather than DB enforcement — a documentation/code-review concern for whichever team implements the API, not something this schema can guarantee by itself.
