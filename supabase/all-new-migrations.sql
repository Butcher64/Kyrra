-- 015_gmail_webhook_queue_function.sql
-- SECURITY DEFINER function for Gmail Pub/Sub webhook queue insertion
-- Allows apps/web (ANON_KEY) to enqueue emails without SERVICE_ROLE_KEY
-- Same pattern as reclassification_requests (migration 012)

-- Function validates integration exists + is active, then inserts queue item
CREATE OR REPLACE FUNCTION enqueue_gmail_notification(
  p_email_address TEXT,
  p_history_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_queue_id UUID;
BEGIN
  -- Find active integration by email address
  SELECT user_id INTO v_user_id
  FROM user_integrations
  WHERE email = p_email_address
    AND provider = 'gmail'
    AND status = 'active'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN NULL; -- Unknown email — ignore silently
  END IF;

  -- Insert queue item (metadata only — never email content)
  INSERT INTO email_queue_items (user_id, gmail_message_id, gmail_history_id, status)
  VALUES (v_user_id, 'history-' || p_history_id, p_history_id, 'pending')
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$;

-- Grant execute to anon and authenticated roles (webhook uses ANON_KEY)
GRANT EXECUTE ON FUNCTION enqueue_gmail_notification(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION enqueue_gmail_notification(TEXT, TEXT) TO authenticated;
-- 016_create_user_settings.sql
-- User preferences: exposure mode, notification settings, recap preferences
-- Separate from user_pipeline_health (operational state vs user preferences)

CREATE TYPE exposure_mode AS ENUM ('strict', 'normal', 'permissive');

CREATE TABLE user_settings (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  exposure_mode           exposure_mode NOT NULL DEFAULT 'normal',
  notifications_enabled   BOOLEAN     NOT NULL DEFAULT true,
  recap_enabled           BOOLEAN     NOT NULL DEFAULT true,
  recap_time_utc          TIME        NOT NULL DEFAULT '07:00:00',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- 017_convert_text_to_enums.sql
-- Convert TEXT + CHECK columns to PostgreSQL native ENUMs (Enforcement Rule F7)
-- This ensures supabase gen types produces TypeScript union types, not string

-- Step 1: Create new ENUM types
CREATE TYPE integration_provider AS ENUM ('gmail', 'outlook');
CREATE TYPE integration_status AS ENUM ('active', 'revoked', 'expired');
CREATE TYPE classification_source AS ENUM ('fingerprint', 'llm');
CREATE TYPE pipeline_mode AS ENUM ('active', 'paused', 'polling');
CREATE TYPE whitelist_source AS ENUM ('scan', 'reclassification', 'manual');
CREATE TYPE onboarding_status AS ENUM ('pending', 'scanning', 'completed', 'failed');

-- Step 2: Drop CHECK constraints, alter columns to use ENUMs
-- user_integrations.provider
ALTER TABLE user_integrations
  DROP CONSTRAINT IF EXISTS user_integrations_provider_check,
  ALTER COLUMN provider DROP DEFAULT,
  ALTER COLUMN provider TYPE integration_provider USING provider::integration_provider,
  ALTER COLUMN provider SET DEFAULT 'gmail';

-- user_integrations.status
ALTER TABLE user_integrations
  DROP CONSTRAINT IF EXISTS user_integrations_status_check,
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE integration_status USING status::integration_status,
  ALTER COLUMN status SET DEFAULT 'active';

-- email_classifications.source
ALTER TABLE email_classifications
  DROP CONSTRAINT IF EXISTS email_classifications_source_check,
  ALTER COLUMN source DROP DEFAULT,
  ALTER COLUMN source TYPE classification_source USING source::classification_source,
  ALTER COLUMN source SET DEFAULT 'fingerprint';

-- user_pipeline_health.mode
ALTER TABLE user_pipeline_health
  DROP CONSTRAINT IF EXISTS user_pipeline_health_mode_check,
  ALTER COLUMN mode DROP DEFAULT,
  ALTER COLUMN mode TYPE pipeline_mode USING mode::pipeline_mode,
  ALTER COLUMN mode SET DEFAULT 'active';

-- whitelist_entries.source
ALTER TABLE whitelist_entries
  DROP CONSTRAINT IF EXISTS whitelist_entries_source_check,
  ALTER COLUMN source DROP DEFAULT,
  ALTER COLUMN source TYPE whitelist_source USING source::whitelist_source,
  ALTER COLUMN source SET DEFAULT 'scan';

-- onboarding_scans.status
ALTER TABLE onboarding_scans
  DROP CONSTRAINT IF EXISTS onboarding_scans_status_check,
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE onboarding_status USING status::onboarding_status,
  ALTER COLUMN status SET DEFAULT 'pending';
-- 018_delete_user_account.sql
-- SECURITY DEFINER function for clean account deletion (FR84)
-- Deletes all user data via CASCADE and removes auth.users row
-- Must be called from apps/web server action with authenticated user_id

CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is the user being deleted (defense in depth)
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only delete own account';
  END IF;

  -- All tables reference auth.users(id) ON DELETE CASCADE, so deleting
  -- the auth.users row cascades to: user_integrations, email_classifications,
  -- email_queue_items, usage_counters, user_pipeline_health, recap_tokens,
  -- reclassification_requests, whitelist_entries, onboarding_scans, user_settings

  -- Delete the user from auth.users (triggers CASCADE on all dependent tables)
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
-- 018_add_user_role_to_settings.sql
-- Add user_role column to user_settings for dynamic classification (B1.2)
-- Defaults to 'CEO' matching current hardcoded behavior

CREATE TYPE user_role AS ENUM ('CEO', 'DRH', 'DSI');

ALTER TABLE user_settings
  ADD COLUMN user_role user_role NOT NULL DEFAULT 'CEO';
-- 019_create_classification_feedback.sql
-- User feedback on email classifications (FR46 — Trust & Feedback Loop)
-- Captures false positives, wrong categories, and whitelist requests

CREATE TABLE classification_feedback (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id  TEXT        NOT NULL,
  reason            TEXT        NOT NULL CHECK (reason IN ('false_positive', 'wrong_category', 'whitelist_sender')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One feedback per user per message
CREATE UNIQUE INDEX idx_classification_feedback_user_message
  ON classification_feedback(user_id, gmail_message_id);
CREATE INDEX idx_classification_feedback_user_id
  ON classification_feedback(user_id);

ALTER TABLE classification_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON classification_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON classification_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- 020_create_label_change_signals.sql
-- Tracks when users remove Kyrra labels in Gmail (implicit reclassification signal)
-- Worker detects via history.labelsRemoved, dashboard shows learn banner

CREATE TABLE label_change_signals (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id  TEXT        NOT NULL,
  old_label         TEXT        NOT NULL,
  detected_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged      BOOLEAN     NOT NULL DEFAULT false
);

CREATE INDEX idx_label_change_signals_user_unack
  ON label_change_signals(user_id) WHERE acknowledged = false;
CREATE INDEX idx_label_change_signals_user_message
  ON label_change_signals(user_id, gmail_message_id);

ALTER TABLE label_change_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own signals"
  ON label_change_signals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own signals"
  ON label_change_signals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Worker inserts via SERVICE_ROLE_KEY (no RLS needed for INSERT)
CREATE POLICY "Service can insert signals"
  ON label_change_signals FOR INSERT
  WITH CHECK (true);
-- 021_add_consent_to_user_settings.sql
-- RGPD consent fields: classification consent (required) and recap consent (optional)

ALTER TABLE user_settings
  ADD COLUMN consent_given   BOOLEAN       NOT NULL DEFAULT false,
  ADD COLUMN consent_at      TIMESTAMPTZ,
  ADD COLUMN recap_consent   BOOLEAN       NOT NULL DEFAULT false;
