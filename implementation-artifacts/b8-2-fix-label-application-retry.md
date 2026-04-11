# Story B8.2: Fix label application retry on failure

Status: review

## Story

As a **user**,
I want my Gmail labels to always reflect Kyrra's classification,
so that I can see the results directly in Gmail.

## Acceptance Criteria

1. **Given** `applyDynamicLabel()` fails (429, network error) **When** the error is caught **Then** the system retries up to 3 times with exponential backoff (1s, 2s, 4s)
2. **And** if all retries fail, the failure is logged with gmail_message_id and label context
3. **And** the classification is still saved (RPC already committed) — label failure is non-fatal
4. **And** both prefilter and main classification paths use the retry logic
5. **And** tests verify retry behavior and final failure logging

## Tasks / Subtasks

- [x] Task 1: Create retry helper `withRetry()` in lib/retry.ts
  - [x] Generic async retry with exponential backoff
  - [x] Configurable max attempts, base delay, jitter
  - [x] Returns result or throws after all attempts exhausted
- [x] Task 2: Apply retry to label application in classification.ts
  - [x] Wrap ensureDynamicLabels + applyDynamicLabel in retry
  - [x] Both prefilter and main paths
  - [x] Log failure with ClassificationLogger (structured) instead of console.error
- [x] Task 3: Tests
  - [x] 7 unit tests for withRetry (success, retry on 2nd/3rd, exhaust, maxAttempts=1, logging, backoff)
  - [x] Existing test "label failure → completeJob" now exercises retry (3 attempts visible in logs)
  - [x] No regressions — 35/35 classification tests pass

## Dev Notes

### Current behavior
- classification.ts:383-391 and 162-169: try/catch silently logs error
- reconciliation.ts only watches for label REMOVALS (labelsRemoved), not missing labels

### Architecture
- Label application is OUTSIDE the classification transaction (external API)
- A failed label application should NOT block the classification save
- The retry is best-effort — if all fail, the classification is still saved

### Files to modify
- `apps/worker/src/lib/retry.ts` — NEW
- `apps/worker/src/classification.ts` — use retry
- `apps/worker/src/lib/retry.test.ts` — NEW
- `apps/worker/src/classification.test.ts` — update label failure tests

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- Created generic `withRetry()` helper (retry.ts) with exponential backoff + jitter
- Replaced silent console.error with structured ClassificationLogger.log for label failures
- Both classification paths (prefilter + main) now retry 3x with 1s/2s/4s backoff
- Label failure remains non-fatal (job completed regardless)
- 7 retry tests + 35 classification tests pass

### File List
- apps/worker/src/lib/retry.ts (NEW)
- apps/worker/src/lib/retry.test.ts (NEW)
- apps/worker/src/classification.ts (MODIFIED)
