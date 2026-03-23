-- 021_add_consent_to_user_settings.sql
-- RGPD consent fields: classification consent (required) and recap consent (optional)

ALTER TABLE user_settings
  ADD COLUMN consent_given   BOOLEAN       NOT NULL DEFAULT false,
  ADD COLUMN consent_at      TIMESTAMPTZ,
  ADD COLUMN recap_consent   BOOLEAN       NOT NULL DEFAULT false;
