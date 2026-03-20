# Story 0.5: Deploy Infrastructure

Status: done

## Story

As a **developer**,
I want Vercel and Railway configured for deployment,
So that apps/web deploys to Vercel and apps/worker deploys to Railway EU.

## Acceptance Criteria

1. apps/web/vercel.json configured
2. Dockerfile at monorepo root with multi-stage build (pnpm install → build shared → build worker → node:20-alpine)
3. Vercel env vars documented (.env.example) — ANON_KEY only, never SERVICE_ROLE_KEY
4. Railway env vars documented (.env.example) — SERVICE_ROLE_KEY, LLM keys, Postmark, RAILWAY_SHUTDOWN_TIMEOUT=20
5. SIGTERM handler + resilientLoop already in apps/worker/src/index.ts (Story 0.1)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- vercel.json with framework: nextjs (Vercel auto-detects rootDirectory from monorepo)
- Dockerfile at monorepo root: 4-stage build (base → build-shared → build-worker → production)
- node:20-alpine production image with pnpm 10
- .env.example files for both apps documenting all required env vars
- SERVICE_ROLE_KEY warning in web .env.example
- GMAIL_MODE=polling documented for local dev
- Note: actual Vercel/Railway connections require manual setup in their dashboards

### File List
- apps/web/vercel.json (created)
- Dockerfile (created — monorepo root, multi-stage)
- apps/web/.env.example (created)
- apps/worker/.env.example (created)
