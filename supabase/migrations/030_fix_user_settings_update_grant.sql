-- Migration 030: Fix user_settings UPDATE permission for PostgREST upserts
--
-- Problem: Migration 022 did REVOKE UPDATE + column-level GRANT.
-- PostgREST requires table-level UPDATE for upserts, even when column-level
-- grants exist. This breaks saveConsent() and all other upsert operations
-- on user_settings.
--
-- Fix: Restore table-level UPDATE + add trigger to block sensitive columns.

-- Step 1: Restore table-level UPDATE for authenticated role
GRANT UPDATE ON user_settings TO authenticated;

-- Step 2: Add trigger to prevent privilege escalation
-- Blocks updates to role, daily_credit_limit, total_credits_used by non-admin users
CREATE OR REPLACE FUNCTION protect_user_settings_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role, supabase_admin, and postgres (SECURITY DEFINER functions)
  IF current_setting('role') IN ('service_role', 'supabase_admin') OR current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  -- Block changes to sensitive columns for authenticated users
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot modify role column'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.daily_credit_limit IS DISTINCT FROM OLD.daily_credit_limit THEN
    RAISE EXCEPTION 'Cannot modify daily_credit_limit column'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.total_credits_used IS DISTINCT FROM OLD.total_credits_used THEN
    RAISE EXCEPTION 'Cannot modify total_credits_used column'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_settings ON user_settings;
CREATE TRIGGER trg_protect_user_settings
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION protect_user_settings_sensitive_columns();
