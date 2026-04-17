-- Migration 036 (B9.4): add LLM error tracking for circuit breaker
--
-- Context: the previous circuit breaker was cost-only (total_cost_eur > 200).
-- That guards against runaway spend but not against a degraded LLM
-- (timeouts, 429s, malformed JSON) still being hit hundreds of times.
-- B9.4 adds an error-rate signal: open the circuit if >30% of recent
-- LLM calls failed AND we have a minimum sample size.

ALTER TABLE llm_metrics_hourly
  ADD COLUMN IF NOT EXISTS llm_errors INT NOT NULL DEFAULT 0;

-- Drop the old 2-arg RPC so we can replace it with a 3-arg signature
-- (supabase-js picks the function by argument count, so we cannot simply
-- overload — both signatures would remain callable).
DROP FUNCTION IF EXISTS record_llm_metric(NUMERIC, BOOLEAN);

CREATE OR REPLACE FUNCTION record_llm_metric(
  p_cost_eur NUMERIC,
  p_was_llm BOOLEAN,
  p_was_error BOOLEAN DEFAULT FALSE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hour TIMESTAMPTZ;
BEGIN
  v_hour := date_trunc('hour', now());

  INSERT INTO llm_metrics_hourly (hour_bucket, total_cost_eur, total_calls, llm_calls, llm_errors, bypass_rate)
  VALUES (
    v_hour,
    p_cost_eur,
    1,
    CASE WHEN p_was_llm THEN 1 ELSE 0 END,
    CASE WHEN p_was_error THEN 1 ELSE 0 END,
    CASE WHEN p_was_llm THEN 0.0 ELSE 1.0 END
  )
  ON CONFLICT (hour_bucket) DO UPDATE SET
    total_cost_eur = llm_metrics_hourly.total_cost_eur + p_cost_eur,
    total_calls    = llm_metrics_hourly.total_calls + 1,
    llm_calls      = llm_metrics_hourly.llm_calls + CASE WHEN p_was_llm THEN 1 ELSE 0 END,
    llm_errors     = llm_metrics_hourly.llm_errors + CASE WHEN p_was_error THEN 1 ELSE 0 END,
    bypass_rate    = 1.0 - (
      (llm_metrics_hourly.llm_calls + CASE WHEN p_was_llm THEN 1 ELSE 0 END)::NUMERIC
      / NULLIF(llm_metrics_hourly.total_calls + 1, 0)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION record_llm_metric(NUMERIC, BOOLEAN, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_llm_metric(NUMERIC, BOOLEAN, BOOLEAN) TO service_role;

NOTIFY pgrst, 'reload schema';
