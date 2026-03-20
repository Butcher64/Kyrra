'use server'

import { createClient } from '@/lib/supabase/server'
import { ERROR_CODES } from '@kyrra/shared'
import type { ActionResult } from '@kyrra/shared'

/**
 * FR84 — Clean uninstall: removes ALL Kyrra labels from every email
 * FR31 — Account deletion with ON DELETE CASCADE
 */

export async function deleteAccount(params: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

  // TODO: Remove all Kyrra labels from Gmail (FR84)
  // This requires Gmail API access — iterate all labeled emails and remove labels

  // Delete account — ON DELETE CASCADE handles all tables
  const { error } = await supabase.auth.admin.deleteUser(user.id)

  if (error) {
    return { data: null, error: { code: ERROR_CODES.INTERNAL, message: error.message } }
  }

  return { data: null, error: null }
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
