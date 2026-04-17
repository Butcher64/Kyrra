-- Migration 032: Auto-admin trigger for @hacksprint.fr accounts
-- Date: 2026-04-14
-- Purpose: New @hacksprint.fr users automatically get role='admin' and unlimited credits.
-- Migration 022 only ran once for existing users — this trigger handles future sign-ups.

CREATE OR REPLACE FUNCTION auto_admin_hacksprint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  -- Look up the email from auth.users (requires SECURITY DEFINER)
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;

  -- If the email matches @hacksprint.fr, promote to admin with unlimited credits
  IF v_email IS NOT NULL AND v_email LIKE '%@hacksprint.fr' THEN
    -- Direct UPDATE bypasses the protect_user_settings_sensitive_columns trigger
    -- because SECURITY DEFINER runs as postgres (allowed in migration 030)
    UPDATE user_settings
    SET role = 'admin',
        daily_credit_limit = -1,
        updated_at = now()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_admin_hacksprint ON user_settings;
CREATE TRIGGER trg_auto_admin_hacksprint
  AFTER INSERT ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION auto_admin_hacksprint();
