CREATE UNIQUE INDEX IF NOT EXISTS idx_user_integrations_user_provider
ON user_integrations(user_id, provider);
