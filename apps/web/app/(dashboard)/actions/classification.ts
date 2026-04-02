'use server'

import { createClient } from '@/lib/supabase/server'
import { reclassifyParamsSchema } from '@kyrra/shared'
import { ERROR_CODES } from '@kyrra/shared'
import type { ActionResult } from '@kyrra/shared'

/**
 * Reclassify an email — user says "this is not prospecting"
 * 1. Insert new classification (append-only — ADR-003)
 * 2. Queue reclassification_request for worker (Gmail label update <10s)
 * 3. Auto-whitelist (FR28): handled client-side by ReclassifyButton calling addToWhitelist()
 *    in parallel. Server-side would require Gmail API call to extract sender email
 *    (email_classifications only stores sender_display name, not email address).
 *    Current pattern works for beta — revisit for server-side atomicity in V2.
 */
export async function reclassifyEmail(params: unknown): Promise<ActionResult> {
  const parsed = reclassifyParamsSchema.safeParse(params)
  if (!parsed.success) {
    return { data: null, error: { code: ERROR_CODES.VALIDATION, message: parsed.error.message } }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

  // Find user's top label (position 0 = "Important" / most visible)
  const { data: topLabel, error: labelError } = await supabase
    .from('user_labels')
    .select('id')
    .eq('user_id', user.id)
    .order('position', { ascending: true })
    .limit(1)
    .single()

  if (labelError || !topLabel) {
    return { data: null, error: { code: ERROR_CODES.INTERNAL, message: 'Labels not configured' } }
  }

  // Insert reclassification as new classification (append-only — ADR-003)
  const { error } = await supabase.from('email_classifications').insert({
    user_id: user.id,
    gmail_message_id: parsed.data.gmail_message_id,
    classification_result: 'A_VOIR', // Legacy compat — derived from position 0
    label_id: topLabel.id,
    confidence_score: 1.0, // User decision = 100% confidence
    summary: 'Reclassifié par l\'utilisateur',
    source: 'fingerprint', // Manual reclassification logged as fingerprint source
    idempotency_key: parsed.data.idempotency_key,
  })

  if (error) {
    if (error.code === '23505') { // Unique violation — already reclassified
      return { data: null, error: null } // Idempotent — treat as success
    }
    return { data: null, error: { code: ERROR_CODES.INTERNAL, message: error.message } }
  }

  // Queue reclassification for worker (Gmail label update <10s — FR43)
  await supabase.from('reclassification_requests').insert({
    user_id: user.id,
    email_id: parsed.data.gmail_message_id,
    source: 'dashboard',
  })

  return { data: null, error: null }
}
