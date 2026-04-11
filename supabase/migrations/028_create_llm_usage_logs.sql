-- Migration 028: Create llm_usage_logs table
-- This table was referenced in classification.ts but never created (silent insert failure).
-- Tracks per-email LLM cost for founder visibility and cost optimization.

CREATE TABLE llm_usage_logs (
  id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id    TEXT            NOT NULL,
  model               TEXT            NOT NULL DEFAULT 'gpt-4o-mini',
  input_tokens        INT             NOT NULL DEFAULT 0,
  output_tokens       INT             NOT NULL DEFAULT 0,
  cost_usd            NUMERIC(10,6)   NOT NULL DEFAULT 0,
  latency_ms          INT,
  classification_result classification_result,
  label_name          TEXT,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Index for cost aggregation queries (hourly, daily, monthly)
CREATE INDEX idx_llm_usage_logs_created ON llm_usage_logs(created_at DESC);
CREATE INDEX idx_llm_usage_logs_user ON llm_usage_logs(user_id);

-- RLS: service role only (worker writes, founders query via admin panel)
ALTER TABLE llm_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON llm_usage_logs
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Revoke direct access from anon/authenticated — only service_role via worker
REVOKE ALL ON llm_usage_logs FROM anon, authenticated;
GRANT ALL ON llm_usage_logs TO service_role;
