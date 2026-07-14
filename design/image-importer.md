## Image Importer

Dynamically imports per-account images with a dark-theme fallback, caching promises to avoid duplicate network requests.

### Files

- `src/utils/imageLoader.ts` — thin wrappers around the two dynamic-import template literals. Kept separate so tests can mock the loader without touching Vite's asset pipeline.
- `src/utils/imageImporter.ts` — orchestrates loading, fallback logic, and promise caching.

### Behaviour

1. If `account` is an empty string, skip the account path and go straight to the dark fallback.
2. Try `assets/images/{account}/{imageName}`. On error, try `assets/images/dark/{imageName}`. On second error, resolve to `""`.
3. The resolved promise is cached by `{account}:{imageName}`. If it resolves to `""` (i.e. nothing loaded), the cache entry is removed via a `setTimeout(0)` so the next call retries.

### Why imageLoader.ts is separate

Vite resolves dynamic imports with template literals at build time by statically analysing the prefix. Moving both loaders into `imageLoader.ts` preserves that static analysis while giving tests a clean `vi.mock('./imageLoader')` seam. Without this split, Vite's test environment returns a constructed path string for non-existent `.webp` assets (instead of throwing), causing the error-handling branch to never fire in CI.

### Testing

`vi.mock('./imageLoader')` is applied in `imageImporter.test.ts`. Default mock behaviour rejects both loaders (simulating missing files). Individual tests override with `mockResolvedValue` to verify the happy path and fallback logic.
