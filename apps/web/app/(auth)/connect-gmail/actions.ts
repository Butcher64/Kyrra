'use server'

import { createClient } from '@/lib/supabase/server'
import { saveConsentSchema, ERROR_CODES } from '@kyrra/shared'
import type { ActionResult } from '@kyrra/shared'

export async function saveConsent(params: unknown): Promise<ActionResult> {
  console.log('[SAVE_CONSENT] Called with params:', JSON.stringify(params))

  const parsed = saveConsentSchema.safeParse(params)
  if (!parsed.success) {
    console.error('[SAVE_CONSENT] Validation failed:', parsed.error.message)
    return { data: null, error: { code: ERROR_CODES.VALIDATION, message: parsed.error.message } }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.error('[SAVE_CONSENT] No authenticated user')
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

  console.log('[SAVE_CONSENT] User:', user.id.slice(0, 8), '— upserting user_settings')

  // Upsert: user_settings row may not exist yet at this point in the onboarding flow
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: user.id,
        consent_given: true,
        consent_at: new Date().toISOString(),
        recap_consent: parsed.data.recap_consent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (error) {
    console.error('[SAVE_CONSENT] Upsert FAILED:', error.message, error.code, error.details)
    return { data: null, error: { code: ERROR_CODES.INTERNAL, message: error.message } }
  }

  console.log('[SAVE_CONSENT] Success — consent saved for user:', user.id.slice(0, 8))
  return { data: null, error: null }
}
