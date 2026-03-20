import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * FR85 Token Redemption — Zero-auth endpoint
 * Uses ANON_KEY + special RLS (anonymous SELECT + UPDATE on recap_tokens)
 * NEVER uses SERVICE_ROLE_KEY — architecture constraint F1
 *
 * Flow: lookup token → mark used → insert reclassification_request → redirect
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const { origin } = new URL(request.url)
  const supabase = await createClient()

  // 1. Lookup token (RLS: anonymous SELECT allowed — token is 32-byte hex, unguessable)
  const { data: recapToken } = await supabase
    .from('recap_tokens')
    .select('id, user_id, email_id')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!recapToken) {
    return NextResponse.redirect(`${origin}/token-expired`)
  }

  // 2. Mark as used atomically (RLS: UPDATE only if used_at IS NULL)
  const { error } = await supabase
    .from('recap_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', recapToken.id)
    .is('used_at', null) // Atomic — prevents double redemption

  if (error) {
    return NextResponse.redirect(`${origin}/token-expired`)
  }

  // 3. Queue reclassification for worker (apps/worker processes via SERVICE_ROLE_KEY)
  await supabase.from('reclassification_requests').insert({
    user_id: recapToken.user_id,
    email_id: recapToken.email_id,
    source: 'recap_token',
    token_id: recapToken.id,
  })

  return NextResponse.redirect(
    `${origin}/reclassification-pending?request_id=${recapToken.id}`,
  )
}
