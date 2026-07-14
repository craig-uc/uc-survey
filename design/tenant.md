Tenant Feature

Overview

The tenant feature manages recognition of the current tenant across the application. Tenant is read from the URL segment (/{tenant}/...) and drives both visual theming and the tenant-code sent to external APIs.

Behaviour

- On / (root): no tenant is present. The default "dark" theme is applied. No redirect occurs.
- On /{tenant}/...: TenantInitializer reads the URL param and sets the tenant via TenantProvider.
- Theme: tenant value is applied directly as the next-themes theme name. When null, theme defaults to "dark".
- Tenant-code for API calls: always a non-empty string. Defaults to "urup" when no tenant is set.
- On logout: tenant is cleared (setTenant(null)), resetting theme to "dark".

Structure

src/features/tenant/
  TenantContext.tsx    Provider + context. Manages tenant state, localStorage sync, and theme sync.
  useTenant.ts         Public hook — returns { tenant, tenantCode, setTenant }.
  getTenantCode.ts     Pure utility — getTenantCode(tenant?) returns tenant or "urup". Server-safe, no hooks.
  TenantInitializer.tsx  Client component that receives the URL tenant param and calls setTenant.
  index.ts             Barrel exports.

TenantProvider

Placed above GlobalStateProvider in the root layout (inside ThemeProvider).

Responsibilities:
- Loads saved tenant from localStorage on mount.
- Syncs theme via setTheme(tenant) or setTheme("dark") when tenant changes.
- Persists tenant to localStorage.

useTenant()

Returns:
- tenant: string | null — the raw tenant string from the URL, or null on /.
- tenantCode: string — tenant ?? "urup". Always safe to pass to external APIs.
- setTenant: (value: string | null) => void

getTenantCode(tenant?)

Pure function, no React. Use in API route handlers or server utilities.
Returns tenant || "urup".

API Integration

When making calls to external APIs, include tenant-code in the payload.

Client side: use useTenant().tenantCode.
Server side (API routes): read tenantCode from the request body, then apply getTenantCode(body.tenantCode) before forwarding.

The login API route (/api/auth/login via features/auth/api/login.ts) applies this pattern — the client sends tenantCode, the route maps it to body["tenant-code"] before calling the upstream tracking API.

Data Flow

URL /{tenant}/...
  -> TenantInitializer (client component in [tenant]/layout.tsx)
    -> setTenant(tenant) via useTenant()
      -> TenantProvider updates state
        -> localStorage.setItem("tenant", tenant)
        -> setTheme(tenant)

No tenant (URL is /)
  -> TenantInitializer not rendered
  -> tenant remains null
  -> tenantCode = "urup"
  -> theme = "dark"
