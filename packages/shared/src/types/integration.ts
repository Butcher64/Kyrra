// Zone 2 (application types): camelCase
// UserIntegration matches DB schema (Zone 1 snake_case in database.ts)
// PublicIntegration strips sensitive token fields for apps/web

export type UserIntegration = {
  id: string
  user_id: string
  provider: 'gmail' | 'outlook'
  email: string
  access_token: string
  refresh_token: string
  expires_at: Date
  scopes: string[]
  watch_expiry: Date | null
  watch_history_id: string | null
  status: 'active' | 'revoked' | 'expired'
}

// Tokens NEVER exposed to apps/web — IDOR protection
export type PublicIntegration = Omit<UserIntegration, 'access_token' | 'refresh_token'>
