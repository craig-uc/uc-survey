
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

`AuthStep` is `"login" | "sent" | "signing-in"`, exported from `@/features/auth`. `onStepChange` exists so a parent rendering the login button in an external `GlassPanel` navigation pane (rather than `AuthFlow`'s own inline button) can hide it once there's nothing left to submit — see `src/app/page.tsx` below.

## Imperative handle

`AuthFlow` forwards a ref exposing `submitLogin`, which allows a parent to trigger the login from outside the form — for example, from a GlassPanel navigation button.

```ts
interface AuthFlowHandle {
  submitLogin: () => Promise<false>;
}
```

`submitLogin` validates the email, calls the login API, and manages the internal step transition. It always returns `false` so that a `NavButton` onClick does not trigger navigation after the call.

### Enter-to-submit

The email field's `<form>` has an `onKeyDown` handler that calls `submitLogin()` directly (with `preventDefault()`) whenever Enter is pressed, regardless of `hideLoginButton`. This is deliberate rather than relying on the browser's native implicit form submission: when `hideLoginButton` is set, the only visible "Login" control (e.g. the `GlassPanel` nav button in `src/app/page.tsx`) is rendered outside `AuthFlow`'s `<form>` entirely (`type="button"`, in a separate DOM subtree), so it can never be a form's native default button — Enter would otherwise do nothing in that layout.

### Reflecting busy state on an external button

`onSubmittingChange` fires with `status === "Submitting..."` whenever `status` changes (mount included), regardless of whether submission was triggered by clicking `AuthFlow`'s own inline button or by pressing Enter. `AuthFlow`'s inline button already reflects this correctly on its own (its `disabled`/label are derived from the same internal state).

When `hideLoginButton` is set, the visible button lives outside `AuthFlow` and manages its own busy/spinner state internally around its own `onClick` (see `StandardButton`'s [external loading override](standard-button.md#external-loading-override)) — it has no way to know a submission happened via Enter unless the parent tells it to. Consuming pages must wire `onSubmittingChange` to a `submitting` state and pass it through as `loading` on the button config (see `src/app/page.tsx`), or the external button will stay idle-looking while a keyboard-triggered submission is actually in flight.

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

Implemented at `src/app/page.tsx` — the app's single, universal login entry point (see `design/admin-routing-restructure.md`; there is no longer a separate per-tenant login page):

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

### Sign-in callback page (receives token from URL)

Implemented at `src/app/signIn/page.tsx` (root-level since `design/admin-routing-restructure.md` — login is a single, universal entry point, not per-tenant):

```tsx
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthFlow, useApplySession } from "@/features/auth";

function SignInContent() {
  const code = useSearchParams().get("token") || "NoCode";
  const router = useRouter();
  const applySession = useApplySession();

  return (
    <AuthFlow
      code={code}
      tenantCode="urup"
      lang="en"
      onSignInSuccess={(data) => {
        applySession(data);
        router.push("/admin/home");
      }}
      onSignInError={() => router.push("/")}
    />
  );
}

// Wrap in Suspense because useSearchParams requires it
export default function SignInPage() {
  return <Suspense><SignInContent /></Suspense>;
}
```

`tenantCode`/`lang` are fixed literals here, not read from the URL — the actual signed-in tenant comes back from the API response (`data.tenant_code`) and is applied via `useApplySession`, independent of whatever was sent in the request. On success the user lands on `/admin/home` (the tenant picker). On error they're bounced back to the login form at `/`.

---

## Route Structure

| Route | Purpose |
|-------|---------|
| `/` | Login form (root, universal) — renders `AuthFlow` (no code) inside a `GlassPanel` nav button; implemented at `src/app/page.tsx` |
| `/signIn?token=xxx` | Magic-link callback — renders `AuthFlow` with code; implemented at `src/app/signIn/page.tsx` |

There is only ever one login form now — `/` — per `design/admin-routing-restructure.md`; there is no per-tenant `/auth` variant. It follows the "nav button lives outside `AuthFlow`'s `<form>`" pattern (see [Login button in GlassPanel navigation pane](#login-button-in-glasspanel-navigation-pane) above): it tracks `step` via `onStepChange` and passes `show: step !== "sent"` to the button config, or the button would stay visible after the email is sent.

The `loginSent` route does not exist; the sent state is managed internally by `AuthFlow` (an orphaned `loginSent` page briefly reappeared during the routing restructure and was removed again to stay consistent with this decision).

`redirectUrl` sent from the login form is derived from the login page's own path (`/`) with `/signIn` appended, so it always resolves to the `signIn` route above.

---

## Client-side session state

The JWT itself is never touched by client-side JS — it's set as an `HttpOnly` cookie by `signin.ts` and stays that way deliberately (mitigates XSS token theft). Instead, `onSignInSuccess` on the `signIn` page receives the `AuthSessionData` already present in the `/api/auth/signin` JSON response body and hydrates client-side app state from it via `useApplySession`:

- `src/features/auth/persistSessionToStorage` — pure function, writes `AuthSessionData` to the existing localStorage keys that `GlobalStateContext`, `TenantContext`, `Header`, `Footer`, and `ProfileEntry` already read: `user`, `f`, `l`, `fn`, `k`, `tagLine`, `tag`, `footer`, `menu`, `personName`, `title`.
- `src/features/auth/useApplySession` — hook that calls `persistSessionToStorage` and also drives the corresponding `useGlobalState`/`useTenant` setters (`setUser`, `setTenant`, `setShowTag`, `setShowFooter`, `setShowMenu`, `setShowPersonName`) so the UI updates immediately without waiting for a reload.

`signIn/page.tsx` calls `applySession(data)` before redirecting to `/admin/home` on success. On error it redirects to `/` without touching session state.

Rehydration on a fresh page load / new tab relies solely on the existing localStorage read in `GlobalStateContext`'s mount effect — there is no server-side session check (e.g. an `/api/auth/me` verifying the `auth_token` cookie). A stale or cleared localStorage will look logged-out even if the cookie is still valid; this was an accepted trade-off, not an oversight.

### `lang` and `LangGuard` — moot for the admin flow post-restructure

`LangGuard` (`src/app/[tenant]/[lang]/LangGuard.tsx`) only runs under the `[tenant]/[lang]` route segment, which the login/admin flow no longer touches at all (`/`, `/signIn`, `/admin/*` are all outside that segment — see `design/admin-routing-restructure.md`). The stale-`lang`-strands-you-on-language-selection issue this section used to describe can no longer happen to a signed-in admin. `LangGuard` is still live for the untouched anonymous survey-taking flow under `[tenant]/[lang]/(anonymous)`, where `persistSessionToStorage` force-writing `localStorage["lang"] = "en"` on sign-in remains relevant only insofar as it could affect that separate flow if the same browser later visits it.

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
