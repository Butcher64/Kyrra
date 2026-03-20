-- 010_rls_policies.sql
-- Row Level Security: per-user isolation at database level
-- RLS always in last numbered migration (architecture convention)

-- ═══ user_integrations ═══
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
  ON user_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON user_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON user_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON user_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- ═══ email_classifications ═══
ALTER TABLE email_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own classifications"
  ON email_classifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own classifications"
  ON email_classifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE policy: append-only table (ADR-003)
-- No DELETE policy: classifications are immutable audit trail

-- ═══ email_queue_items ═══
ALTER TABLE email_queue_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own queue items"
  ON email_queue_items FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE via SERVICE_ROLE_KEY only (worker)

-- ═══ usage_counters ═══
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON usage_counters FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE via SERVICE_ROLE_KEY or increment_usage_counter() function

-- ═══ user_pipeline_health ═══
ALTER TABLE user_pipeline_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pipeline health"
  ON user_pipeline_health FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE via SERVICE_ROLE_KEY only (worker manages pipeline health)

-- ═══ llm_metrics_hourly ═══
ALTER TABLE llm_metrics_hourly ENABLE ROW LEVEL SECURITY;
-- System-level table: no user-scoped policies
-- Accessed only via SERVICE_ROLE_KEY (worker) or SECURITY DEFINER functions

-- ═══ processed_webhook_events ═══
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;
-- System-level table: no user-scoped policies
-- Accessed only via SERVICE_ROLE_KEY (webhook Route Handlers use server-side)
