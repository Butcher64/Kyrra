-- 014_create_onboarding_scans.sql
-- Tracks onboarding whitelist scan progress (async background job)
-- Enables real-time progress display + resume interrupted scans

CREATE TABLE onboarding_scans (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status            TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'completed', 'failed')),
  total_sent        INT         DEFAULT 0,
  emails_processed  INT         DEFAULT 0,
  contacts_found    INT         DEFAULT 0,
  prospecting_found INT         DEFAULT 0,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE onboarding_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scan"
  ON onboarding_scans FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE via SERVICE_ROLE_KEY (worker creates and updates scan progress)
