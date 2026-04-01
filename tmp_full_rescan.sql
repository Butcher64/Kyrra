BEGIN;

DELETE FROM whitelist_entries
WHERE user_id = '6096c16a-1897-4399-83ee-3335f74e1fd7';

DELETE FROM email_classifications
WHERE user_id = '6096c16a-1897-4399-83ee-3335f74e1fd7';

DELETE FROM email_queue_items
WHERE user_id = '6096c16a-1897-4399-83ee-3335f74e1fd7';

DELETE FROM llm_usage_logs
WHERE user_id = '6096c16a-1897-4399-83ee-3335f74e1fd7';

UPDATE onboarding_scans
SET status = 'pending',
    started_at = NULL,
    completed_at = NULL,
    emails_processed = 0,
    contacts_found = 0,
    total_sent = 0,
    updated_at = NOW()
WHERE user_id = '6096c16a-1897-4399-83ee-3335f74e1fd7';

COMMIT;
