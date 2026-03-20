-- 013_create_whitelist.sql
-- Whitelisted sender addresses stored as non-reversible SHA-256 hashes
-- Two levels: exact address hash + domain hash (FR27)
-- Auto-populated by onboarding scan (6-month sent history)
-- Auto-added on reclassification (FR28)

CREATE TABLE whitelist_entries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address_hash  TEXT        NOT NULL,  -- SHA-256 of full email address
  domain_hash   TEXT        NOT NULL,  -- SHA-256 of domain
  source        TEXT        NOT NULL DEFAULT 'scan' CHECK (source IN ('scan', 'reclassification', 'manual')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicate whitelist entries
CREATE UNIQUE INDEX idx_whitelist_user_address ON whitelist_entries(user_id, address_hash);
CREATE INDEX idx_whitelist_user_domain ON whitelist_entries(user_id, domain_hash);
CREATE INDEX idx_whitelist_user_id ON whitelist_entries(user_id);

ALTER TABLE whitelist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own whitelist"
  ON whitelist_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own whitelist"
  ON whitelist_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own whitelist"
  ON whitelist_entries FOR DELETE
  USING (auth.uid() = user_id);
