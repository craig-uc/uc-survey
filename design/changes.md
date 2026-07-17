# Change Log

## 0.1.0
***

## 0.0.0
### 0.0.8
#### 2026-07-17
+ Change glasspanel in admin to full screen
### 0.0.7
#### 2026-07-17
+ Every page under `/admin/*` now shows the breadcrumb bar — previously only the dashboard page had one. `/admin/home` shows a single active "Home" crumb, `/admin/surveys` shows Home / Surveys, and `/admin/surveys/[surveyId]` shows Home / Surveys / the survey id
### 0.0.6
#### 2026-07-17
+ Login now lives at the site root (`/`) as a single entry point for every tenant, replacing the old per-tenant login page
+ Signed-in users now work under `/admin/*`; home (`/admin/home`) is now always the tenant picker, no longer doubling as a survey list for non-urup tenants
+ The survey list is now its own page (`/admin/surveys`), reached by picking a tenant from home
+ Logging out now always returns to the root login page, regardless of which tenant you were viewing
### 0.0.5
#### 2026-07-16
+ Added a design doc for the Survey object's persisted DB schema (MySQL) — UUID primary key, tenant-scoped unique slug, lifecycle fields (status/pendingSubState/version), and UTC-safe date columns
+ Reorganized design docs so all Survey-specific docs live directly under `design/`, separate from other feature docs kept in `design/features/`
### 0.0.4
#### 2026-07-15
+ Tenant list on the urup home page now shows live tenants from the tenant API, replacing the placeholder list used during development
+ Fixed the tenant list showing fewer tenants than the API actually returned — `urup` was being incorrectly excluded from its own list
### 0.0.3
#### 2026-07-15
+ Fixed magic-link login always failing with "code expired or already used" — the sign-in page was reading the wrong URL parameter and never picked up the actual login token
+ Fixed unauthenticated visits to the home page (and post-login redirects) landing on a broken login URL that incorrectly displayed "Survey Not Found"
+ Sign-in now correctly passes tenant and language through to the backend, defaulting to `urup` and `en` when not specified
+ Added server-side logging of the reason a sign-in attempt is rejected, to make future login issues easier to diagnose
### 0.0.2
#### 2026-07-15
+ Login form now submits on Enter, not just on button click
+ Fixed root login page (`/`) so the Login button hides once the magic-link email has been sent, matching the `/auth` login page
+ Login button shows a busy spinner and disables while a login request is in flight, whether submitted by click or by pressing Enter
### 0.0.1
#### 2026-07-14
+ Setup application
***
