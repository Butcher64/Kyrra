/**
 * Kyrra Recap — Daily email generation + delivery
 * The Recap IS the mobile product (Principle 7)
 *
 * Source: [architecture.md — Epic 5, ux-design-specification.md — Recap structure]
 */

/**
 * Recap cron loop — generates and sends daily Recaps
 * Runs after classification data is available (typically 7:00 AM user local time)
 */
export async function recapCronLoop(supabase: any): Promise<void> {
  // TODO: Full implementation in dedicated story
  // Flow:
  // 1. Pre-aggregate stats nightly (NFR-PERF-12: all Recaps within 15 min)
  // 2. For each active Pro/Trial user:
  //    a. Generate Recap HTML from template (RecapEmailTemplate)
  //    b. Include: reassurance → hero stat → À voir summaries → cumulative stats
  //    c. Include: recap_tokens for in-email reclassification (FR85)
  //    d. Send via Postmark from recap.kyrra.io
  // 3. Monthly report on first of month (FR52)
  // 4. cleanupExpiredTokens() after generation (RGPD Art.5.1.e)

  await new Promise((resolve) => setTimeout(resolve, 3_600_000)) // Check every hour
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
    console.log(JSON.stringify({
      event: 'recap_tokens_cleanup',
      deleted_count: count,
    }))
  }
}
