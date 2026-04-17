#!/usr/bin/env node
/**
 * One-shot: bootstrap watch_history_id for a user whose worker
 * reconciliation bootstrap isn't firing in prod.
 *
 * Decrypts refresh_token, refreshes access_token with Google, calls
 * gmail.users.getProfile, writes historyId back to user_integrations.
 *
 * Usage:
 *   ENCRYPTION_KEY=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_URL=... \
 *   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
 *   node scripts/bootstrap-history-id.mjs <user_id>
 */

import { createDecipheriv } from 'node:crypto'

async function supaGet(url, path, serviceKey) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  })
  if (!res.ok) throw new Error(`supa get ${path} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function supaPatch(url, path, serviceKey, body) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`supa patch ${path} failed: ${res.status} ${await res.text()}`)
}

const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const ALGORITHM = 'aes-256-gcm'

function decrypt(encryptedBase64, keyBase64) {
  const key = Buffer.from(keyBase64, 'base64')
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes')
  const packed = Buffer.from(encryptedBase64, 'base64')
  const iv = packed.subarray(0, IV_LENGTH)
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

async function main() {
  const userId = process.argv[2]
  if (!userId) throw new Error('usage: bootstrap-history-id.mjs <user_id>')

  const { ENCRYPTION_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env
  for (const [k, v] of Object.entries({ ENCRYPTION_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET })) {
    if (!v) throw new Error(`missing env: ${k}`)
  }

  const rows = await supaGet(
    SUPABASE_URL,
    `user_integrations?user_id=eq.${userId}&provider=eq.gmail&select=*`,
    SUPABASE_SERVICE_ROLE_KEY,
  )
  const integration = rows[0]
  if (!integration) throw new Error(`integration not found for user ${userId}`)

  console.log(`[bootstrap] integration found (status=${integration.status}, expires_at=${integration.expires_at})`)

  const refreshToken = decrypt(integration.refresh_token, ENCRYPTION_KEY)
  console.log(`[bootstrap] refresh_token decrypted (length=${refreshToken.length})`)

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenRes.ok) {
    const body = await tokenRes.text()
    throw new Error(`token refresh failed: ${tokenRes.status} ${body}`)
  }

  const tokenData = await tokenRes.json()
  console.log(`[bootstrap] access_token refreshed (expires_in=${tokenData.expires_in}s)`)

  const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  if (!profileRes.ok) {
    const body = await profileRes.text()
    throw new Error(`getProfile failed: ${profileRes.status} ${body}`)
  }

  const profile = await profileRes.json()
  console.log(`[bootstrap] profile: emailAddress=${profile.emailAddress}, historyId=${profile.historyId}`)

  await supaPatch(
    SUPABASE_URL,
    `user_integrations?id=eq.${integration.id}`,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      watch_history_id: profile.historyId,
      updated_at: new Date().toISOString(),
    },
  )

  console.log(`[bootstrap] SUCCESS — watch_history_id=${profile.historyId} persisted for user ${userId}`)
}

main().catch((err) => {
  console.error(`[bootstrap] FAILED:`, err.message)
  process.exit(1)
})
