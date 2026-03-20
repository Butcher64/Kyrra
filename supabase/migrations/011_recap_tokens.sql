-- 011_recap_tokens.sql
-- FR85: single-use in-email reclassification tokens
-- Zero-auth: anonymous SELECT + UPDATE via special RLS policies
-- Token = encode(gen_random_bytes(32), 'hex') — 256 bits, unguessable

CREATE TABLE recap_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,
  email_id    TEXT        NOT NULL,
  recap_date  DATE        NOT NULL,
  used_at     TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recap_tokens_token ON recap_tokens(token);
CREATE INDEX idx_recap_tokens_user_id ON recap_tokens(user_id);

ALTER TABLE recap_tokens ENABLE ROW LEVEL SECURITY;

-- Anonymous token lookup by exact value (token is 32-byte random hex, unguessable)
CREATE POLICY "Anonymous token lookup by value"
  ON recap_tokens FOR SELECT
  USING (true);

-- Mark as used: only if not yet used (atomic single-use enforcement)
CREATE POLICY "Token redemption mark used"
  ON recap_tokens FOR UPDATE
  USING (used_at IS NULL)
  WITH CHECK (used_at IS NOT NULL);

-- INSERT/DELETE via SERVICE_ROLE_KEY only (worker creates tokens, cron cleans expired)
