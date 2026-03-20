import { extractRecipients, buildWhitelistEntries, type ScanProgress } from './lib/whitelist-scan'

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

    // TODO: Implement actual Gmail API sent history fetch
    // For now, mark as completed with zero results (Gmail API integration in Epic 2)
    // The actual Gmail API call will use:
    //   GET https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:sent&maxResults=500
    //   with access_token from integration
    //   Rate limited to 20 calls/sec

    const progress: ScanProgress = {
      total_sent: 0,
      emails_processed: 0,
      contacts_found: 0,
      prospecting_found: 0,
    }

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

    console.log(`Onboarding scan completed for user ${scan.user_id}`)
  } catch (error) {
    console.error(`Onboarding scan failed for user ${scan.user_id}:`, error)
    await supabase
      .from('onboarding_scans')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', scan.id)
  }
}
