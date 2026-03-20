-- 005_create_email_queue_items.sql
-- Async processing queue (ADR-001: Supabase queue MVP-0 → BullMQ MVP-1)
-- Queue payload is metadata-only — never email content

CREATE TABLE email_queue_items (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id  TEXT          NOT NULL,
  gmail_history_id  TEXT,
  status            queue_status  NOT NULL DEFAULT 'pending',
  retry_count       INT           NOT NULL DEFAULT 0,
  claimed_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  processed_at      TIMESTAMPTZ,
  error_message     TEXT          -- error code only, never email content
);

-- Critical index for claimNextJob() atomic UPDATE...WHERE status='pending' ORDER BY created_at
CREATE INDEX idx_email_queue_items_status_created
  ON email_queue_items(status, created_at ASC)
  WHERE status = 'pending';

CREATE INDEX idx_email_queue_items_user_id ON email_queue_items(user_id);
