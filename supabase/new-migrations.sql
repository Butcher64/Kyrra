-- 018_add_user_role_to_settings.sql
-- Add user_role column to user_settings for dynamic classification (B1.2)
-- Defaults to 'CEO' matching current hardcoded behavior

CREATE TYPE user_role AS ENUM ('CEO', 'DRH', 'DSI');

ALTER TABLE user_settings
  ADD COLUMN user_role user_role NOT NULL DEFAULT 'CEO';
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
