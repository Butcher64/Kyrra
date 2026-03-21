'use server'

import { createClient } from '@/lib/supabase/server'
import { updateExposureModeSchema, updateNotificationsSchema, ERROR_CODES } from '@kyrra/shared'
import type { ActionResult } from '@kyrra/shared'

/**
 * Update the user's exposure mode (strict / normal / permissive)
 * Architecture ref: Server Actions — params: unknown + ActionResult<T>
 */
export async function updateExposureMode(params: unknown): Promise<ActionResult> {
  const parsed = updateExposureModeSchema.safeParse(params)
  if (!parsed.success) {
    return { data: null, error: { code: ERROR_CODES.VALIDATION, message: parsed.error.message } }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

  const { error } = await supabase
    .from('user_settings')
    .update({
      exposure_mode: parsed.data.exposure_mode,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) {
    return { data: null, error: { code: ERROR_CODES.INTERNAL, message: error.message } }
  }

  return { data: null, error: null }
}

/**
 * Update notification preferences (notifications_enabled, recap_enabled, recap_time)
 * Architecture ref: Server Actions — params: unknown + ActionResult<T>
 */
export async function updateNotifications(params: unknown): Promise<ActionResult> {
  const parsed = updateNotificationsSchema.safeParse(params)
  if (!parsed.success) {
    return { data: null, error: { code: ERROR_CODES.VALIDATION, message: parsed.error.message } }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

  const updateData: Record<string, unknown> = {
    notifications_enabled: parsed.data.notifications_enabled,
    updated_at: new Date().toISOString(),
  }

  if (parsed.data.recap_enabled !== undefined) {
    updateData.recap_enabled = parsed.data.recap_enabled
  }
  if (parsed.data.recap_time_utc !== undefined) {
    updateData.recap_time_utc = parsed.data.recap_time_utc
  }

  const { error } = await supabase
    .from('user_settings')
    .update(updateData)
    .eq('user_id', user.id)

  if (error) {
    return { data: null, error: { code: ERROR_CODES.INTERNAL, message: error.message } }
  }

  return { data: null, error: null }
}
