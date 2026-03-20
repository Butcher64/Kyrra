---
stepsCompleted: [step-01-init, step-02-context, step-03-starter, step-04-decisions, step-05-patterns, step-06-structure, step-07-validation, step-08-complete]
status: 'complete'
completedAt: '2026-03-17'
inputDocuments:
  - planning-artifacts/prd.md
  - planning-artifacts/product-brief-Kyrra-2026-03-09.md
workflowType: 'architecture'
project_name: 'Kyrra'
user_name: 'Thomas'
date: '2026-03-16'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
86 FRs across 8 functional groups establishing Kyrra as an invisible B2B SaaS middleware that intercepts, classifies, and surfaces email intelligence without displacing Gmail/Outlook as the user's primary interface.

Architecturally significant FR groups:
- Classification engine (FR1-9, FR86): dual-layer pipeline, fallback logic, PII stripping, prompt injection resistance, multilingual support
- Provider integration (FR10-19): OAuth lifecycle, Pub/Sub event stream, adaptive polling, idempotent reconciliation, multi-provider readiness
- Onboarding (FR20-32, FR84): one-time sent-history scan (6 months), whitelist generation, clean uninstall (full label removal)
- Dashboard (FR33-41): dual-mode display (simple/detailed opt-in), responsive, <1s FCP
- Trust & feedback (FR42-49, FR85): reclassification propagation <10s, in-email token (zero-auth, 7-day TTL, single-use, Recap-only MVP-0), degraded mode transparency
- Recap (FR50-60): daily HTML generation + delivery, re-engagement trigger (7-day inactivity dashboard)
- Subscription (FR61-68): tier enforcement (Free 30/day counter, Pro unlimited, Team), referral
- Privacy/Admin (FR69-83): RGPD dual-obligation, audit trail, AIPD, admin dashboard

**Non-Functional Requirements:**
Performance targets that drive architectural decisions:
- Classification end-to-end: <2 min p95 (async queue acceptable)
- Rules-only path: <5 sec
- LLM path: <15 sec; circuit breaker at >10 sec → rules fallback
- Reclassification propagation: <10 sec (Gmail label update)
- Low-confidence notification: <5 min delivery
- Dashboard FCP: <1 sec; API response: <500 ms p95
- System uptime: 99.5% (Kyrra-owned); email loss rate: 0%
- PII leakage: <0.5% in generated summaries
- LLM cost: <0.70€/user/month; total infra: <2€/user/month
- Reconciliation poll: 5 min (business hours) / 30 min (off-hours)

Security & compliance NFRs:
- OAuth tokens: AES-256 at rest, TLS 1.3 in transit
- Zero email content in any log (P0)
- Supabase RLS: per-user isolation at DB level
- Security audit trail: 1 year retention, separate schema
- All sub-processors: DPA with EU residency + zero training guarantee

**Scale & Complexity:**
- Primary domain: event-driven backend pipeline + lightweight web dashboard
- Complexity level: HIGH (near-critical)
- MVP-0 capacity: 50 users / ~3,000 emails/day
- MVP-1 capacity: 500 users / ~30,000 emails/day
- V1.1 capacity: 2,000 users / ~120,000 emails/day
- Estimated architectural components: ~12 bounded services

### Technical Constraints & Dependencies

- **Gmail = source of truth:** Supabase is always the replica. Conflicts resolved in Gmail's favor. Label changes in Gmail detected as implicit reclassification signals.
- **Pub/Sub + adaptive polling dual-track:** Gmail Pub/Sub for real-time events; polling as safety net (5 min / 30 min). Watch renewal automated 24h before 7-day expiration + second safety net at 6h.
- **Queue-based pipeline:** Email processing must survive Supabase downtime (up to 30 min) without data loss. Workers are stateless and horizontally scalable.
- **In-memory-only content processing:** Email content never touches disk or database. Classification pipeline is stateless with respect to content.
- **LLM multi-provider:** Primary (GPT-4o-mini or Claude Haiku) + fallback provider. Cost circuit breaker: alert at 0.50€/user, degraded mode at 1€/user. Hard cap: 500€/month system-wide.
- **EU data residency mandatory:** Supabase EU Frankfurt. All sub-processors EU-bound.
- **Greenfield context:** No existing codebase constraints. Full architectural freedom within compliance and integration requirements.

### Cross-Cutting Concerns Identified

1. **Privacy-by-Design (P0):** Impacts classification pipeline, logging, storage schema, LLM gateway, Recap generation, admin access model, and sub-processor contracts. `ClassificationLogger` whitelist-only fields enforced in code.
2. **Distributed State Consistency:** Gmail × Supabase × LLM — idempotent processing, delta detection, reconciliation polling, conflict resolution with timestamp comparison and "user touched" flag.
3. **Resilience Architecture:** Per-dependency degraded modes (LLM bypass, Supabase queue, OAuth pause) with automatic recovery. Zero email loss guarantee. Heartbeat monitor + dead man's switch per user.
4. **Security Perimeter:** OAuth lifecycle, prompt injection hardening, RLS enforcement, zero-content logging, token-based in-email actions (Recap-only), security audit trail.
5. **Observability & Cost Control:** Real-time LLM cost per user, bypass ratio monitoring, classification rates, reclassification trends, circuit breaker states — all founder-visible. Hard cap + canary deployments for rules updates.
6. **Multi-Tenancy:** Per-user data isolation (Supabase RLS), per-user plan enforcement (Free 30/day counter), per-user Gmail watch subscriptions, per-user whitelist.
7. **Async Email Processing Pipeline:** Pub/Sub → queue → classify → safety rules → label → sync → notify. Idempotent at every stage. `ClassificationSafetyRules` module post-engine.

### Architecture Decision Records (Pre-decisions)

**ADR-001 — Email Processing Queue**
- Decision: Supabase queue table (MVP-0) → BullMQ/Upstash Redis (MVP-1)
- Rationale: Zero additional dependency for MVP-0; natural migration path at scale
- Constraint: Queue payload is metadata-only (email_id, gmail_message_id, user_id, timestamp) — never email content. Content fetched in-memory at processing time.

**ADR-002 — Worker Deployment**
- Decision: Vercel (Next.js dashboard + API routes) + Railway EU region (background workers)
- Rationale: Co-location with Supabase EU Frankfurt; separation of concerns; Vercel incompatible with long-running worker processes
- Workers: classification worker, reconciliation poller, recap cron generator
- Secrets: Railway environment variables (MVP-0) → dedicated vault (MVP-1)

**ADR-003 — Distributed State Management**
- Decision: Append-only classification table (INSERT only, no UPDATE) + reconciliation polling with timestamp comparison
- Rationale: Natural audit trail; conflict resolution via `shouldApplyLabel(classificationAt, gmailModifiedAt, userModifiedAt)`; Gmail always wins; "user touched" flag prevents overwriting manual corrections
- Post-outage recovery: slowdown mode (5 emails/sec) + conflict logging in `reconciliation_conflicts` table

**ADR-004 — LLM Gateway**
- Decision: LLMGateway interface with GPT-4o-mini primary implementation
- Constraints: Structured message separation (system/user), content always in explicit delimited block, JSON schema output validation, non-compliant output → rules fallback
- Circuit breaker: **Supabase-backed from MVP-0** (reads/writes `llm_metrics_hourly` table — survives Railway restarts); triggers at >10s latency, >1€/user cost, or >60% LLM bypass ratio for >30 min. LLM call timeout: **14 seconds** (6s margin before Railway SIGKILL at 20s)
- Canary deployment: rules engine updates roll out to 5% users for 2h before full rollout

**ADR-005 — Frontend & Monorepo**
- Decision: Turborepo monorepo — apps/web (Next.js App Router), apps/worker (Node.js), packages/shared (TypeScript types, Zod schemas, classification helpers)
- Dashboard: Server Components for stats pages (FCP <1s), Client Components for interactive elements only; Recharts for detailed mode charts
- Security: CSP strict, CORS restricted to kyrra.io, X-Frame-Options DENY, zero third-party tracking in dashboard

### Cross-Functional Scoping Decisions

**FR85 in-email token:** MVP-0 scoped to Recap only — 1 redemption endpoint, token embedded in daily Recap. Not per-filtered-email (reduces scope 80%).

**Dashboard dual mode:** Both MVP-0 — trivial frontend split (Server Component simple / Client Component detailed). No backend impact.

**FR86 multilingual:** MVP-0 at zero architectural cost — LLM handles FR/EN/mixed natively. Validate explicitly in smoke test.

**Free plan counter:** Supabase `date_bucket + count` table (MVP-0, UTC timezone) → Redis atomic counter (MVP-1). Email #31+ receives no label, stays visible in inbox. In-app banner notification only. Counter displayed in dashboard simple mode.

**Admin dashboard:** Supabase Studio for smoke test. Single `/admin` Next.js page for beta (LLM cost real-time, reclassification rate, active users, circuit breaker status). MFA MVP-1.

### Pre-mortem Architectural Safeguards

**Safeguard 1 — Silent pipeline failure prevention:**
`user_pipeline_health` table tracking `last_classified_at`, `watch_expires_at`, `mode`. Monitoring cron every 5 min: alert if `last_classified_at` > 15 min for active user during business hours. Dead man's switch → auto-switch to polling mode.

**Safeguard 2 — RGPD log leak prevention:**
`ClassificationLogger` central class with hardcoded whitelist: `{email_id, classification_result, confidence_score, processing_time_ms}`. Any other field raises exception. CI pipeline scan for email patterns in log output. Per-user debug mode with code-enforced 24h TTL.

**Safeguard 3 — LLM cost explosion prevention:**
`llm_metrics_hourly` table with `bypass_rate`, `total_cost_eur`, `users_count`. Alerts: bypass_rate >50% (warning), >70% (critical), spend >300€ (warning), >500€ (hard cap → 100% fingerprinting mode). Canary deployment for all fingerprinting rules updates.

**Safeguard 4 — False positive on critical email prevention:**
`ClassificationSafetyRules` module applied after classification engine, before DB write and label application. Rules: (1) confidence <75% + BLOCKED → FILTERED, (2) confidence <60% → À_VOIR, (3) new users <14 days: notification on every BLOCKED. Rules immutable, 100% unit test coverage required.

**Safeguard 5 — Distributed state divergence prevention:**
`shouldApplyLabel(classificationAt, gmailModifiedAt, userModifiedAt)` function — returns false if user has manually modified since classification. Post-outage recovery: slowdown processing (5 emails/sec), check each email against current Gmail state before applying. `reconciliation_conflicts` table for audit.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack monorepo (Turborepo) — Next.js App Router dashboard + Node.js background workers + shared packages. Domain confirmed via ADR-005.

### Starter Options Considered

**Option A — `npx create-turbo@latest`** (Turborepo 2.8.1, Vercel core team)
- Minimal scaffold: apps/web + apps/docs + packages/ui + shared configs
- Zero opinionated library choices — all Kyrra-specific stack decisions preserved
- Adaptation required: rename apps/docs → apps/worker, replace packages/ui with packages/shared

**Option B — `next-forge`** (`npx next-forge init`, production-grade SaaS)
- Full SaaS batteries included: auth, Prisma ORM, Stripe, Resend, analytics, feature flags
- Stack conflicts with Kyrra: Prisma vs Supabase native, Resend vs Postmark/SES, Clerk vs custom Gmail OAuth
- Over-engineered: ~15 packages on day 1, most irrelevant to Kyrra's pipeline-first architecture

### Selected Starter: `create-turbo@latest` — customized to ADR-005

**Rationale:** next-forge's opinionated choices (Prisma, Resend, Clerk) conflict with Kyrra's pre-decided stack (Supabase, Postmark, Gmail OAuth). The minimal create-turbo starter provides the correct Turborepo skeleton with zero conflicting decisions; the ADR-005 structure maps onto it directly.

**Initialization Command:**

```bash
npx create-turbo@latest kyrra --package-manager pnpm
```

**Post-initialization customization (first story):**

```bash
# Rename apps/docs → apps/worker (Node.js classification/polling/recap workers)
# Replace packages/ui → packages/shared (TypeScript types, Zod schemas, classification helpers)
# Remove default placeholder content from apps/web
```

**Final monorepo structure (post-customization):**

```
kyrra/
├── apps/
│   ├── web/          ← Next.js App Router (dashboard, auth, admin)
│   └── worker/       ← Node.js (classification worker, reconciliation poller, recap cron)
│       ├── src/
│       │   ├── classification.ts   ← queue consumer
│       │   ├── reconciliation.ts   ← polling cron
│       │   ├── recap.ts            ← recap generator
│       │   └── index.ts            ← imports all 3 (MVP-0 single process)
├── packages/
│   ├── shared/       ← TypeScript types, Zod schemas, ClassificationSafetyRules, LLMGateway interface
│   ├── eslint-config/ ← shared ESLint config
│   └── tsconfig/     ← shared TypeScript config
├── turbo.json
└── package.json
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript strict mode across all apps and packages. Node.js 20 LTS. Shared `tsconfig` base with per-app extension.

**Package Manager:**
pnpm (chosen for workspace strictness and deterministic lockfile over npm/yarn). `shamefully-hoist=false` in `.npmrc` — prevents apps/worker from accidentally loading web-only packages.

**Build Tooling:**
Turborepo task graph (`turbo.json`) — intentionally minimal, 3 tasks only: `dev`, `build`, `lint`. No pipeline complexity at MVP-0. Remote caching via Vercel. CI: two independent filter jobs (`turbo build --filter=web...` / `turbo build --filter=worker...`) to avoid cross-rebuilds.

**Code Organization:**
`apps/` for deployable services (Vercel → apps/web; Railway → apps/worker). `packages/` for shared internal libraries. Cross-app imports via workspace protocol (`@kyrra/shared`). `packages/shared` scope rule: types, Zod schemas, ClassificationSafetyRules **only** — no API calls, no secrets. Zod schemas in `packages/shared/schemas/` serve dual purpose: worker pipeline validation AND dashboard form validation (zero duplication).

**apps/worker Entry Points:**
3 named entry points (classification.ts / reconciliation.ts / recap.ts) imported by index.ts at MVP-0. Deployable as 3 independent Railway services at MVP-1 with no refactoring.

**Testing Framework:**
Vitest for unit tests (apps/worker classification logic, packages/shared). Playwright for E2E (apps/web dashboard flows). Per-app test configuration.

**Development Experience:**
`turbo dev` runs apps/web + apps/worker in parallel. Hot reload: Next.js (apps/web), tsx watch (apps/worker). `packages/shared` changes detected via turborepo watch mode.

**Styling Solution (apps/web):**
Tailwind CSS v4 + shadcn/ui components. CSP-strict configuration. No third-party tracking scripts.

**Deploy Order:**
apps/worker before apps/web (pipeline-first — demonstrate email classification before dashboard UI). Sprint 1 = working classification pipeline; Sprint 2 = dashboard connected to live pipeline.

**Known Failure Modes (mitigated at setup):**
- Vercel monorepo: `vercel.json` with `rootDirectory: "apps/web"` required on first deploy
- Worker crash safety: graceful SIGTERM handler required in apps/worker Sprint 1 (zero email loss guarantee)
- packages/shared scope rule: types, Zod schemas, ClassificationSafetyRules only — no API calls, no secrets
- Railway deploy order: Supabase migrations must precede worker deployment in CI pipeline
- pnpm install: run as pre-commit hook to prevent lockfile divergence
- `tsc --noEmit`: CI step before every deployment to catch cross-app type breakage

**Shark Tank Validation (3/3 investors aligned):**
- Turborepo justified by packages/shared cross-app type consistency — not premature optimization
- Vercel/Railway split is intentional: Edge CDN + native Turborepo cache for web, long-running process for worker
- Worker statelessness + Supabase queue = Railway vendor lock-in eliminated (migrate to Fly.io EU / Render EU: redeploy same container, zero code change)
- Cost envelope confirmed: ~1€/user/month at MVP-0 (50 users)
- SIGTERM graceful shutdown: mandatory Sprint 1, not deferred

**ADR-006 (pending — evaluate at MVP-1):**
Bun runtime for apps/worker only. Bun 1.2 supported by Railway natively; 3x I/O performance vs Node.js. Blocked at MVP-0 by ecosystem edge cases with googleapis / @supabase/supabase-js. Evaluate at MVP-1 with classification worker benchmarks.

**ADR-002 confirmed — Recap cron stays on Railway:**
Recap generation requires `SERVICE_ROLE_KEY` (cross-user data access for generating digests). Moving Recap to Vercel Cron would require `SERVICE_ROLE_KEY` in apps/web — direct violation of the ANON_KEY-only constraint. Self-consistency validation confirmed: all 3 independent reasoning approaches (security/cost/DX) reject this migration. Recap cron remains `apps/worker/src/recap.ts` on Railway.

**Note:** Project initialization using the above command should be the **first implementation story** (Epic 0 — Foundation). Post-initialization customization (rename/replace packages, configure vercel.json, add SIGTERM handler) is part of the same story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Auth: Supabase Auth + Google OAuth (`@supabase/ssr`) for dashboard; custom PKCE flow for Gmail integration
- API pattern: Server Actions (mutations) + Route Handlers (webhooks only)
- Migration tooling: Supabase CLI (`supabase/migrations/*.sql`)
- Env separation: `ANON_KEY` (web, RLS enforced) vs `SERVICE_ROLE_KEY` (worker only, RLS bypass)
- Admin middleware: `ADMIN_USER_IDS` env var (Supabase UUIDs, immutable)

**Important Decisions (Shape Architecture):**
- Client state: TanStack Query v5 (Client Components only — detailed dashboard mode)
- Error handling: `ActionResult<T> = { data: T; error: null } | { data: null; error: string }` throughout
- Error tracking: Sentry (`@sentry/nextjs` + `@sentry/node`) with ClassificationLogger whitelist constraint
- CI/CD: GitHub Actions with Turborepo filter-based jobs

**Deferred Decisions (Post-MVP-0):**
- Redis atomic counters (free plan counter) → MVP-1
- Dedicated secrets vault → MVP-1
- Admin MFA + Supabase roles → MVP-1
- Bun runtime for apps/worker (ADR-006 pending) → evaluate at MVP-1

### Data Architecture

**Migration Tooling:** Supabase CLI (`supabase/migrations/*.sql`)
- Rationale: Supabase-native, no ORM overhead, RLS policies written in SQL natively
- Types: `supabase gen types typescript` auto-generates DB types from schema
- Rejected: Prisma (stack conflict with Supabase-first approach), Drizzle (abstraction layer counterproductive over Supabase RLS)
- Migration pattern: NOT NULL columns via 3-step only (nullable → backfill → constraint). Always test migrations on realistic data before production.

**Caching:** None at MVP-0
- Free plan counter: `usage_counters (user_id UUID, date_bucket DATE, count INT)` — Supabase row upsert
- Redis atomic counter: MVP-1 migration (ADR-001 pattern)

**DB Constraints:** Dual-layer validation
- Application: Zod schemas in `packages/shared/schemas/` (dual-use: worker pipeline + dashboard forms)
- Database: PostgreSQL CHECK constraints on critical enum fields (`classification_result`, `confidence_score BETWEEN 0 AND 1`)

### Authentication & Security

**Auth Flow (Two intentionally separate OAuth flows):**

*Step 1 — Dashboard login:* Supabase Auth Google OAuth (email + profile scopes)
- Package: `@supabase/ssr` (server-side cookie sessions for Next.js App Router)
- Session protection: `supabase.auth.getUser()` on all server-side route protection (never `getSession()` alone)

*Step 2 — Gmail integration (onboarding):* Custom PKCE flow (gmail.modify + gmail.readonly)
- Tokens stored encrypted (AES-256) in `user_integrations` table, scoped per `user_id`
- Proactive refresh: 1h before expiry (not at expiry). Verify DB persistence after every write (read-back assertion).

**Rationale for separation:** RGPD Art.7 granular consent (revoke Gmail without losing account), worker token independence, B2B alignment (login email ≠ Gmail pro address).

**Rejected paths:** Combined Supabase Auth + Gmail scopes (RGPD Art.7 violation + worker token complexity), NextAuth.js (unnecessary dependency, same RGPD issue).

**`user_integrations` table structure:**
```typescript
type UserIntegration = {
  id: string
  user_id: string                   // FK → auth.users
  provider: 'gmail' | 'outlook'
  email: string                     // gmail address (may differ from login email)
  access_token: string              // AES-256 encrypted
  refresh_token: string             // AES-256 encrypted
  expires_at: Date
  scopes: string[]                  // ['gmail.modify', 'gmail.readonly']
  watch_expiry: Date | null
  watch_history_id: string | null
  status: 'active' | 'revoked' | 'expired'  // PM9: track token revocation
}
```

**Token Revocation Handling (PM9):**
- On `invalid_grant` error during refresh: set `status = 'revoked'`, pause user pipeline (`user_pipeline_health.mode = 'paused'`)
- Notify user via **Postmark** (not Gmail — the Gmail channel is broken!)
- Dashboard displays reconnection banner when `status = 'revoked'`
- Worker skips all jobs for users with `status != 'active'`

**Admin Access (MVP-0):**
- Middleware: `ADMIN_USER_IDS` env var (comma-separated Supabase UUIDs — immutable, not email addresses which are mutable)
- Startup validation: throws if `ADMIN_USER_IDS` is undefined (fail-crash > fail-open)
- Upgrade path: Supabase `user_roles` table + MFA at MVP-1

### API & Communication Patterns

**Dashboard API:** Next.js Server Actions (all mutations — type-safe, no extra infrastructure)
- Mutations: reclassification, whitelist CRUD, settings, account deletion, uninstall
- Return type standard: `ActionResult<T> = { data: T; error: null } | { data: null; error: string }`
- Idempotency: required for all reclassification mutations — `idempotency_key` field + DB UNIQUE constraint on `(user_id, email_id, idempotency_key)` in `email_classifications`

**Webhook Handlers:** Route Handlers only
```
apps/web/app/api/webhooks/
├── stripe/route.ts    ← Stripe events (signature verification + idempotency via processed_webhook_events table)
└── gmail/route.ts     ← Gmail Pub/Sub push (Google JWT verification — mandatory Sprint 1, rate limit 100 req/min)
```

**Inter-service Communication:** All via Supabase — zero direct HTTP between apps/web and apps/worker
- apps/web writes to Supabase → apps/worker reads via polling
- Intentional decoupling: apps/worker deployable and testable independently

**Error Handling:** `{ data, error }` pattern consistent with supabase-js throughout codebase

### Frontend Architecture

**Client State Management:** TanStack Query v5 (`@tanstack/react-query`)
- Scope: Client Components only — Server Components fetch directly via supabase-js
- Use cases: real-time reclassification status polling (<10s), free plan counter updates, circuit breaker status
- Justification: optimistic mutations with rollback (reclassification), devtools, stale time control

**Route Groups:**
```
app/
├── (auth)/              ← /login, /auth/callback (Supabase OAuth), /connect-gmail (PKCE)
├── (dashboard)/         ← protected layout (supabase.auth.getUser())
│   ├── page.tsx         ← simple mode (Server Component, FCP <1s, supabase-js direct)
│   └── detailed/        ← detailed mode (Client Component + TanStack Query)
└── api/webhooks/        ← Stripe + Gmail Pub/Sub handlers only
```
Route `/admin` protected by separate middleware (`ADMIN_USER_IDS` check).

**Forms:** React Hook Form + Zod resolver — schemas from `packages/shared/schemas/`

**Integration API response type:** `PublicIntegration = Omit<UserIntegration, 'access_token' | 'refresh_token'>` — tokens never exposed to apps/web

### Infrastructure & Deployment

**CI/CD:** GitHub Actions
```
Jobs:
  test-lint     → turbo test lint (all packages)
  build-web     → turbo build --filter=web... → deploy Vercel
  migrate-db    → supabase db push (runs before worker deploy)
  build-worker  → turbo build --filter=worker... → deploy Railway
  (migrate-db must complete before build-worker)
```

**Error Tracking:** Sentry (free tier)
- `@sentry/nextjs` (apps/web) + `@sentry/node` (apps/worker)
- Constraint: ClassificationLogger whitelist applies to all Sentry contexts — zero email content

**Logging:** Railway built-in (apps/worker) + Vercel built-in (apps/web). No external logging stack at MVP-0.

**Environment Separation:**
- `apps/web`: `SUPABASE_ANON_KEY` (RLS enforced) — CI guard: grep block on `SERVICE_ROLE_KEY` in apps/web PRs
- `apps/worker`: `SUPABASE_SERVICE_ROLE_KEY` (RLS bypass, Railway env only)
- Integration test: assert apps/web Supabase client uses `ANON_KEY` only

### Decision Impact Analysis

**Implementation Sequence:**
1. Supabase project setup + migrations scaffold + `supabase gen types` (blocks everything)
2. Supabase Auth + Google OAuth dashboard login (blocks user-facing features)
3. Gmail PKCE OAuth + `user_integrations` token storage (blocks classification pipeline)
4. apps/worker classification pipeline — deploy first (pipeline-first principle)
5. apps/web dashboard — connects to live pipeline data

**Cross-Component Dependencies:**
- Supabase migrations → DB schema → Zod schemas in `packages/shared` → apps/worker + apps/web
- Supabase Auth `user_id` → `user_integrations` Gmail tokens → classification pipeline → Gmail label operations
- `SERVICE_ROLE_KEY` must never reach apps/web build — enforced by CI grep guard

### Pre-mortem Risk Mitigations

| Risk | Mitigation | Sprint |
|------|-----------|--------|
| Gmail token refresh not persisted to DB | Read-back assertion after every write; proactive refresh 1h before expiry | Sprint 1 |
| `SERVICE_ROLE_KEY` leak into apps/web | CI grep guard on apps/web PRs; integration test asserting ANON_KEY-only client | Sprint 1 |
| Server Action double-submit (reclassification) | Idempotency key + DB UNIQUE constraint; UI button disabled on first click | Sprint 2 |
| NOT NULL migration on existing data | 3-step migration pattern; test on production data dump before deploy | Sprint 1 (process) |
| Admin middleware fail-open on missing env var | Startup throws if `ADMIN_USER_IDS` undefined; use UUIDs not emails | Sprint 1 |

### Red Team Security Hardening

| Attack Vector | Mitigation |
|---------------|-----------|
| Prompt injection via email content | JSON schema `additionalProperties: false`; prompt injection test in CI suite |
| IDOR on integration tokens | `PublicIntegration` type never includes tokens; Supabase RLS as backstop |
| Gmail Pub/Sub webhook flooding (DoS) | Google JWT verification mandatory Sprint 1; rate limit 100 req/min on endpoint |
| Stripe webhook replay | `processed_webhook_events (event_id UNIQUE)` table; idempotent handler |
| Admin identity spoofing via email change | `ADMIN_USER_IDS` uses Supabase UUIDs (immutable), not email addresses (mutable) |

### Self-Consistency Validation

Three independent reasoning approaches (security-first / cost-optimization / developer-experience) converged on identical stack decisions with zero contradictions. Single incohérence corrected: SCAMPER-suggested Recap Vercel Cron migration rejected — Recap requires `SERVICE_ROLE_KEY` (cross-user data) which violates apps/web ANON_KEY-only constraint. ADR-002 confirmed: Recap cron remains on Railway.

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming Conventions:**
- Tables: plural, snake_case → `email_classifications`, `user_integrations`, `usage_counters`
- Columns: snake_case → `user_id`, `created_at`, `classification_result`
- Foreign keys: `{table_singular}_id` → `user_id` (never `fk_users_id`)
- Indexes: `idx_{table}_{column(s)}` → `idx_email_classifications_user_id`
- Enum types: PostgreSQL native ENUMs (not VARCHAR + CHECK constraint) → ensures `supabase gen types` generates union types, not `string`
  ```sql
  CREATE TYPE classification_result AS ENUM ('A_VOIR', 'FILTRE', 'BLOQUE');
  CREATE TYPE queue_status AS ENUM ('pending', 'processing', 'completed', 'failed');
  ```
- Display labels with diacritics (application layer only): `CLASSIFICATION_LABELS` in `packages/shared/constants/classification.ts`

**Code Naming Conventions — Two Zones:**

Zone 1 — DB-originated types (from `supabase gen types`): **snake_case** — matches DB columns exactly, never transform
Zone 2 — Application-layer types (custom TypeScript): **camelCase** — normal TypeScript conventions

```typescript
// Zone 1 (DB-originated): snake_case
type EmailClassification = { user_id: string; classification_result: ClassificationResult; created_at: string }

// Zone 2 (application): camelCase
type ActionResult<T = void> = { data: T; error: null } | { data: null; error: AppError }
type PublicIntegration = { provider: string; connectedEmail: string; watchExpiry: Date | null }
```

- TypeScript types/interfaces (Zone 2): PascalCase → `UserIntegration`, `ActionResult`, `AppError`
- Zod schemas: camelCase + `Schema` suffix → `emailClassificationSchema`, `reclassifyParamsSchema`
- React components: PascalCase → `DashboardSimpleView.tsx`
- Client Components naming: `*.client.tsx` suffix to distinguish from Server Components
- Functions: camelCase verb+noun → `getEmailClassifications`, `reclassifyEmail`
- Server Actions: verb+noun → `reclassifyEmail`, `updateWhitelist`, `deleteAccount`
- Worker functions: verb+noun → `processEmail`, `renewWatch`, `generateRecap`
- Constants (env vars): SCREAMING_SNAKE_CASE → `ADMIN_USER_IDS`, `SUPABASE_ANON_KEY`

**Classification Constants:**
```typescript
// packages/shared/constants/classification.ts
export const CLASSIFICATION_RESULTS = ['A_VOIR', 'FILTRE', 'BLOQUE'] as const
export type ClassificationResult = typeof CLASSIFICATION_RESULTS[number]
export const CLASSIFICATION_LABELS: Record<ClassificationResult, string> = {
  A_VOIR: 'À voir',
  FILTRE: 'Filtré',
  BLOQUE: 'Bloqué',
}

// System whitelisted senders — skip classification entirely (PM6)
export const SYSTEM_WHITELISTED_SENDERS = [
  'noreply@kyrra.io',
  'recap@kyrra.io',
  'support@kyrra.io',
] as const
```

**Classification Signal Type (Safety Rule 0):**
```typescript
// packages/shared/types/classification-signal.ts
// SafetyRules return ClassificationSignal, not ClassificationResult
// FORCE_LLM_REVIEW is a routing signal — NEVER written to DB
export type ClassificationSignal = ClassificationResult | 'FORCE_LLM_REVIEW'
```

### Structure Patterns

**Project Organization:**
```
apps/web/
├── app/
│   ├── (auth)/
│   │   └── page.tsx                          ← Server Component
│   │   └── api/auth/callback/google/route.ts ← Route Handler (OAuth PKCE callback)
│   ├── (dashboard)/
│   │   ├── actions.ts                        ← Server Actions (co-located, NOT in components)
│   │   ├── page.tsx                          ← Server Component (simple mode)
│   │   └── detailed/
│   │       └── page.tsx                      ← Client Component (TanStack Query)
│   └── api/webhooks/
│       ├── stripe/route.ts                   ← Route Handler (Stripe events)
│       └── gmail/route.ts                    ← Route Handler (Pub/Sub push)
├── components/
│   ├── ui/                                   ← shadcn/ui primitives (never modify)
│   ├── {feature}/
│   │   ├── StatsCard.tsx                     ← Server Component
│   │   └── FilterDropdown.client.tsx         ← Client Component (*.client.tsx)
└── lib/
    └── supabase/
        ├── server.ts                         ← createServerClient (ANON_KEY, cookies)
        └── browser.ts                        ← createBrowserClient (ANON_KEY)

apps/worker/src/
├── classification.ts    ← queue consumer loop + processReclassificationRequests()
├── reconciliation.ts    ← Promise.all([watchRenewalLoop(), reconciliationLoop()]) + recovery mode
├── recap.ts             ← recap generator + cleanupExpiredTokens() (MVP-1)
├── index.ts             ← 5 resilientLoop()s, SIGTERM handler, main()
└── lib/
    ├── gmail.ts                    ← + invalid_grant detection → status revoked
    ├── supabase.ts                 ← createServiceClient (SERVICE_ROLE_KEY only)
    ├── llm-gateway.ts              ← circuit breaker Supabase-backed + LLM_TIMEOUT_MS=14000
    ├── classification-logger.ts
    └── queue-consumer.ts           ← claimNextJob() canonical function

packages/shared/
├── schemas/             ← Zod schemas (dual-use)
├── types/               ← custom TypeScript types (Zone 2)
├── constants/           ← classification.ts, errors.ts
├── rules/               ← ClassificationSafetyRules (100% coverage required)
│   ├── rule-0-fingerprint-bloque-force-llm.ts      ← Safety Rule 0 (returns ClassificationSignal)
│   ├── rule-0-fingerprint-bloque-force-llm.test.ts  ← boundary test: confidence=0.90 exact
│   ├── rule-1-low-confidence-blocked.ts
│   ├── rule-1-low-confidence-blocked.test.ts  ← co-located
│   └── index.ts
└── types/
    └── classification-signal.ts  ← ClassificationSignal = ClassificationResult | 'FORCE_LLM_REVIEW'
# Note: queue-consumer.ts lives in apps/worker/src/lib/ (not packages/shared — would require supabase-js import)
```

**Test Location:**
- Unit tests: co-located `*.test.ts` next to the file being tested
- Safety rules: `packages/shared/rules/*.test.ts` (mandatory co-location, 100% branch coverage enforced by c8)
- E2E tests: `e2e/` (monorepo root — needs both apps running; Playwright dual webServer config)
- Integration tests: `apps/worker/src/*.integration.test.ts` (requires real Supabase test project + Gmail test account)

**Server Actions location:** `app/{route-group}/actions.ts` — never inside component files, never in `lib/`

**Route Handler scope:**
- Server Actions = mutations from **our UI** (form submits, button clicks)
- Route Handlers = requests from **third parties** (Stripe webhooks, Gmail Pub/Sub push, OAuth callbacks)
- Worker → Dashboard: ALWAYS via Supabase tables — zero direct HTTP between apps/worker and apps/web

### Format Patterns

**Server Action Return Type (universal):**
```typescript
// packages/shared/types/action-result.ts
export type AppError = { code: string; message: string }
export type ActionResult<T = void> =
  | { data: T; error: null }
  | { data: null; error: AppError }

// packages/shared/constants/errors.ts
export const ERROR_CODES = {
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL_ERROR',
} as const

// Server Action signature — params typed as 'unknown' forces explicit Zod.safeParse:
export async function reclassifyEmail(params: unknown): Promise<ActionResult> {
  const parsed = reclassifyParamsSchema.safeParse(params)
  if (!parsed.success) return { data: null, error: { code: ERROR_CODES.VALIDATION, message: parsed.error.message } }
  // ...
  return { data: null, error: null }
}
```

**Date/Time Format:**
- DB: `TIMESTAMPTZ` (UTC with timezone, always)
- TypeScript: `Date` objects (supabase-js auto-conversion)
- JSON: ISO 8601 → `"2026-03-16T14:30:00Z"` — never Unix timestamps

**Worker Queue Item:**
```typescript
type EmailQueueItem = {
  id: string
  user_id: string
  gmail_message_id: string
  gmail_history_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  retry_count: number
  created_at: string
  processed_at: string | null
  error_message: string | null  // error code only, never email content
}
```

### Communication Patterns

**Queue Atomicity — canonical pattern:**
```typescript
// apps/worker/src/lib/queue-consumer.ts
// ALWAYS use this — never SELECT + UPDATE (race condition)
export async function claimNextJob(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('email_queue_items')
    .update({ status: 'processing', claimed_at: new Date().toISOString() })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .select()
    .single()
  return data  // null = no pending job (another worker claimed it first)
}
```

**Retry Pattern (worker):** max 3 retries, exponential backoff (1s → 2s → 4s). After max retries: `failed` status + health monitor alert. Never retry LLM prompt injection failures (→ rules fallback immediately).

**TanStack Query refetch strategy:**
```typescript
// Detailed dashboard mode
useQuery({
  queryKey: ['classifications', userId],
  queryFn: fetchClassificationStats,
  refetchInterval: 30_000,        // 30s background polling
  refetchOnWindowFocus: true,     // immediate on tab return
})

// Post-mutation (reclassification confirmed)
const { mutate } = useMutation({
  mutationFn: reclassifyEmail,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classifications'] }),
})
```
Supabase Realtime: deferred to MVP-1 (websocket complexity not justified at MVP-0 scale).

### Process Patterns

**Server Component vs Client Component — operational rule:**
```
Step 1: Write component without any directive (Server Component by default)
Step 2: If TypeScript errors on hooks → add 'use client'
Step 3: If 'use client', make the component AS SMALL AS POSSIBLE
         (push data fetching to parent Server Component, pass as props)

ESLint: 'use client' forbidden in app/**/page.tsx and app/**/layout.tsx
```

**Validation — dual-layer (never skip server-side):**
```typescript
// Server Action: params: unknown forces Zod parse (skipping = TypeScript error)
// React form: same schema via zodResolver (client UX only, not security)
// Client validation = UX; Server validation = security boundary
```

**Supabase Client Pattern:**
```typescript
// apps/web server (Server Components, Server Actions, Route Handlers)
import { createServerClient } from '@/lib/supabase/server'   // ANON_KEY

// apps/web client (Client Components only)
import { createBrowserClient } from '@/lib/supabase/browser'  // ANON_KEY

// apps/worker ONLY (never in apps/web)
import { createServiceClient } from './lib/supabase'          // SERVICE_ROLE_KEY
```

**SIGTERM Graceful Shutdown + Resilient Loops:**
```typescript
// apps/worker/src/index.ts
let isShuttingDown = false
process.on('SIGTERM', () => { isShuttingDown = true })

// Each loop is wrapped in resilientLoop — crash in one loop does NOT kill others
async function resilientLoop(name: string, fn: () => Promise<void>): Promise<never> {
  while (!isShuttingDown) {
    try {
      await fn()
    } catch (error) {
      Sentry.captureException(error, { tags: { loop: name } })
      await sleep(5000)  // 5s backoff before restart
    }
  }
  return undefined as never
}

await Promise.all([
  resilientLoop('classification', () => classificationLoop(supabase)),
  resilientLoop('reclassification', () => reclassificationLoop(supabase)),  // token redemption
  resilientLoop('watchRenewal', () => watchRenewalLoop(supabase)),
  resilientLoop('reconciliation', () => reconciliationLoop(supabase)),       // + recovery mode
  resilientLoop('recapCron', () => recapCronLoop(supabase)),
])
process.exit(0)
// Railway config: RAILWAY_SHUTDOWN_TIMEOUT=20 (seconds)
// Max LLM call: 14s → 6s margin before SIGKILL
```

**ClassificationLogger — environment-aware:**
```typescript
// Dev/Test: throw (caught in CI)
ClassificationLogger.log({ email_id, subject: '...' })  // → throws ClassificationLoggerViolation

// Production: strip illegal field + Sentry CRITICAL + continue (never crash on logger violation)
// Mandatory CI test:
expect(() => ClassificationLogger.log({ email_id, subject: 'test' }))
  .toThrow(ClassificationLoggerViolation)
```

**Local Development:**
- `GMAIL_MODE=polling` env var → worker polls Gmail API every 30s (no Pub/Sub setup needed locally)
- Test Gmail account: dedicated `@gmail.com` for integration tests — never personal accounts
- Gmail API: never mocked in integration tests (unit tests only for ClassificationSafetyRules + LLMGateway)

### Enforcement Guidelines

**All AI Agents MUST:**
1. Type Server Action `params` as `unknown` — forces explicit `Zod.safeParse` at server boundary
2. Use `ActionResult<T>` return type with `AppError` shape (`{ code, message }`)
3. Use `ClassificationLogger` (never `console.log`) in apps/worker for classification events
4. Default to Server Components — add `'use client'` only when TypeScript requires it
5. Use `claimNextJob()` canonical pattern — never SELECT + UPDATE for queue processing
6. Keep `SERVICE_ROLE_KEY` in apps/worker only — ESLint `no-restricted-imports` in apps/web
7. Use PostgreSQL ENUMs (not VARCHAR + CHECK) for classification_result and queue status
8. Co-locate safety rule tests in `packages/shared/rules/` — c8 branch coverage 100%

**Anti-Patterns:**
```typescript
// ❌ throwing from Server Action
throw new Error('Not found')
// ✅ ActionResult with error code
return { data: null, error: { code: ERROR_CODES.NOT_FOUND, message: 'Email not found' } }

// ❌ 'use client' on page.tsx (converts entire page from Server to Client Component)
'use client'  // in app/(dashboard)/page.tsx
// ✅ extract small Client Component
// app/(dashboard)/components/FilterDropdown.client.tsx

// ❌ SELECT + UPDATE queue processing (race condition)
const job = await supabase.from('email_queue_items').select()...
await supabase.from('email_queue_items').update({ status: 'processing' })...
// ✅ atomic UPDATE...WHERE
const job = await claimNextJob(supabase)

// ❌ email content in any log or Sentry context
console.log('Processing:', email.body)
// ✅ ClassificationLogger whitelist only
ClassificationLogger.log({ email_id, processing_time_ms })

// ❌ Zod validation client-side only
export async function addToWhitelist(params: WhitelistParams) { ... }
// ✅ unknown forces safeParse at server boundary
export async function addToWhitelist(params: unknown): Promise<ActionResult> {
  const parsed = whitelistSchema.safeParse(params)
  if (!parsed.success) return { data: null, error: { code: ERROR_CODES.VALIDATION, message: '...' } }
}
```

## Project Structure & Boundaries

### Full Monorepo Directory Tree

```
kyrra/                                          ← monorepo root
├── apps/
│   ├── web/                                    ← Next.js App Router (Vercel)
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx                ← Server Component
│   │   │   │   ├── auth/
│   │   │   │   │   └── callback/
│   │   │   │   │       ├── google/
│   │   │   │   │       │   └── route.ts        ← Gmail PKCE callback (Route Handler)
│   │   │   │   │       └── route.ts            ← Supabase Auth callback
│   │   │   │   └── connect-gmail/
│   │   │   │       └── page.tsx                ← Gmail PKCE onboarding step
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx                  ← Protected layout (auth.getUser())
│   │   │   │   ├── page.tsx                    ← Simple mode (Server Component, FCP <1s)
│   │   │   │   ├── detailed/
│   │   │   │   │   └── page.tsx                ← Detailed mode (Client Component + TanStack Query)
│   │   │   │   ├── reclassification-pending/
│   │   │   │   │   └── page.tsx                ← Client Component — poll reclassification_requests status (2s)
│   │   │   │   ├── onboarding-progress/
│   │   │   │   │   └── page.tsx                ← Client Component — whitelist scan progress bar
│   │   │   │   └── actions/                    ← Server Actions — domain-split (never in components)
│   │   │   │       ├── classification.ts       ← reclassifyEmail, bulkReclassify
│   │   │   │       ├── whitelist.ts            ← addToWhitelist, removeFromWhitelist
│   │   │   │       ├── settings.ts             ← updateExposureMode, updateNotifications
│   │   │   │       └── account.ts              ← deleteAccount, uninstallKyrra (FR84 clean uninstall)
│   │   │   ├── admin/
│   │   │   │   └── page.tsx                    ← Admin dashboard (ADMIN_USER_IDS middleware guard)
│   │   │   └── api/
│   │   │       ├── webhooks/
│   │   │       │   ├── stripe/
│   │   │       │   │   └── route.ts            ← Stripe events (signature + processed_webhook_events)
│   │   │       │   └── gmail/
│   │   │       │       └── route.ts            ← Gmail Pub/Sub push (Google JWT verification)
│   │   │       ├── token/
│   │   │       │   └── [token]/
│   │   │       │       └── route.ts            ← FR85 token redemption (ANON_KEY + RLS, inserts reclassification_requests)
│   │   │       └── cron/
│   │   │           └── health-check/
│   │   │               └── route.ts            ← MVP-1: Vercel Cron 15min (SECURITY DEFINER fn via ANON_KEY)
│   │   ├── components/
│   │   │   ├── ui/                             ← shadcn/ui primitives (never modify directly)
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCard.tsx               ← Server Component
│   │   │   │   ├── ClassificationList.tsx      ← Server Component
│   │   │   │   └── FilterDropdown.client.tsx   ← Client Component (*.client.tsx naming)
│   │   │   └── shared/
│   │   │       └── LoadingSpinner.tsx
│   │   ├── lib/
│   │   │   └── supabase/
│   │   │       ├── server.ts                   ← createServerClient (ANON_KEY, cookies)
│   │   │       └── browser.ts                  ← createBrowserClient (ANON_KEY)
│   │   ├── middleware.ts                       ← Auth guard + ADMIN_USER_IDS check
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── vercel.json                         ← rootDirectory: "apps/web" (required for Vercel)
│   │
│   └── worker/                                 ← Node.js long-running processes (Railway EU)
│       ├── src/
│       │   ├── classification.ts               ← queue consumer + processReclassificationRequests()
│       │   ├── reconciliation.ts               ← watchRenewalLoop + reconciliationLoop + recovery mode
│       │   ├── recap.ts                        ← recap generator + cleanupExpiredTokens() (MVP-1)
│       │   ├── index.ts                        ← 5 resilientLoop()s + SIGTERM handler + main()
│       │   └── lib/
│       │       ├── gmail.ts                    ← Gmail API client + invalid_grant → status revoked
│       │       ├── supabase.ts                 ← createServiceClient (SERVICE_ROLE_KEY only)
│       │       ├── llm-gateway.ts              ← LLMGateway + Supabase circuit breaker + LLM_TIMEOUT_MS=14000
│       │       ├── classification-logger.ts    ← ClassificationLogger (whitelist enforcer)
│       │       └── queue-consumer.ts           ← claimNextJob() canonical function
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared/                                 ← Internal library (@kyrra/shared)
│   │   ├── schemas/                            ← Zod schemas (dual-use: worker pipeline + web forms)
│   │   │   ├── email-classification.ts
│   │   │   ├── reclassify-params.ts
│   │   │   └── whitelist-params.ts
│   │   ├── types/                              ← Custom TypeScript types (Zone 2, camelCase)
│   │   │   ├── action-result.ts                ← ActionResult<T>, AppError
│   │   │   ├── classification-signal.ts        ← ClassificationSignal (routing type, never in DB)
│   │   │   └── integration.ts                  ← UserIntegration, PublicIntegration
│   │   ├── constants/
│   │   │   ├── classification.ts               ← CLASSIFICATION_RESULTS, CLASSIFICATION_LABELS
│   │   │   └── errors.ts                       ← ERROR_CODES
│   │   └── rules/                              ← ClassificationSafetyRules (100% branch coverage)
│   │       ├── rule-0-fingerprint-bloque-force-llm.ts      ← Safety Rule 0 (returns ClassificationSignal)
│   │       ├── rule-0-fingerprint-bloque-force-llm.test.ts ← boundary: confidence=0.90 exact
│   │       ├── rule-1-low-confidence-blocked.ts
│   │       ├── rule-1-low-confidence-blocked.test.ts   ← co-located
│   │       ├── rule-2-very-low-confidence.ts
│   │       ├── rule-2-very-low-confidence.test.ts
│   │       ├── rule-3-new-user-notification.ts
│   │       ├── rule-3-new-user-notification.test.ts
│   │       └── index.ts
│   ├── eslint-config/
│   │   └── package.json
│   └── tsconfig/
│       └── package.json
│
├── supabase/
│   ├── migrations/                             ← NNN_descriptive_name.sql convention
│   │   ├── 001_create_extensions.sql           ← pgcrypto, uuid-ossp
│   │   ├── 002_create_enums.sql                ← classification_result, queue_status (PostgreSQL ENUMs)
│   │   ├── 003_create_user_integrations.sql    ← Gmail token storage (AES-256 encrypted)
│   │   ├── 004_create_email_classifications.sql ← append-only classification table
│   │   ├── 005_create_email_queue_items.sql    ← async processing queue
│   │   ├── 006_create_usage_counters.sql       ← Free plan 30/day counter
│   │   ├── 007_create_user_pipeline_health.sql ← health monitor (Safeguard 1)
│   │   ├── 008_create_llm_metrics.sql          ← cost + bypass rate tracking (Safeguard 3)
│   │   ├── 009_create_processed_webhook_events.sql ← Stripe idempotency (Safeguard webhook replay)
│   │   ├── 010_rls_policies.sql                ← RLS always in last-numbered migration (010)
│   │   ├── 011_recap_tokens.sql                ← FR85 single-use token + RLS for anonymous redemption
│   │   └── 012_reclassification_requests.sql   ← token redemption → worker queue (zero SERVICE_ROLE_KEY in web)
│   └── config.toml
│
├── e2e/                                        ← Playwright E2E tests (monorepo root — needs both apps)
│   ├── auth.spec.ts                            ← login + Gmail connection flows
│   ├── classification.spec.ts                  ← email classification user journey
│   ├── reclassification.spec.ts                ← false positive correction flow
│   └── recap-token.spec.ts                     ← FR85 in-email token redemption
│
├── Dockerfile                                  ← Multi-stage build at monorepo root (not in apps/worker/)
│                                               ←   Stage 1: pnpm install (full workspace)
│                                               ←   Stage 2: build packages/shared
│                                               ←   Stage 3: build apps/worker
│                                               ←   Stage 4: production image (node:20-alpine)
├── playwright.config.ts                        ← Dual webServer: apps/web (port 3000) + apps/worker (port 3001)
├── turbo.json
├── pnpm-workspace.yaml
├── .npmrc                                      ← shamefully-hoist=false
└── package.json
```

### Architectural Boundaries

| Boundary | Rule | Enforcement |
|----------|------|-------------|
| `apps/web` → Supabase | ANON_KEY only; RLS enforced | ESLint `no-restricted-imports` blocks SERVICE_ROLE_KEY in apps/web |
| `apps/worker` → Supabase | SERVICE_ROLE_KEY only; RLS bypass | Railway env var only; never committed |
| `apps/web` ↔ `apps/worker` | Zero direct HTTP; communicate via Supabase tables only | Architecture rule; no shared HTTP client |
| `packages/shared` | Types, Zod schemas, ClassificationSafetyRules only; no API calls, no secrets | ESLint `no-restricted-imports` blocks supabase-js, googleapis |
| Email content | Never written to DB, logs, or Sentry; in-memory processing only | ClassificationLogger whitelist; CI log scan |
| `api/token/[token]/route.ts` | Zero-auth endpoint; token single-use and ≤7 days TTL | DB `recap_tokens` table with `used_at` + `expires_at` CHECK |
| `supabase/migrations/010_rls_policies.sql` | RLS always last numbered migration | Convention + CI verify RLS migration exists |

### FR Group → File Mapping

| FR Group | FRs | Primary Files |
|----------|-----|---------------|
| Classification engine | FR1-9, FR86 | `apps/worker/src/classification.ts`, `packages/shared/rules/index.ts`, `apps/worker/src/lib/llm-gateway.ts` |
| Provider integration | FR10-19 | `apps/worker/src/lib/gmail.ts`, `apps/worker/src/reconciliation.ts`, `supabase/migrations/003_create_user_integrations.sql` |
| Onboarding + whitelist scan | FR20-32 | `apps/web/app/(auth)/connect-gmail/page.tsx`, `apps/worker/src/classification.ts` |
| Clean uninstall | FR84 | `apps/web/app/(dashboard)/actions/account.ts` |
| Dashboard simple mode | FR33-38 | `apps/web/app/(dashboard)/page.tsx` (Server Component) |
| Dashboard detailed mode | FR39-41 | `apps/web/app/(dashboard)/detailed/page.tsx` (Client Component + TanStack Query) |
| Trust & reclassification | FR42-49 | `apps/web/app/(dashboard)/actions/classification.ts` |
| In-email token | FR85 | `apps/web/app/api/token/[token]/route.ts`, `supabase/migrations/011_recap_tokens.sql` |
| Recap generation | FR50-60 | `apps/worker/src/recap.ts` |
| Subscription & plan | FR61-68 | `apps/web/app/api/webhooks/stripe/route.ts`, `apps/web/app/(dashboard)/actions/settings.ts` |
| Privacy, RGPD, admin | FR69-83 | `apps/web/app/admin/page.tsx`, `supabase/migrations/010_rls_policies.sql` |
| Multilingual FR/EN | FR86 | `apps/worker/src/lib/llm-gateway.ts` (LLM handles natively; validated in smoke tests) |

### CI/CD Pipeline Structure

```yaml
# .github/workflows/ci.yml
jobs:
  test-lint:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm install --frozen-lockfile
      - run: turbo test lint
      - run: tsc --noEmit                               # cross-app type check
      - name: Scan for PII in log statements             # P2: Sprint 1 mandatory
        run: |
          grep -rn --include="*.ts" \
            -E "(console\.|logger\.|ClassificationLogger\.)[^;]*(subject|body|snippet|from|to|content)" \
            apps/ packages/ \
          && echo "PII in log detected" && exit 1 || exit 0

  migrate-db:
    needs: [test-lint]
    runs-on: ubuntu-latest
    steps:
      - run: supabase db push --project-ref $SUPABASE_PROJECT_REF
      - run: supabase gen types typescript > packages/shared/types/database.ts
      - run: git diff --exit-code packages/shared/types/database.ts  # CI guard: ENUM sync

  build-worker:
    needs: [migrate-db]                                 # worker deploys FIRST (expand-contract)
    runs-on: ubuntu-latest
    steps:
      - run: docker build -f Dockerfile -t kyrra-worker .   # Dockerfile at monorepo root
      # Railway deployment via Railway GitHub integration

  build-web:
    needs: [build-worker]                               # P4: web waits for worker (expand-contract enforced)
    runs-on: ubuntu-latest
    steps:
      - run: turbo build --filter=web...
      - run: grep -r "SERVICE_ROLE_KEY" apps/web/ && exit 1 || exit 0  # CI security guard
      # Vercel deployment via GitHub integration (auto on merge to main)
```

### Environment Configuration

```env
# apps/web (Vercel environment variables)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...              # ANON_KEY — RLS enforced
NEXT_PUBLIC_APP_URL=https://kyrra.io
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx                          # Gmail PKCE OAuth
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_USER_IDS=uuid1,uuid2                        # Supabase UUIDs (immutable — not email addresses)
SENTRY_DSN=https://...
# ❌ SERVICE_ROLE_KEY must NEVER appear here (CI grep guard enforces)

# apps/worker (Railway environment variables)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...                  # SERVICE_ROLE_KEY — RLS bypass
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
OPENAI_API_KEY=sk-...                             # LLM primary (GPT-4o-mini)
ANTHROPIC_API_KEY=sk-ant-...                      # LLM fallback (Claude Haiku — ADR-004)
POSTMARK_API_KEY=xxx                              # Recap email delivery
SENTRY_DSN=https://...
RAILWAY_SHUTDOWN_TIMEOUT=20                       # SIGTERM grace period (seconds)
GMAIL_MODE=pubsub                                 # pubsub (prod) | polling (local dev: GMAIL_MODE=polling)

# Local development (apps/worker/.env.local)
GMAIL_MODE=polling                                # polls Gmail API every 30s (no Pub/Sub setup needed)
```

### Advanced Elicitation — Step 06 Findings

**Graph of Thoughts (method 12):** Mapping all 86 FRs as an interconnected node graph against the monorepo structure revealed 6 findings:

1. **FR85 token endpoint missing** — no Route Handler existed for in-email token redemption. Added: `apps/web/app/api/token/[token]/route.ts` + `supabase/migrations/011_recap_tokens.sql`.
2. **Reconciliation dual-responsibility** — `reconciliation.ts` conflated watch renewal (must run continuously) with email reconciliation (can pause when queue empty). Fixed: `Promise.all([watchRenewalLoop(), reconciliationLoop()])` with independent loops, each with its own error boundary.
3. **ENUM sync gap** — PostgreSQL ENUM changes require coordinated `supabase gen types` + TypeScript constant updates. Added: CI diff check (`git diff --exit-code packages/shared/types/database.ts`) after every `supabase db push`.
4. **packages/shared → supabase-js import** — `queue-consumer.ts` in packages/shared would import `@supabase/supabase-js`, making the shared package impure (breaks packages/shared scope rule). Relocated: `apps/worker/src/lib/queue-consumer.ts`.
5. **actions/ monolith risk** — Single `actions.ts` for all dashboard mutations would reach 300+ lines. Split into domain files: `actions/classification.ts`, `actions/whitelist.ts`, `actions/settings.ts`, `actions/account.ts`.
6. **Expand-contract schema evolution protocol** — When `packages/shared/schemas/` changes require coordinated deployment (worker must be updated before web), the expand-contract protocol applies: (1) add new field as optional, (2) deploy worker, (3) make field required in web, (4) deploy web. Document in migration PR description.

**Challenge from Critical Perspective (method 36):** Five structural corrections validated and applied:

1. **Dockerfile location** — A Dockerfile inside `apps/worker/` cannot build monorepo dependencies: `packages/shared` is outside its Docker build context. Corrected: Dockerfile at monorepo root with 4-stage multi-stage build (full pnpm install → build packages/shared → build apps/worker → production node:20-alpine image).
2. **queue-consumer.ts location** — Moved from `packages/shared/patterns/` to `apps/worker/src/lib/`. The `claimNextJob()` function requires a `SupabaseClient` instance, which requires `@supabase/supabase-js` — a forbidden import in packages/shared.
3. **e2e/ location** — E2E tests require both apps/web (port 3000) and apps/worker (port 3001) running simultaneously. Placing them in `apps/web/e2e/` is architecturally incoherent. Corrected: `e2e/` at monorepo root with `playwright.config.ts` configuring dual `webServer` entries.
4. **actions/ split** — Confirmed from Graph of Thoughts: single `actions.ts` becomes unmanageable. Four domain-split files enforce single-responsibility at file level and prevent naming collisions as Server Actions grow.
5. **Migration naming convention** — Descriptive names (`NNN_descriptive_name.sql`) required; not generic names. RLS policies always at the highest consecutive number in the initial scaffold (`010_`). All future migrations append higher numbers (`011_`, `012_`, ...) — never renumber existing migrations.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All technology pairings validated as compatible — zero version conflicts. TanStack Query v5 + React 19 concurrent rendering confirmed. Sentry integration respects ClassificationLogger whitelist constraint. Supabase Auth `@supabase/ssr` fully compatible with Next.js App Router server-side cookies.

**Pattern Consistency:** Zone 1/Zone 2 naming split is clear and ESLint-enforceable. `ActionResult<T>` standardizes all Server Action returns. Server-first component pattern enforced by ESLint. Queue atomicity has single canonical entry point (`claimNextJob`). `ClassificationSignal` type cleanly separates routing signals from persisted classification results.

**Structure Alignment:** All structural corrections from step-06 and step-07 elicitations merged into directory tree and pattern sections. No orphan references. CI YAML enforces deploy order (`build-web` depends on `build-worker`).

### Requirements Coverage ✅

**All 86 FRs mapped to specific files** (FR group → file mapping table in step-06). No orphan FRs. Late-added FRs (FR84 clean uninstall, FR85 in-email token, FR86 multilingual) all have architectural support with file-level specificity.

**All 12 NFR targets addressed architecturally:**
- Performance: async queue, Server Components FCP, 14s LLM timeout
- Security: ANON_KEY separation, RLS, AES-256 tokens, CI grep guard, PII log scan
- RGPD: Art.7 granular consent (separate OAuth), Art.17 erasure (ON DELETE CASCADE), Art.5.1.e data minimization (token cleanup MVP-1), zero data retention (in-memory only)
- Cost: Supabase-backed circuit breaker, fingerprinting bypass ratio monitoring, hard cap 500€/month

### Implementation Readiness ✅

**Decision Completeness:** 5 ADRs documented with rationale, rejected paths, and upgrade paths. ADR-004 amended (circuit breaker Supabase-backed from MVP-0). ADR-006 deferred to MVP-1 (Bun runtime).

**Structure Completeness:** Full directory tree with 50+ files named. FR → file mapping. CI/CD pipeline with 4 jobs. Environment configuration for both apps. Architectural boundaries table.

**Pattern Completeness:** 10 enforcement rules (original 8 + Safety Rule 0 + resilientLoop). 5 anti-patterns with code examples. All major patterns have concrete TypeScript code blocks.

### Validation Schemas (Gap Resolutions)

**recap_tokens table (011):**
```sql
CREATE TABLE recap_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,         -- encode(gen_random_bytes(32), 'hex')
  email_id    TEXT        NOT NULL,                -- gmail_message_id to reclassify
  recap_date  DATE        NOT NULL,
  used_at     TIMESTAMPTZ,                         -- NULL = not yet redeemed
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_recap_tokens_token ON recap_tokens(token);
ALTER TABLE recap_tokens ENABLE ROW LEVEL SECURITY;
-- Anonymous token lookup (token = 32-byte hex, unguessable)
CREATE POLICY "Anonymous token lookup" ON recap_tokens FOR SELECT USING (true);
-- Mark used (only if not yet used)
CREATE POLICY "Token redemption" ON recap_tokens FOR UPDATE
  USING (used_at IS NULL) WITH CHECK (used_at IS NOT NULL);
```

**reclassification_requests table (012):**
```sql
CREATE TABLE reclassification_requests (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id      TEXT        NOT NULL,
  source        TEXT        NOT NULL DEFAULT 'recap_token',
  token_id      UUID        REFERENCES recap_tokens(id),
  status        TEXT        NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ
);
ALTER TABLE reclassification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insert reclassification" ON reclassification_requests FOR INSERT WITH CHECK (true);
```

**Token redemption Route Handler (ANON_KEY — zero SERVICE_ROLE_KEY):**
```typescript
// apps/web/app/api/token/[token]/route.ts
export async function GET(req: Request, { params }: { params: { token: string } }) {
  const supabase = createServerClient()  // ANON_KEY
  const { data: recapToken } = await supabase
    .from('recap_tokens').select('id, user_id, email_id')
    .eq('token', params.token).is('used_at', null)
    .gt('expires_at', new Date().toISOString()).single()
  if (!recapToken) return Response.redirect('/token-expired')

  const { error } = await supabase.from('recap_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', recapToken.id).is('used_at', null)
  if (error) return Response.redirect('/token-expired')

  await supabase.from('reclassification_requests').insert({
    user_id: recapToken.user_id, email_id: recapToken.email_id,
    source: 'recap_token', token_id: recapToken.id,
  })
  return Response.redirect('/reclassification-pending?request_id=' + recapToken.id)
}
```

**Safety Rule 0 (fingerprint BLOQUE < 90% → force LLM review):**
```typescript
// packages/shared/rules/rule-0-fingerprint-bloque-force-llm.ts
import type { ClassificationResult } from '../constants/classification'
import type { ClassificationSignal } from '../types/classification-signal'

export function applyRule0(
  result: ClassificationResult,
  confidence: number,
  source: 'fingerprint' | 'llm'
): ClassificationSignal {
  if (source === 'fingerprint' && result === 'BLOQUE' && confidence < 0.90) {
    return 'FORCE_LLM_REVIEW'
  }
  return result
}
// Worker handles: if signal === 'FORCE_LLM_REVIEW' → re-route to LLM path, never write to DB
```

**Reconciliation as Zero-Email-Loss Guarantee:**
```typescript
// apps/worker/src/reconciliation.ts
// The reconciliation poller is the PRIMARY guarantee of zero email loss.
// Gmail Pub/Sub is a latency optimization — not a delivery guarantee.
// After any outage, reconciliation catches ALL missed emails via gmail.history().
async function reconciliationLoop(supabase: SupabaseClient) {
  let lastSuccessfulPoll = Date.now()
  while (!isShuttingDown) {
    try {
      await reconcileEmails(supabase)
      const wasRecovering = (Date.now() - lastSuccessfulPoll) > 60_000
      lastSuccessfulPoll = Date.now()
      await sleep(wasRecovering ? 30_000 : 300_000)  // recovery: 30s, normal: 5min
    } catch { await sleep(10_000) }
  }
}
```

### Package Versions

| Package | Version | Location |
|---------|---------|----------|
| next | ^15.2 | apps/web |
| react / react-dom | ^19.0 | apps/web |
| @supabase/supabase-js | ^2.49 | apps/web + apps/worker |
| @supabase/ssr | ^0.5 | apps/web |
| @tanstack/react-query | ^5.67 | apps/web |
| tailwindcss | ^4.0 | apps/web |
| react-hook-form | ^7.54 | apps/web |
| zod | ^3.24 | packages/shared + apps/web |
| recharts | ^2.15 | apps/web (detailed mode) |
| @sentry/nextjs | ^9.x | apps/web |
| @sentry/node | ^9.x | apps/worker |
| vitest | ^3.0 | apps/worker + packages/shared |
| @playwright/test | ^1.50 | e2e/ |
| turbo | 2.8.1 | root |
| typescript | ^5.7 | root (tsconfig shared) |

### ON DELETE CASCADE Map

| Table | FK → auth.users | Cascade |
|-------|-----------------|---------|
| user_integrations | user_id | ON DELETE CASCADE ✅ |
| email_classifications | user_id | ON DELETE CASCADE ✅ |
| email_queue_items | user_id | ON DELETE CASCADE ✅ |
| usage_counters | user_id | ON DELETE CASCADE ✅ |
| user_pipeline_health | user_id | ON DELETE CASCADE ✅ |
| recap_tokens | user_id | ON DELETE CASCADE ✅ |
| reclassification_requests | user_id | ON DELETE CASCADE ✅ |

All tables cascade on user deletion. `supabase.auth.admin.deleteUser()` triggers atomic cleanup. RGPD Art.17 compliance: immediate, no orphan data.

### RGPD Legal Basis for Data Retention

| Data | Retention | Legal Basis |
|------|-----------|-------------|
| email_classifications (email_id, result, score) | 1 year | Art.6.1.b (contract execution) + Art.5.2 (accountability) |
| user_integrations (encrypted tokens) | Active account duration | Art.6.1.b (service delivery) |
| llm_metrics_hourly (cost aggregates) | 1 year | Art.6.1.f (legitimate interest — cost monitoring) |
| recap_tokens (expired) | MVP-1: cleanup cron deletes after 7 days | Art.5.1.e (storage limitation) |
| Email content | Zero — never stored | Privacy by design |

### SECURITY DEFINER Governance

**Rules for all SECURITY DEFINER functions (bypass RLS by design):**
1. Only primitive type parameters (INT, UUID, DATE, BOOLEAN) — never TEXT/VARCHAR/JSONB
2. Must include `SET search_path = public` (prevents schema hijacking)
3. Return scalar or void only — never SETOF/TABLE with PII columns
4. Maximum 3 SECURITY DEFINER functions at MVP-0
5. Each must be documented in this section with security justification

**Current functions (MVP-1):**
- `get_stale_pipeline_count(threshold_minutes INT)` → returns INT (count only, zero PII)

### Architecture Completeness Checklist

- [x] Project context analyzed (scale, constraints, 7 cross-cutting concerns)
- [x] Pre-mortem safeguards (5 safeguards + 10 pre-mortem mitigations)
- [x] Starter template evaluated (create-turbo, customized to ADR-005)
- [x] Core decisions documented (5 ADRs + ADR-004 amendment + ADR-006 deferred)
- [x] Red Team security hardening (5 attack vectors + PII log scan CI)
- [x] Self-consistency validation (2 passes, 3 agents each, zero residual contradictions)
- [x] Implementation patterns (naming, structure, format, communication, process)
- [x] Enforcement rules for AI agents (10 rules + 5 anti-patterns)
- [x] Project structure (full tree, 50+ files, boundaries, FR→file mapping)
- [x] CI/CD pipeline (4 jobs, deploy order enforced, PII scan, SERVICE_ROLE_KEY guard)
- [x] Package versions pinned
- [x] RGPD legal basis documented per data type
- [x] ON DELETE CASCADE exhaustively mapped
- [x] SECURITY DEFINER governance established
- [x] Thread classification documented as by-design (per-message, not per-thread)

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION
**Confidence Level:** HIGH

**Key Strengths:**
- Privacy-by-design enforced at every layer (code, DB, CI, logging)
- Dual-engine classification with Safety Rule 0 (fingerprint false positive protection)
- Zero SERVICE_ROLE_KEY in apps/web — validated by 2 independent Self-Consistency passes
- Stateless workers + Supabase queue = vendor-independent (Railway replaceable)
- 5 resilient loops with crash isolation (one crash ≠ total failure)
- Reconciliation as zero-email-loss guarantee (not just optimization)
- Token revocation detection + user notification via Postmark
- System whitelisted senders prevent Kyrra self-classification
- Google OAuth verification planned as Sprint 0 parallel action

**MVP-1 Deferred Items (4):**
- F2: Usage counter atomic PostgreSQL function (race condition negligible at 50 users)
- F3: Token cleanup cron (RGPD impact after ~6 months)
- T1+S2: Health-check Vercel Cron + SECURITY DEFINER function
- T2: Failed jobs replay from admin dashboard (Supabase Studio sufficient)

**Sprint 0 (parallel, pre-code):**
- Google OAuth verification application (CASA Tier 2, gmail.modify scope)
- Fallback documented: `gmail.readonly` → dashboard-only mode (no labels)

### Quick Reference — All Enforcement Rules

**AI Agents MUST:**
1. Type Server Action `params` as `unknown` — forces Zod.safeParse
2. Use `ActionResult<T>` with `AppError` shape `{ code, message }`
3. Use `ClassificationLogger` (never `console.log`) in apps/worker
4. Default to Server Components — add `'use client'` only when TypeScript requires it
5. Use `claimNextJob()` — never SELECT + UPDATE for queue processing
6. Keep `SERVICE_ROLE_KEY` in apps/worker only — ESLint + CI grep guard
7. Use PostgreSQL ENUMs for classification_result and queue status
8. Co-locate safety rule tests — c8 branch coverage 100%
9. Check `SYSTEM_WHITELISTED_SENDERS` before classification — skip @kyrra.io emails
10. Wrap all worker loops in `resilientLoop()` — crash isolation mandatory

**AI Agents MUST NOT:**
- Write `FORCE_LLM_REVIEW` to the database (it's a routing signal only)
- Use `createServiceClient()` anywhere in apps/web (including Route Handlers)
- Create SECURITY DEFINER functions with TEXT parameters
- Skip the CI PII log scan step
- Deploy apps/web before apps/worker (expand-contract violation)

### Implementation Handoff

**First Story:** Epic 0 — Foundation
```bash
npx create-turbo@latest kyrra --package-manager pnpm
# Rename apps/docs → apps/worker, packages/ui → packages/shared
# Add: vercel.json, .npmrc (shamefully-hoist=false), SIGTERM handler + resilientLoop
# Run: supabase init, create migrations 001-012
# Deploy: Supabase → Railway worker → Vercel web
```

**Deploy Sequence:** Supabase migrations → apps/worker (Railway) → apps/web (Vercel) — always in this order.

**Sprint 0 parallel:** Submit Google OAuth verification application immediately.
