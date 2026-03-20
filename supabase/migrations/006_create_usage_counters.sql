-- 006_create_usage_counters.sql
-- Free plan 30/day counter with atomic increment function
-- Prevents TOCTOU race condition at limit boundary

CREATE TABLE usage_counters (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_bucket DATE    NOT NULL,
  count       INT     NOT NULL DEFAULT 0,
  UNIQUE(user_id, date_bucket)
);

CREATE INDEX idx_usage_counters_user_date ON usage_counters(user_id, date_bucket);

-- Atomic increment with boundary check
-- Returns new count if under limit, NULL if limit reached
CREATE OR REPLACE FUNCTION increment_usage_counter(
  p_user_id UUID,
  p_date    DATE
) RETURNS INT
LANGUAGE SQL
AS $$
  INSERT INTO usage_counters (user_id, date_bucket, count)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, date_bucket) DO UPDATE
    SET count = usage_counters.count + 1
    WHERE usage_counters.count < 30
  RETURNING count;
$$;
