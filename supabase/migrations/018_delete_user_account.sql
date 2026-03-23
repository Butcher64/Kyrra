-- 018_delete_user_account.sql
-- SECURITY DEFINER function for clean account deletion (FR84)
-- Deletes all user data via CASCADE and removes auth.users row
-- Must be called from apps/web server action with authenticated user_id

CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is the user being deleted (defense in depth)
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: can only delete own account';
  END IF;

  -- All tables reference auth.users(id) ON DELETE CASCADE, so deleting
  -- the auth.users row cascades to: user_integrations, email_classifications,
  -- email_queue_items, usage_counters, user_pipeline_health, recap_tokens,
  -- reclassification_requests, whitelist_entries, onboarding_scans, user_settings

  -- Delete the user from auth.users (triggers CASCADE on all dependent tables)
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
