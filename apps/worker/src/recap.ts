/**
 * Kyrra Recap — Daily email generation + delivery
 * The Recap IS the mobile product (Principle 7)
 *
 * Source: [architecture.md — Epic 5, ux-design-specification.md — Recap structure]
 */

import { randomBytes } from 'node:crypto'
import { ClassificationLogger } from './lib/classification-logger'
import {
  generateRecapEmailHtml,
  generateRecapSubject,
  type RecapEmailData,
} from './lib/recap-email-template'

const POSTMARK_API_URL = 'https://api.postmarkapp.com/email'
const POSTMARK_SERVER_TOKEN = process.env.POSTMARK_SERVER_TOKEN ?? ''
const RECAP_FROM_EMAIL = process.env.RECAP_FROM_EMAIL ?? 'recap@kyrra.io'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.kyrra.io'

// ~45 seconds per email processed in B2B context (source: PRD FR-PERF estimates)
const MINUTES_PER_EMAIL = 0.75

/**
 * Recap cron loop — generates and sends daily Recaps
 * Runs after classification data is available (typically 7:00 AM user local time)
 */
export async function recapCronLoop(supabase: any): Promise<void> {
  // NFR-PERF-12: all Recaps within 15 min
  // 1. Get all users who have recap_enabled in user_settings
  //    Join with user_integrations for email (no `users` table — Supabase Auth stores identity)
  const { data: settingsRows } = await supabase
    .from('user_settings')
    .select('user_id')
    .eq('recap_enabled', true)

  if (!settingsRows || settingsRows.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 3_600_000))
    return
  }

  // Fetch email + created_at from user_integrations for each user
  const userIds = settingsRows.map((r: { user_id: string }) => r.user_id)
  const { data: integrations } = await supabase
    .from('user_integrations')
    .select('user_id, email, created_at')
    .in('user_id', userIds)
    .eq('status', 'active')

  if (!integrations || integrations.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 3_600_000))
    return
  }

  // Deduplicate by user_id (one recap per user)
  const seenUsers = new Set<string>()
  const users = integrations.filter((i: { user_id: string }) => {
    if (seenUsers.has(i.user_id)) return false
    seenUsers.add(i.user_id)
    return true
  }).map((i: { user_id: string; email: string; created_at: string }) => ({
    id: i.user_id,
    email: i.email,
    display_name: i.email.split('@')[0] ?? 'Utilisateur',
    created_at: i.created_at,
  }))

  const today = new Date().toISOString().split('T')[0]!
  const dateFormatted = formatFrenchDate(new Date())

  for (const user of users) {
    try {
      await generateAndSendRecap(supabase, user, today, dateFormatted)
    } catch (error) {
      ClassificationLogger.log({
        event: 'recap_generation_failed',
        user_id: user.id,
        error: (error as Error).message,
      })
    }
  }

  // RGPD Art.5.1.e — cleanup expired tokens after generation
  await cleanupExpiredTokens(supabase)

  // Check again in 1 hour
  await new Promise((resolve) => setTimeout(resolve, 3_600_000))
}

/**
 * Generate and send a single user's Recap email
 */
async function generateAndSendRecap(
  supabase: any,
  user: { id: string; email: string; display_name: string; created_at: string },
  today: string,
  dateFormatted: string,
): Promise<void> {
  // Fetch user's labels to identify "À voir" bucket (position 0-2)
  const { data: userLabels } = await supabase
    .from('user_labels')
    .select('id, position')
    .eq('user_id', user.id)
    .lte('position', 2)

  const aVoirLabelIds = (userLabels ?? []).map((l: { id: string }) => l.id)

  // Fetch today's filtered count
  const { count: filteredCount } = await supabase
    .from('email_classifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', `${today}T00:00:00Z`)

  const filtered = filteredCount ?? 0

  // Fetch "À voir" emails with summaries (labels with position 0-2)
  const aVoirQuery = aVoirLabelIds.length > 0
    ? supabase
        .from('email_classifications')
        .select('gmail_message_id, summary, confidence_score')
        .eq('user_id', user.id)
        .in('label_id', aVoirLabelIds)
        .gte('created_at', `${today}T00:00:00Z`)
        .order('created_at', { ascending: false })
        .limit(5)
    : Promise.resolve({ data: [] })

  const { data: aVoirEmails } = await aVoirQuery

  // Generate recap tokens for each "À voir" email (FR85)
  const aVoirList = aVoirEmails ?? []
  const tokenMap = new Map<string, string>() // gmail_message_id → token URL

  for (const email of aVoirList) {
    const token = randomBytes(32).toString('hex')
    await supabase.from('recap_tokens').insert({
      user_id: user.id,
      token,
      email_id: email.gmail_message_id,
      recap_date: today,
    })
    tokenMap.set(email.gmail_message_id, `${APP_URL}/api/token/${token}`)
  }

  // Fetch cumulative stats
  const { count: totalFiltered } = await supabase
    .from('email_classifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const daysSinceSignup = Math.max(
    1,
    Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86_400_000),
  )

  const totalFilteredCount = totalFiltered ?? 0
  const totalTimeSavedHours = Math.round((totalFilteredCount * MINUTES_PER_EMAIL) / 60)
  // Value estimate: ~15 EUR/hour saved (CEO time value)
  const estimatedValue = totalTimeSavedHours * 15

  // Monthly stats — if today is the 1st, include last month's stats (FR52)
  const now = new Date()
  let monthlyStats: RecapEmailData['monthlyStats']
  if (now.getDate() === 1) {
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthLabel = `${FRENCH_MONTHS[lastMonthStart.getMonth()]} ${lastMonthStart.getFullYear()}`

    const { count: monthFiltered } = await supabase
      .from('email_classifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', lastMonthStart.toISOString())
      .lt('created_at', lastMonthEnd.toISOString())

    const monthAVoirQuery = aVoirLabelIds.length > 0
      ? supabase
          .from('email_classifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('label_id', aVoirLabelIds)
          .gte('created_at', lastMonthStart.toISOString())
          .lt('created_at', lastMonthEnd.toISOString())
      : Promise.resolve({ count: 0 })

    const { count: monthAVoir } = await monthAVoirQuery

    const mFiltered = monthFiltered ?? 0
    monthlyStats = {
      monthLabel: lastMonthLabel,
      totalFiltered: mFiltered,
      totalAVoir: monthAVoir ?? 0,
      timeSavedHours: Math.round((mFiltered * MINUTES_PER_EMAIL) / 60),
    }
  }

  const recapData: RecapEmailData = {
    userName: user.display_name || user.email.split('@')[0] || 'Utilisateur',
    date: dateFormatted,
    filteredCount: filtered,
    timeSavedMinutes: Math.round(filtered * MINUTES_PER_EMAIL),
    aVoirEmails: aVoirList.map((e: any) => ({
      summary: e.summary ?? 'Email nécessitant votre attention',
      gmailMessageId: e.gmail_message_id,
      confidenceScore: e.confidence_score,
      reclassifyTokenUrl: tokenMap.get(e.gmail_message_id),
    })),
    cumulativeStats: {
      totalFiltered: totalFilteredCount,
      totalTimeSavedHours,
      estimatedValue,
      daysSinceSignup,
    },
    monthlyStats,
    referralUrl: `${APP_URL}/referral`,
    settingsUrl: `${APP_URL}/settings`,
    unsubscribeUrl: `${APP_URL}/settings#recap`,
  }

  const htmlBody = generateRecapEmailHtml(recapData)
  const subject = generateRecapSubject(filtered, aVoirList.length)

  // Send via Postmark
  await sendViaPostmark(user.email, subject, htmlBody)

  ClassificationLogger.log({
    event: 'recap_sent',
    user_id: user.id,
    filtered_count: filtered,
    a_voir_count: aVoirList.length,
    tokens_created: aVoirList.length,
  })
}

/**
 * Send email via Postmark API
 * Uses direct fetch — no extra dependency needed
 * Exported for reuse by onboarding email (B4.2)
 */
export async function sendViaPostmark(
  to: string,
  subject: string,
  htmlBody: string,
): Promise<void> {
  if (!POSTMARK_SERVER_TOKEN) {
    ClassificationLogger.log({
      event: 'recap_send_skipped',
      reason: 'POSTMARK_SERVER_TOKEN not set',
    })
    return
  }

  const response = await fetch(POSTMARK_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN,
    },
    body: JSON.stringify({
      From: RECAP_FROM_EMAIL,
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      MessageStream: 'outbound',
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Postmark error ${response.status}: ${errorBody}`)
  }
}

const FRENCH_MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

/**
 * Format date in French for Recap header
 */
function formatFrenchDate(date: Date): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  return `${days[date.getDay()]} ${date.getDate()} ${FRENCH_MONTHS[date.getMonth()]}`
}

/**
 * Cleanup expired recap tokens — RGPD Art.5.1.e data minimization
 * Runs daily after Recap generation
 */
export async function cleanupExpiredTokens(supabase: any): Promise<void> {
  const { count } = await supabase
    .from('recap_tokens')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString())

  if (count && count > 0) {
    ClassificationLogger.log({
      event: 'recap_tokens_cleanup',
      deleted_count: count,
    })
  }
}
