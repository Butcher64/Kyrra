import { extractRecipients, buildWhitelistEntries, type ScanProgress } from './lib/whitelist-scan'
import { getValidAccessToken, listSentMessages, createWatch, listInboxMessageIds, GmailAuthError } from './lib/gmail'
import { sendViaPostmark } from './recap'
import {
  generateOnboardingEmailHtml,
  generateOnboardingSubject,
  type OnboardingEmailData,
} from './lib/onboarding-email-template'

const PUBSUB_TOPIC = process.env.GMAIL_PUBSUB_TOPIC ?? ''

/**
 * Onboarding scan loop — checks for pending scans and processes them
 * Called via resilientLoop in index.ts
 *
 * Flow:
 * 1. Check for pending onboarding_scans
 * 2. For each pending scan: fetch Gmail sent history (6 months)
 * 3. Extract recipients, hash addresses, store in whitelist_entries
 * 4. Update scan progress in real-time (for /onboarding-progress page polling)
 */
export async function onboardingScanLoop(supabase: any): Promise<void> {
  // Find pending scans
  const { data: pendingScans } = await supabase
    .from('onboarding_scans')
    .select('*')
    .eq('status', 'pending')
    .limit(1)

  if (!pendingScans || pendingScans.length === 0) {
    // No pending scans — sleep and retry
    await new Promise((resolve) => setTimeout(resolve, 5000))
    return
  }

  const scan = pendingScans[0]

  // Mark as scanning
  await supabase
    .from('onboarding_scans')
    .update({ status: 'scanning', started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', scan.id)

  try {
    // Get user's Gmail tokens
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', scan.user_id)
      .eq('provider', 'gmail')
      .eq('status', 'active')
      .single()

    if (!integration) {
      await supabase
        .from('onboarding_scans')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', scan.id)
      return
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, integration)
    if (!accessToken) {
      await supabase
        .from('onboarding_scans')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', scan.id)
      return
    }

    // Scan sent history from last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const progress: ScanProgress = {
      total_sent: 0,
      emails_processed: 0,
      contacts_found: 0,
      prospecting_found: 0,
    }

    const allRecipients: string[] = []

    const totalProcessed = await listSentMessages(
      accessToken,
      sixMonthsAgo,
      async (batch) => {
        const recipients = extractRecipients(batch)
        allRecipients.push(...recipients)

        progress.emails_processed += batch.length
        progress.total_sent += batch.length

        // Update progress in real-time (for /onboarding-progress page polling)
        await supabase
          .from('onboarding_scans')
          .update({
            emails_processed: progress.emails_processed,
            total_sent: progress.total_sent,
            contacts_found: new Set(allRecipients).size,
            updated_at: new Date().toISOString(),
          })
          .eq('id', scan.id)
      },
    )

    // Deduplicate and build whitelist entries
    const uniqueRecipients = [...new Set(allRecipients)]
    const whitelistEntries = buildWhitelistEntries(scan.user_id, uniqueRecipients)

    // Upsert whitelist entries (ignore duplicates)
    if (whitelistEntries.length > 0) {
      await supabase
        .from('whitelist_entries')
        .upsert(whitelistEntries, { onConflict: 'user_id,address_hash' })
    }

    progress.contacts_found = uniqueRecipients.length

    // Update final progress
    await supabase
      .from('onboarding_scans')
      .update({
        status: 'completed',
        ...progress,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', scan.id)

    console.log(`Onboarding scan completed for user ${scan.user_id}: ${uniqueRecipients.length} contacts`)

    // B4.2 — Send "Kyrra est actif" onboarding email after scan completion
    try {
      const onboardingData: OnboardingEmailData = {
        userName: integration.email?.split('@')[0] ?? 'Utilisateur',
        contactsFound: uniqueRecipients.length,
        emailsProcessed: totalProcessed,
      }
      const htmlBody = generateOnboardingEmailHtml(onboardingData)
      const subject = generateOnboardingSubject()
      await sendViaPostmark(integration.email, subject, htmlBody)
      console.log(`Onboarding email sent to ${integration.email}`)
    } catch (emailError) {
      // Non-fatal — scan is already completed, email is a bonus
      console.error('Onboarding email send failed:', (emailError as Error).message)
    }

    // Fix 2 — Create Gmail Watch for real-time Pub/Sub notifications
    if (PUBSUB_TOPIC) {
      try {
        const watchResponse = await createWatch(accessToken, PUBSUB_TOPIC)
        const expirationDate = new Date(Number(watchResponse.expiration))

        await supabase
          .from('user_integrations')
          .update({
            watch_history_id: watchResponse.historyId,
            watch_expiry: expirationDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', integration.id)

        console.log(`Gmail Watch created for user ${scan.user_id}, historyId=${watchResponse.historyId}, expires=${expirationDate.toISOString()}`)

        // Fix 3 — Initial inbox scan: queue last 100 emails for classification
        try {
          const inboxMessageIds = await listInboxMessageIds(accessToken, 100)

          if (inboxMessageIds.length > 0) {
            // Check which messages are already queued or classified
            const { data: existingQueue } = await supabase
              .from('email_queue_items')
              .select('gmail_message_id')
              .eq('user_id', scan.user_id)
              .in('gmail_message_id', inboxMessageIds)

            const { data: existingClassifications } = await supabase
              .from('email_classifications')
              .select('gmail_message_id')
              .eq('user_id', scan.user_id)
              .in('gmail_message_id', inboxMessageIds)

            const alreadyProcessed = new Set([
              ...(existingQueue ?? []).map((q: any) => q.gmail_message_id),
              ...(existingClassifications ?? []).map((c: any) => c.gmail_message_id),
            ])

            const newItems = inboxMessageIds
              .filter((id) => !alreadyProcessed.has(id))
              .map((gmailMessageId) => ({
                user_id: scan.user_id,
                gmail_message_id: gmailMessageId,
                gmail_history_id: watchResponse.historyId,
                status: 'pending' as const,
              }))

            if (newItems.length > 0) {
              await supabase.from('email_queue_items').insert(newItems)
              console.log(`Initial inbox scan: queued ${newItems.length} emails for classification (user ${scan.user_id})`)
            }
          }
        } catch (inboxError) {
          // Non-fatal — watch is already set up, reconciliation will catch these
          console.error('Initial inbox scan failed:', (inboxError as Error).message)
        }
      } catch (watchError) {
        // Non-fatal — reconciliation loop will retry watch creation
        console.error('Gmail Watch creation failed:', (watchError as Error).message)
      }
    } else {
      console.warn('GMAIL_PUBSUB_TOPIC not configured — skipping watch creation')
    }
  } catch (error) {
    if (error instanceof GmailAuthError) {
      await supabase
        .from('user_integrations')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('user_id', scan.user_id)
        .eq('provider', 'gmail')
    }
    console.error(`Onboarding scan failed for user ${scan.user_id}:`, (error as Error).message)
    await supabase
      .from('onboarding_scans')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', scan.id)
  }
}
