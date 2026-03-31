DO $$ BEGIN CREATE TYPE exposure_mode AS ENUM ('strict', 'normal', 'permissive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  exposure_mode exposure_mode NOT NULL DEFAULT 'normal',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  recap_enabled BOOLEAN NOT NULL DEFAULT true,
  recap_time_utc TIME NOT NULL DEFAULT '07:00:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('CEO', 'DRH', 'DSI'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS user_role user_role NOT NULL DEFAULT 'CEO';

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS recap_consent BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS classification_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('false_positive', 'wrong_category', 'whitelist_sender')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_classification_feedback_user_message ON classification_feedback(user_id, gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_classification_feedback_user_id ON classification_feedback(user_id);
ALTER TABLE classification_feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own feedback" ON classification_feedback FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own feedback" ON classification_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS label_change_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL,
  old_label TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_label_change_signals_user_unack ON label_change_signals(user_id) WHERE acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_label_change_signals_user_message ON label_change_signals(user_id, gmail_message_id);
ALTER TABLE label_change_signals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own signals" ON label_change_signals FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own signals" ON label_change_signals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service can insert signals" ON label_change_signals FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only delete own account';
  END IF;
  DELETE FROM auth.users WHERE id = p_user_id;
END; $$;
