-- ============================================================
-- KYRRA — Migrations 015 → 021 (ordonnees)
-- Copier-coller dans Supabase SQL Editor : https://supabase.com/dashboard/project/nhvlkpibtnggsjuqthuz/sql
-- Executer en UNE SEULE fois (les transactions sont implicites par bloc)
-- ============================================================

-- ===== MIGRATION 015 : Gmail webhook queue function =====
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
  SELECT user_id INTO v_user_id
  FROM user_integrations
  WHERE email = p_email_address
    AND provider = 'gmail'
    AND status = 'active'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO email_queue_items (user_id, gmail_message_id, gmail_history_id, status)
  VALUES (v_user_id, 'history-' || p_history_id, p_history_id, 'pending')
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$;

GRANT EXECUTE ON FUNCTION enqueue_gmail_notification(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION enqueue_gmail_notification(TEXT, TEXT) TO authenticated;


-- ===== MIGRATION 016 : user_settings table =====
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


-- ===== MIGRATION 017 : Convert TEXT to ENUMs =====
CREATE TYPE integration_provider AS ENUM ('gmail', 'outlook');
CREATE TYPE integration_status AS ENUM ('active', 'revoked', 'expired');
CREATE TYPE classification_source AS ENUM ('fingerprint', 'llm');
CREATE TYPE pipeline_mode AS ENUM ('active', 'paused', 'polling');
CREATE TYPE whitelist_source AS ENUM ('scan', 'reclassification', 'manual');
CREATE TYPE onboarding_status AS ENUM ('pending', 'scanning', 'completed', 'failed');

ALTER TABLE user_integrations
  DROP CONSTRAINT IF EXISTS user_integrations_provider_check,
  ALTER COLUMN provider DROP DEFAULT,
  ALTER COLUMN provider TYPE integration_provider USING provider::integration_provider,
  ALTER COLUMN provider SET DEFAULT 'gmail';

ALTER TABLE user_integrations
  DROP CONSTRAINT IF EXISTS user_integrations_status_check,
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE integration_status USING status::integration_status,
  ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE email_classifications
  DROP CONSTRAINT IF EXISTS email_classifications_source_check,
  ALTER COLUMN source DROP DEFAULT,
  ALTER COLUMN source TYPE classification_source USING source::classification_source,
  ALTER COLUMN source SET DEFAULT 'fingerprint';

ALTER TABLE user_pipeline_health
  DROP CONSTRAINT IF EXISTS user_pipeline_health_mode_check,
  ALTER COLUMN mode DROP DEFAULT,
  ALTER COLUMN mode TYPE pipeline_mode USING mode::pipeline_mode,
  ALTER COLUMN mode SET DEFAULT 'active';

ALTER TABLE whitelist_entries
  DROP CONSTRAINT IF EXISTS whitelist_entries_source_check,
  ALTER COLUMN source DROP DEFAULT,
  ALTER COLUMN source TYPE whitelist_source USING source::whitelist_source,
  ALTER COLUMN source SET DEFAULT 'scan';

ALTER TABLE onboarding_scans
  DROP CONSTRAINT IF EXISTS onboarding_scans_status_check,
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE onboarding_status USING status::onboarding_status,
  ALTER COLUMN status SET DEFAULT 'pending';


-- ===== MIGRATION 018 : delete_user_account function =====
CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only delete own account';
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;


-- ===== MIGRATION 018b : add user_role to user_settings =====
CREATE TYPE user_role AS ENUM ('CEO', 'DRH', 'DSI');

ALTER TABLE user_settings
  ADD COLUMN user_role user_role NOT NULL DEFAULT 'CEO';


-- ===== MIGRATION 019 : classification_feedback table =====
CREATE TABLE classification_feedback (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id  TEXT        NOT NULL,
  reason            TEXT        NOT NULL CHECK (reason IN ('false_positive', 'wrong_category', 'whitelist_sender')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

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


-- ===== MIGRATION 020 : label_change_signals table =====
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

CREATE POLICY "Service can insert signals"
  ON label_change_signals FOR INSERT
  WITH CHECK (true);


-- ===== MIGRATION 021 : RGPD consent fields =====
ALTER TABLE user_settings
  ADD COLUMN consent_given   BOOLEAN       NOT NULL DEFAULT false,
  ADD COLUMN consent_at      TIMESTAMPTZ,
  ADD COLUMN recap_consent   BOOLEAN       NOT NULL DEFAULT false;


-- ============================================================
-- VERIFICATION — Executer apres les migrations ci-dessus
-- ============================================================

-- Verifier user_settings existe avec toutes les colonnes
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'user_settings' ORDER BY ordinal_position;

-- Verifier les fonctions
SELECT proname FROM pg_proc WHERE proname IN ('enqueue_gmail_notification', 'delete_user_account');

-- Verifier les nouvelles tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('classification_feedback', 'label_change_signals');

-- Verifier les ENUMs
SELECT typname FROM pg_type
WHERE typname IN ('exposure_mode', 'user_role', 'integration_provider',
  'integration_status', 'classification_source', 'pipeline_mode',
  'whitelist_source', 'onboarding_status');
