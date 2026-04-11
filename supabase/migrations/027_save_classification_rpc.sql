-- Migration 027: Atomic save_classification_result RPC
-- Wraps email_classifications INSERT + user_pipeline_health UPDATE in a single transaction
-- Prevents inconsistent state if one operation fails (B8.1)
--
-- NOTE: llm_usage_logs is NOT included — table has no migration, insert is best-effort.
-- NOTE: Gmail label application is NOT included — external API, cannot be in DB transaction.

CREATE OR REPLACE FUNCTION save_classification_result(
  p_user_id UUID,
  p_gmail_message_id TEXT,
  p_classification_result classification_result,
  p_label_id UUID,
  p_confidence_score NUMERIC,
  p_summary TEXT,
  p_source classification_source,
  p_processing_time_ms INT,
  p_idempotency_key TEXT,
  p_sender_display TEXT DEFAULT '',
  p_subject_snippet TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_classification_id UUID;
BEGIN
  -- 1. Insert classification (append-only — ADR-003)
  INSERT INTO email_classifications (
    user_id, gmail_message_id, classification_result, label_id,
    confidence_score, summary, source, processing_time_ms,
    idempotency_key, sender_display, subject_snippet
  ) VALUES (
    p_user_id, p_gmail_message_id, p_classification_result, p_label_id,
    p_confidence_score, p_summary, p_source, p_processing_time_ms,
    p_idempotency_key, p_sender_display, p_subject_snippet
  )
  RETURNING id INTO v_classification_id;

  -- 2. Update pipeline health (upsert)
  INSERT INTO user_pipeline_health (user_id, last_classified_at, updated_at)
  VALUES (p_user_id, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET
    last_classified_at = now(),
    updated_at = now();

  RETURN v_classification_id;
END;
$$;

-- Service role only (worker uses SERVICE_ROLE_KEY)
REVOKE EXECUTE ON FUNCTION save_classification_result(UUID, TEXT, classification_result, UUID, NUMERIC, TEXT, classification_source, INT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION save_classification_result(UUID, TEXT, classification_result, UUID, NUMERIC, TEXT, classification_source, INT, TEXT, TEXT, TEXT) TO service_role;
