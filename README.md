# Kyrra

SaaS B2B de filtrage intelligent d'emails par IA.

## Smoke Test E2E

The smoke test validates that all **public pages** load correctly on the deployed instance.

### Pages covered

| Page | Route | Assertions |
|------|-------|------------|
| Login | `/login` | Title "Kyrra", tagline, Google sign-in button |
| Token Expired | `/token-expired` | Expiry message, dashboard link |
| CGU | `/legal/cgu` | Page heading "Conditions Generales d'Utilisation" |
| Privacy | `/legal/privacy` | Page heading "Politique de Confidentialite" |

### Pages NOT covered

Dashboard, settings, connect-gmail, and other authenticated pages require a Google OAuth session and are not testable without mocking auth. They are excluded from the smoke test scope.

### How to run

```bash
# Install dependencies (if not already done)
pnpm install

# Install Playwright browsers (first time only)
npx playwright install chromium

# Run the smoke test
pnpm test:e2e
```

The base URL is configured in `playwright.config.ts` and points to the staging deployment.
