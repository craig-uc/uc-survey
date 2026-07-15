
# Logout Feature

## Overview

`LogoutButton` is a self-contained React component that handles user logout. It supports three visual variants (button, link, menu item), translates its label via an internal API route backed by the Journey API, and redirects the user to the appropriate post-logout destination based on tenant and language context.

The feature module ships with its own API route handler (`api/label.ts`). The Next.js route file (`app/api/logout/label/route.ts`) is a thin re-export.

Location: `src/features/logout/`

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"button" \| "link" \| "menu"` | `"button"` | Visual presentation |
| `label` | `string` | `"logout"` | Display text; used as the API lookup key and fallback |
| `style` | `string` | — | Overrides the default Tailwind classes for the variant |
| `className` | `string` | — | Additional classes appended to the element |

---

## Variants

### `button` (default)

Renders a `<button>` with secondary theme tokens. Default classes:

```
px-4 py-2 rounded-md font-medium transition-colors text-sm uppercase tracking-widest cursor-pointer
bg-secondary text-on-secondary hover:bg-on-secondary hover:text-secondary
```

Passing `style` replaces only the colour/state classes, keeping the base shape classes.

### `link`

Renders a `<button>` styled as inline text. Default classes:

```
text-secondary no-underline hover:text-primary transition-colors cursor-pointer
```

Passing `style` replaces the entire default class string.

### `menu`

Renders a bare `<button>` with no preset classes. The caller supplies all styling via `className`, so the element inherits whatever the host menu requires.

---

## Label Translation

On mount (after hydration), the component fetches `/api/logout/label` with:

```json
{
  "label": "<label lowercased and trimmed>",
  "tenant_code": "<tenant or empty string>",
  "language": "<lang or 'en'>"
}
```

The prop label is displayed immediately (no loading state); the API response replaces it when it arrives. On API failure the prop label is retained.

---

## Logout Flow

On click:

1. `POST /api/auth/logout` — clears the `auth_token` HttpOnly cookie.
2. `logout()` — clears GlobalState (user, UI flags, localStorage keys).
3. `setTenant(null)` — clears tenant state and theme.
4. Resets `localStorage.identifier` to a new anonymous UUID.
5. Redirects:

| tenant | lang | Destination |
|--------|------|-------------|
| set | set | `/{tenant}/{lang}` |
| set | unset | `/{tenant}` |
| unset | any | `/` |

The logout flow always completes even if the API call fails.

---

## API Handler

### POST `/api/logout/label`

**Request body**

| Field | Type | Default |
|-------|------|---------|
| `label` | `string` | `"logout"` |
| `tenant_code` | `string` | `""` |
| `language` | `string` | `"en"` |

Calls `JOURNEY_API/standard_button` with:

```json
{
  "label": "<label>",
  "tenant_code": "<tenant_code>",
  "application": "<APPLICATION>",
  "language": "<language>"
}
```

Returns `{ "message": "<translated label>" }` on success.

### Required environment variables

| Variable | Purpose |
|----------|---------|
| `JOURNEY_API` | Base URL for the Journey translation API |
| `APPLICATION` | Application identifier |

---

## Integration

### Button in a header

```tsx
import { LogoutButton } from "@/features/logout";

<LogoutButton />
```

### Link in a sidebar

```tsx
<LogoutButton variant="link" label="Sign out" />
```

### Item in a dropdown menu

```tsx
<LogoutButton variant="menu" label="Sign out" className="block w-full px-4 py-2 text-sm text-left hover:bg-light/10" />
```

### Custom style override

```tsx
<LogoutButton style="bg-danger text-light hover:bg-danger/80" />
```

---

## File Structure

```
src/features/logout/
  LogoutButton.tsx        Client component — all three variants
  types.ts                LogoutButtonProps, LogoutVariant
  index.ts                Re-exports
  LogoutButton.test.tsx   UI tests (Vitest + Testing Library)
  api/
    label.ts              POST /api/logout/label handler

src/app/api/logout/
  label/
    route.ts              Thin re-export of api/label.ts
```
