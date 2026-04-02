import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScanProgressClient from './ScanProgressClient'

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default async function ScanProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check onboarding state
  const { data: scan } = await supabase
    .from('onboarding_scans')
    .select('status, labels_configured')
    .eq('user_id', user.id)
    .maybeSingle()

  // Guard: scan not completed → go back to whitelist scan
  if (!scan || scan.status !== 'completed') {
    redirect('/onboarding-progress')
  }

  // Guard: labels not configured → go back to label config
  if (!scan.labels_configured) {
    redirect('/configure-labels')
  }

  // [M3 fix] Wait for worker to queue emails — retry up to 5 times (10s total)
  // The inboxScanLoop runs asynchronously after labels_configured is set.
  // There's a race window where the user lands here before emails are queued.
  let queueCount = 0
  for (let attempt = 0; attempt < 5; attempt++) {
    const { count } = await supabase
      .from('email_queue_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('gmail_history_id', 'initial_scan')

    queueCount = count ?? 0
    if (queueCount > 0) break

    // Check if classifications already exist (scan already completed previously)
    const { count: classCount } = await supabase
      .from('email_classifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (classCount && classCount > 0) {
      redirect('/dashboard')
    }

    // Wait 2s before retrying
    if (attempt < 4) await sleep(2000)
  }

  // After retries, if still no queue items → dashboard (worker may have no emails to process)
  if (queueCount === 0) {
    redirect('/dashboard')
  }

  return <ScanProgressClient totalQueued={queueCount} />
}
