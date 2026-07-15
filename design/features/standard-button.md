
# StandardButton Feature

## Overview

`StandardButton` is a self-contained React client component that renders a button with a JOURNEY API-translated label. On click, the button enters a disabled spinner state that resolves when the caller's async action completes, or immediately when navigation occurs. Styling and click handling are fully delegated to the caller.

The feature ships with its own API route handler. The only server-side dependency is the `JOURNEY_API` environment variable.

Location: `src/features/standard-button/`

---

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Display text; used as the translation key and fallback |
| `lang` | `string` | Yes | Language code for the translation request |
| `tenantCode` | `string` | Yes | Tenant identifier for the translation request |
| `application` | `string` | Yes | Application identifier for the translation request |
| `onClick` | `() => Promise<void>` | Yes | Async action to perform on click; spinner runs until the promise settles |
| `className` | `string` | No | CSS classes applied to the `<button>` element |
| `disabled` | `boolean` | No | Disables the button independently of loading state |
| `loading` | `boolean` | No | Forces the busy spinner/disabled state from outside the component, OR'd with the internal click-triggered loading state — see [Spinner state](#spinner-state) |

---

## Behaviour

### Label translation

On mount, the component fetches `/api/standard-button/label` to retrieve the translated label. The `label` prop is displayed immediately; the API response replaces it when it arrives. On fetch failure the `label` prop is retained unchanged.

### Spinner state

On click:
1. The button becomes `disabled` and its label is replaced by an inline SVG spinner.
2. The `onClick` promise is awaited.
3. When the promise settles (resolve or reject), the spinner clears and the button re-enables.

If navigation occurs while the spinner is active (e.g. the button lives in a persistent layout and `onClick` triggers a route change), the spinner clears as soon as `usePathname()` returns a new value. This prevents a perpetually spinning button when the navigating page is the one that would have resolved the promise.

Errors thrown by `onClick` are caught silently by the button; error handling is the caller's responsibility within the `onClick` implementation.

### External loading override

The `loading` prop lets a parent force the busy state (spinner + disabled) without going through this button's own `onClick`. The rendered busy state is `internalClickLoading || loading` — either source can trigger it, and the button only returns to idle once both are false.

This exists for cases where the action can be triggered from somewhere other than a click on this specific button — e.g. `AuthFlow`'s email field submits on Enter (see [auth-flow.md](../features/auth-flow.md#enter-to-submit)) while the actual "Login" button lives outside `AuthFlow`'s form, in a `GlassPanel` nav pane. Without the `loading` prop, that external button would have no way to reflect a submission it didn't initiate.

---

## API Handler

### POST `/api/standard-button/label`

**Request body**

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Translation key (lowercased and trimmed by the handler) |
| `language` | `string` | Language code |
| `tenant_code` | `string` | Tenant identifier |
| `application` | `string` | Application identifier |

Calls `JOURNEY_API/standard_button`. If the Journey API cannot find a matching translation it returns the label it was given, so the response is always usable as a display string.

If `JOURNEY_API` is not defined, the handler logs a warning to the server console and returns the given label unchanged.

Returns `{ "message": "<translated label>" }` on success.

**Required environment variable**

| Variable | Purpose |
|----------|---------|
| `JOURNEY_API` | Base URL for the Journey translation API (e.g. `https://api.example.com/`) |

---

## Usage

```tsx
import { StandardButton } from "@/features/standard-button";

<StandardButton
  label="save"
  lang={lang}
  tenantCode={tenantCode}
  application="my-app"
  onClick={async () => {
    await saveRecord();
  }}
  className="px-4 py-2 rounded bg-primary text-white"
/>
```

---

## Portability

To use this component in another Next.js project:

1. Copy `src/features/standard-button/` into the target project.
2. Create `src/app/api/standard-button/label/route.ts` with:
   ```ts
   export { POST } from "@/features/standard-button/api/label";
   ```
3. Set the `JOURNEY_API` environment variable.

No other internal project dependencies exist.

---

## File Structure

```
src/features/standard-button/
  StandardButton.tsx        Client component
  types.ts                  StandardButtonProps
  index.ts                  Re-exports
  StandardButton.test.tsx   UI tests (Vitest + Testing Library)
  api/
    label.ts                POST /api/standard-button/label handler

src/app/api/standard-button/
  label/
    route.ts                Thin re-export of api/label.ts
```
