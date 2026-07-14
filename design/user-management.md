
# User Management

## Overview

Every visitor to the application is assigned a persistent `identifier` stored in `localStorage`. This identifier bridges the anonymous and authenticated states, allowing page visits and return visits to be tracked across sessions without requiring a login.

---

## User States

| State | Condition | `identifier` value |
|-------|-----------|--------------------|
| Anonymous | No active session | `anon_<UUID>` (e.g. `anon_550e8400-...`) |
| Authenticated | Active session via auth-flow | User value from sign-in API (e.g. `jane@example.com`) |

`isAnonymous` is true when `identifier` is absent or starts with `anon_`.

---

## Identifier Lifecycle

```
New visit (no identifier)
  └─> redirect to /<tenant> or /
        └─> IdentityInitializer sets identifier
              ├─> user in localStorage? → use user value
              └─> no user?             → generate anon_<UUID>

Sign-in (auth-flow success)
  └─> identifier overwritten with data.user

Logout
  └─> identifier reset to new anon_<UUID>
      (post-logout session is not linked to the authenticated session)

Return visit (identifier exists)
  └─> proceed — no redirect
```

---

## Components

All components live in `src/features/identity/` and are reusable across projects.

### IdentityInitializer

Client component. Renders nothing. Sets `identifier` in `localStorage` if not already present.

- If `user` is in localStorage (i.e. a returning authenticated user on a fresh tab): uses `user` as the identifier.
- Otherwise: generates `anon_<UUID>` using `crypto.randomUUID()`.

**Placed on**: the `/<tenant>` landing page (`[tenant]/page.tsx`).

```tsx
import { IdentityInitializer } from "@/features/identity";

<Suspense fallback={null}>
  <IdentityInitializer />
</Suspense>
```

### IdentityGuard

Client component. Checks `localStorage` for `identifier` on mount.

- If present: renders `children`.
- If absent: redirects to `/<tenant>` (reads `tenant` from URL params) or `/` if no tenant.
- Renders `null` while checking to prevent content flash.

**Placed on**: layouts that should enforce identity before rendering (currently `(anonymous)/layout.tsx`).

```tsx
import { IdentityGuard } from "@/features/identity";

<IdentityGuard>
  {children}
</IdentityGuard>
```

### useIdentity()

Hook returning the current identity state from `localStorage`.

```ts
const { identifier, isAnonymous } = useIdentity();
// identifier: string | null
// isAnonymous: boolean
```

---

## Integration Points

| Location | Action |
|----------|--------|
| `[tenant]/page.tsx` | `<IdentityInitializer />` — seeds identifier for new visitors |
| `[tenant]/[lang]/(anonymous)/layout.tsx` | `<IdentityGuard>` — redirects visitors without an identifier |
| `auth/signIn/page.tsx` handleSuccess | `localStorage.setItem("identifier", data.user)` — upgrades anonymous to authenticated |
| `LogoutButton.tsx` handleLogout | `localStorage.setItem("identifier", "anon_" + crypto.randomUUID())` — downgrades to new anonymous session |

---

## Redirect Flow for a New Visitor

```
User visits any page under /<tenant>/<lang>/
  │
  ├─ (anonymous pages) IdentityGuard fires
  │     no identifier → redirect to /<tenant>
  │           IdentityInitializer runs → anon_<UUID> set
  │           user selects language → navigates to /<tenant>/<lang>/auth/login
  │           IdentityGuard: identifier present → renders login page
  │           user logs in → identifier upgraded to user value
  │           redirect to /home ✓
  │
  └─ (authenticated pages) auth guard fires first
        no user → redirect to /auth/login
        IdentityGuard on anonymous layout → redirect to /<tenant> if no identifier
        flow continues as above ✓
```

---

## localStorage Keys

| Key | Type | Set by | Cleared by |
|-----|------|--------|------------|
| `identifier` | `string` | `IdentityInitializer`, `handleSuccess`, `handleLogout` | Never removed — only overwritten |
| `user` | `string` | `handleSuccess` (sign-in) | `GlobalStateContext.logout()` |

---

## File Structure

```
src/features/identity/
  IdentityInitializer.tsx       Sets identifier on first visit
  IdentityGuard.tsx             Redirects if no identifier present
  useIdentity.ts                Hook: { identifier, isAnonymous }
  index.ts                      Re-exports
  IdentityInitializer.test.tsx
  IdentityGuard.test.tsx
  useIdentity.test.ts
```
