/**
 * Kyrra Recap — Daily email generation + delivery
 * The Recap IS the mobile product (Principle 7)
 *
 * Source: [architecture.md — Epic 5, ux-design-specification.md — Recap structure]
 */

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
  // 1. Get all active Pro/Trial users who should receive Recap today
  const { data: users } = await supabase
    .from('users')
    .select('id, email, display_name, created_at')
    .in('subscription_tier', ['pro', 'team', 'trial'])
    .eq('recap_enabled', true)

  if (!users || users.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 3_600_000))
    return
  }

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
  // Fetch today's filtered count
  const { count: filteredCount } = await supabase
    .from('email_classifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', `${today}T00:00:00Z`)

  const filtered = filteredCount ?? 0

  // Fetch "À voir" emails with summaries
  const { data: aVoirEmails } = await supabase
    .from('email_classifications')
    .select('gmail_message_id, summary, confidence_score')
    .eq('user_id', user.id)
    .eq('classification_result', 'A_VOIR')
    .gte('created_at', `${today}T00:00:00Z`)
    .order('created_at', { ascending: false })
    .limit(5)

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

  const recapData: RecapEmailData = {
    userName: user.display_name || user.email.split('@')[0] || 'Utilisateur',
    date: dateFormatted,
    filteredCount: filtered,
    timeSavedMinutes: Math.round(filtered * MINUTES_PER_EMAIL),
    aVoirEmails: (aVoirEmails ?? []).map((e: any) => ({
      summary: e.summary ?? 'Email nécessitant votre attention',
      gmailMessageId: e.gmail_message_id,
      confidenceScore: e.confidence_score,
    })),
    cumulativeStats: {
      totalFiltered: totalFilteredCount,
      totalTimeSavedHours,
      estimatedValue,
      daysSinceSignup,
    },
    referralUrl: `${APP_URL}/referral`,
    settingsUrl: `${APP_URL}/settings`,
    unsubscribeUrl: `${APP_URL}/settings#recap`,
  }

  const htmlBody = generateRecapEmailHtml(recapData)
  const subject = generateRecapSubject(filtered, (aVoirEmails ?? []).length)

  // Send via Postmark
  await sendViaPostmark(user.email, subject, htmlBody)

  ClassificationLogger.log({
    event: 'recap_sent',
    user_id: user.id,
    filtered_count: filtered,
    a_voir_count: (aVoirEmails ?? []).length,
  })
}

/**
 * Send email via Postmark API
 * Uses direct fetch — no extra dependency needed
 */
async function sendViaPostmark(
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

/**
 * Format date in French for Recap header
 */
function formatFrenchDate(date: Date): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ]
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`
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
