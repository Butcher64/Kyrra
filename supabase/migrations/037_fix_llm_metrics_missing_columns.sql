-- Migration 037 (B9.4 follow-up): backfill missing llm_metrics_hourly columns
--
-- Migration 029 declared `total_calls` and `llm_calls` via ADD COLUMN IF NOT
-- EXISTS, but information_schema shows they were never applied to prod
-- (same failure pattern as 028/035). Without them the record_llm_metric RPC
-- from 036 errors and the circuit breaker stays blind.
--
-- Idempotent: IF NOT EXISTS.

ALTER TABLE llm_metrics_hourly
  ADD COLUMN IF NOT EXISTS total_calls INT NOT NULL DEFAULT 0;

ALTER TABLE llm_metrics_hourly
  ADD COLUMN IF NOT EXISTS llm_calls INT NOT NULL DEFAULT 0;

NOTIFY pgrst, 'reload schema';
