# Story B8.1: Transaction wrapping for classification save

Status: review

## Story

As a **system**,
I want classification saves to be atomic (classification + pipeline_health),
so that a partial failure doesn't leave the database in an inconsistent state.

## Acceptance Criteria

1. **Given** the classification pipeline saves results **When** it writes to `email_classifications` and `user_pipeline_health` **Then** all operations are wrapped in a single Supabase RPC transaction
2. **And** if any insert fails, the entire transaction rolls back
3. **And** the job is retried (not marked completed) on rollback
4. **And** both prefilter path and main classification path use the RPC
5. **And** existing tests updated to verify transactional behavior

## Tasks / Subtasks

- [x] Task 1: Create migration 027 with `save_classification_result()` RPC (AC: #1, #2)
  - [x] SECURITY DEFINER plpgsql function
  - [x] INSERT into email_classifications
  - [x] UPSERT into user_pipeline_health
  - [x] Rollback on any failure (implicit in plpgsql BEGIN/END)
- [x] Task 2: Refactor classification.ts prefilter path (AC: #1, #4)
  - [x] Extract save logic into helper function `saveClassificationResult()`
  - [x] Call the RPC instead of 3 separate inserts
  - [x] Keep Gmail label application OUTSIDE transaction (external API)
- [x] Task 3: Refactor classification.ts main path (AC: #1, #4)
  - [x] Same helper for main classification path
  - [x] Handle LLM cost logging separately (not in transaction — table may not exist)
- [x] Task 4: Error handling for RPC failures (AC: #2, #3)
  - [x] If RPC fails, job goes to retry (failJob) not complete
  - [x] Log RPC errors with context
- [x] Task 5: Tests (AC: #5)
  - [x] Test helper function with mocked supabase.rpc (all 35 tests pass)
  - [x] Test error path (RPC failure → failJob) — new test added

## Dev Notes

### Architecture Compliance
- ADR-003: email_classifications is append-only (INSERT only, never UPDATE)
- SECURITY DEFINER: follows pattern from migration 026 (save_user_labels)
- Pipeline health is UPSERT (INSERT ON CONFLICT UPDATE)

### Key Insight: llm_usage_logs
The `llm_usage_logs` table has NO migration — the insert at classification.ts:368 is silently failing. Do NOT include it in the transaction. Keep it as a best-effort log outside the RPC for now.

### Files to modify
- `supabase/migrations/027_save_classification_rpc.sql` — NEW
- `apps/worker/src/classification.ts` — refactor save paths
- `apps/worker/src/classification.test.ts` — update tests

### References
- [Source: supabase/migrations/026_save_user_labels_rpc.sql — RPC pattern]
- [Source: supabase/migrations/004_create_email_classifications.sql — table schema]
- [Source: supabase/migrations/007_create_user_pipeline_health.sql — table schema]
- [Source: planning-artifacts/epics-stabilization.md#B8.1]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References

### Completion Notes List
- Created `save_classification_result()` SECURITY DEFINER RPC (migration 027) wrapping email_classifications INSERT + user_pipeline_health UPSERT in one transaction
- Extracted `saveClassificationResult()` helper in classification.ts (exported for testing)
- Both prefilter and main classification paths now use the RPC
- LLM usage logging kept outside transaction (best-effort, table has no migration)
- Gmail label application kept outside transaction (external API)
- RPC failure → error thrown → caught by existing try/catch → failJob (retry)
- Fixed 15 pre-existing test failures in classification.test.ts (insert → rpc assertion pattern)
- Added 1 new test: RPC failure → failJob (not completeJob)
- Total: 35/35 classification tests pass, 0 regressions

### File List
- supabase/migrations/027_save_classification_rpc.sql (NEW)
- apps/worker/src/classification.ts (MODIFIED)
- apps/worker/src/classification.test.ts (MODIFIED)
