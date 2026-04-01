-- Migration: Add user profile fields for AI-powered classification
-- Date: 2026-04-01
-- Purpose: Collect user context (sector, prospection preferences) to improve classification accuracy

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS sector TEXT DEFAULT '';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS company_description TEXT DEFAULT '';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS prospection_utile TEXT DEFAULT '';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS prospection_non_sollicitee TEXT DEFAULT '';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS interests TEXT DEFAULT '';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS profile_configured BOOLEAN NOT NULL DEFAULT false;
