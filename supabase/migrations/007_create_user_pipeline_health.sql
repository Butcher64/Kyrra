-- 007_create_user_pipeline_health.sql
-- Health monitor (Safeguard 1): tracks pipeline status per user
-- Dead man's switch: alert if last_classified_at > 15 min for active user

CREATE TABLE user_pipeline_health (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  last_classified_at TIMESTAMPTZ,
  watch_expires_at  TIMESTAMPTZ,
  mode              TEXT        NOT NULL DEFAULT 'active' CHECK (mode IN ('active', 'paused', 'polling')),
  pause_reason      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_pipeline_health_user_id ON user_pipeline_health(user_id);

-- SECURITY DEFINER function: accessible via ANON_KEY for Vercel Cron health check
-- Returns only a count (zero PII) — governance rule: primitive params only
CREATE OR REPLACE FUNCTION get_stale_pipeline_count(threshold_minutes INT DEFAULT 15)
RETURNS INT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INT
  FROM user_pipeline_health
  WHERE last_classified_at < now() - (threshold_minutes || ' minutes')::INTERVAL
  AND mode != 'paused';
$$;
