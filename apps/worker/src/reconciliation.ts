/**
 * Reconciliation — Zero email loss guarantee
 * The reconciliation poller is the PRIMARY guarantee (not Pub/Sub)
 * Two independent loops: watchRenewalLoop + reconciliationLoop
 *
 * Source: [architecture.md — Story 2.7, PM7 recovery mode]
 */

let isShuttingDown = false

/**
 * Watch renewal loop — renews Gmail Pub/Sub subscriptions
 * Runs independently from reconciliation (Promise.all)
 * Renews 24h before 7-day expiry + safety net at 6h
 */
export async function watchRenewalLoop(supabase: any): Promise<void> {
  // TODO: Implement Gmail watch renewal
  // 1. Query user_integrations for watches expiring within 24h
  // 2. Renew via Gmail API: POST /gmail/v1/users/{userId}/watch
  // 3. Update watch_expiry and watch_history_id
  // 4. Second safety net: re-check at 6h before expiry

  await new Promise((resolve) => setTimeout(resolve, 60_000)) // Check every 60s
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
    // TODO: Implement Gmail history delta comparison
    // 1. For each active user integration:
    //    a. Fetch gmail.history() since last known history_id
    //    b. Compare against email_classifications
    //    c. Queue any missing emails for classification
    // 2. Detect user label changes (FR14) — implicit reclassification

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
