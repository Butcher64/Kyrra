-- 015_gmail_webhook_queue_function.sql
-- SECURITY DEFINER function for Gmail Pub/Sub webhook queue insertion
-- Allows apps/web (ANON_KEY) to enqueue emails without SERVICE_ROLE_KEY
-- Same pattern as reclassification_requests (migration 012)

-- Function validates integration exists + is active, then inserts queue item
CREATE OR REPLACE FUNCTION enqueue_gmail_notification(
  p_email_address TEXT,
  p_history_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_queue_id UUID;
BEGIN
  -- Find active integration by email address
  SELECT user_id INTO v_user_id
  FROM user_integrations
  WHERE email = p_email_address
    AND provider = 'gmail'
    AND status = 'active'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN NULL; -- Unknown email — ignore silently
  END IF;

  -- Insert queue item (metadata only — never email content)
  INSERT INTO email_queue_items (user_id, gmail_message_id, gmail_history_id, status)
  VALUES (v_user_id, 'history-' || p_history_id, p_history_id, 'pending')
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$;

-- Grant execute to anon and authenticated roles (webhook uses ANON_KEY)
GRANT EXECUTE ON FUNCTION enqueue_gmail_notification(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION enqueue_gmail_notification(TEXT, TEXT) TO authenticated;
