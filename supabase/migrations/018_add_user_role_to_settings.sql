-- 018_add_user_role_to_settings.sql
-- Add user_role column to user_settings for dynamic classification (B1.2)
-- Defaults to 'CEO' matching current hardcoded behavior

CREATE TYPE user_role AS ENUM ('CEO', 'DRH', 'DSI');

ALTER TABLE user_settings
  ADD COLUMN user_role user_role NOT NULL DEFAULT 'CEO';
