-- 004_create_email_classifications.sql
-- Append-only classification table (INSERT only, never UPDATE)
-- Natural audit trail — ADR-003

CREATE TABLE email_classifications (
  id                  UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID                  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id    TEXT                  NOT NULL,
  classification_result classification_result NOT NULL,
  confidence_score    NUMERIC(5,4)          NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  summary             TEXT,
  source              TEXT                  NOT NULL DEFAULT 'fingerprint' CHECK (source IN ('fingerprint', 'llm')),
  processing_time_ms  INT,
  idempotency_key     TEXT,
  created_at          TIMESTAMPTZ           NOT NULL DEFAULT now()
);

-- Idempotency: prevent duplicate classifications for same email
CREATE UNIQUE INDEX idx_email_classifications_idempotency
  ON email_classifications(user_id, gmail_message_id, idempotency_key);

CREATE INDEX idx_email_classifications_user_id ON email_classifications(user_id);
CREATE INDEX idx_email_classifications_gmail_message_id ON email_classifications(gmail_message_id);
CREATE INDEX idx_email_classifications_user_created ON email_classifications(user_id, created_at DESC);
