-- 008_create_llm_metrics.sql
-- LLM cost + bypass rate tracking (Safeguard 3)
-- Circuit breaker reads from this table (Supabase-backed, survives Railway restarts)

CREATE TABLE llm_metrics_hourly (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  hour_bucket     TIMESTAMPTZ   NOT NULL UNIQUE,
  bypass_rate     NUMERIC(5,4),
  total_cost_eur  NUMERIC(10,4),
  users_count     INT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);
