'use server'

import { createClient } from '@/lib/supabase/server'
import { whitelistParamsSchema, removeWhitelistParamsSchema, ERROR_CODES } from '@kyrra/shared'
import type { ActionResult } from '@kyrra/shared'

/**
 * Add a sender to the user's whitelist
 * Stores SHA-256 hashes of address and domain (never raw email)
 * Architecture ref: Server Actions — params: unknown + ActionResult<T>
 */
export async function addToWhitelist(params: unknown): Promise<ActionResult> {
  const parsed = whitelistParamsSchema.safeParse(params)
  if (!parsed.success) {
    return { data: null, error: { code: ERROR_CODES.VALIDATION, message: parsed.error.message } }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

  // Hash address and domain (SHA-256, non-reversible — RGPD compliant)
  const email = parsed.data.email_address.toLowerCase()
  const domain = email.split('@')[1]

  const encoder = new TextEncoder()
  const addressHash = Buffer.from(
    await crypto.subtle.digest('SHA-256', encoder.encode(email)),
  ).toString('hex')
  const domainHash = Buffer.from(
    await crypto.subtle.digest('SHA-256', encoder.encode(domain)),
  ).toString('hex')

  const { error } = await supabase.from('whitelist_entries').insert({
    user_id: user.id,
    address_hash: addressHash,
    domain_hash: domainHash,
    source: 'manual',
  })

  if (error) {
    if (error.code === '23505') {
      // Unique violation — already whitelisted, treat as success
      return { data: null, error: null }
    }
    return { data: null, error: { code: ERROR_CODES.INTERNAL, message: error.message } }
  }

  return { data: null, error: null }
}

/**
 * Remove a sender from the user's whitelist by address hash
 * Architecture ref: Server Actions — params: unknown + ActionResult<T>
 */
export async function removeFromWhitelist(params: unknown): Promise<ActionResult> {
  const parsed = removeWhitelistParamsSchema.safeParse(params)
  if (!parsed.success) {
    return { data: null, error: { code: ERROR_CODES.VALIDATION, message: parsed.error.message } }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Not authenticated' } }
  }

  // RLS ensures user can only delete own entries
  const { error } = await supabase
    .from('whitelist_entries')
    .delete()
    .eq('user_id', user.id)
    .eq('address_hash', parsed.data.address_hash)

  if (error) {
    return { data: null, error: { code: ERROR_CODES.INTERNAL, message: error.message } }
  }

  return { data: null, error: null }
}
