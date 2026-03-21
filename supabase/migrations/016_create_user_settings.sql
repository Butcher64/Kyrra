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
