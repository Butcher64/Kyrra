-- 017_convert_text_to_enums.sql
-- Convert TEXT + CHECK columns to PostgreSQL native ENUMs (Enforcement Rule F7)
-- This ensures supabase gen types produces TypeScript union types, not string

-- Step 1: Create new ENUM types
CREATE TYPE integration_provider AS ENUM ('gmail', 'outlook');
CREATE TYPE integration_status AS ENUM ('active', 'revoked', 'expired');
CREATE TYPE classification_source AS ENUM ('fingerprint', 'llm');
CREATE TYPE pipeline_mode AS ENUM ('active', 'paused', 'polling');
CREATE TYPE whitelist_source AS ENUM ('scan', 'reclassification', 'manual');
CREATE TYPE onboarding_status AS ENUM ('pending', 'scanning', 'completed', 'failed');

-- Step 2: Drop CHECK constraints, alter columns to use ENUMs
-- user_integrations.provider
ALTER TABLE user_integrations
  DROP CONSTRAINT IF EXISTS user_integrations_provider_check,
  ALTER COLUMN provider DROP DEFAULT,
  ALTER COLUMN provider TYPE integration_provider USING provider::integration_provider,
  ALTER COLUMN provider SET DEFAULT 'gmail';

-- user_integrations.status
ALTER TABLE user_integrations
  DROP CONSTRAINT IF EXISTS user_integrations_status_check,
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE integration_status USING status::integration_status,
  ALTER COLUMN status SET DEFAULT 'active';

-- email_classifications.source
ALTER TABLE email_classifications
  DROP CONSTRAINT IF EXISTS email_classifications_source_check,
  ALTER COLUMN source DROP DEFAULT,
  ALTER COLUMN source TYPE classification_source USING source::classification_source,
  ALTER COLUMN source SET DEFAULT 'fingerprint';

-- user_pipeline_health.mode
ALTER TABLE user_pipeline_health
  DROP CONSTRAINT IF EXISTS user_pipeline_health_mode_check,
  ALTER COLUMN mode DROP DEFAULT,
  ALTER COLUMN mode TYPE pipeline_mode USING mode::pipeline_mode,
  ALTER COLUMN mode SET DEFAULT 'active';

-- whitelist_entries.source
ALTER TABLE whitelist_entries
  DROP CONSTRAINT IF EXISTS whitelist_entries_source_check,
  ALTER COLUMN source DROP DEFAULT,
  ALTER COLUMN source TYPE whitelist_source USING source::whitelist_source,
  ALTER COLUMN source SET DEFAULT 'scan';

-- onboarding_scans.status
ALTER TABLE onboarding_scans
  DROP CONSTRAINT IF EXISTS onboarding_scans_status_check,
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE onboarding_status USING status::onboarding_status,
  ALTER COLUMN status SET DEFAULT 'pending';
