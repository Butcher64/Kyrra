import { SYSTEM_WHITELISTED_SENDERS, applyClassificationSafetyRules } from '@kyrra/shared'
import { claimNextJob, completeJob, failJob } from './lib/queue-consumer'
import { fingerprintEmail, type EmailHeaders } from './lib/fingerprinting'
import { classifyWithLLM, type EmailContent } from './lib/llm-gateway'
import { stripPIIFromSummary, sanitizeForLLM } from './lib/pii-stripper'
import { getValidAccessToken, fetchEmail, ensureLabels, applyLabel, GmailAuthError } from './lib/gmail'
import { ClassificationLogger } from './lib/classification-logger'
import { checkWhitelist } from './lib/whitelist-check'
import type { ClassificationResult } from '@kyrra/shared'

/**
 * Classification loop — processes emails from the queue
 * Flow: claimNextJob → fetch email → fingerprint → (optional LLM) → safety rules → save + label
 *
 * Source: [architecture.md — Epic 2, Story 2.5]
 */
export async function classificationLoop(supabase: any): Promise<void> {
  const job = await claimNextJob(supabase)

  if (!job) {
    // No pending jobs — sleep 1s and retry
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return
  }

  const startTime = Date.now()

  try {
    // Get user integration for Gmail API access
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', job.user_id)
      .eq('provider', 'gmail')
      .eq('status', 'active')
      .single()

    if (!integration) {
      await failJob(supabase, job.id, 'NO_ACTIVE_INTEGRATION', job.retry_count)
      return
    }

    // Get valid access token (proactive refresh 1h before expiry)
    const accessToken = await getValidAccessToken(supabase, integration)
    if (!accessToken) {
      // Token revoked (invalid_grant) — pipeline paused by getValidAccessToken
      await failJob(supabase, job.id, 'TOKEN_REVOKED', job.retry_count)
      return
    }

    // Fetch email from Gmail API (in-memory only, never persisted)
    const gmailEmail = await fetchEmail(accessToken, job.gmail_message_id)

    const emailHeaders: EmailHeaders = {
      from: gmailEmail.from,
      subject: gmailEmail.subject,
      headers: gmailEmail.headers,
    }

    // Check system whitelist (PM6 — skip @kyrra.io emails)
    const senderEmail = emailHeaders.from.toLowerCase()
    if (SYSTEM_WHITELISTED_SENDERS.some((addr: string) => senderEmail === addr)) {
      await completeJob(supabase, job.id)
      return // Skip classification — Kyrra's own emails
    }

    // Check user whitelist (SHA-256 hash comparison — B1.1)
    const whitelistMatch = await checkWhitelist(supabase, job.user_id, senderEmail)
    if (whitelistMatch === 'exact') {
      // Exact address match — skip classification entirely
      ClassificationLogger.log({
        event: 'classification_skipped',
        email_id: job.gmail_message_id,
        reason: 'whitelist_exact_match',
      })
      await completeJob(supabase, job.id)
      return
    }

    // Idempotency check: skip if already classified (B1.3)
    const { data: existingClassification } = await supabase
      .from('email_classifications')
      .select('id')
      .eq('user_id', job.user_id)
      .eq('gmail_message_id', job.gmail_message_id)
      .limit(1)
      .maybeSingle()

    if (existingClassification) {
      await completeJob(supabase, job.id)
      return
    }

    // Load user settings (role, credits, exposure mode)
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('user_role, exposure_mode, role, daily_credit_limit')
      .eq('user_id', job.user_id)
      .maybeSingle()

    const accountRole: string = userSettings?.role ?? 'user'
    const dailyCreditLimit: number = userSettings?.daily_credit_limit ?? 0
    const userRole: string = userSettings?.user_role ?? 'CEO'
    const exposureMode: string = userSettings?.exposure_mode ?? 'normal'

    // Credit check — admin accounts bypass all limits
    if (accountRole !== 'admin') {
      if (dailyCreditLimit === 0) {
        // No credits — classification disabled for this user
        ClassificationLogger.log({
          event: 'classification_skipped',
          email_id: job.gmail_message_id,
          reason: 'no_credits',
        })
        await completeJob(supabase, job.id)
        return
      }

      // dailyCreditLimit > 0 — enforce daily limit via usage_counters
      const todayDate = new Date().toISOString().split('T')[0]
      const { data: usageRow } = await supabase
        .from('usage_counters')
        .select('count')
        .eq('user_id', job.user_id)
        .eq('date_bucket', todayDate)
        .maybeSingle()

      const currentCount = usageRow?.count ?? 0
      if (currentCount >= dailyCreditLimit) {
        ClassificationLogger.log({
          event: 'classification_skipped',
          email_id: job.gmail_message_id,
          reason: 'daily_limit_reached',
        })
        await completeJob(supabase, job.id)
        return
      }

      // Increment usage counter atomically
      await supabase.rpc('increment_usage_counter', {
        p_user_id: job.user_id,
        p_date: todayDate,
      })
    }

    // Step 1: Fingerprinting
    const fpResult = fingerprintEmail(emailHeaders)

    let finalResult: ClassificationResult
    let confidence: number
    let summary = ''
    let source: 'fingerprint' | 'llm' = 'fingerprint'
    let llmUsage: { inputTokens: number; outputTokens: number; costUsd: number; model: string } | null = null

    if (fpResult) {
      // Apply safety rules to fingerprint result
      const signal = applyClassificationSafetyRules(fpResult.result, fpResult.confidence, 'fingerprint')

      if (signal === 'FORCE_LLM_REVIEW') {
        // Safety Rule 0 triggered — re-route to LLM
        const llmResult = await classifyWithLLM({
          from: emailHeaders.from,
          subject: emailHeaders.subject,
          headers: sanitizeForLLM(gmailEmail.bodyPreview),
          tail: sanitizeForLLM(gmailEmail.bodyTail),
          userRole,
          exposureMode,
        }, supabase)

        if (llmResult) {
          const llmSignal = applyClassificationSafetyRules(llmResult.result, llmResult.confidence, 'llm')
          finalResult = llmSignal as ClassificationResult // LLM path never returns FORCE_LLM_REVIEW
          confidence = llmResult.confidence
          summary = stripPIIFromSummary(llmResult.summary)
          source = 'llm'
          if (llmResult._usage) llmUsage = llmResult._usage
        } else {
          // LLM failed — use fingerprint result with downgrade
          finalResult = 'FILTRE' // Downgrade BLOQUE to FILTRE on LLM failure
          confidence = fpResult.confidence * 0.8
          summary = fpResult.reason
        }
      } else {
        finalResult = signal as ClassificationResult
        confidence = fpResult.confidence
        summary = fpResult.reason
      }
    } else {
      // Fingerprinting couldn't classify — route to LLM
      const llmResult = await classifyWithLLM({
        from: emailHeaders.from,
        subject: emailHeaders.subject,
        headers: sanitizeForLLM(gmailEmail.bodyPreview),
        tail: sanitizeForLLM(gmailEmail.bodyTail),
        userRole,
        exposureMode,
      }, supabase)

      if (llmResult) {
        const llmSignal = applyClassificationSafetyRules(llmResult.result, llmResult.confidence, 'llm')
        finalResult = llmSignal as ClassificationResult
        confidence = llmResult.confidence
        summary = stripPIIFromSummary(llmResult.summary)
        source = 'llm'
        if (llmResult._usage) llmUsage = llmResult._usage
      } else {
        // Both fingerprint and LLM failed — classify as A_VOIR (doubt promotes)
        finalResult = 'A_VOIR'
        confidence = 0.3
        summary = 'Unable to classify — manual review recommended'
        source = 'fingerprint'
      }
    }

    // Domain whitelist: never BLOQUE a whitelisted domain (B1.1)
    if (whitelistMatch === 'domain' && finalResult === 'BLOQUE') {
      finalResult = 'A_VOIR'
    }

    // Mode-specific confidence thresholds (B1.2)
    // Strict: more aggressive at surfacing for review
    // Permissive: only surface very low confidence
    const aVoirThreshold = exposureMode === 'strict' ? 0.8
      : exposureMode === 'permissive' ? 0.4
      : 0.6
    if (finalResult !== 'A_VOIR' && confidence < aVoirThreshold) {
      finalResult = 'A_VOIR'
    }

    const processingTimeMs = Date.now() - startTime

    // Save classification result (append-only — ADR-003)
    await supabase.from('email_classifications').insert({
      user_id: job.user_id,
      gmail_message_id: job.gmail_message_id,
      classification_result: finalResult,
      confidence_score: confidence,
      summary,
      source,
      processing_time_ms: processingTimeMs,
      idempotency_key: job.gmail_message_id,
    })

    // Log LLM usage for cost tracking
    if (source === 'llm') {
      const inputTokens = llmUsage?.inputTokens ?? 0
      const outputTokens = llmUsage?.outputTokens ?? 0
      const costUsd = llmUsage?.costUsd ?? 0.001
      await supabase.from('llm_usage_logs').insert({
        user_id: job.user_id,
        gmail_message_id: job.gmail_message_id,
        model: llmUsage?.model ?? 'gpt-4o-mini',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: costUsd,
        latency_ms: processingTimeMs,
        classification_result: finalResult,
      })
      console.log(`[COST] LLM: ${inputTokens}+${outputTokens} tokens, $${costUsd.toFixed(6)} (${finalResult})`)
    }

    // Apply Gmail label (Story 2.6)
    try {
      const labelMap = await ensureLabels(accessToken)
      await applyLabel(accessToken, job.gmail_message_id, finalResult, labelMap)
    } catch (labelError) {
      // Label failure is non-fatal — classification is saved, label will be reconciled
      console.error('Label application failed (will reconcile):', (labelError as Error).message)
    }

    // Update pipeline health
    await supabase
      .from('user_pipeline_health')
      .update({
        last_classified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', job.user_id)

    await completeJob(supabase, job.id)

    // ClassificationLogger — whitelist only fields (Enforcement Rule 3)
    ClassificationLogger.log({
      event: 'classification_complete',
      email_id: job.gmail_message_id,
      classification_result: finalResult,
      confidence_score: confidence,
      processing_time_ms: processingTimeMs,
      source,
    })
  } catch (error) {
    if (error instanceof GmailAuthError) {
      // Token expired mid-request — mark integration as revoked
      await supabase
        .from('user_integrations')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('user_id', job.user_id)
        .eq('provider', 'gmail')
      await failJob(supabase, job.id, 'TOKEN_REVOKED', job.retry_count)
      return
    }
    console.error('Classification error:', error)
    await failJob(supabase, job.id, (error as Error).message, job.retry_count)
  }
}
