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
