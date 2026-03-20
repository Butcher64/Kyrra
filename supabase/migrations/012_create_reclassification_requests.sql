-- 012_create_reclassification_requests.sql
-- Token redemption queue: apps/web Route Handler (ANON_KEY) inserts,
-- apps/worker (SERVICE_ROLE_KEY) processes
-- Zero SERVICE_ROLE_KEY in apps/web — architecture constraint F1

CREATE TABLE reclassification_requests (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id      TEXT        NOT NULL,
  source        TEXT        NOT NULL DEFAULT 'recap_token',
  token_id      UUID        REFERENCES recap_tokens(id),
  status        TEXT        NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ
);

ALTER TABLE reclassification_requests ENABLE ROW LEVEL SECURITY;

-- Anonymous INSERT allowed (token-based: Route Handler validates token before inserting)
CREATE POLICY "Insert reclassification request"
  ON reclassification_requests FOR INSERT
  WITH CHECK (true);

-- SELECT/UPDATE/DELETE via SERVICE_ROLE_KEY only (worker processes requests)
