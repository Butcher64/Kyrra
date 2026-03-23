/**
 * Monitoring Loop — Hourly health checks for Kyrra founders
 * Checks: revoked tokens, reclassification rate, reconciliation gap, LLM errors
 *
 * Source: [epics-beta.md — B5.2]
 */

const POSTMARK_API_URL = 'https://api.postmarkapp.com/email'
const POSTMARK_SERVER_TOKEN = process.env.POSTMARK_SERVER_TOKEN ?? ''
const MONITORING_FROM_EMAIL = process.env.RECAP_FROM_EMAIL ?? 'alerts@kyrra.io'
const ADMIN_EMAILS = (process.env.ADMIN_ALERT_EMAILS ?? '').split(',').filter(Boolean)

const ONE_HOUR_MS = 3_600_000

interface MonitoringAlert {
  check: string
  message: string
  severity: 'warning' | 'critical'
}

/**
 * Monitoring cron loop — runs every hour
 * Checks key health metrics and alerts founders via Postmark
 */
export async function monitoringLoop(supabase: any): Promise<void> {
  const alerts: MonitoringAlert[] = []

  // Check 1: Revoked tokens (user_integrations status=revoked)
  const revokedTokens = await checkRevokedTokens(supabase)
  if (revokedTokens.length > 0) {
    alerts.push({
      check: 'revoked_tokens',
      message: `${revokedTokens.length} user(s) with revoked Gmail tokens: ${revokedTokens.join(', ')}`,
      severity: 'critical',
    })
  }

  // Check 2: Reclassification rate >10% (over 24h)
  const reclassRate = await checkReclassificationRate(supabase)
  if (reclassRate !== null && reclassRate > 10) {
    alerts.push({
      check: 'high_reclassification_rate',
      message: `Reclassification rate is ${reclassRate.toFixed(1)}% over last 24h (threshold: 10%)`,
      severity: 'warning',
    })
  }

  // Check 3: Reconciliation gap >10 min
  const reconGaps = await checkReconciliationGap(supabase)
  if (reconGaps.length > 0) {
    alerts.push({
      check: 'reconciliation_gap',
      message: `${reconGaps.length} user(s) with reconciliation gap >10 min: ${reconGaps.join(', ')}`,
      severity: 'warning',
    })
  }

  // Check 4: LLM errors >5% (llm_metrics_hourly)
  const llmErrorRate = await checkLLMErrorRate(supabase)
  if (llmErrorRate !== null && llmErrorRate > 5) {
    alerts.push({
      check: 'high_llm_error_rate',
      message: `LLM error rate is ${llmErrorRate.toFixed(1)}% in last hour (threshold: 5%)`,
      severity: 'critical',
    })
  }

  // Send alerts if any
  if (alerts.length > 0) {
    await sendAlertEmail(alerts)
  }

  // Sleep 1 hour before next check
  await new Promise((resolve) => setTimeout(resolve, ONE_HOUR_MS))
}

// ── Individual checks ──

async function checkRevokedTokens(supabase: any): Promise<string[]> {
  const { data } = await supabase
    .from('user_integrations')
    .select('user_id')
    .eq('status', 'revoked')

  return (data ?? []).map((row: { user_id: string }) => row.user_id)
}

async function checkReclassificationRate(supabase: any): Promise<number | null> {
  const since = new Date(Date.now() - 24 * ONE_HOUR_MS).toISOString()

  const { count: totalCount } = await supabase
    .from('email_classifications')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since)

  if (!totalCount || totalCount === 0) return null

  const { count: reclassCount } = await supabase
    .from('classification_feedback')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since)

  if (reclassCount === null || reclassCount === undefined) return null

  return (reclassCount / totalCount) * 100
}

async function checkReconciliationGap(supabase: any): Promise<string[]> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString()

  const { data } = await supabase
    .from('user_pipeline_health')
    .select('user_id')
    .lt('last_classified_at', tenMinutesAgo)
    .eq('mode', 'active')

  return (data ?? []).map((row: { user_id: string }) => row.user_id)
}

async function checkLLMErrorRate(supabase: any): Promise<number | null> {
  const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS).toISOString()

  const { data } = await supabase
    .from('llm_metrics_hourly')
    .select('total_calls, error_count')
    .gte('hour', oneHourAgo)
    .order('hour', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data || !data.total_calls || data.total_calls === 0) return null

  return (data.error_count / data.total_calls) * 100
}

// ── Alert email ──

async function sendAlertEmail(alerts: MonitoringAlert[]): Promise<void> {
  if (!POSTMARK_SERVER_TOKEN || ADMIN_EMAILS.length === 0) {
    console.warn('[monitoring] Cannot send alerts: POSTMARK_SERVER_TOKEN or ADMIN_ALERT_EMAILS not configured')
    for (const alert of alerts) {
      console.error(`[monitoring] ALERT [${alert.severity}] ${alert.check}: ${alert.message}`)
    }
    return
  }

  const hasCritical = alerts.some((a) => a.severity === 'critical')
  const subject = hasCritical
    ? `[CRITICAL] Kyrra monitoring — ${alerts.length} alert(s)`
    : `[WARNING] Kyrra monitoring — ${alerts.length} alert(s)`

  const body = alerts
    .map((a) => `[${a.severity.toUpperCase()}] ${a.check}\n${a.message}`)
    .join('\n\n---\n\n')

  const htmlBody = `
    <div style="font-family: monospace; padding: 20px;">
      <h2>${subject}</h2>
      <p>Time: ${new Date().toISOString()}</p>
      <hr>
      ${alerts.map((a) => `
        <div style="margin: 16px 0; padding: 12px; background: ${a.severity === 'critical' ? '#fee2e2' : '#fef3c7'}; border-radius: 8px;">
          <strong>[${a.severity.toUpperCase()}] ${a.check}</strong>
          <p>${a.message}</p>
        </div>
      `).join('')}
    </div>
  `

  for (const adminEmail of ADMIN_EMAILS) {
    try {
      const response = await fetch(POSTMARK_API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN,
        },
        body: JSON.stringify({
          From: MONITORING_FROM_EMAIL,
          To: adminEmail,
          Subject: subject,
          TextBody: body,
          HtmlBody: htmlBody,
          MessageStream: 'outbound',
        }),
      })

      if (!response.ok) {
        console.error(`[monitoring] Postmark error for ${adminEmail}: ${response.status}`)
      }
    } catch (error) {
      console.error(`[monitoring] Failed to send alert to ${adminEmail}:`, error)
    }
  }
}
