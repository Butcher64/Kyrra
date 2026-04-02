# Kyrra

SaaS B2B de filtrage intelligent d'emails par IA.

## Quick Start

```bash
pnpm install
pnpm dev          # Start web + worker
```

## Smoke Test E2E

### Automated Tests (public pages)

9 Playwright tests validate that all public pages load correctly.

| Page | Route | Assertions |
|------|-------|------------|
| Landing | `/` | Hero, navbar, pricing, footer |
| Login | `/login` | Title, Google sign-in button, uninstall banner |
| CGU | `/legal/cgu` | Page heading |
| Privacy | `/legal/privacy` | Page heading |
| Token Expired | `/token-expired` | Expiry message |
| Dashboard redirect | `/dashboard` | Redirects to `/login` when unauthenticated |

### How to run

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run automated smoke tests
pnpm test:e2e
```

Set `E2E_BASE_URL` to test against staging (defaults to `http://localhost:3000`).

### Manual Test Plan (authenticated flow)

The full onboarding + dashboard flow requires Google OAuth and a live environment.
See the detailed 38-step manual test plan in `e2e/smoke-test.spec.ts`.

**Prerequisites:**
- Test Gmail account (not personal)
- Dev server running (`pnpm dev`)
- Worker running (`cd apps/worker && pnpm dev`)
- Supabase with migrations 001-026 applied

**Flow summary:**
1. Login → RGPD consent → Gmail OAuth
2. Onboarding: whitelist scan → profile → labels → real-time scan
3. Dashboard: stats, emails with label badges, settings
4. Classification: send test email, verify Kyrra label in Gmail
5. Uninstall: delete account, verify cleanup
