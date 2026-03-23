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
