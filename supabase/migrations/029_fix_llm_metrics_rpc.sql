-- Migration 029: Fix LLM metrics recording
-- Problem: recordMetrics() replaced total_cost_eur instead of incrementing,
-- and bypass_rate was never calculated (circuit breaker partially dead).
-- Fix: RPC that atomically increments cost + tracks bypass rate.

-- Add columns to track call counts for bypass_rate calculation
ALTER TABLE llm_metrics_hourly ADD COLUMN IF NOT EXISTS total_calls INT NOT NULL DEFAULT 0;
ALTER TABLE llm_metrics_hourly ADD COLUMN IF NOT EXISTS llm_calls INT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION record_llm_metric(
  p_cost_eur NUMERIC,
  p_was_llm BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hour TIMESTAMPTZ;
BEGIN
  -- Truncate to current hour
  v_hour := date_trunc('hour', now());

  -- Single atomic upsert: increment counters + compute bypass_rate in one operation
  -- No separate SELECT/UPDATE = no TOCTOU race condition with concurrent workers
  INSERT INTO llm_metrics_hourly (hour_bucket, total_cost_eur, total_calls, llm_calls, bypass_rate)
  VALUES (
    v_hour,
    p_cost_eur,
    1,
    CASE WHEN p_was_llm THEN 1 ELSE 0 END,
    CASE WHEN p_was_llm THEN 0.0 ELSE 1.0 END
  )
  ON CONFLICT (hour_bucket) DO UPDATE SET
    total_cost_eur = llm_metrics_hourly.total_cost_eur + p_cost_eur,
    total_calls    = llm_metrics_hourly.total_calls + 1,
    llm_calls      = llm_metrics_hourly.llm_calls + CASE WHEN p_was_llm THEN 1 ELSE 0 END,
    bypass_rate    = 1.0 - (
      (llm_metrics_hourly.llm_calls + CASE WHEN p_was_llm THEN 1 ELSE 0 END)::NUMERIC
      / NULLIF(llm_metrics_hourly.total_calls + 1, 0)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION record_llm_metric(NUMERIC, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_llm_metric(NUMERIC, BOOLEAN) TO service_role;
