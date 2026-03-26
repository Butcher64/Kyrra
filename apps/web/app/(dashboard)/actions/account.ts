'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'
import { ERROR_CODES } from '@kyrra/shared'
import type { ActionResult } from '@kyrra/shared'

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'

/**
 * FR84 — Clean uninstall: removes ALL Kyrra labels from Gmail
 * FR31 — Account deletion with ON DELETE CASCADE via SECURITY DEFINER
 *
 * Flow: 1) fetch integration → 2) deleteKyrraLabels → 3) stopWatch → 4) delete_user_account RPC → 5) redirect
 */
export async function deleteAccount(params: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

  // 1. Fetch the active Gmail integration
  const { data: integration } = await supabase
    .from('user_integrations')
    .select('id, access_token, refresh_token, expires_at')
    .eq('user_id', user.id)
    .eq('provider', 'gmail')
    .eq('status', 'active')
    .single()

  if (integration) {
    try {
      // Decrypt access token
      let accessToken = decrypt(integration.access_token)

      // Check if token needs refresh
      const expiresAt = new Date(integration.expires_at)
      if (expiresAt.getTime() - Date.now() < 60 * 60 * 1000) {
        const refreshed = await refreshGmailToken(decrypt(integration.refresh_token))
        if (refreshed) {
          accessToken = refreshed
        }
      }

      // 2. Delete Kyrra labels from Gmail (also removes them from all messages)
      await deleteKyrraLabelsFromGmail(accessToken)

      // 3. Stop Pub/Sub watch
      await stopGmailWatch(accessToken)

      // 4. Revoke OAuth token (FR84 — explicit revocation)
      await revokeGmailToken(accessToken)
    } catch {
      // Gmail cleanup failed — proceed with account deletion anyway
      // Labels will remain but are harmless without Kyrra
    }
  }

  // 5. Delete account via SECURITY DEFINER function (cascades all tables)
  const { error } = await supabase.rpc('delete_user_account', { p_user_id: user.id })

  if (error) {
    return { data: null, error: { code: ERROR_CODES.INTERNAL, message: error.message } }
  }

  // 6. Redirect to login with success message
  redirect('/login?uninstalled=true')
}

// ── Gmail helpers (inline — web app cannot import from worker) ──

async function refreshGmailToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) return null
  const data = await response.json()
  return data.access_token
}

async function deleteKyrraLabelsFromGmail(accessToken: string): Promise<void> {
  // List all labels and find Kyrra ones
  const response = await fetch(`${GMAIL_API_BASE}/labels`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) return

  const data = await response.json()
  const labels: Array<{ id: string; name: string }> = data.labels ?? []
  const kyrraLabels = labels.filter((l) => l.name.startsWith('Kyrra/'))

  // Delete each Kyrra label (Gmail auto-removes label from all messages)
  for (const label of kyrraLabels) {
    await fetch(`${GMAIL_API_BASE}/labels/${label.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  }
}

async function stopGmailWatch(accessToken: string): Promise<void> {
  await fetch(`${GMAIL_API_BASE}/stop`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

async function revokeGmailToken(accessToken: string): Promise<void> {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

export async function pauseClassification(params: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

  await supabase
    .from('user_pipeline_health')
    .update({ mode: 'paused', pause_reason: 'user_requested', updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return { data: null, error: null }
}

export async function resumeClassification(params: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

  await supabase
    .from('user_pipeline_health')
    .update({ mode: 'active', pause_reason: null, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return { data: null, error: null }
}
