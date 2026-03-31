-- Migration: Add admin role and credit system to user_settings
-- Date: 2026-03-31
-- Purpose: Secure classification pipeline with role-based access and credit limits

-- Add role column (admin, beta_tester, user)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS role text DEFAULT 'user'
  CHECK (role IN ('admin', 'beta_tester', 'user'));

-- Add credit limit (-1 = unlimited, 0 = no credits, >0 = daily limit)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS daily_credit_limit integer DEFAULT 0;

-- Add total credits used (lifetime counter)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS total_credits_used integer DEFAULT 0;

-- Set @hacksprint.fr users as admin with unlimited credits
UPDATE user_settings SET role = 'admin', daily_credit_limit = -1
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@hacksprint.fr');

-- Fix RLS: restrict UPDATE to safe columns only (prevent users from escalating their own role)
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own safe settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

REVOKE UPDATE ON user_settings FROM authenticated;
GRANT UPDATE (exposure_mode, notifications_enabled, recap_enabled, recap_time_utc,
  recap_consent, consent_given, consent_at, updated_at) ON user_settings TO authenticated;

-- Helper function to add admin users
CREATE OR REPLACE FUNCTION add_admin_user(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found with email: ' || p_email);
  END IF;

  UPDATE user_settings
  SET role = 'admin', daily_credit_limit = -1, updated_at = now()
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'No user_settings row for user: ' || p_email);
  END IF;

  RETURN json_build_object('success', true, 'user_id', v_user_id, 'email', p_email, 'role', 'admin');
END;
$$;
