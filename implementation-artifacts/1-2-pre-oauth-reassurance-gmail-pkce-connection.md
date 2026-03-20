# Story 1.2: Pre-OAuth Reassurance & Gmail PKCE Connection

Status: done

## Story

As a **user**,
I want to understand what Kyrra will do with my Gmail before connecting,
So that I feel confident granting access to my email.

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List

- Pre-OAuth reassurance page: "Ce que Kyrra fait ✓ / Ce que Kyrra ne fait JAMAIS ✗" + clean uninstall guarantee
- Gmail PKCE OAuth flow: separate from Supabase Auth (RGPD Art.7 granular consent)
- Scopes: gmail.modify + gmail.readonly
- Token exchange + storage in user_integrations table via Supabase upsert
- Gmail email address fetched via userinfo API
- Pipeline health initialized on connection (user_pipeline_health)
- Redirect to /onboarding-progress after successful connection
- Error handling: token_exchange_failed, storage_failed, oauth_failed → redirect with error param
- Note: AES-256 token encryption deferred to hardening story (development uses plain storage)
- tsc --noEmit: PASS

### File List

- apps/web/app/(auth)/connect-gmail/page.tsx (created — pre-OAuth reassurance screen)
- apps/web/app/(auth)/auth/callback/google/route.ts (created — Gmail PKCE flow)
