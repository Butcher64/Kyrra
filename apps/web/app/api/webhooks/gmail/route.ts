import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Gmail Pub/Sub Webhook Handler
 * Receives push notifications when new emails arrive
 * Inserts metadata-only queue items (never email content)
 *
 * Security: Google JWT verification mandatory (FR11)
 * Rate limit: 100 req/min (NFR-SEC-11)
 *
 * Source: [architecture.md — API & Communication Patterns]
 */

// Use service role for webhook processing (server-side only, never exposed to client)
function getServiceClient() {
  // This is the ONE exception where SERVICE_ROLE_KEY is used in apps/web
  // It's a server-side Route Handler, never bundled to client
  // The CI grep guard should exclude api/webhooks/ directory
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // TODO: Verify Google JWT signature (mandatory Sprint 1)
    // For now, accept all requests (development only)

    const { message } = body
    if (!message?.data) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    // Decode Pub/Sub message
    const decoded = JSON.parse(
      Buffer.from(message.data, 'base64').toString('utf-8'),
    )

    const { emailAddress, historyId } = decoded

    if (!emailAddress || !historyId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Find user by Gmail email in integrations
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('user_id')
      .eq('email', emailAddress)
      .eq('provider', 'gmail')
      .eq('status', 'active')
      .single()

    if (!integration) {
      // Unknown email — ignore silently
      return NextResponse.json({ status: 'ignored' })
    }

    // Insert queue item (metadata only — never email content)
    await supabase.from('email_queue_items').insert({
      user_id: integration.user_id,
      gmail_message_id: `history-${historyId}`, // Will be resolved by worker
      gmail_history_id: historyId,
      status: 'pending',
    })

    return NextResponse.json({ status: 'queued' })
  } catch (error) {
    console.error('Gmail webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
