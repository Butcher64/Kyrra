-- Migration: Add sender_display, subject_snippet, and 'prefilter' source to email_classifications
-- Date: 2026-04-01
-- Purpose: Persist email metadata for real-time scan page + fix source ENUM for prefilter path
-- Story: B2.6 — Real-time classification scan page

-- Add 'prefilter' to classification_source ENUM (was missing — only had 'fingerprint', 'llm')
ALTER TYPE classification_source ADD VALUE IF NOT EXISTS 'prefilter';

-- Add sender/subject columns for scan page and dashboard previews
ALTER TABLE email_classifications ADD COLUMN IF NOT EXISTS sender_display TEXT DEFAULT '';
ALTER TABLE email_classifications ADD COLUMN IF NOT EXISTS subject_snippet TEXT DEFAULT '';

-- Index on label_id for efficient JOIN in scan page polling (M1 code review finding)
CREATE INDEX IF NOT EXISTS idx_email_classifications_label_id ON email_classifications(label_id);
