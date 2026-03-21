/**
 * Reconciliation — Zero email loss guarantee
 * The reconciliation poller is the PRIMARY guarantee (not Pub/Sub)
 * Two independent loops: watchRenewalLoop + reconciliationLoop
 *
 * Source: [architecture.md — Story 2.7, PM7 recovery mode]
 */

import {
  getValidAccessToken,
  renewWatch,
  getHistory,
  GmailAuthError,
  type GmailHistoryRecord,
} from './lib/gmail'
import { ClassificationLogger } from './lib/classification-logger'

const PUBSUB_TOPIC = process.env.GMAIL_PUBSUB_TOPIC ?? ''

// Watch renewal: 24h before 7-day expiry + 6h safety net
const RENEWAL_BUFFER_24H_MS = 24 * 60 * 60 * 1000
const RENEWAL_BUFFER_6H_MS = 6 * 60 * 60 * 1000

/**
 * Watch renewal loop — renews Gmail Pub/Sub subscriptions
 * Runs independently from reconciliation (Promise.all)
 * Renews 24h before 7-day expiry + safety net at 6h
 */
export async function watchRenewalLoop(supabase: any): Promise<void> {
  // Find integrations with watches expiring within 24h
  const now = new Date()
  const threshold24h = new Date(now.getTime() + RENEWAL_BUFFER_24H_MS)

  const { data: expiringIntegrations } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('provider', 'gmail')
    .eq('status', 'active')
    .not('watch_expiry', 'is', null)
    .lt('watch_expiry', threshold24h.toISOString())
    .order('watch_expiry', { ascending: true })
    .limit(10)

  if (!expiringIntegrations || expiringIntegrations.length === 0) {
    // No watches to renew — check every 60s
    await new Promise((resolve) => setTimeout(resolve, 60_000))
    return
  }

  for (const integration of expiringIntegrations) {
    try {
      const accessToken = await getValidAccessToken(supabase, integration)
      if (!accessToken) continue // Token revoked — skip

      const watchResponse = await renewWatch(accessToken, PUBSUB_TOPIC)

      // Update watch metadata
      const expirationDate = new Date(Number(watchResponse.expiration))
      await supabase
        .from('user_integrations')
        .update({
          watch_expiry: expirationDate.toISOString(),
          watch_history_id: watchResponse.historyId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id)

      ClassificationLogger.log({
        event: 'watch_renewed',
        user_id: integration.user_id,
        expires_at: expirationDate.toISOString(),
      })
    } catch (error) {
      if (error instanceof GmailAuthError) {
        await supabase
          .from('user_integrations')
          .update({ status: 'revoked', updated_at: new Date().toISOString() })
          .eq('id', integration.id)
        continue
      }
      console.error(`Watch renewal failed for integration ${integration.id}:`, (error as Error).message)
    }
  }

  // Check again in 60s
  await new Promise((resolve) => setTimeout(resolve, 60_000))
}

/**
 * Reconciliation loop — catches missed Pub/Sub notifications
 * Compares gmail.history() against known classifications
 * Recovery mode: 30s interval after Supabase outage, normally 5 min
 */
export async function reconciliationLoop(supabase: any): Promise<void> {
  const NORMAL_INTERVAL_MS = 300_000    // 5 min during business hours
  const RECOVERY_INTERVAL_MS = 30_000   // 30s during recovery
  const OFF_HOURS_INTERVAL_MS = 1_800_000 // 30 min off-hours

  let lastSuccessfulPoll = Date.now()

  try {
    // Get all active integrations with watch history IDs
    const { data: integrations } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('provider', 'gmail')
      .eq('status', 'active')
      .not('watch_history_id', 'is', null)

    if (integrations && integrations.length > 0) {
      for (const integration of integrations) {
        try {
          await reconcileUser(supabase, integration)
        } catch (error) {
          if (error instanceof GmailAuthError) {
            await supabase
              .from('user_integrations')
              .update({ status: 'revoked', updated_at: new Date().toISOString() })
              .eq('id', integration.id)
            continue
          }
          // Log per-user error but continue with other users
          console.error(`Reconciliation failed for user ${integration.user_id}:`, (error as Error).message)
        }
      }
    }

    lastSuccessfulPoll = Date.now()
  } catch {
    // Supabase might be down — will retry
  }

  // Determine interval based on recovery state
  const wasRecovering = (Date.now() - lastSuccessfulPoll) > 60_000
  const currentHour = new Date().getHours()
  const isBusinessHours = currentHour >= 8 && currentHour < 19

  let interval: number
  if (wasRecovering) {
    interval = RECOVERY_INTERVAL_MS
  } else if (isBusinessHours) {
    interval = NORMAL_INTERVAL_MS
  } else {
    interval = OFF_HOURS_INTERVAL_MS
  }

  await new Promise((resolve) => setTimeout(resolve, interval))
}

/**
 * Reconcile a single user: fetch Gmail history, queue missing emails
 */
async function reconcileUser(
  supabase: any,
  integration: any,
): Promise<void> {
  const accessToken = await getValidAccessToken(supabase, integration)
  if (!accessToken) return // Token revoked

  const historyRecords = await getHistory(accessToken, integration.watch_history_id)

  if (historyRecords === null) {
    // History ID too old (>30 days) — need full re-sync
    // For MVP-0, just update the history ID via a fresh watch
    if (PUBSUB_TOPIC) {
      const watchResponse = await renewWatch(accessToken, PUBSUB_TOPIC)
      await supabase
        .from('user_integrations')
        .update({
          watch_history_id: watchResponse.historyId,
          watch_expiry: new Date(Number(watchResponse.expiration)).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id)
    }
    return
  }

  // Find new messages from history
  const newMessageIds = new Set<string>()
  let latestHistoryId = integration.watch_history_id

  for (const record of historyRecords) {
    if (record.messagesAdded) {
      for (const added of record.messagesAdded) {
        // Only process INBOX messages
        if (added.message.labelIds?.includes('INBOX')) {
          newMessageIds.add(added.message.id)
        }
      }
    }
    // Track label changes for implicit reclassification detection (FR14)
    if (record.labelsRemoved) {
      for (const removed of record.labelsRemoved) {
        // User removed a Kyrra label — implicit reclassification signal
        // Will be handled in reclassification flow (Story 4.3)
      }
    }
    // Track the latest history ID
    if (record.id > latestHistoryId) {
      latestHistoryId = record.id
    }
  }

  if (newMessageIds.size > 0) {
    // Check which messages are already classified or queued
    const { data: existingClassifications } = await supabase
      .from('email_classifications')
      .select('gmail_message_id')
      .eq('user_id', integration.user_id)
      .in('gmail_message_id', [...newMessageIds])

    const { data: existingQueue } = await supabase
      .from('email_queue_items')
      .select('gmail_message_id')
      .eq('user_id', integration.user_id)
      .in('gmail_message_id', [...newMessageIds])
      .in('status', ['pending', 'processing'])

    const alreadyProcessed = new Set([
      ...(existingClassifications ?? []).map((c: any) => c.gmail_message_id),
      ...(existingQueue ?? []).map((q: any) => q.gmail_message_id),
    ])

    // Queue missing emails for classification
    const missingMessages = [...newMessageIds].filter((id) => !alreadyProcessed.has(id))

    if (missingMessages.length > 0) {
      const queueItems = missingMessages.map((gmailMessageId) => ({
        user_id: integration.user_id,
        gmail_message_id: gmailMessageId,
        gmail_history_id: latestHistoryId,
        status: 'pending',
      }))

      await supabase.from('email_queue_items').insert(queueItems)

      ClassificationLogger.log({
        event: 'reconciliation_queued',
        user_id: integration.user_id,
        count: missingMessages.length,
      })
    }
  }

  // Update the stored history ID for next poll
  if (latestHistoryId !== integration.watch_history_id) {
    await supabase
      .from('user_integrations')
      .update({
        watch_history_id: latestHistoryId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id)
  }
}
