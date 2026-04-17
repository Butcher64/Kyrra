-- Migration 035: Add missing `label_name` column to llm_usage_logs
--
-- Context: migration 028 shipped to prod without the `label_name TEXT` column
-- (the file in git has it, but the table in prod doesn't — suggesting 028 was
-- applied from an earlier revision of the file before label_name was added).
-- Result: every worker insert at apps/worker/src/classification.ts:418 failed
-- silently with PGRST204 "label_name not in schema cache", caught by the try/catch.
-- 367 LLM classifications happened, 0 rows in llm_usage_logs.
--
-- Idempotent: uses ADD COLUMN IF NOT EXISTS so it's safe even if 028 was correct.

ALTER TABLE llm_usage_logs
  ADD COLUMN IF NOT EXISTS label_name TEXT;

-- Refresh PostgREST schema cache so the new column is visible to the worker
-- immediately (otherwise requires a few seconds / manual reload).
NOTIFY pgrst, 'reload schema';
