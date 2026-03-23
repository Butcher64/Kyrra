'use server'

import { createClient } from '@/lib/supabase/server'
import { saveConsentSchema, ERROR_CODES } from '@kyrra/shared'
import type { ActionResult } from '@kyrra/shared'

export async function saveConsent(params: unknown): Promise<ActionResult> {
  const parsed = saveConsentSchema.safeParse(params)
  if (!parsed.success) {
    return { data: null, error: { code: ERROR_CODES.VALIDATION, message: parsed.error.message } }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

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
    return { data: null, error: { code: ERROR_CODES.INTERNAL, message: error.message } }
  }

  return { data: null, error: null }
}
