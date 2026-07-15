
# AuthFlow Component

## Overview

`AuthFlow` is a self-contained React component that manages the full magic-link authentication flow. It renders panel content only — no outer layout or page chrome — so it can be placed inside any container (GlassPanel, DisplayBlock, card, etc.).

The feature module ships with its own API route handlers (`api/login.ts`, `api/signin.ts`). Copying `src/features/auth/` into a new project gives you the complete implementation — UI and server-side logic together. The Next.js route files (`app/api/auth/*/route.ts`) are thin re-exports.

---

## State Machine

```
[login] --submit email--> [sent]
[signing-in] --code prop on mount--> [success callback | error callback]
```

Three mutually exclusive steps are rendered:

| Step | Trigger | Renders |
|------|---------|---------|
| `login` | Default (no `code` prop) | Email form |
| `sent` | Successful POST to `/api/auth/login` | Confirmation message |
| `signing-in` | `code` prop is present | Spinner + calls `/api/auth/signin` |

The `login → sent` transition is internal. The `signing-in` outcome is delegated to the parent via callbacks.

---

## Props

```ts
interface AuthFlowProps {
  code?: string;             // magic-link code from URL; triggers signing-in step
  tenantCode?: string;
  logo?: React.ReactNode;
  hideLoginButton?: boolean; // hide the inline submit button; use with AuthFlowHandle for nav-pane placement
  onSignInSuccess?: (data: AuthSessionData) => void;
  onSignInError?: () => void;
  onStepChange?: (step: AuthStep) => void; // fires whenever the internal step changes, including on mount
  onSubmittingChange?: (submitting: boolean) => void; // fires whenever the login-submission in-flight state changes, including on mount
}
```

`AuthStep` is `"login" | "sent" | "signing-in"`, exported from `@/features/auth`. `onStepChange` exists so a parent rendering the login button in an external `GlassPanel` navigation pane (rather than `AuthFlow`'s own inline button) can hide it once there's nothing left to submit — see `admin/auth/page.tsx` below.

## Imperative handle

`AuthFlow` forwards a ref exposing `submitLogin`, which allows a parent to trigger the login from outside the form — for example, from a GlassPanel navigation button.

```ts
interface AuthFlowHandle {
  submitLogin: () => Promise<false>;
}
```

`submitLogin` validates the email, calls the login API, and manages the internal step transition. It always returns `false` so that a `NavButton` onClick does not trigger navigation after the call.

### Enter-to-submit

The email field's `<form>` has an `onKeyDown` handler that calls `submitLogin()` directly (with `preventDefault()`) whenever Enter is pressed, regardless of `hideLoginButton`. This is deliberate rather than relying on the browser's native implicit form submission: when `hideLoginButton` is set, the only visible "Login" control (e.g. the `GlassPanel` nav button in `admin/auth/page.tsx`) is rendered outside `AuthFlow`'s `<form>` entirely (`type="button"`, in a separate DOM subtree), so it can never be a form's native default button — Enter would otherwise do nothing in that layout.

### Reflecting busy state on an external button

`onSubmittingChange` fires with `status === "Submitting..."` whenever `status` changes (mount included), regardless of whether submission was triggered by clicking `AuthFlow`'s own inline button or by pressing Enter. `AuthFlow`'s inline button already reflects this correctly on its own (its `disabled`/label are derived from the same internal state).

When `hideLoginButton` is set, the visible button lives outside `AuthFlow` and manages its own busy/spinner state internally around its own `onClick` (see `StandardButton`'s [external loading override](standard-button.md#external-loading-override)) — it has no way to know a submission happened via Enter unless the parent tells it to. Consuming pages must wire `onSubmittingChange` to a `submitting` state and pass it through as `loading` on the button config (see `admin/auth/page.tsx` and `src/app/page.tsx`), or the external button will stay idle-looking while a keyboard-triggered submission is actually in flight.

`AuthSessionData` shape returned by `/api/auth/signin`:

```ts
interface AuthSessionData {
  user: string;
  tenant_code: string;
  app_settings: {
    show_tag_line: boolean;
    show_footer: boolean;
    show_menu: boolean;
    show_person_name: boolean;
    show_user_name: boolean;
    first_name: string;
    full_name: string;
    known_as: string;
    last_name: string;
    tag_line: string;
    application_title: string;
  };
}
```

---

## API Handlers

Both handlers live in `src/features/auth/api/` and are wired to Next.js routes via re-export.

### POST `/api/auth/login`

Request: `{ email: string, redirectUrl: string, tenantCode?: string }`

`redirectUrl` is the absolute URL of the `signIn` callback page (see Route Structure below) that the magic-link email should point at — it is built client-side in `AuthFlow.submitLogin` from `window.location.origin` + the current path + `/signIn`, so it reflects wherever the login form is actually mounted (tenant/lang segment included). Both `email` and `redirectUrl` are required; missing either returns 400.

Injects `ACCOUNT`, `APPLICATION`, `TENANT_APP`, `ENVIRONMENT` from env vars, then forwards the body (including `redirectUrl`) to `TRACKING_API/event-consumer`. Returns `{ success: true }` on success or an error JSON on failure.

### POST `/api/auth/signin`

Request: `{ code: string }`

Calls `TRACKING_API/event-consumer` with the code. On success: mints a signed JWT (`HS256`, `JWT_SECRET_KEY`), sets an `auth_token` HttpOnly cookie, returns `AuthSessionData`. On failure: returns a 403 error.

### Required environment variables

| Variable | Purpose |
|----------|---------|
| `TRACKING_API` | Base URL for the upstream auth/event API |
| `ACCOUNT` | Organisation account identifier |
| `APPLICATION` | Application identifier |
| `TENANT_APP` | Tenant-specific app identifier |
| `ENVIRONMENT` | Deployment environment (e.g. `production`) |
| `JWT_SECRET_KEY` | 256-bit secret for signing session JWTs |

---

## Integration

### Minimal usage — inline button (default)

```tsx
import { AuthFlow } from "@/features/auth";

<GlassPanel>
  <AuthFlow
    onSignInSuccess={(data) => {
      // store session, redirect
    }}
    onSignInError={() => {
      // clear session, redirect
    }}
  />
</GlassPanel>
```

### Login button in GlassPanel navigation pane

Implemented at `src/app/[tenant]/[lang]/(anonymous)/admin/auth/page.tsx`:

```tsx
import { useRef, useState } from "react";
import { AuthFlow, AuthFlowHandle, AuthStep } from "@/features/auth";

const authRef = useRef<AuthFlowHandle>(null);
const [step, setStep] = useState<AuthStep>("login");

<GlassPanel
  showTitle
  navigation={{
    buttons: [
      { type: "submit", label: "Login", href: "#", show: step !== "sent", onClick: () => authRef.current?.submitLogin() },
    ],
  }}
>
  <AuthFlow
    ref={authRef}
    hideLoginButton
    onStepChange={setStep}
    onSignInSuccess={(data) => { /* store session, redirect */ }}
    onSignInError={() => { /* clear session, redirect */ }}
  />
</GlassPanel>
```

`href="#"` is a placeholder — `submitLogin` always returns `false`, so `NavButton` never calls `router.push`. The nav button's `show` is tied to `onStepChange` so the button panel is empty once the step is `sent` (nothing left to submit); `GlassPanel`'s `Navigation` already filters out any button with `show === false`.

### Sign-in callback page (receives code from URL)

Implemented at `src/app/[tenant]/[lang]/(anonymous)/admin/auth/signIn/page.tsx`:

```tsx
import { Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { AuthFlow } from "@/features/auth";

function SignInContent() {
  const code = useSearchParams().get("code") || "NoCode";
  const router = useRouter();
  const { tenant, lang } = useParams<{ tenant: string; lang: string }>();

  return (
    <AuthFlow
      code={code}
      onSignInSuccess={() => router.push(`/${tenant}/${lang}/home`)}
      onSignInError={() => router.push(`/${tenant}/${lang}/admin/auth`)}
    />
  );
}

// Wrap in Suspense because useSearchParams requires it
export default function SignInPage() {
  return <Suspense><SignInContent /></Suspense>;
}
```

On success the user lands on `(authenticated)/home` (route groups don't appear in the URL, so this resolves to `/${tenant}/${lang}/home`). On error they're bounced back to the login form at `/${tenant}/${lang}/admin/auth`.

---

## Route Structure

| Route | Purpose |
|-------|---------|
| `/` | Email entry (root) — renders `AuthFlow` (no code) inside a `GlassPanel` nav button, same pattern as `/auth` below; implemented at `src/app/page.tsx` |
| `/auth` | Email entry — renders `AuthFlow` (no code); implemented at `src/app/[tenant]/[lang]/(anonymous)/admin/auth/page.tsx` |
| `/auth/signIn?code=xxx` | Magic-link callback — renders `AuthFlow` with code; implemented at `src/app/[tenant]/[lang]/(anonymous)/admin/auth/signIn/page.tsx` |

Both `/` and `/auth` follow the same "nav button lives outside `AuthFlow`'s `<form>`" pattern (see [Login button in GlassPanel navigation pane](#login-button-in-glasspanel-navigation-pane) above) — each must independently track `step` via `onStepChange` and pass `show: step !== "sent"` to the button config, or the button will stay visible after the email is sent. `src/app/page.tsx` was missing this wiring until it was added to match `admin/auth/page.tsx`.

The `loginSent` route has been removed; the sent state is managed internally by `AuthFlow`.

`redirectUrl` sent from the login form is derived from the login page's own path with `/signIn` appended, so it always resolves to the sibling `signIn` route above.

---

## Client-side session state

The JWT itself is never touched by client-side JS — it's set as an `HttpOnly` cookie by `signin.ts` and stays that way deliberately (mitigates XSS token theft). Instead, `onSignInSuccess` on the `signIn` page receives the `AuthSessionData` already present in the `/api/auth/signin` JSON response body and hydrates client-side app state from it via `useApplySession`:

- `src/features/auth/persistSessionToStorage` — pure function, writes `AuthSessionData` to the existing localStorage keys that `GlobalStateContext`, `TenantContext`, `Header`, `Footer`, and `ProfileEntry` already read: `user`, `f`, `l`, `fn`, `k`, `tagLine`, `tag`, `footer`, `menu`, `personName`, `title`.
- `src/features/auth/useApplySession` — hook that calls `persistSessionToStorage` and also drives the corresponding `useGlobalState`/`useTenant` setters (`setUser`, `setTenant`, `setShowTag`, `setShowFooter`, `setShowMenu`, `setShowPersonName`) so the UI updates immediately without waiting for a reload.

`signIn/page.tsx` calls `applySession(data)` before redirecting to `/${tenant}/${lang}/home` on success. On error it redirects to `/${tenant}/${lang}/admin/auth` without touching session state.

Rehydration on a fresh page load / new tab relies solely on the existing localStorage read in `GlobalStateContext`'s mount effect — there is no server-side session check (e.g. an `/api/auth/me` verifying the `auth_token` cookie). A stale or cleared localStorage will look logged-out even if the cookie is still valid; this was an accepted trade-off, not an oversight.

### Known issue: `lang` and `LangGuard`

`LangGuard` (`src/app/[tenant]/[lang]/LangGuard.tsx`) reads `localStorage["lang"]` on every route render under `[tenant]/[lang]`, and if it's set but invalid for the current tenant (`isValidLocaleForTenant`), it clears it and `router.replace(`/${tenant}`)` — the language-selection page — discarding whatever path the user was headed to. Because nothing in the login flow wrote a `lang` value, a stale one left over from a different tenant/session could win this check and strand a freshly-authenticated user on language selection instead of `/home`.

**Interim fix:** `persistSessionToStorage` now force-writes `localStorage["lang"] = "en"` on every successful sign-in, since `AuthSessionData`/`AuthAppSettings` carries no language field to derive a real preference from. This is acknowledged as temporary — a proper fix would either add a language field to the tracking API's session response, or have `LangGuard` fall back to the URL's `lang` segment (already known-valid, since it's the tenant/lang route being rendered) instead of forcibly redirecting away when the stored value is stale.

---

## UI Dependencies

| Dependency | Note |
|------------|------|
| `@/components/ui/Button` | Submit button |
| `@/features/standard-input` | `StandardInput` — translated email field with localStorage persistence and inline validation |
| `ua-parser-js` | Used by the host app's `signIn` page for device logging; not used inside the feature |

---

## File Structure

```
src/features/auth/
  AuthFlow.tsx              Client component — step machine
  useApplySession.ts        Hook — hydrates GlobalStateContext/TenantContext from AuthSessionData
  persistSession.ts         Pure function — writes AuthSessionData to localStorage
  types.ts                  AuthFlowProps, AuthFlowHandle, AuthSessionData, AuthAppSettings
  index.ts                  Re-exports
  AuthFlow.test.tsx         UI tests (Vitest + Testing Library)
  useApplySession.test.tsx  Hook tests
  persistSession.test.ts    Unit tests
  api/
    login.ts            POST /api/auth/login handler
    signin.ts           POST /api/auth/signin handler
    login.test.ts       Node-env API tests
    signin.test.ts      Node-env API tests
```
