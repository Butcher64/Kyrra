import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Gmail Pub/Sub Webhook Handler
 * Receives push notifications when new emails arrive
 * Uses SECURITY DEFINER function to insert queue items (zero SERVICE_ROLE_KEY)
 *
 * Security: Google JWT verification mandatory (FR11)
 * Rate limit: 100 req/min (NFR-SEC-11)
 *
 * Source: [architecture.md — API & Communication Patterns]
 */

// ANON_KEY only — queue insertion via SECURITY DEFINER function (migration 015)
function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const supabase = getAnonClient()

    // Use SECURITY DEFINER function — validates integration + inserts queue item
    // Zero SERVICE_ROLE_KEY in apps/web (architecture constraint F1)
    const { data, error } = await supabase.rpc('enqueue_gmail_notification', {
      p_email_address: emailAddress,
      p_history_id: historyId,
    })

    if (error) {
      console.error('Gmail webhook RPC error:', error.message)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }

    if (!data) {
      // Unknown email — ignore silently
      return NextResponse.json({ status: 'ignored' })
    }

    return NextResponse.json({ status: 'queued' })
  } catch (error) {
    console.error('Gmail webhook error:', (error as Error).message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
