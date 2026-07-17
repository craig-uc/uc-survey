
# GlassPanel Component

## Overview

`GlassPanel` is the primary layout shell for all page content. It renders a frosted-glass card centred on the viewport and manages three optional regions: a title header, a scrollable content area, and a navigation footer.

All sub-components (`Title`, `Navigation`) are private to `GlassPanel` and are not exported separately. `ButtonConfig` and `NavigationConfig` are exported for use in consuming pages.

Location: `src/components/GlassPanel.tsx`

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Content rendered inside the scrollable area |
| `showTitle` | `boolean` | `false` | Renders the tenant title header when `true` |
| `navigation` | `NavigationConfig` | — | Renders the navigation footer when provided; omit to hide it entirely |
| `layout` | `"floating" \| "admin"` | `"floating"` | `"floating"` renders the centred card described below; `"admin"` stretches the panel to fill its container instead, capping `children` at `max-w-[80%]` and centering them — used across `/admin/*` |

### NavigationConfig

| Key | Type | Description |
|-----|------|-------------|
| `buttons` | `ButtonConfig[]` | Ordered list of nav buttons; position and order within each zone is determined by each button's `type` and `position` |

### ButtonConfig

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | `string` | required | Button type; expected values: `submit`, `cancel`, `back` — used to determine default style and position |
| `label` | `string` | required | Display text passed to NavButton; used as the API lookup key and as the fallback label |
| `href` | `string` | required | Route to push on click (pass `"#"` when `onClick` always returns `false`) |
| `show` | `boolean` | `true` | Set `false` to hide the button without removing the config |
| `style` | `"primary" \| "secondary" \| string` | by type | Visual style — `primary` or `secondary` maps to theme tokens; any other string is applied directly as Tailwind classes |
| `position` | `"left" \| "center" \| "right"` | by type | Which nav zone the button occupies; defaults: `back`→left, all others→right |
| `onClick` | `() => Promise<boolean \| void> \| boolean \| void` | — | Pre-navigation guard; return `false` to cancel navigation |
| `loading` | `boolean` | `false` | Forces the button's spinner/disabled state (passed through to `NavButton` → `StandardButton`'s external `loading` prop), independent of its own `onClick` |

#### Default styles by type

| Type | Style |
|------|-------|
| `submit` | `primary` |
| `cancel` | `secondary` |
| `back` | `secondary` |
| anything else | `secondary` |

#### Default positions by type

| Type | Position |
|------|----------|
| `back` | left |
| everything else | right |
| `submit` (among right buttons) | rightmost |

---

## Layout Structure

```
┌─────────────────────────────────────────┐
│  Title (optional, showTitle=true)       │  border-b
├─────────────────────────────────────────┤
│                                         │
│  Content area  (flex-1, overflow-y-auto)│  px-6 py-4
│  └─ children                            │
│                                         │
├─────────────────────────────────────────┤
│  Navigation (optional, navigation prop) │  border-t
│  [left…]     [center…]     [right…]    │
└─────────────────────────────────────────┘
```

The outer card is `w-[95vw] h-[95vh]` on mobile and `md:w-[70%] md:h-[90vh]` on larger viewports.

---

## Layout Variants

### `layout="floating"` (default)

The behaviour described above and used by the anonymous survey-taking flow: a centred glass card sized relative to the viewport (`w-[95vw] h-[95vh] md:w-[75%] md:h-[90vh]`), with rounded corners.

### `layout="admin"`

Used across `/admin/*` pages (home, surveys list, survey editor, dashboard), typically rendered below a `BreadcrumbBar` inside a `flex flex-col` page wrapper. Differences from `floating`:

- No fixed viewport-relative sizing or rounded corners — the outer shell is `w-full flex-1 min-h-0`, so it stretches to fill whatever space its flex-column parent gives it (e.g. the page area beneath the breadcrumb bar) rather than floating as a card.
- `children` are wrapped in an inner `max-w-[80%] mx-auto w-full` container within the scrollable content area, so admin content is centred and capped at 80% width instead of running edge-to-edge.
- `showTitle` and `navigation` still work identically to the floating variant if supplied, though admin pages generally omit both — `BreadcrumbBar` already covers in-app navigation/identity for `/admin/*`.

```tsx
<div className="flex flex-col min-h-full">
  <BreadcrumbBar items={breadcrumbs} />
  <GlassPanel layout="admin">
    <SurveyListing tenantCode={tenantCode} />
  </GlassPanel>
</div>
```

---

## Title Region

Renders when `showTitle={true}`. Fetches the tenant display name from `/api/app-data/text` (type `"title"`) and the matching tenant system image. Renders after hydration — the image appears immediately and the heading fades in once the API responds.

Tenant image map: `dark`, `dpw-apac`, `dpw-eu`, `dpw-gbl`, `dpw-ssa`, `nedbank`, `t3`, `urup`. Falls back to `dark` for unknown tenants.

---

## Navigation Region

Renders when the `navigation` prop is provided. The `buttons` array may contain any number of entries — provide only the configs you need.

Each button renders immediately using its `label` prop, then updates if the API returns a translation. The nav bar is visible as soon as the component mounts.

The `onClick` guard runs before `router.push`. Returning `false` cancels navigation; any other return value (including `void`) allows it.

---

## Usage Examples

Content only — no title or nav:

```tsx
<GlassPanel>
  <p>Hello</p>
</GlassPanel>
```

With title:

```tsx
<GlassPanel showTitle>
  <MyContent />
</GlassPanel>
```

With title and back/submit navigation:

```tsx
<GlassPanel
  showTitle
  navigation={{
    buttons: [
      { type: "back", label: "Back", href: "/step-1" },
      { type: "submit", label: "Next", href: "/step-3", onClick: () => validateStep() },
    ],
  }}
>
  <StepTwoForm />
</GlassPanel>
```

Login button in the nav bar (onClick always returns false — AuthFlow manages step internally). `loading` is wired from `AuthFlow`'s `onSubmittingChange` so the button shows busy/disabled even when submission is triggered by pressing Enter in the email field rather than by clicking this button:

```tsx
const [step, setStep] = useState<AuthStep>("login");
const [submitting, setSubmitting] = useState(false);

<GlassPanel
  showTitle
  navigation={{
    buttons: [
      {
        type: "submit",
        label: "Login",
        href: "#",
        show: step !== "sent",
        loading: submitting,
        onClick: () => authRef.current?.submitLogin(),
      },
    ],
  }}
>
  <AuthFlow ref={authRef} hideLoginButton onStepChange={setStep} onSubmittingChange={setSubmitting} ... />
</GlassPanel>
```

Cancel + Submit with custom style override:

```tsx
<GlassPanel
  navigation={{
    buttons: [
      { type: "cancel", label: "Cancel", href: "/dashboard" },
      { type: "submit", label: "Save", href: "/save", style: "bg-success text-dark" },
    ],
  }}
>
  <EditForm />
</GlassPanel>
```

Conditionally hiding a button without removing the config:

```tsx
<GlassPanel
  navigation={{
    buttons: [
      { type: "back", label: "Back", href: "/prev", show: canGoBack },
    ],
  }}
>
  <Content />
</GlassPanel>
```
