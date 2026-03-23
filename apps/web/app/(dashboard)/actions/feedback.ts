'use server'

import { createClient } from '@/lib/supabase/server'
import { feedbackParamsSchema, ERROR_CODES } from '@kyrra/shared'
import type { ActionResult } from '@kyrra/shared'
import { addToWhitelist } from './whitelist'

/**
 * Submit classification feedback (FR46 — Trust & Feedback Loop)
 * If reason is 'whitelist_sender', auto-adds to whitelist
 * Architecture ref: Server Actions — params: unknown + ActionResult<T>
 */
export async function submitFeedback(params: unknown): Promise<ActionResult> {
  const parsed = feedbackParamsSchema.safeParse(params)
  if (!parsed.success) {
    return { data: null, error: { code: ERROR_CODES.VALIDATION, message: parsed.error.message } }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

  // Insert feedback
  const { error } = await supabase.from('classification_feedback').insert({
    user_id: user.id,
    gmail_message_id: parsed.data.gmail_message_id,
    reason: parsed.data.reason,
  })

  if (error) {
    if (error.code === '23505') {
      // Already submitted feedback for this message — idempotent success
      return { data: null, error: null }
    }
    return { data: null, error: { code: ERROR_CODES.INTERNAL, message: error.message } }
  }

  // Auto-whitelist if requested — need the sender's email from the classification
  if (parsed.data.reason === 'whitelist_sender') {
    // Fetch the sender from the original classification metadata
    const { data: classification } = await supabase
      .from('email_classifications')
      .select('summary')
      .eq('user_id', user.id)
      .eq('gmail_message_id', parsed.data.gmail_message_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Queue a reclassification request so the worker can resolve the sender
    // and add to whitelist via the worker pipeline (worker has Gmail access)
    await supabase.from('reclassification_requests').insert({
      user_id: user.id,
      email_id: parsed.data.gmail_message_id,
      source: 'feedback_whitelist',
    })
  }

  // Acknowledge any label_change_signals for this message
  await supabase
    .from('label_change_signals')
    .update({ acknowledged: true })
    .eq('user_id', user.id)
    .eq('gmail_message_id', parsed.data.gmail_message_id)

  return { data: null, error: null }
}

/**
 * Acknowledge label change signals (dismiss the learn banner)
 */
export async function acknowledgeLabelSignals(params: unknown): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

  const { error } = await supabase
    .from('label_change_signals')
    .update({ acknowledged: true })
    .eq('user_id', user.id)
    .eq('acknowledged', false)

  if (error) {
    return { data: null, error: { code: ERROR_CODES.INTERNAL, message: error.message } }
  }

  return { data: null, error: null }
}
