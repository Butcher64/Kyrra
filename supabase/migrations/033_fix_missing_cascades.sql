-- Migration 033: Fix missing ON DELETE CASCADE / SET NULL on foreign keys
--
-- Three FKs in the public schema have ON DELETE NO ACTION, which can block
-- account deletion (delete_user_account RPC), label reconfiguration
-- (save_user_labels RPC), and expired-token cleanup.
--
-- Fixes:
--   1. email_classifications.label_id → user_labels.id  : NO ACTION → SET NULL
--      Reason: classifications are append-only audit trail (ADR-003).
--      When labels are deleted (save_user_labels RPC or account deletion cascade),
--      the classification row must survive with label_id = NULL.
--      classification_result (legacy enum) remains intact for backwards compat.
--
--   2. reclassification_requests.token_id → recap_tokens.id  : NO ACTION → SET NULL
--      Reason: expired token cron cleanup or account deletion cascade must not
--      be blocked by pending reclassification requests. The request row survives
--      with token_id = NULL; it still has user_id + email_id for traceability.
--
--   3. llm_usage_logs.user_id → auth.users.id  : NO ACTION → CASCADE
--      Reason: every other user_id FK in the schema uses ON DELETE CASCADE.
--      This table was created in migration 028 but the CASCADE was omitted.
--      Account deletion must cascade to usage logs (RGPD compliance).

-- ═══ 1. email_classifications.label_id → SET NULL ═══
ALTER TABLE email_classifications
  DROP CONSTRAINT email_classifications_label_id_fkey;

ALTER TABLE email_classifications
  ADD CONSTRAINT email_classifications_label_id_fkey
  FOREIGN KEY (label_id) REFERENCES user_labels(id) ON DELETE SET NULL;

-- ═══ 2. reclassification_requests.token_id → SET NULL ═══
ALTER TABLE reclassification_requests
  DROP CONSTRAINT reclassification_requests_token_id_fkey;

ALTER TABLE reclassification_requests
  ADD CONSTRAINT reclassification_requests_token_id_fkey
  FOREIGN KEY (token_id) REFERENCES recap_tokens(id) ON DELETE SET NULL;

-- ═══ 3. llm_usage_logs.user_id → CASCADE ═══
ALTER TABLE llm_usage_logs
  DROP CONSTRAINT llm_usage_logs_user_id_fkey;

ALTER TABLE llm_usage_logs
  ADD CONSTRAINT llm_usage_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
