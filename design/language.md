# Language Feature

## Overview

The language feature manages locale selection, persistence, and enforcement for tenant-scoped, language-prefixed
routes (/{tenant}/{lang}/...).

## Behaviour

- On /{tenant}: no language is selected. LanguageSelector is rendered, presenting the available options for that tenant.
- On /{tenant}/{lang}/...: LangInitializer reads the URL param, sets lang in GlobalStateContext, and updates
  document.documentElement.lang. LangGuard runs in the background and enforces the stored preference.
- Language options: sourced from TENANT_LOCALES config in src/app/lib/i18n/locales.ts. Each tenant has its own list;
  unknown tenants fall back to ["en"].
- Detected language: resolved client-side after hydration in this priority order:
    1. localStorage key "lang" — set when the user explicitly selects a language.
    2. navigator.language (first segment, e.g. "es" from "es-419") — the browser's default language.
    3. null — if neither resolves to a valid locale for the tenant.
       The detected locale is used to pre-highlight the matching button and to drive the language passed to
       /api/language/field for label and title translation. If GlobalStateContext.lang is already set (i.e. on a
       /{tenant}/{lang}/... page), that takes precedence over detected for API calls (savedLang ?? detected).
- Labels: human-readable names for each locale code are derived from Intl.DisplayNames.
- Title: the prompt text ("Select your language") is resolved from preloaded EN labels (passed as props from the
  Server Component) when the effective locale is English, otherwise fetched from /api/language/field with label
  "selectLanguage". Results are cached in a module-level Map for the browser session.
- Site translation notice: when showSiteTranslation is true, the siteTranslation label is resolved from preloaded EN
  labels when the effective locale is English, otherwise fetched from /api/language/field. If the external API returns
  the label untranslated, the internal API substitutes the default English text.
- Tracking: when the user selects a language and a user identity is present, a POST is fired to /api/track/language
  before navigating.
- Persistence: on selection, the chosen locale is written to localStorage key "lang" before navigation.
- Navigation: selection pushes /{tenant}/{locale} or /{tenant}/{locale}/{destination} via Next.js router.

## LangGuard redirect rules

Runs client-side after hydration on every /{tenant}/{lang}/ page load. Executes in order:

| Condition                                 | Action                                                 |
  |-------------------------------------------|--------------------------------------------------------|
| No "lang" in localStorage                 | No redirect — URL lang is accepted as-is               |
| Stored lang is not valid for the tenant   | Remove "lang" from localStorage; redirect to /{tenant} |
| Stored lang differs from URL lang (valid) | Redirect to /{tenant}/{storedLang}/{rest of path}      |
| Stored lang matches URL lang              | No redirect                                            |

Path segments beyond /{tenant}/{lang} are preserved on mismatch redirects.
Example: /acme/en/auth/loginSent with stored lang "af" -> /acme/af/auth/loginSent

## Structure

| src/features/language/          |                                                                                                                                                                              |
|---------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| LanguagePage.tsx                | Server component — full page composition: IdentityInitializer, GlassPanel, and LanguageSelector with showSiteTranslation. Accepts enLabels (preloaded EN labels) from app/[tenant]/page.tsx and passes to LanguageSelector. |
| LanguageSelector.tsx            | Client component — renders locale buttons, handles detection, label resolution, tracking, localStorage persistence, and navigation. Exports clearLabelCache() for test use. |
| LanguageSelector.test.tsx       | Tests.                                                                                                                                                                       |
| index.ts                        | Barrel export (LanguageSelector, LanguagePage).                                                                                                                              |
| **api/**                        |                                                                                                                                                                              |
| field.ts                        | fetchField(tenant, lang, label) — calls JOURNEY_API/standard_field with next: { revalidate: 86400 }; substitutes defaults when untranslated. POST handler wraps fetchField for client-side route use. |
| **src/app/api/language/field/** |                                                                                                                                                                              |
| route.ts                        | Next.js route — re-exports POST from features/language/api/field.                                                                                                            |
| **src/app/lib/i18n/**           |                                                                                                                                                                              |
| locales.ts                      | Config and utilities — TENANT_LOCALES, getTenantLocales(), isValidLocale(), isValidLocaleForTenant().                                                                        |
| **src/app/[tenant]/[lang]/**    |                                                                                                                                                                              |
| layout.tsx                      | Layout for all [lang] routes — renders LangInitializer + LangGuard.                                                                                                          |
| LangInitializer.tsx             | Sets GlobalStateContext lang from URL param; syncs document.documentElement.lang.                                                                                            |
| LangGuard.tsx                   | Background redirect enforcer — mismatch and invalid-lang handling.                                                                                                           |
| LangGuard.test.tsx              | Tests.                                                                                                                                                                       |

## Config

TENANT_LOCALES in locales.ts is the single source of truth for available languages per tenant.

| tenant   | languages                                                                                                                  |
|----------|----------------------------------------------------------------------------------------------------------------------------|
| urup:    | en, af, st, tn, xh, zu                                                                                                     |
| dpw-eu:  | de, en, es, fr, el, it, hu, nl, pl, ro, sr, sv, tr, uk                                                                     |
| dpw-gbl: | fr, de, es, it, pt, nl, tr, ro, el, sr, uk, pl, hu, sk, sv, en, zh, vi, th, id, so, ur, hi, mr, te, ta, ml, kn, gu, ar, ko |

Unknown tenant -> ["en"].

## GlobalStateContext

| state    | type                         | use                                                                                                                           |
|----------|------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| lang:    | string or null               | the active locale, set by LangInitializer on route entry.                                                                     | 
| setLang: | lang: string or null => void | used by LangInitializer; consumed by components making language-aware API calls (NavButton -> StandardButton -> JOURNEY API). |

API route: /api/language/field

POST body: { label, tenant_code, language }

- label: the field to resolve ("selectLanguage" or "siteTranslation")
- tenant_code defaults to "urup" if absent or blank
- language defaults to "en" if absent or blank
- application is taken from process.env.APPLICATION server-side (not passed by client)

Returns: { message: string }

- If JOURNEY_API returns the label unchanged (case-insensitive match), the handler substitutes the default English text:
    - "selectlanguage" -> "Select your language"
    - "sitetranslation" -> "This site has been automatically translated. Some wording may not be exact."
- If JOURNEY_API is not configured, returns the default text directly.

## LanguageSelector

Props:

- page (string), version (string) — passed through to the tracking payload.
- destination (string, optional) — path segment appended after /{tenant}/{locale} on navigation.
- showSiteTranslation (boolean, default false) — when true, fetches the siteTranslation label and renders it as a
  paragraph below the locale buttons.

Reads:

- tenant from useParams()
- lang, user, isHydrated from useGlobalState()
- locale list from getTenantLocales(tenant)

Renders a button per locale. GlassPanel is applied by LanguagePage.

## LanguagePage

Owns the full page composition for app/[tenant]/. Renders IdentityInitializer, GlassPanel, and LanguageSelector (with
showSiteTranslation). app/[tenant]/page.tsx is an async Server Component that preloads EN labels and passes them as
enLabels.

destination="auth" navigates to /{tenant}/{locale}/auth after selection.

## Caching

Labels are static content that rarely changes. Three caching layers work together:

Server-side (Next.js data cache):
- fetchField uses next: { revalidate: 86400 } on the JOURNEY_API fetch.
- The result for each {tenant, lang, label} combination is cached for 24 hours by the Next.js server.
- Applies to both the server preload (page.tsx) and client-triggered API route calls (/api/language/field).

EN preload (Server Component):
- app/[tenant]/page.tsx is an async Server Component.
- On each page render it calls fetchField for EN selectLanguage and siteTranslation in parallel and passes them
  as enLabels to LanguagePage → LanguageSelector.
- The client receives labels embedded in the rendered HTML — no client-side fetch required for English users.

Client-side module cache (labelCache Map):
- LanguageSelector holds a module-level Map keyed by "{tenant}:{lang}:{label}".
- On mount, enLabels are seeded into the cache under their EN keys.
- For non-EN locales, fetchLabel checks the cache before calling /api/language/field.
- Subsequent mounts within the same browser session reuse cached values; no repeat HTTP calls.
- clearLabelCache() exported for test isolation (called in beforeEach).

## Data flow

URL /{tenant} (no lang selected)
+ app/[tenant]/page.tsx (Server Component) calls fetchField("en", ...) — hits Next.js cache or JOURNEY_API
+ LanguagePage passes enLabels to LanguageSelector
+ LanguageSelector initialises title/siteTranslation from enLabels; seeds labelCache with EN values
+ If detected lang is EN: no fetch made
+ If detected lang is non-EN: fetchLabel checks module cache, then /api/language/field if not cached
+ User clicks a locale button
+ localStorage.setItem("lang", locale)
+ /api/track/language POST (if user present)
+ router.push(/{tenant}/{locale}/auth)

URL /{tenant}/{lang}/...
+ LangLayout renders LangInitializer + LangGuard + children
+ LangInitializer sets lang in GlobalStateContext
+ LangGuard (after hydration) checks localStorage vs URL; redirects if needed
+ Downstream components read lang via useGlobalState()
