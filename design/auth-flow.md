
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
}
```

## Imperative handle

`AuthFlow` forwards a ref exposing `submitLogin`, which allows a parent to trigger the login from outside the form — for example, from a GlassPanel navigation button.

```ts
interface AuthFlowHandle {
  submitLogin: () => Promise<false>;
}
```

`submitLogin` validates the email, calls the login API, and manages the internal step transition. It always returns `false` so that a `NavButton` onClick does not trigger navigation after the call.

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

Request: `{ email: string }`

Injects `ACCOUNT`, `APPLICATION`, `TENANT_APP`, `ENVIRONMENT` from env vars, then calls `TRACKING_API/event-consumer`. Returns `{ success: true }` on success or an error JSON on failure.

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

```tsx
import { useRef } from "react";
import { AuthFlow, AuthFlowHandle } from "@/features/auth";

const authRef = useRef<AuthFlowHandle>(null);

<GlassPanel
  showTitle
  navigation={{
    submit: { href: "#", onClick: () => authRef.current?.submitLogin() },
  }}
>
  <AuthFlow
    ref={authRef}
    hideLoginButton
    onSignInSuccess={(data) => { /* store session, redirect */ }}
    onSignInError={() => { /* clear session, redirect */ }}
  />
</GlassPanel>
```

`href="#"` is a placeholder — `submitLogin` always returns `false`, so `NavButton` never calls `router.push`.

### Sign-in callback page (receives code from URL)

```tsx
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthFlow } from "@/features/auth";

function SignInContent() {
  const code = useSearchParams().get("code") || "NoCode";
  return (
    <AuthFlow
      code={code}
      onSignInSuccess={handleSuccess}
      onSignInError={handleError}
    />
  );
}

// Wrap in Suspense because useSearchParams requires it
export default function SignInPage() {
  return <Suspense><SignInContent /></Suspense>;
}
```

---

## Route Structure

| Route | Purpose |
|-------|---------|
| `/auth/login` | Email entry — renders `AuthFlow` (no code) |
| `/auth/signIn?code=xxx` | Magic-link callback — renders `AuthFlow` with code |

The `loginSent` route has been removed; the sent state is managed internally by `AuthFlow`.

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
  AuthFlow.tsx          Client component — step machine
  types.ts              AuthFlowProps, AuthFlowHandle, AuthSessionData, AuthAppSettings
  index.ts              Re-exports
  AuthFlow.test.tsx     UI tests (Vitest + Testing Library)
  api/
    login.ts            POST /api/auth/login handler
    signin.ts           POST /api/auth/signin handler
    login.test.ts       Node-env API tests
    signin.test.ts      Node-env API tests
```
