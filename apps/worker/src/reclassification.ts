/**
 * Reclassification worker — processes reclassification_requests
 * Handles: dashboard button (source='dashboard') + token redemption (source='recap_token')
 * Updates Gmail labels within <10s (FR43)
 *
 * Source: [architecture.md — Epic 4, Story 4.1]
 */

import {
  getValidAccessToken,
  ensureLabels,
  applyLabel,
  removeAllKyrraLabels,
  GmailAuthError,
} from './lib/gmail'
import { ClassificationLogger } from './lib/classification-logger'

/**
 * Reclassification loop — processes pending reclassification requests
 * Polls reclassification_requests table for pending items
 */
export async function reclassificationLoop(supabase: any): Promise<void> {
  // Claim next pending request
  const { data: request } = await supabase
    .from('reclassification_requests')
    .update({
      status: 'processing',
    })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .select()
    .single()

  if (!request) {
    // No pending requests — sleep 1s
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return
  }

  try {
    // Get user's Gmail integration
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', request.user_id)
      .eq('provider', 'gmail')
      .eq('status', 'active')
      .single()

    if (!integration) {
      await supabase
        .from('reclassification_requests')
        .update({ status: 'failed', processed_at: new Date().toISOString() })
        .eq('id', request.id)
      return
    }

    const accessToken = await getValidAccessToken(supabase, integration)
    if (!accessToken) {
      await supabase
        .from('reclassification_requests')
        .update({ status: 'failed', processed_at: new Date().toISOString() })
        .eq('id', request.id)
      return
    }

    // Update Gmail label: remove existing Kyrra labels, apply A_VOIR
    const labelMap = await ensureLabels(accessToken)
    await applyLabel(accessToken, request.email_id, 'A_VOIR', labelMap)

    // Mark as done
    await supabase
      .from('reclassification_requests')
      .update({ status: 'done', processed_at: new Date().toISOString() })
      .eq('id', request.id)

    ClassificationLogger.log({
      event: 'reclassification_complete',
      email_id: request.email_id,
      user_id: request.user_id,
      source: request.source,
    })
  } catch (error) {
    if (error instanceof GmailAuthError) {
      await supabase
        .from('user_integrations')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('user_id', request.user_id)
        .eq('provider', 'gmail')
    }

    await supabase
      .from('reclassification_requests')
      .update({ status: 'failed', processed_at: new Date().toISOString() })
      .eq('id', request.id)

    console.error('Reclassification error:', (error as Error).message)
  }
}
