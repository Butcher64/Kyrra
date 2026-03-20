-- 003_create_user_integrations.sql
-- Gmail/Outlook OAuth tokens (AES-256 encrypted at application layer)
-- Separate from Supabase Auth session — two distinct OAuth flows (RGPD Art.7)

CREATE TABLE user_integrations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        TEXT        NOT NULL DEFAULT 'gmail' CHECK (provider IN ('gmail', 'outlook')),
  email           TEXT        NOT NULL,
  access_token    TEXT        NOT NULL,  -- AES-256 encrypted at app layer
  refresh_token   TEXT        NOT NULL,  -- AES-256 encrypted at app layer
  expires_at      TIMESTAMPTZ NOT NULL,
  scopes          TEXT[]      NOT NULL DEFAULT '{}',
  watch_expiry    TIMESTAMPTZ,
  watch_history_id TEXT,
  status          TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_integrations_user_id ON user_integrations(user_id);
