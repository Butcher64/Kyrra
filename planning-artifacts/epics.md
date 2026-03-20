---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
status: 'complete'
completedAt: '2026-03-19'
inputDocuments:
  - planning-artifacts/prd.md
  - planning-artifacts/architecture.md
  - planning-artifacts/ux-design-specification.md
---

# Kyrra - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Kyrra, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: System can classify incoming emails into three categories (Non-commercial / Filtered / Blocked) using a dual-layer engine (fingerprinting rules + LLM)
FR2: System can classify 60-70% of emails using rule-based fingerprinting without invoking the LLM
FR3: System can detect prospecting tool signatures from email headers, domain reputation, and subject patterns
FR4: System can route ambiguous emails to the LLM with truncated content sufficient for classification while preserving privacy
FR5: System can produce a structured classification result with category, confidence score (0-100), and one-line summary for each email
FR6: System can fall back to rules-only classification when LLM is unavailable or latency exceeds threshold
FR7: User can switch between exposure modes (Strict / Normal / Permissive) with a functional description of each mode's behavior; mode change applies to newly received emails only
FR8: System can strip PII from generated summaries using a multi-layer pipeline (prompt instruction, regex post-processing, monitoring)
FR9: System can resist prompt injection from email content through sandboxed prompts, structured JSON output, and format validation
FR10: User can connect their Gmail account via OAuth and grant required permissions
FR11: System can receive new email notifications via Gmail Pub/Sub and process them within target latency
FR12: System can apply graduated Gmail labels (Kyrra — À voir / Kyrra — Filtré / Kyrra — Bloqué) to classified emails
FR13: System can detect and reconcile missed Pub/Sub notifications via adaptive polling with frequency adjusted to expected email activity
FR14: System can detect user label changes in Gmail and interpret them as implicit reclassification signals
FR15: System can reference labels by internal ID and auto-recreate deleted labels with user notification
FR16: System can maintain Gmail as the source of truth, with Supabase as synchronized replica
FR17: System can automatically renew Gmail Pub/Sub watch subscriptions before expiration without manual intervention
FR18: System can detect external OAuth revocation (user revoking access from Google/Microsoft settings or password change) and gracefully pause processing with user notification
FR19: User can connect one or more email accounts to Kyrra, with whitelists and classification operating across all connected accounts (MVP-1 for Outlook addition)
FR20: User can create a Kyrra account and initiate the signup/onboarding flow with clear value proposition
FR21: User can authenticate to the Kyrra web application, with the option to link authentication to their email provider OAuth
FR22: User can complete onboarding in under 5 minutes (OAuth connect + initial scan)
FR23: System can scan the user's sent email history (6 months) and auto-generate a hashed whitelist of known contacts, with user review during onboarding before activation
FR24: System can display onboarding scan results as an instant value demonstration ("847 emails analyzed, 312 were noise, 42 contacts whitelisted")
FR25: System can display real-time progress of the initial onboarding scan to the user
FR26: System can resume interrupted onboarding and present scan results on user return
FR27: System can store whitelist entries in non-reversible hashed form at address and domain levels
FR28: System can automatically whitelist senders when user reclassifies an email as non-commercial
FR29: User can manage their whitelist (view entries, add/remove contacts)
FR30: User can access a unified settings page to manage all personal preferences (exposure mode, whitelist, Recap, notifications, privacy, account)
FR31: User can delete their account, export their data (RGPD portability), and revoke OAuth access to their email provider
FR32: User can maintain service continuity when migrating between email providers, preserving whitelist, preferences, and classification history
FR33: User can view a web dashboard with email filtering statistics (daily/weekly/monthly breakdown)
FR34: Dashboard can display in two modes: simple (one headline number + alert) and detailed (full stats, trends, confidence distribution, reclassification history); detailed mode is user-initiated opt-in toggle
FR35: User can view one-line summaries of important emails received
FR36: User can view classification details for any processed email (category, confidence score, classification rationale on demand)
FR37: User can view the classification timestamp for any processed email
FR38: User can switch between exposure modes from the dashboard
FR39: User can access the dashboard from mobile devices (responsive design)
FR40: System can display contextual in-app notifications (plan limit approaching, degraded mode active, reclassification confirmed, system maintenance)
FR41: System can track and display differential value (emails caught by Kyrra but not by native provider filtering)
FR42: User can reclassify any email with one click (via dashboard or Gmail label change)
FR43: System can display confidence scores selectively (only on doubt, <75% confidence) with opt-in full visibility
FR44: System can display classification rationale explaining why an email was classified in a given category
FR45: System can automatically improve classification accuracy over time by incorporating reclassification signals, whitelist changes, and domain pattern updates
FR46: User can provide feedback on classifications via a mini-feedback modal (false positive / wrong category / whitelist sender)
FR47: System can detect Gmail-based reclassifications and prompt the user to provide explicit feedback ("help Kyrra learn" banner)
FR48: User can receive visual confirmation when a reclassification has been processed by the system
FR49: System can inform users when operating in degraded mode, with adjusted confidence score display
FR50: System can generate and send a Kyrra Recap HTML email with functional summaries (role + urgency + action, no PII) — only when meaningful content exists
FR51: Recap can include filtering statistics, important email summaries, and a referral link
FR52: Recap can include monthly value stats in the first email of each month
FR53: User can access exposure mode switching directly from the Recap email via deep link
FR54: User can customize Recap preferences (frequency, delivery time, content scope)
FR55: User can unsubscribe from the Kyrra Recap email independently of their Kyrra account
FR56: System can generate a win-back email 7 days post-churn with personalized filtering stats
FR57: Founders can send operational communications to users (changelog, maintenance notices)
FR58: System can detect user inactivity (no dashboard visit for 7+ consecutive days) and trigger a re-engagement email
FR59: System can send push or email notifications for low-confidence classifications requiring user attention
FR60: System can notify users through an alternative channel (in-app banner at next login) when the primary email channel is unavailable due to OAuth token invalidation
FR61: System can manage subscription tiers (Trial 14 days / Free / Pro / Team) with appropriate feature gating
FR62: System can enforce plan limits (30 emails/day for Free plan) with graceful degradation
FR63: System can progressively degrade features post-trial (dashboard detail day 15, summaries day 22, Recap day 30) with value reminders
FR64: User can upgrade, downgrade, or cancel their subscription
FR65: System can manage subscription plan transitions with clear rules for feature access timing and data continuity
FR66: System can track referral attribution and display referral status to users in real-time
FR67: System can reward referrers with subscription benefits
FR68: User can share Kyrra with others through a ready-to-use sharing mechanism
FR69: User can provide explicit informed consent for core automated AI processing, with separate opt-in controls for secondary features
FR70: User can view and consult the Terms of Service and Privacy Policy at any time, and must re-consent when updated
FR71: User can view a privacy dashboard showing what personal data Kyrra holds, retention periods, and upcoming purge dates
FR72: System can process data opposition requests from third-party senders
FR73: System can process third-party data subject access requests (Art. 15 RGPD)
FR74: System can notify affected users within regulatory deadlines in case of a data breach
FR75: System can enforce zero email content in all application logs and restrict debug mode
FR76: Founders can view an admin dashboard with system-wide aggregated stats, per-user anomaly detection, and classification logs (metadata only)
FR77: System can generate automated monitoring alerts for business metrics AND infrastructure health
FR78: Admin dashboard can display real-time LLM cost per user and system-wide, with circuit breaker status
FR79: Admin dashboard can display cost-per-email and cost-per-user-segment analytics
FR80: Founders can update the fingerprinting rules library (add, modify, remove detection signatures)
FR81: System can expose a public status page displaying current system health and active degraded modes
FR82: System can apply content sanitization (Art. 9 RGPD sensitive data patterns) to email excerpts before LLM transmission
FR83: User can pause and resume email classification processing without deleting their account
FR84: User can perform a clean uninstall that removes all Kyrra labels from every email and restores mailbox to pre-Kyrra state
FR85: User can reclassify a filtered email directly from within the email itself via a tokenized one-click link (zero auth, 7-day TTL, single-use)
FR86: System can classify emails written in French, English, or mixed FR/EN content with reclassification rate ≤5%

### NonFunctional Requirements

NFR-PERF-01: Email classification end-to-end latency <2 min (p95)
NFR-PERF-02: Rules-only classification latency <5 sec
NFR-PERF-03: LLM classification latency <15 sec per email; circuit breaker at >10 sec
NFR-PERF-04: Dashboard simple mode FCP <1 sec (architecture targets <500ms with Cache Components)
NFR-PERF-05: Dashboard detailed mode TTI <3 sec
NFR-PERF-06: Dashboard API response <500 ms (p95)
NFR-PERF-07: Dashboard API mobile payload <200 KB per request
NFR-PERF-08: Onboarding scan throughput: 6 months in <10 min (500 sent emails)
NFR-PERF-09: Onboarding progress refresh: update every 3 seconds
NFR-PERF-10: Reconciliation polling cycle: complete per-user poll in <30 sec
NFR-PERF-11: Recap HTML email size <80 KB total
NFR-PERF-12: Recap generation: all Recaps queued within 15 min for up to 2,000 users
NFR-PERF-13: Reclassification propagation: dashboard action → Gmail label update <10 seconds
NFR-PERF-14: Low-confidence notification delivery <5 min from classification
NFR-SEC-01: OAuth tokens encrypted at rest (AES-256), in transit (TLS 1.3)
NFR-SEC-02: Email content: zero persistence — in-memory only
NFR-SEC-03: LLM input: truncated only; provider bound to zero data retention
NFR-SEC-04: Application logs: zero email content; log only email_id, classification_result, confidence_score, processing_time
NFR-SEC-05: PII in summaries <0.5% leakage rate
NFR-SEC-06: Prompt injection: 100% LLM outputs validated against JSON schema
NFR-SEC-07: Database: Supabase RLS enforced — per-user isolation
NFR-SEC-08: Admin: aggregated stats default; individual access requires justification + audit
NFR-SEC-09: Debug mode: per-user consent, 24h max, auto-purge, audit trail
NFR-SEC-10: Whitelist: non-reversible hashing; cross-domain inference in-memory only
NFR-SEC-11: Rate limiting: Auth 10/min/IP, Dashboard 100/min/user, Public 30/min/IP
NFR-SEC-12: Recap anti-spoofing: DKIM, SPF, DMARC on dedicated subdomain
NFR-SEC-13: Auth error messages: uniform (prevent user enumeration)
NFR-SEC-14: Webhook auth: cryptographic signature verification (Gmail, Stripe)
NFR-SEC-15: Security headers: CSP, X-Frame-Options DENY, HSTS, CORS restricted
NFR-SEC-16: Public identifiers: opaque, non-sequential (UUID v4)
NFR-SEC-17: Vulnerability patching: critical <48h, high <7 days
NFR-SEC-18: RGPD response time: <72h target, <30 days legal max
NFR-SCALE-01: MVP-0 capacity: 50 users, ~3,000 emails/day
NFR-SCALE-02: MVP-1 capacity: 500 users, ~30,000 emails/day
NFR-SCALE-03: LLM cost per user <0.70€/month; alert at 0.50€; degraded at 1€
NFR-SCALE-04: Infrastructure cost per user <2€/month
NFR-SCALE-05: Stateless workers, horizontally scalable
NFR-REL-01: System uptime 99.5%
NFR-REL-02: Email loss rate: 0%
NFR-REL-03: Reconciliation gap: <5 min detection
NFR-REL-04: Degraded mode activation: <30 sec
NFR-REL-05: Degraded mode recovery: <5 min
NFR-REL-06: Email processing idempotency
NFR-REL-07: Queue durability: survives system restart
NFR-REL-08: Gmail watch renewal: automated 24h before 7-day expiry
NFR-REL-09: OAuth token refresh: automatic with graceful degradation
NFR-REL-10: Recap delivery rate >99%
NFR-REL-11: Recap inbox placement >98%
NFR-REL-12: Daily automated backups, <24h RPO
NFR-REL-13: Monitoring check interval <1 min for critical metrics
NFR-REL-14: Monitoring alert delivery <5 min
NFR-REL-15: Code rollback <5 min; migrations backward-compatible
NFR-INT-01: Gmail API: full compliance with ToS and Limited Use Policy
NFR-INT-02: Gmail API rate limiting: exponential backoff
NFR-INT-03: LLM provider failover: automatic switch within 30 sec
NFR-INT-04: LLM response: structured JSON with enum constraints
NFR-INT-05: Supabase dependency: continue classification during downtime up to 30 min

### Additional Requirements

**From Architecture:**
- Starter template: `npx create-turbo@latest kyrra --package-manager pnpm` → rename apps/docs→worker, packages/ui→shared
- Next.js 16 with `cacheComponents: true` (Cache Components + PPR native)
- Turborepo monorepo: apps/web (Vercel) + apps/worker (Railway EU) + packages/shared
- Supabase Auth + Google OAuth (dashboard login) + custom PKCE (Gmail integration) — two separate flows
- `user_integrations` table with AES-256 encrypted tokens + status column (active/revoked/expired)
- 5 ADRs: queue (Supabase→BullMQ), worker (Railway), state (append-only+reconciliation), LLM gateway (circuit breaker Supabase-backed), frontend (Turborepo)
- 12 Supabase migrations (001-012) with RLS always last (010)
- `reclassification_requests` table for token redemption (zero SERVICE_ROLE_KEY in apps/web)
- `increment_usage_counter()` PostgreSQL atomic function (Free plan counter)
- 5 resilientLoop()s in apps/worker/src/index.ts (classification, reclassification, watchRenewal, reconciliation, recapCron)
- SIGTERM graceful shutdown: RAILWAY_SHUTDOWN_TIMEOUT=20, LLM_TIMEOUT_MS=14000
- CI/CD: test-lint → migrate-db → build-worker → build-web (deploy order enforced)
- CI PII log scan: grep regex in test-lint job
- CI SERVICE_ROLE_KEY guard: grep block in apps/web
- ClassificationSafetyRules in packages/shared/rules/ (100% branch coverage, c8)
- Safety Rule 0: fingerprint BLOQUE <90% confidence → FORCE_LLM_REVIEW (ClassificationSignal type)
- SYSTEM_WHITELISTED_SENDERS: @kyrra.io emails skip classification
- Google OAuth verification: Sprint 0 parallel action (CASA Tier 2, gmail.modify)
- Reconciliation = zero-email-loss guarantee (not Pub/Sub). Recovery mode 30s post-outage.
- Token revocation detection: invalid_grant → status revoked → Postmark notification

**From UX Design:**
- Nordic Calm design direction: white space, 7px green dot, hero light-weight 300, zero shadows on cards
- shadcn/ui + Motion (ex-Framer Motion) + Magic UI animated components
- OKLch color space (not hex) — shadcn/ui 2026 standard
- 12 micro-interactions specified (MI-1 through MI-12) with timing
- 6 custom components: ProtectedStatusBadge, ExposureModePills, ClassificationCard, DegradedModeBanner, TrustScoreIndicator, RecapEmailTemplate
- 7 Experience Principles (absence is product, 30s max, Gmail is destination, show the why, doubt promotes, learn don't obey, Recap IS the mobile app)
- 5 Emotional Design Principles (calm by subtraction, distrust is ally, error is teaching, value must be accounted, respect departure)
- Pre-OAuth reassurance screen (FR20): "what we do ✓ / what we NEVER do ✗"
- Onboarding scan: progressive results from T+30s, "close safely" at T+15s, confetti on completion
- Recap structure: reassurance FIRST, then hero stat, then À voir, then cumulative stats, then referral
- Dashboard simple layout: ProtectedStatusBadge → HeroStat (NumberTicker) → 3 stat cards → alert cards → "view filtered" link → "view details" toggle
- Toast + Learn pattern: reclassification → toast "Kyrra a appris" → post-toast opt-in feedback link (FR46 Sheet)
- HelpKyrraLearnBanner: dismissible contextual banner for Gmail reclassification detection (FR47)
- WCAG AA accessibility, axe-core in CI, prefers-reduced-motion support
- Responsive: desktop-first dashboard, mobile-first Recap email

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | E2 | Dual-layer classification |
| FR2 | E2 | Rule-based fingerprinting (60-70%) |
| FR3 | E2 | Prospecting tool signature detection |
| FR4 | E2 | LLM routing for ambiguous emails |
| FR5 | E2 | Structured classification result + summary |
| FR6 | E2 | Rules-only fallback |
| FR7 | E3 | Exposure mode switch |
| FR8 | E2 | PII stripping pipeline |
| FR9 | E2 | Prompt injection resistance |
| FR10 | E1 | Gmail OAuth connection |
| FR11 | E2 | Gmail Pub/Sub notifications |
| FR12 | E2 | Gmail label application |
| FR13 | E2 | Reconciliation polling |
| FR14 | E2 | Gmail label change detection |
| FR15 | E2 | Label by ID + auto-recreate |
| FR16 | E2 | Gmail = source of truth |
| FR17 | E2 | Watch subscription renewal |
| FR18 | E2 | OAuth revocation detection |
| FR19 | — | MVP-1 (Outlook) — deferred |
| FR20 | E1 | Account creation + onboarding |
| FR21 | E1 | Authentication |
| FR22 | E1 | Onboarding <5 min |
| FR23 | E1 | Sent history scan + whitelist |
| FR24 | E1 | Scan results display |
| FR25 | E1 | Real-time scan progress |
| FR26 | E1 | Resume interrupted onboarding |
| FR27 | E1 | Hashed whitelist storage |
| FR28 | E4 | Auto-whitelist on reclassification |
| FR29 | E7 | Whitelist management |
| FR30 | E3 | Settings page |
| FR31 | E7 | Account deletion + data export |
| FR32 | — | MVP-1 (provider migration) — deferred |
| FR33 | E3 | Dashboard stats |
| FR34 | E3 | Dashboard dual mode |
| FR35 | E3 | One-line summaries |
| FR36 | E3 | Classification details |
| FR37 | E3 | Classification timestamp |
| FR38 | E3 | Mode switch from dashboard |
| FR39 | E3 | Mobile responsive |
| FR40 | E3 | In-app notifications |
| FR41 | E3 | Differential value |
| FR42 | E4 | One-click reclassification |
| FR43 | E3 | Confidence scores display |
| FR44 | E3 | Classification rationale |
| FR45 | E4 | Classification improvement |
| FR46 | E4 | Feedback modal |
| FR47 | E4 | Gmail reclassification banner |
| FR48 | E4 | Reclassification confirmation |
| FR49 | E3 | Degraded mode display |
| FR50 | E5 | Recap generation |
| FR51 | E5 | Recap content |
| FR52 | E5 | Monthly value stats |
| FR53 | E5 | Mode switch from Recap |
| FR54 | E5 | Recap preferences |
| FR55 | E5 | Recap unsubscribe |
| FR56 | E5 | Win-back email |
| FR57 | E5 | Operational communications |
| FR58 | E5 | Re-engagement email |
| FR59 | E5 | Low-confidence notification |
| FR60 | E5 | Alternative channel notification |
| FR61 | E6 | Subscription tiers |
| FR62 | E6 | Free plan limits |
| FR63 | E6 | Progressive degradation |
| FR64 | E6 | Upgrade/downgrade/cancel |
| FR65 | E6 | Plan transitions |
| FR66 | E6 | Referral tracking |
| FR67 | E6 | Referral rewards |
| FR68 | E6 | Share mechanism |
| FR69 | E7 | RGPD consent |
| FR70 | E7 | ToS/Privacy + re-consent |
| FR71 | E7 | Privacy dashboard |
| FR72 | E7 | Third-party opposition |
| FR73 | E7 | Third-party access requests |
| FR74 | E7 | Data breach notification |
| FR75 | E7 | Zero-content logging + debug |
| FR76 | E7 | Admin dashboard |
| FR77 | E7 | Monitoring alerts |
| FR78 | E7 | LLM cost display |
| FR79 | E7 | Cost analytics |
| FR80 | E7 | Fingerprint rules update |
| FR81 | E7 | Public status page |
| FR82 | E2 | Content sanitization |
| FR83 | E7 | Pause/resume |
| FR84 | E7 | Clean uninstall |
| FR85 | E4 | In-email token reclassification |
| FR86 | E2 | Multilingual FR/EN |

Coverage: 84/86 FRs mapped. FR19 (Outlook) and FR32 (provider migration) deferred to MVP-1.

## Epic List

### Epic 0: Project Foundation
The founders set up the monorepo, database, and CI/CD pipeline — the technical foundation for all subsequent epics.
**FRs covered:** None directly (prerequisite infrastructure)

### Epic 1: Gmail Connection & Onboarding
Marc can sign up, connect Gmail, and see his inbox diagnostic — the first "wow moment."
**FRs covered:** FR10, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27

### Epic 2: Email Classification Pipeline
Marc's emails are classified and labeled in Gmail 24/7 — the core invisible product.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR8, FR9, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR82, FR86

### Epic 3: Dashboard
Marc can see his filtering stats and control Kyrra from a premium Nordic Calm dashboard.
**FRs covered:** FR7, FR30, FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR40, FR41, FR43, FR44, FR49

### Epic 4: Trust & Reclassification
Marc can correct errors and provide feedback — Kyrra learns and improves over time.
**FRs covered:** FR28, FR42, FR45, FR46, FR47, FR48, FR85

### Epic 5: Kyrra Recap
Marc receives his daily "coffee moment" — the premium Recap email.
**FRs covered:** FR50, FR51, FR52, FR53, FR54, FR55, FR56, FR57, FR58, FR59, FR60

### Epic 6: Subscription & Growth
Monetization: trials, plans, billing, and referral mechanics.
**FRs covered:** FR61, FR62, FR63, FR64, FR65, FR66, FR67, FR68

### Epic 7: Privacy, Compliance & Administration
Full RGPD compliance, admin dashboard, and complete user account control.
**FRs covered:** FR29, FR31, FR69, FR70, FR71, FR72, FR73, FR74, FR75, FR76, FR77, FR78, FR79, FR80, FR81, FR83, FR84

### Dependency Flow

```
Epic 0 (Foundation)
  └→ Epic 1 (Gmail Connection)
       └→ Epic 2 (Classification Pipeline)
            ├→ Epic 3 (Dashboard)       ← can parallel with E4/E5
            ├→ Epic 4 (Trust)           ← requires E2 + E3
            ├→ Epic 5 (Recap)           ← requires E2
            ├→ Epic 6 (Subscription)    ← requires E3
            └→ Epic 7 (Privacy/Admin)   ← requires E3
```

## Epic 0: Project Foundation

The founders set up the monorepo, database, and CI/CD pipeline — the technical foundation for all subsequent epics.

### Story 0.1: Monorepo Initialization

As a **developer**,
I want to initialize the Turborepo monorepo with the correct project structure,
So that all subsequent development has a consistent foundation.

**Acceptance Criteria:**

**Given** no existing codebase
**When** the developer runs `npx create-turbo@latest kyrra --package-manager pnpm`
**Then** the monorepo is created with apps/ and packages/ directories
**And** apps/docs is renamed to apps/worker
**And** packages/ui is replaced with packages/shared
**And** `.npmrc` contains `shamefully-hoist=false`
**And** `pnpm-workspace.yaml` lists `apps/*` and `packages/*`
**And** `turbo.json` has 3 tasks: `dev`, `build`, `lint`
**And** `tsconfig` base is shared across apps and packages
**And** `pnpm install` succeeds without errors
**And** `turbo dev` starts both apps/web and apps/worker

### Story 0.2: Supabase Project & Database Schema

As a **developer**,
I want to set up the Supabase project with all database migrations,
So that the complete schema is ready for application development.

**Acceptance Criteria:**

**Given** a Supabase project created in EU Frankfurt region
**When** the developer runs `supabase init` and creates migrations 001-012
**Then** migration 001 creates extensions (pgcrypto, uuid-ossp)
**And** migration 002 creates PostgreSQL ENUMs (classification_result, queue_status)
**And** migration 003 creates user_integrations table with encrypted token columns and status column (active/revoked/expired)
**And** migration 004 creates email_classifications table (append-only)
**And** migration 005 creates email_queue_items table with queue_status ENUM
**And** migration 006 creates usage_counters table + increment_usage_counter() atomic function
**And** migration 007 creates user_pipeline_health table + get_stale_pipeline_count() SECURITY DEFINER function
**And** migration 008 creates llm_metrics_hourly table
**And** migration 009 creates processed_webhook_events table
**And** migration 010 creates RLS policies for all tables (per-user isolation)
**And** migration 011 creates recap_tokens table with anonymous lookup RLS
**And** migration 012 creates reclassification_requests table
**And** all tables reference auth.users(id) with ON DELETE CASCADE
**And** `supabase gen types typescript` generates types without errors

### Story 0.3: Shared Packages Foundation

As a **developer**,
I want to set up the shared package with type definitions, Zod schemas, constants, and safety rules scaffold,
So that apps/web and apps/worker share consistent types from day 1.

**Acceptance Criteria:**

**Given** the monorepo from Story 0.1
**When** the developer creates the packages/shared structure
**Then** `types/action-result.ts` exports ActionResult<T> and AppError
**And** `types/classification-signal.ts` exports ClassificationSignal
**And** `types/integration.ts` exports UserIntegration and PublicIntegration
**And** `constants/classification.ts` exports CLASSIFICATION_RESULTS, CLASSIFICATION_LABELS, and SYSTEM_WHITELISTED_SENDERS
**And** `constants/errors.ts` exports ERROR_CODES
**And** `schemas/` contains initial Zod schema stubs
**And** `rules/index.ts` exports the safety rules runner (stub)
**And** the package is importable as `@kyrra/shared` via workspace protocol
**And** `tsc --noEmit` passes across all packages

### Story 0.4: CI/CD Pipeline

As a **developer**,
I want a GitHub Actions CI/CD pipeline enforcing code quality and deploy order,
So that every push is validated and deployments are safe.

**Acceptance Criteria:**

**Given** the monorepo with Supabase migrations
**When** a PR is created or code is pushed to main
**Then** the test-lint job runs: pnpm install → turbo test lint → tsc --noEmit → PII log scan
**And** the migrate-db job runs after test-lint: supabase db push → supabase gen types → ENUM sync guard
**And** the build-worker job runs after migrate-db
**And** the build-web job runs after build-worker (expand-contract deploy order)
**And** the PII log scan blocks the pipeline if email content patterns are found

### Story 0.5: Deploy Infrastructure

As a **developer**,
I want Vercel and Railway configured for deployment,
So that apps/web deploys to Vercel and apps/worker deploys to Railway EU.

**Acceptance Criteria:**

**Given** CI/CD pipeline from Story 0.4
**When** the developer configures deployment targets
**Then** `apps/web/vercel.json` sets rootDirectory to apps/web
**And** Vercel environment variables include ANON_KEY (never SERVICE_ROLE_KEY)
**And** Dockerfile at monorepo root builds apps/worker with multi-stage build
**And** Railway is configured with EU region
**And** Railway environment variables include SERVICE_ROLE_KEY, LLM keys, Postmark, RAILWAY_SHUTDOWN_TIMEOUT=20
**And** apps/worker/src/index.ts has the SIGTERM handler with isShuttingDown flag
**And** apps/worker/src/index.ts has the resilientLoop() wrapper function
**And** a manual deploy succeeds on both Vercel and Railway

## Epic 1: Gmail Connection & Onboarding

Marc can sign up, connect Gmail, and see his inbox diagnostic — the first "wow moment."

### Story 1.1: Authentication (Supabase Auth + Google OAuth)

As a **user**,
I want to sign up and log in to Kyrra using my Google account,
So that I can access the dashboard without creating a separate password.

**Acceptance Criteria:**

**Given** a user navigates to `/login`
**When** they click "Se connecter avec Google"
**Then** they are redirected to Google OAuth consent screen
**And** after successful authentication, Supabase Auth creates a session
**And** the user is redirected to `/(dashboard)` with an active session
**And** `supabase.auth.getUser()` returns the authenticated user on all protected routes
**And** the `(dashboard)/layout.tsx` middleware redirects unauthenticated users to `/login`
**And** auth error messages are uniform (prevent user enumeration)

### Story 1.2: Pre-OAuth Reassurance & Gmail PKCE Connection

As a **user**,
I want to understand what Kyrra will do with my Gmail before connecting,
So that I feel confident granting access to my email.

**Acceptance Criteria:**

**Given** an authenticated user navigates to `/connect-gmail`
**When** the page loads
**Then** the pre-OAuth reassurance screen displays: what Kyrra does ✓ and what Kyrra NEVER does ✗
**And** a clean uninstall guarantee is visible
**And** the "Connecter Gmail →" button initiates the custom PKCE OAuth flow (gmail.modify + gmail.readonly)
**And** on successful OAuth callback, Gmail tokens are encrypted (AES-256) and stored in user_integrations with status active
**And** the user is redirected to `/onboarding-progress`
**And** if the user refuses OAuth, they return to `/connect-gmail` with a neutral message

### Story 1.3: Onboarding Scan (Whitelist Generation)

As a **user**,
I want Kyrra to scan my sent history and build a whitelist automatically,
So that emails from my known contacts are never filtered.

**Acceptance Criteria:**

**Given** a user has connected Gmail
**When** the onboarding scan starts as an async background job
**Then** the system scans up to 6 months of sent email history
**And** sender addresses are stored as SHA-256 hashes (address + domain level)
**And** the scan processes at rate-limited 20 calls/sec (40% of Gmail API quota)
**And** if the user closes the browser, the scan continues in background
**And** the "1h post-signup" email is sent with scan results
**And** classification begins immediately on new incoming emails (even during scan)
**And** emails received during scan are re-evaluated after scan completes

### Story 1.4: Onboarding Progress Page

As a **user**,
I want to see real-time progress of my inbox scan,
So that I know the scan is working and can see results appearing.

**Acceptance Criteria:**

**Given** the onboarding scan has started
**When** the user is on `/onboarding-progress`
**Then** a progress bar shows scan completion percentage
**And** real-time counters display: emails analyzed, contacts identified, prospecting detected
**And** counters update at least every 3 seconds
**And** partial results appear from T+30 seconds
**And** at T+15 seconds, "close safely" message fades in
**And** on completion, subtle confetti animation plays (5-6 gold particles)
**And** final result displays the "wow moment" stats
**And** a CTA links to `/(dashboard)`

### Story 1.5: Resume Interrupted Onboarding

As a **user**,
I want to return to my onboarding progress after closing the browser,
So that I can see the results without starting over.

**Acceptance Criteria:**

**Given** a user closed the browser during the onboarding scan
**When** they log in again
**Then** if scan is still running, they are redirected to `/onboarding-progress` with current state
**And** if scan is complete, they are redirected to `/(dashboard)` with results
**And** the "1h post-signup" email has already been sent
**And** no duplicate scans are initiated

## Epic 2: Email Classification Pipeline

Marc's emails are classified and labeled in Gmail 24/7 — the core invisible product.

### Story 2.1: Fingerprinting Engine

As a **user**,
I want 60-70% of prospecting emails detected by rules without AI,
So that classification is fast, cheap, and resilient to LLM outages.

**Acceptance Criteria:**

**Given** an incoming email is fetched from Gmail API
**When** the fingerprinting engine processes email headers and metadata
**Then** Layer 1 detects prospecting tool signatures (X-Mailer for Lemlist/Apollo/Instantly/Woodpecker, DKIM mismatches, bulk timestamps, malformed List-Unsubscribe)
**And** Layer 2 evaluates domain reputation (known prospecting domains, fresh domains, SPF/DMARC)
**And** Layer 3 matches subject line patterns (common prospecting templates)
**And** the engine produces classification_result + confidence_score (0-100)
**And** SYSTEM_WHITELISTED_SENDERS (@kyrra.io) are skipped entirely
**And** whitelisted contacts (SHA-256 hash match) bypass classification
**And** the engine runs in <5 sec per email

### Story 2.2: LLM Classification (Ambiguous Emails)

As a **user**,
I want ambiguous emails analyzed by AI with business context,
So that prospecting is detected even when fingerprinting can't determine intent.

**Acceptance Criteria:**

**Given** fingerprinting could not classify with sufficient confidence
**When** the email is routed to the LLM path
**Then** the LLM receives only headers + first 500 chars + last 50 chars (privacy truncation)
**And** the system prompt includes user role context and exposure mode
**And** the LLM returns structured JSON with enum-constrained category
**And** non-compliant LLM output triggers automatic rules fallback
**And** LLM latency >10 sec triggers circuit breaker → rules fallback
**And** LLM call timeout is hardcoded at 14 seconds
**And** the summary is generated in the email's language (FR/EN/mixed)
**And** circuit breaker state is read/written from llm_metrics_hourly (Supabase-backed)

### Story 2.3: Classification Safety Rules

As a **user**,
I want safety checks applied after every classification,
So that critical emails are never wrongly blocked.

**Acceptance Criteria:**

**Given** a classification result from fingerprinting or LLM
**When** ClassificationSafetyRules are applied
**Then** Rule 0: fingerprint BLOQUE <90% confidence → FORCE_LLM_REVIEW (ClassificationSignal, never written to DB)
**And** Rule 1: confidence <75% + BLOQUE → downgraded to FILTRE
**And** Rule 2: confidence <60% → promoted to A_VOIR
**And** Rule 3: new users <14 days → notification on every BLOQUE
**And** if signal is FORCE_LLM_REVIEW, email re-routes to LLM path
**And** final ClassificationResult is written to email_classifications (append-only)
**And** all safety rules have co-located tests with 100% branch coverage (c8)

### Story 2.4: PII Stripping & Content Sanitization

As a **user**,
I want my personal data stripped from generated summaries,
So that no PII leaks through the classification pipeline.

**Acceptance Criteria:**

**Given** the LLM has generated a one-line summary
**When** the PII stripping pipeline processes it
**Then** Layer 1: LLM prompt instruction excludes personal data
**And** Layer 2: regex removes phone, email, address, financial patterns
**And** Layer 3: Art. 9 RGPD sensitive data detected and redacted before LLM transmission
**And** PII leakage rate <0.5%
**And** prompt injection resisted through sandboxed prompts + structured JSON + format validation

### Story 2.5: Gmail Pub/Sub Webhook & Queue Processing

As a **user**,
I want my new emails detected and classified within 2 minutes,
So that my inbox is clean before I see it.

**Acceptance Criteria:**

**Given** a new email arrives in the user's Gmail
**When** Gmail Pub/Sub sends notification to api/webhooks/gmail/route.ts
**Then** the webhook verifies Google JWT signature (reject unsigned)
**And** rate-limits at 100 req/min
**And** inserts email_queue_item (metadata only)
**And** classification worker claims job atomically via claimNextJob()
**And** email content fetched in-memory (never persisted)
**And** classification completes (fingerprint → safety rules → optional LLM)
**And** result written to email_classifications (append-only INSERT)
**And** end-to-end latency <2 min (p95)
**And** processing is idempotent

### Story 2.6: Gmail Label Application

As a **user**,
I want classified emails to have Kyrra labels in my Gmail,
So that I can see the classification directly in my inbox.

**Acceptance Criteria:**

**Given** an email has been classified
**When** the worker applies the Gmail label
**Then** correct label applied: "Kyrra — À voir" / "Kyrra — Filtré" / "Kyrra — Bloqué"
**And** labels referenced by internal Gmail label ID (never by name)
**And** deleted labels auto-recreated with user notification
**And** emails in inbox are labeled without being moved
**And** ClassificationLogger logs only: email_id, classification_result, confidence_score, processing_time_ms
**And** zero email content in any log or Sentry context

### Story 2.7: Reconciliation Polling & Watch Renewal

As a **user**,
I want missed emails detected even if Pub/Sub fails,
So that zero emails are ever lost or unprocessed.

**Acceptance Criteria:**

**Given** the reconciliation loop runs continuously
**When** the loop polls Gmail history API
**Then** missed emails detected via delta comparison (gmail.history vs known classifications)
**And** polling: 5 min business hours, 30 min off-hours
**And** after Supabase recovery, polling accelerates to 30s for 15 min (recovery mode)
**And** watch subscriptions renewed 24h before 7-day expiry + safety net at 6h
**And** watchRenewalLoop runs independently via Promise.all
**And** reconciliation is the PRIMARY zero-email-loss guarantee

### Story 2.8: Degraded Mode & Token Revocation

As a **user**,
I want Kyrra to keep working even when dependencies fail,
So that my inbox is always protected.

**Acceptance Criteria:**

**Given** the LLM provider is down or latency exceeds threshold
**When** degraded mode activates
**Then** all emails classified by rules-only with lower confidence
**And** activation within 30 sec of failure
**And** recovery within 5 min of restoration

**Given** a user's Gmail refresh token is revoked
**When** the worker encounters invalid_grant
**Then** user_integration status set to 'revoked'
**And** pipeline paused (user_pipeline_health.mode = 'paused')
**And** reconnection email sent via Postmark (not Gmail)
**And** worker skips all jobs for users with status != 'active'
**And** dashboard displays reconnection banner at next login

## Epic 3: Dashboard

Marc can see his filtering stats and control Kyrra from a premium Nordic Calm dashboard.

### Story 3.1: Dashboard Simple Mode (Nordic Calm)

As a **user**,
I want to see my filtering stats at a glance in a calm, minimal dashboard,
So that I know my inbox is protected without information overload.

**Acceptance Criteria:**

**Given** an authenticated user navigates to `/(dashboard)`
**When** the page loads (Server Component, Cache Components)
**Then** FCP <500ms (Next.js 16 'use cache' + Suspense streaming)
**And** ProtectedStatusBadge: 7px green dot (pulse 3s) + "Votre boîte est protégée"
**And** HeroStat with NumberTicker animation (0→value, 800ms), label "distractions supprimées"
**And** 3 stat cards: "À voir" (blue), "Mode" (current), "Trust" (%)
**And** cards have 1px borders only (no shadows, no backgrounds)
**And** hero stat: Outfit font, weight 300 (light)
**And** layout: single column centered, max-width 640px
**And** dark mode supported via Tailwind dark: + OKLch

### Story 3.2: Alert Email Cards & Filtered Link

As a **user**,
I want to see emails needing my attention directly on the dashboard,
So that I can quickly decide what to review.

**Acceptance Criteria:**

**Given** there are "À voir" emails with confidence <75%
**When** the dashboard renders alert cards
**Then** each ClassificationCard shows: blue pill + 1-line summary (ellipsis) + "→"
**And** entire card clickable → Gmail deep link
**And** AnimatedList stagger entrance (100ms between cards)
**And** hover: opacity 0.7 only (Nordic Calm restraint)
**And** below cards: "Voir les X filtrés dans Gmail →" link (always visible, never hidden)
**And** link opens Gmail filtered label in new tab

### Story 3.3: Dashboard Detailed Mode

As a **power user**,
I want to see detailed classification analytics,
So that I can understand how Kyrra works and track improvements.

**Acceptance Criteria:**

**Given** user clicks "Voir les détails"
**When** detailed mode activates
**Then** MI-4: hero shrinks (48→24px), charts stagger fade-in (400ms)
**And** same URL (no page change — Client Component within)
**And** shadcn/ui Chart: 7-day trend, confidence distribution, reclassification history
**And** TanStack Query refetch every 30 seconds
**And** OKLch themed chart colors
**And** "Mode simple" returns with reverse animation (350ms ease-out)
**And** detailed mode state preserved in TanStack Query cache

### Story 3.4: Exposure Mode Switch

As a **user**,
I want to switch filtering intensity between Strict, Normal, and Permissive,
So that I can adapt Kyrra to my business context.

**Acceptance Criteria:**

**Given** user views ExposureModePills
**When** they click a different mode
**Then** MI-2: old pill desaturates (50ms), new pill illuminates (100ms), selector slides (spring)
**And** descriptions appear: Strict/Normal/Permissive with functional text
**And** toast "Mode [X] activé. Appliqué aux prochains emails."
**And** saved via Server Action (params: unknown + Zod)
**And** applies to new emails only
**And** pills always visible, role="radiogroup", keyboard arrow nav

### Story 3.5: Classification Details & Confidence Scores

As a **user**,
I want to see why an email was classified a certain way,
So that I can trust Kyrra's decisions.

**Acceptance Criteria:**

**Given** user inspects a classified email
**When** they view classification details
**Then** confidence score visible only if <75% (default)
**And** rationale on demand (hover desktop, tap mobile)
**And** format: "Filtré 92% — signature Lemlist détectée, domaine créé il y a 3 jours"
**And** timestamp: "Aujourd'hui", "Hier", or "19 mars"
**And** opt-in full visibility via Settings > Display
**And** differential value tracked (caught by Kyrra but not Gmail native)

### Story 3.6: Settings Page

As a **user**,
I want a unified settings page to manage all preferences,
So that I can control Kyrra without hunting through menus.

**Acceptance Criteria:**

**Given** user clicks gear icon (top-right)
**When** settings loads
**Then** sections: Exposure mode, Recap, Notifications, Display, Privacy, Account
**And** React Hook Form + Zod resolver
**And** Server Actions with params: unknown → Zod safeParse
**And** validation inline, amber text, human language
**And** success feedback via toast
**And** responsive single column

### Story 3.7: In-App Notifications & Degraded Mode Display

As a **user**,
I want to be informed when something needs attention,
So that I'm never surprised by system changes.

**Acceptance Criteria:**

**Given** system is in degraded mode
**When** user opens dashboard
**Then** DegradedModeBanner slides down (300ms), amber, persistent, auto-disappears when restored + green toast
**And** ProtectedStatusBadge switches to amber dot + "Mode simplifié actif"

**Given** Free plan limit approaching
**When** 28+ emails classified today
**Then** notification "28/30" → at 30: amber "Limite atteinte" + discreet Pro CTA

**Given** Gmail token revoked
**When** user logs in
**Then** reconnection banner with CTA

## Epic 4: Trust & Reclassification

Marc can correct errors and provide feedback — Kyrra learns and improves over time.

### Story 4.1: One-Click Reclassification (Dashboard)

As a **user**,
I want to correct a misclassified email with one click,
So that Kyrra learns from my feedback immediately.

**Acceptance Criteria:**

**Given** a user views a classified email on the dashboard
**When** they click "Ce n'est pas de la prospection"
**Then** MI-1: button press (50ms) → green pulse (150ms) → "✓ Compris" (200ms)
**And** toast: "Kyrra a appris. Cet expéditeur sera reconnu." (500ms, 3s auto)
**And** sub-line: sender added to whitelist (native shadcn/ui toast description)
**And** sender auto-whitelisted (SHA-256 hash)
**And** Gmail label updated within 10 seconds
**And** reclassification written with idempotency key
**And** Server Action: params unknown → Zod → ActionResult

### Story 4.2: Feedback Modal (Post-Reclassification)

As a **user**,
I want to explain WHY an email was misclassified,
So that Kyrra can learn more precisely.

**Acceptance Criteria:**

**Given** reclassification toast completed (3s)
**When** toast fades
**Then** opt-in link appears below card: "Pourquoi mal classé ? Aidez-nous."
**And** click opens Sheet (shadcn/ui) from right (not blocking Dialog)
**And** 3 options: faux positif / mauvaise catégorie / whitelist expéditeur
**And** feedback saved to classification_feedback table
**And** if ignored, no feedback collected (opt-in only)
**And** link disappears on page navigation

### Story 4.3: Gmail Reclassification Detection & Learn Banner

As a **user**,
I want Kyrra to detect when I manually move emails in Gmail,
So that my Gmail actions also teach Kyrra.

**Acceptance Criteria:**

**Given** reconciliation detects user label change in Gmail
**When** user next visits dashboard
**Then** HelpKyrraLearnBanner: amber-50, "Vous avez modifié un label. Aidez Kyrra à comprendre."
**And** dismiss button (×) + CTA "Expliquer"
**And** "Expliquer" opens same Sheet as Story 4.2
**And** dismissing records implicit signal without explicit feedback
**And** banner disappears after dismiss or explain

### Story 4.4: In-Email Token Reclassification

As a **user**,
I want to reclassify directly from the Recap with one click,
So that I can correct errors without opening the dashboard.

**Acceptance Criteria:**

**Given** user clicks "Reclassifier →" tokenized link in Recap
**When** browser opens /api/token/[token]
**Then** Route Handler (ANON_KEY, zero SERVICE_ROLE_KEY) looks up recap_tokens
**And** if valid: marks used_at atomically + inserts into reclassification_requests
**And** redirects to /reclassification-pending with spinner → poll 2s → checkmark (400ms)
**And** "✓ Email reclassifié. Kyrra a appris." → redirect dashboard 2s
**And** if expired/used: redirect /token-expired with neutral message + dashboard CTA
**And** reclassificationLoop in worker processes request (5s poll) via SERVICE_ROLE_KEY
**And** tokens: single-use, 7-day TTL, gen_random_bytes(32)

### Story 4.5: Classification Improvement Tracking

As a **user**,
I want to see my reclassification rate decreasing over time,
So that I trust Kyrra is genuinely learning.

**Acceptance Criteria:**

**Given** user has been using Kyrra 2+ weeks
**When** they view detailed dashboard
**Then** reclassification history shows descending curve (W1→W4)
**And** TrustScoreIndicator with spring animation (stiffness 100, damping 20)
**And** declining: green arrow ↑ / stagnating: no arrow / rising: amber arrow ↓
**And** system incorporates reclassification signals + whitelist + domain patterns

## Epic 5: Kyrra Recap

Marc receives his daily "coffee moment" — the premium Recap email.

### Story 5.1: Recap Email Generation & Template

As a **user**,
I want to receive a daily Recap summarizing filtered emails,
So that I can review my inbox in 30 seconds.

**Acceptance Criteria:**

**Given** recap cron runs daily
**When** meaningful content exists
**Then** RecapEmailTemplate: header (logo 24px + date) → reassurance → hero stat → "À voir" with summaries + Gmail deep links → cumulative stats
**And** <80KB, HTML tables + inline CSS + Arial
**And** dark mode via @media (prefers-color-scheme: dark)
**And** above "À voir" visible without scroll on iPhone SE
**And** all links to Gmail (never dashboard)
**And** summaries functional (role + urgency, no PII)
**And** delivered by 7:00 AM user local time
**And** all Recaps queued within 15 min for 2,000 users

### Story 5.2: Recap Delivery & Deliverability

As a **user**,
I want the Recap in my inbox, not spam,
So that I actually see it every morning.

**Acceptance Criteria:**

**Given** Recap generated
**When** sent via Postmark
**Then** from recap.kyrra.io with DKIM, SPF, DMARC
**And** inbox placement >98%, delivery >99%
**And** subject: "Kyrra — 25 filtrés, 2 à voir"
**And** preheader for preview + screen readers
**And** RFC 8058 one-click unsubscribe + visible footer link

### Story 5.3: Monthly Value Stats & Cumulative Tracking

As a **user**,
I want cumulative value visibility,
So that I never forget Kyrra is worth paying for.

**Acceptance Criteria:**

**Given** first day of month
**When** Recap generated
**Then** monthly section: "Mars 2026 : 1,247 filtrés, ~8h gagnées, valeur 320€"
**And** every daily Recap footer: cumulative since signup
**And** referral CTA: "Un collègue noyé ?" + link

### Story 5.4: Recap Preferences & Mode Switch

As a **user**,
I want to customize Recap and switch modes from email,
So that I control Kyrra without the dashboard.

**Acceptance Criteria:**

**Given** user receives Recap
**When** interacting with controls
**Then** "Modifier la fréquence" → Settings deep link
**And** mode switch → dashboard with ExposureModePills focused
**And** unsubscribe deactivates Recap only (classification continues)

### Story 5.5: Win-Back, Re-Engagement & Notifications

As a **user**,
I want re-engagement if I become inactive,
So that I don't lose value.

**Acceptance Criteria:**

**Given** 7+ days no dashboard → re-engagement email with stats
**And** 7 days post-churn → win-back email (subject to consent)
**And** <75% confidence → notification within 5 min
**And** OAuth invalidated → in-app banner at next login
**And** founders can send operational communications
**And** cleanupExpiredTokens() runs daily after Recap

## Epic 6: Subscription & Growth

Monetization: trials, plans, billing, and referral mechanics.

### Story 6.1: Subscription Tiers & Feature Gating

As a **user**,
I want to understand what each plan offers,
So that I can choose the right tier.

**Acceptance Criteria:**

**Given** 4 tiers: Trial (14d) / Free / Pro (15€/mo) / Team (19€/user/mo)
**When** tier determined
**Then** feature gating: Free = 30/day + basic; Pro = unlimited + Recap + summaries + detailed; Team = Pro + shared whitelist + admin
**And** Free counter: atomic increment_usage_counter()
**And** beyond 30/day: unclassified silently
**And** all new users start with Trial (full Pro, 14 days)

### Story 6.2: Progressive Degradation Post-Trial

As a **user**,
I want gradual transition from Trial to Free,
So that I experience value loss progressively.

**Acceptance Criteria:**

**Given** Trial expired
**When** degradation begins
**Then** Day 15: lose detailed + reminder
**And** Day 22: lose summaries + reminder
**And** Day 30: lose Recap + 30/day active
**And** each loss with specific value reminder
**And** upgrade CTA visible but never aggressive

### Story 6.3: Stripe Billing Integration

As a **user**,
I want to manage my subscription seamlessly,
So that I control billing without friction.

**Acceptance Criteria:**

**Given** user manages subscription
**When** accessing billing
**Then** Stripe Checkout for upgrades, Portal for downgrade/cancel
**And** webhooks idempotent via processed_webhook_events
**And** signature verification on Route Handler
**And** upgrade immediate, downgrade end of period
**And** failed payments: 3 retries → 7-day grace → pattern detection

### Story 6.4: Referral Mechanism

As a **user**,
I want to share Kyrra and earn rewards,
So that I spread the word.

**Acceptance Criteria:**

**Given** user shares
**When** using referral mechanism
**Then** unique ?ref= link generated
**And** available: Recap footer, dashboard, Settings
**And** attribution tracked real-time
**And** conversion → one free Pro month
**And** pre-formatted sharing message
**And** Free: dashboard share; Pro: also Recap footer

## Epic 7: Privacy, Compliance & Administration

Full RGPD compliance, admin dashboard, and complete user account control.

### Story 7.1: RGPD Consent & Privacy Controls

As a **user**,
I want granular consent and privacy control,
So that I know how my data is used.

**Acceptance Criteria:**

**Given** user signs up
**When** consent requested
**Then** single consent for core AI processing
**And** separate opt-ins: Recap, summaries, anonymous stats
**And** ToS/Privacy accessible anytime, re-consent on update
**And** privacy dashboard: data held, retention, purge dates
**And** 90-day auto-purge visible

### Story 7.2: Account Management & Clean Uninstall

As a **user**,
I want full control over my account,
So that I can leave with zero traces.

**Acceptance Criteria:**

**Given** user manages account
**When** accessing settings
**Then** whitelist management: view, add, remove
**And** pause/resume classification (preserves data)
**And** data export (RGPD portability)
**And** account deletion: ON DELETE CASCADE + revoke OAuth
**And** clean uninstall: removes ALL Kyrra labels, restores pre-Kyrra state, single confirmation
**And** deletion response <72h

### Story 7.3: Third-Party Data Requests

As a **system**,
I want to process third-party sender data requests,
So that Kyrra complies with RGPD toward non-users.

**Acceptance Criteria:**

**Given** third-party submits request
**When** processed
**Then** sender metadata removed
**And** identity verified for access requests
**And** response within 72h target / 30 days max
**And** breach: affected users notified within regulatory deadlines

### Story 7.4: Admin Dashboard

As a **founder**,
I want a comprehensive admin dashboard,
So that I monitor health, costs, and users.

**Acceptance Criteria:**

**Given** founder accesses /admin (ADMIN_USER_IDS check)
**When** dashboard loads
**Then** system-wide stats, per-user anomaly detection, classification logs (metadata only)
**And** real-time LLM cost + circuit breaker status
**And** cost-per-email and cost-per-segment analytics
**And** automated monitoring alerts (business + infra)
**And** fingerprinting rules update interface
**And** aggregates default; individual metadata requires justification + audit

### Story 7.5: Public Status Page & Debug Mode

As a **user**,
I want to check if Kyrra has issues,
So that I know when the system is degraded.

**Acceptance Criteria:**

**Given** anyone visits status page
**When** loads
**Then** system health + active degraded modes (no auth)

**Given** founder debugs user issue
**When** debug mode activated
**Then** per-user consent + 24h max + auto-purge + audit trail
**And** zero email content in any log
**And** ClassificationLogger enforced (dev=throw, prod=strip+Sentry)
