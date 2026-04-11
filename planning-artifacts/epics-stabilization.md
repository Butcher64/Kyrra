---
stepsCompleted: [audit, design]
status: 'active'
createdAt: '2026-04-11'
context: 'Post-audit complet du projet (2026-04-11). Sprint de stabilisation backend focalisé sur le pipeline de classification — bugs critiques, robustesse, et couverture de tests.'
---

# Kyrra — Stabilization Sprint: Backend Pipeline

## Context

Audit complet réalisé le 2026-04-11 (4 agents en parallèle : BMAD artifacts, backend worker, tests/schema, frontend). 27 issues identifiées dans le backend, dont 5 critiques/hautes impactant la fiabilité du pipeline de classification email. Ce sprint vise à stabiliser le cœur du réacteur avant la beta.

## Sprint Goal

**Pipeline de classification fiable et testable** — chaque email traité correctement, chaque erreur gérée proprement, chaque résultat vérifié par des tests.

## Epic List

### Epic B8: Pipeline Critical Fixes
Corriger les bugs qui cassent ou corrompent le traitement des emails en production.
**Impact:** Emails mal classés, labels Gmail manquants, état DB incohérent.

### Epic B9: Pipeline Robustness
Durcir le pipeline contre les cas limites et les défaillances réseau/API.
**Impact:** Worker qui hang, API rate limits dépassées, cascade d'erreurs.

### Epic B10: Test Infrastructure
Reconstruire la couverture de tests pour le pipeline avec les labels dynamiques.
**Impact:** Régressions non détectées, CI inutile.

---

## Epic B8: Pipeline Critical Fixes

### Story B8.1: Transaction wrapping for classification save

As a **system**,
I want classification saves to be atomic (classification + llm_usage + pipeline_health),
So that a partial failure doesn't leave the database in an inconsistent state.

**Acceptance Criteria:**
- **Given** the classification pipeline saves results **When** it writes to `email_classifications`, `llm_usage_logs`, and `user_pipeline_health` **Then** all 3 operations are wrapped in a single Supabase RPC transaction
- **And** if any insert fails, the entire transaction rolls back
- **And** the job is retried (not marked completed) on rollback
- **And** existing unit tests updated to verify transactional behavior

**Technical Notes:**
- File: `apps/worker/src/classification.ts` lines 349-361
- Current: 3 separate inserts, no transaction
- Fix: Create a `save_classification_result()` SECURITY DEFINER RPC function in a new migration
- The RPC receives: classification data, llm usage data (optional), user_id
- It performs all inserts + pipeline_health upsert in one transaction

### Story B8.2: Fix label application retry on failure

As a **user**,
I want my Gmail labels to always reflect Kyrra's classification,
So that I can see the results directly in Gmail.

**Acceptance Criteria:**
- **Given** `applyDynamicLabel()` fails (429 rate limit, network error, label deleted) **When** the error is caught **Then** the system retries up to 3 times with exponential backoff (1s, 2s, 4s)
- **And** if all retries fail, the failure is recorded in a `label_application_failures` tracking mechanism (could be a column on email_classifications or a log)
- **And** the reconciliation loop explicitly checks for emails with `label_id` set but no Gmail label applied
- **And** a metric tracks label application success rate

**Technical Notes:**
- File: `apps/worker/src/classification.ts` lines 383-391
- Current: try/catch logs error, says "will reconcile" but reconciliation only watches for label REMOVALS, not missing labels
- Fix: Add retry loop in classification.ts + extend reconciliation to detect missing labels

### Story B8.3: Fix race condition in ensureDynamicLabels

As a **system**,
I want Gmail label creation to be idempotent and race-safe,
So that concurrent classifications don't create duplicate labels.

**Acceptance Criteria:**
- **Given** two emails are classified concurrently for the same user **When** both call `ensureDynamicLabels()` **Then** only one set of Gmail labels is created (no duplicates)
- **And** the function fetches existing labels AFTER creating each new label to verify (read-after-write)
- **And** duplicate label creation errors from Gmail API (409 Conflict) are handled gracefully (fetch the existing label ID instead of throwing)
- **And** label ID mapping is cached per-user per classification batch (not per-email)

**Technical Notes:**
- File: `apps/worker/src/lib/gmail.ts` lines 775-831
- Current: fetches existing labels once, creates missing ones, updates local cache — but no protection against concurrent calls
- Fix: Handle Gmail API 409 errors gracefully + add per-user mutex or batch-level caching

### Story B8.4: Validate buildSystemPrompt with empty labels

As a **system**,
I want the prompt builder to fail fast when labels are missing,
So that the LLM never receives an invalid prompt without classification options.

**Acceptance Criteria:**
- **Given** `buildSystemPrompt()` is called **When** the labels array is empty or undefined **Then** it throws a descriptive error (not sent to LLM)
- **And** the caller (classification pipeline) catches this error and logs it as a monitoring event
- **And** the email is classified with a fallback (A_VOIR via legacy path) instead of being lost
- **And** a monitoring alert fires if this happens (via existing monitoring loop)
- **And** unit test covers: empty array, undefined, single label, normal case

**Technical Notes:**
- File: `apps/worker/src/lib/prompt-builder.ts` line 18
- Current: no validation, would produce a prompt with "Classify into exactly ONE of:" followed by nothing
- Fix: Add guard clause + fallback behavior

### Story B8.5: Add email body size guard

As a **system**,
I want email body fetching to have a size limit,
So that oversized emails don't cause OOM crashes on the worker.

**Acceptance Criteria:**
- **Given** `fetchEmailBody()` is called **When** the Gmail API response exceeds 5MB **Then** the body is truncated before parsing
- **And** the truncation happens at the raw response level (before base64 decode)
- **And** the classification proceeds with the truncated content (first 500 + last 50 chars still applied)
- **And** a log entry records the truncation event with message_id and original size
- **And** no OOM crash occurs for emails up to 50MB

**Technical Notes:**
- File: `apps/worker/src/lib/gmail.ts` lines 290-306
- Current: `format=full` fetches entire email into memory, then truncates to 550 chars for LLM
- Fix: Either use `format=metadata` + separate body fetch with size check, or add response size guard before JSON parsing

---

## Epic B9: Pipeline Robustness

### Story B9.1: Add Supabase RPC timeouts

As a **system**,
I want all Supabase RPC calls to have explicit timeouts,
So that a hung database connection doesn't stall the worker indefinitely.

**Acceptance Criteria:**
- **Given** the worker makes a Supabase RPC call (claimNextJob, save, query) **When** the call takes longer than 10 seconds **Then** it times out with a descriptive error
- **And** the timeout wraps all `supabase.rpc()` and critical `supabase.from().select/insert/update` calls
- **And** timeout errors are logged and the loop continues (not crash)
- **And** a helper function `withTimeout(promise, ms, label)` is reusable

**Technical Notes:**
- File: `apps/worker/src/lib/queue-consumer.ts` line 12 + throughout worker
- Current: no timeout on any Supabase call
- Fix: Create `lib/timeout.ts` utility, wrap critical calls

### Story B9.2: Rate limit reclassification requests

As a **system**,
I want reclassification processing to be rate-limited,
So that bulk reclassification doesn't exhaust Gmail API quotas.

**Acceptance Criteria:**
- **Given** multiple reclassification requests are pending **When** the reclassification loop processes them **Then** it processes at most 10 per iteration with 500ms delay between each
- **And** if more than 10 are pending, the remaining are processed in the next loop iteration
- **And** Gmail API rate limit errors (429) trigger a 30-second cooldown before the next iteration
- **And** the user sees a "processing" status while their request is queued

**Technical Notes:**
- File: `apps/worker/src/reclassification.ts` lines 22-39
- Current: processes ALL pending requests without limit
- Fix: Add batch size limit + inter-request delay + 429 handling

### Story B9.3: Reduce LLM timeout margin

As a **system**,
I want the LLM timeout to leave sufficient margin before Railway SIGKILL,
So that timeout errors are handled gracefully instead of crashing the worker.

**Acceptance Criteria:**
- **Given** an LLM call is made **When** it takes longer than 10 seconds **Then** it times out cleanly (AbortController)
- **And** the 10s timeout leaves a 10s margin before Railway's 20s SIGKILL
- **And** timeout results in fallback classification (rules-based), not an error
- **And** timeout events are tracked in `llm_metrics_hourly` as errors
- **And** the circuit breaker counts timeouts toward its error threshold

**Technical Notes:**
- File: `apps/worker/src/lib/llm-gateway.ts` line 11
- Current: `LLM_TIMEOUT_MS = 14_000` (only 6s margin)
- Fix: Reduce to 10_000, use AbortController for clean cancellation

### Story B9.4: Lower circuit breaker threshold

As a **system**,
I want the circuit breaker to trigger earlier when LLM is unreliable,
So that costs are controlled and fallback kicks in sooner.

**Acceptance Criteria:**
- **Given** the circuit breaker monitors LLM performance **When** bypass_rate exceeds 50% OR cost exceeds 200€/hour **Then** the circuit opens
- **And** the circuit stays open for 5 minutes before half-open retry
- **And** half-open state allows 1 test request — if it succeeds, circuit closes
- **And** circuit state transitions are logged

**Technical Notes:**
- File: `apps/worker/src/lib/llm-gateway.ts` lines 129-131
- Current: threshold at 70% bypass rate and 500€/hour — too permissive
- Fix: Lower to 50% / 200€, add half-open state

### Story B9.5: Startup environment validation

As a **system**,
I want all required environment variables validated at worker startup,
So that misconfiguration is caught immediately instead of at runtime.

**Acceptance Criteria:**
- **Given** the worker starts **When** any required env var is missing or invalid **Then** the worker exits with a clear error message listing all missing vars
- **And** validated vars include: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OPENAI_API_KEY`, `POSTMARK_API_KEY`
- **And** `ENCRYPTION_KEY` is validated for correct length (32 bytes for AES-256)
- **And** optional vars are listed but don't block startup: `GMAIL_PUBSUB_TOPIC`, `ADMIN_ALERT_EMAILS`
- **And** validation runs before any loop starts

**Technical Notes:**
- File: `apps/worker/src/index.ts`
- Current: env vars are read at point of use, errors surface late
- Fix: Add `lib/env.ts` with Zod schema validation at startup

---

## Epic B10: Test Infrastructure

### Story B10.1: Rewrite classification pipeline tests

As a **developer**,
I want the classification pipeline tests to work with the dynamic labels architecture,
So that regressions are caught by CI.

**Acceptance Criteria:**
- **Given** `classification.test.ts` **When** executed **Then** all tests pass with current imports (fetchEmailMetadata, fetchEmailBody, ensureDynamicLabels, applyDynamicLabel)
- **And** mocks use `UserLabel[]` data instead of hardcoded A_VOIR/FILTRE/BLOQUE
- **And** tests cover the full flow: prefilter → fingerprint → LLM → label resolution → save → Gmail label apply
- **And** edge cases: whitelist exact match, whitelist domain match, prefilter hit, fingerprint hit, LLM fallback, LLM timeout
- **And** `pnpm test` passes in CI

**Technical Notes:**
- File: `apps/worker/src/classification.test.ts` (965 lines)
- Current: mocks reference old imports, broken since dynamic labels refactor
- Fix: Rewrite mock setup to match current module exports

### Story B10.2: Add prefilter and label-resolver tests

As a **developer**,
I want the prefilter and label resolver to have dedicated test suites,
So that classification routing logic is verified independently.

**Acceptance Criteria:**
- **Given** `prefilter.test.ts` **When** executed **Then** it tests: known prospecting domains (→ BLOQUE), known noise domains (→ FILTRE), noreply addresses (→ FILTRE except transactional), marketing subdomains, no-match case
- **And** `label-resolver.test.ts` tests: resolveLabel with all 7 default labels, resolveLabel with custom labels, resolveLabelByName case-insensitive, deriveLegacyResult position mapping, fallback when default label deleted
- **And** both test files pass in CI

**Technical Notes:**
- Files: New files `apps/worker/src/lib/prefilter.test.ts` and `apps/worker/src/lib/label-resolver.test.ts`
- Current: no tests for either module
- Fix: Write comprehensive test suites

### Story B10.3: Add prompt-builder tests

As a **developer**,
I want the prompt builder to have a test suite,
So that dynamic prompt assembly is verified.

**Acceptance Criteria:**
- **Given** `prompt-builder.test.ts` **When** executed **Then** it tests: normal build with 7 labels + full profile, build with custom labels, build with minimal profile (no sector/interests), build with empty labels (expects error), label ordering by position, profile injection (sector, interests, prospection guidance)
- **And** verifies the output prompt contains all label names and prompts
- **And** verifies critical rules are present (transactional never spam, known contacts important, doubt → surface)
- **And** passes in CI

**Technical Notes:**
- File: New file `apps/worker/src/lib/prompt-builder.test.ts`
- Current: no tests for prompt-builder.ts
- Fix: Write test suite covering all prompt assembly paths

---

## Dependency Flow

```
Epic B8 (Critical Fixes)
  ├→ B8.1 (transaction) ──┐
  ├→ B8.2 (label retry)   ├→ Epic B10 (Tests)
  ├→ B8.3 (race condition) │    ├→ B10.1 (classification tests)
  ├→ B8.4 (prompt valid.)  │    ├→ B10.2 (prefilter + resolver tests)
  └→ B8.5 (body size)     │    └→ B10.3 (prompt-builder tests)
                           │
Epic B9 (Robustness) ──────┘
  ├→ B9.1 (RPC timeouts)
  ├→ B9.2 (rate limit reclass)
  ├→ B9.3 (LLM timeout)
  ├→ B9.4 (circuit breaker)
  └→ B9.5 (env validation)
```

**Execution order:** B8 first (critical bugs), then B9 (hardening) in parallel with B10 (tests). B10 stories can run after B8 is done since they test the fixed code.

## Definition of Done (Stabilization Quality)

1. Code complet : zero TODO pour cette story
2. Tests : chaque fix a son test unitaire correspondant
3. CI passe : lint + types + tests
4. Pas de régression : les tests existants passent toujours
5. Error handling : chaque erreur est loggée avec contexte suffisant pour debug
6. Monitoring : les cas critiques déclenchent une alerte
