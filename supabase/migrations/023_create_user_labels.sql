-- 023_create_user_labels.sql
-- Dynamic user-configurable label system (replaces fixed 3-label enum)
-- Each user gets their own label set with AI classification prompts

-- ═══ user_labels table ═══
CREATE TABLE IF NOT EXISTS user_labels (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  description       TEXT,
  prompt            TEXT,
  color             TEXT,
  gmail_label_id    TEXT,
  gmail_label_name  TEXT,
  is_default        BOOLEAN     NOT NULL DEFAULT false,
  position          INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each user's label names must be unique
  UNIQUE (user_id, name)
);

-- Composite index for fast lookup by user, ordered by position
CREATE INDEX IF NOT EXISTS idx_user_labels_user
  ON user_labels(user_id, position);

-- ═══ RLS policies ═══
ALTER TABLE user_labels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own labels"
    ON user_labels FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own labels"
    ON user_labels FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own labels"
    ON user_labels FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own labels"
    ON user_labels FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service role bypasses RLS (worker needs to read labels during classification)

-- ═══ Add label_id to email_classifications ═══
ALTER TABLE email_classifications
  ADD COLUMN IF NOT EXISTS label_id UUID REFERENCES user_labels(id);

-- ═══ Add label config columns to onboarding_scans ═══
ALTER TABLE onboarding_scans
  ADD COLUMN IF NOT EXISTS labels_configured BOOLEAN DEFAULT false;

ALTER TABLE onboarding_scans
  ADD COLUMN IF NOT EXISTS gmail_labels JSONB DEFAULT '[]'::jsonb;
