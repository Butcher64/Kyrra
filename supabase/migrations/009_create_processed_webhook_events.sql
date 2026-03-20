-- 009_create_processed_webhook_events.sql
-- Stripe webhook idempotency (prevents replay attacks)

CREATE TABLE processed_webhook_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     TEXT        NOT NULL UNIQUE,
  event_type   TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_processed_webhook_events_event_id ON processed_webhook_events(event_id);
