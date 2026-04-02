# Story B1.8: Fix saveLabelsConfig atomique

Status: done

## Story

As a **system**,
I want label configuration saves to be atomic,
so that a failed insert never leaves the user with zero labels.

## Acceptance Criteria

1. **Given** the user saves their label configuration **When** the server action executes **Then** the delete + insert is wrapped in a Supabase RPC transaction
2. **Given** the insert fails **When** the transaction rolls back **Then** the previous labels are preserved
3. **Given** the operation succeeds **When** complete **Then** the user's labels are fully replaced atomically

## Tasks / Subtasks

- [x] Task 1: Create migration 026 with `save_user_labels` RPC function (SECURITY DEFINER, transaction)
- [x] Task 2: Update `configure-labels.ts` to call the RPC instead of separate delete+insert
- [x] Task 3: Verify error handling — RPC failure returns proper error to frontend

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### File List

- `supabase/migrations/026_save_user_labels_rpc.sql` (NEW) — PL/pgSQL function wrapping delete+insert in single transaction
- `apps/web/app/(auth)/actions/configure-labels.ts` (MODIFIED) — replaced 2 separate calls with single `supabase.rpc('save_user_labels')`

### Change Log

- 2026-04-02: B1.8 implemented — atomic label save via RPC transaction

## Dev Notes

- Current code: `configure-labels.ts` does DELETE then INSERT as 2 separate Supabase client calls
- Risk: if INSERT fails after DELETE, user has 0 labels
- Fix: Postgres function wraps both in a single transaction (implicit in PL/pgSQL)
- The RPC uses `auth.uid()` for RLS consistency, called via Supabase client (user context)
- SECURITY DEFINER so the function runs with its own permissions (bypasses RLS for the transaction body)
