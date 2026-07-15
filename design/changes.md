# Change Log

## 0.1.0
***

## 0.0.0
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
