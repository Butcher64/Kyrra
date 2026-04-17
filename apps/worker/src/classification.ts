import { SYSTEM_WHITELISTED_SENDERS, applyClassificationSafetyRules } from '@kyrra/shared'
import type { ClassificationResult, UserLabel } from '@kyrra/shared'
import { claimNextJob, completeJob, failJob } from './lib/queue-consumer'
import { fingerprintEmail, type EmailHeaders } from './lib/fingerprinting'
import { prefilterEmail } from './lib/prefilter'
import { classifyWithLLM, recordMetrics } from './lib/llm-gateway'
import { stripPIIFromSummary, sanitizeForLLM } from './lib/pii-stripper'
import { getValidAccessToken, fetchEmailMetadata, fetchEmailBody, ensureDynamicLabels, applyDynamicLabel, GmailAuthError } from './lib/gmail'
import { ClassificationLogger } from './lib/classification-logger'
import { checkWhitelist } from './lib/whitelist-check'
import { buildSystemPrompt, type UserProfile } from './lib/prompt-builder'
import { resolveLabel, resolveLabelByName, deriveLegacyResult } from './lib/label-resolver'
import { withRetry } from './lib/retry'

/**
 * Save classification result atomically via RPC (B8.1)
 * Wraps email_classifications INSERT + user_pipeline_health UPDATE in one transaction.
 * Gmail label application stays outside (external API).
 * LLM usage logging stays outside (best-effort, table may not exist).
 */
export async function saveClassificationResult(
  supabase: any,
  params: {
    userId: string
    gmailMessageId: string
    classificationResult: ClassificationResult
    labelId: string
    confidenceScore: number
    summary: string
    source: 'fingerprint' | 'llm' | 'prefilter'
    processingTimeMs: number
    idempotencyKey: string
    senderDisplay: string
    subjectSnippet: string
  },
): Promise<void> {
  const { error } = await supabase.rpc('save_classification_result', {
    p_user_id: params.userId,
    p_gmail_message_id: params.gmailMessageId,
    p_classification_result: params.classificationResult,
    p_label_id: params.labelId,
    p_confidence_score: params.confidenceScore,
    p_summary: params.summary,
    p_source: params.source,
    p_processing_time_ms: params.processingTimeMs,
    p_idempotency_key: params.idempotencyKey,
    p_sender_display: params.senderDisplay,
    p_subject_snippet: params.subjectSnippet,
  })

  if (error) {
    throw new Error(`save_classification_result RPC failed: ${error.message}`)
  }
}

/**
 * Classification loop — processes emails from the queue
 *
 * Optimized flow (metadata-first, lazy body fetch):
 *   1. Claim job
 *   2. Fetch metadata only (headers, no body — cheap API call)
 *   3. System whitelist → skip
 *   4. User whitelist exact → skip
 *   5. Idempotency → skip
 *   6. Pre-filter: known domains + noreply + never-exchanged → instant classification
 *   7. Load user settings + credit check
 *   8. Fingerprinting (headers only)
 *   9. Only if LLM needed → fetch full body (lazy load)
 *  10. LLM classification (dynamic prompt from user labels)
 *  11. Safety rules + exposure mode
 *  12. Save with label_id + label in Gmail
 *
 * Source: [architecture.md — Epic 2, Story 2.5]
 */
export async function classificationLoop(supabase: any): Promise<void> {
  const job = await claimNextJob(supabase)

  if (!job) {
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
      await failJob(supabase, job.id, 'TOKEN_REVOKED', job.retry_count)
      return
    }

    // ── Load user labels early ──
    const { data: userLabels } = await supabase
      .from('user_labels')
      .select('*')
      .eq('user_id', job.user_id)
      .order('position', { ascending: true })

    if (!userLabels || userLabels.length === 0) {
      await completeJob(supabase, job.id)
      return // Labels not configured yet
    }

    const typedLabels = userLabels as UserLabel[]

    // ── Step 1: Fetch metadata only (headers, no body) ──
    const metadata = await fetchEmailMetadata(accessToken, job.gmail_message_id)

    const emailHeaders: EmailHeaders = {
      from: metadata.from,
      subject: metadata.subject,
      headers: metadata.headers,
    }

    // Extract display-friendly sender name and subject for scan page (B2.6)
    const rawFrom = metadata.headers['from'] ?? metadata.from
    const senderDisplay = rawFrom.includes('<')
      ? rawFrom.split('<')[0]!.trim().replace(/^["']|["']$/g, '')
      : rawFrom
    const subjectSnippet = (metadata.subject || '(sans objet)').slice(0, 120)

    // ── Step 2: System whitelist (PM6 — skip @kyrra.io emails) ──
    const senderEmail = emailHeaders.from.toLowerCase()
    if (SYSTEM_WHITELISTED_SENDERS.some((addr: string) => senderEmail === addr)) {
      await completeJob(supabase, job.id)
      return
    }

    // ── Step 3: User whitelist (SHA-256 hash comparison — B1.1) ──
    const whitelistMatch = await checkWhitelist(supabase, job.user_id, senderEmail)
    if (whitelistMatch === 'exact') {
      ClassificationLogger.log({
        event: 'classification_skipped',
        email_id: job.gmail_message_id,
        reason: 'whitelist_exact_match',
      })
      await completeJob(supabase, job.id)
      return
    }

    // ── Step 4: Idempotency check (B1.3) ──
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

    // ── Step 5: Pre-filter — known domains, noreply, never-exchanged ──
    // Instant classification without body fetch for obvious cases
    const prefilterResult = prefilterEmail(senderEmail, whitelistMatch)

    if (prefilterResult) {
      // Pre-filter matched — classify immediately, no body fetch needed
      const pfResult = prefilterResult.result
      const pfConfidence = prefilterResult.confidence

      // Resolve legacy result to user's dynamic label
      let resolvedLabel = resolveLabel(pfResult, typedLabels)

      // Domain whitelist override: never put whitelisted domain in Prospection/Spam
      if (whitelistMatch === 'domain' && (resolvedLabel.name === 'Prospection' || resolvedLabel.name === 'Spam')) {
        const sortedByPosition = [...typedLabels].sort((a, b) => a.position - b.position)
        resolvedLabel = sortedByPosition[0]!
      }

      const processingTimeMs = Date.now() - startTime

      // Atomic save: classification + pipeline health in one transaction (B8.1)
      await saveClassificationResult(supabase, {
        userId: job.user_id,
        gmailMessageId: job.gmail_message_id,
        classificationResult: deriveLegacyResult(resolvedLabel),
        labelId: resolvedLabel.id,
        confidenceScore: pfConfidence,
        summary: prefilterResult.reason,
        source: 'prefilter',
        processingTimeMs,
        idempotencyKey: job.gmail_message_id,
        senderDisplay,
        subjectSnippet,
      })

      // Track bypass metric (prefilter = no LLM, cost 0)
      await recordMetrics(supabase, 0, false)

      // Gmail label application — outside transaction, with retry (B8.2)
      try {
        await withRetry(async () => {
          const gmailLabelMap = await ensureDynamicLabels(accessToken, typedLabels)
          const targetGmailLabelId = gmailLabelMap[resolvedLabel.id]
          if (targetGmailLabelId) {
            await applyDynamicLabel(accessToken, job.gmail_message_id, targetGmailLabelId, Object.values(gmailLabelMap))
          }
        }, { maxAttempts: 3, baseDelayMs: 1000, label: `applyLabel:${job.gmail_message_id}` })
      } catch (labelError) {
        ClassificationLogger.log({
          event: 'label_application_failed',
          email_id: job.gmail_message_id,
          label_name: resolvedLabel.name,
          error: (labelError as Error).message,
        })
      }

      await completeJob(supabase, job.id)

      ClassificationLogger.log({
        event: 'classification_complete',
        email_id: job.gmail_message_id,
        classification_result: pfResult,
        label_name: resolvedLabel.name,
        confidence_score: pfConfidence,
        processing_time_ms: processingTimeMs,
        source: 'prefilter',
      })
      return
    }

    // ── Step 6: Load user settings + credit check ──
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('user_role, exposure_mode, role, daily_credit_limit, sector, company_description, prospection_utile, prospection_non_sollicitee, interests')
      .eq('user_id', job.user_id)
      .maybeSingle()

    const accountRole: string = userSettings?.role ?? 'user'
    const dailyCreditLimit: number = userSettings?.daily_credit_limit ?? 0
    const userRole: string = userSettings?.user_role ?? 'CEO'
    const exposureMode: string = userSettings?.exposure_mode ?? 'normal'

    const userProfile: UserProfile = {
      userRole,
      exposureMode,
      sector: userSettings?.sector || undefined,
      companyDescription: userSettings?.company_description || undefined,
      prospectionUtile: userSettings?.prospection_utile || undefined,
      prospectionNonSollicitee: userSettings?.prospection_non_sollicitee || undefined,
      interests: userSettings?.interests || undefined,
    }

    if (accountRole !== 'admin') {
      if (dailyCreditLimit === 0) {
        ClassificationLogger.log({
          event: 'classification_skipped',
          email_id: job.gmail_message_id,
          reason: 'no_credits',
        })
        await completeJob(supabase, job.id)
        return
      }

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

      await supabase.rpc('increment_usage_counter', {
        p_user_id: job.user_id,
        p_date: todayDate,
      })
    }

    // ── Step 7: Fingerprinting (headers only — no body needed) ──
    const fpResult = fingerprintEmail(emailHeaders)

    // Build dynamic prompt from user's labels
    const dynamicPrompt = buildSystemPrompt(typedLabels, userProfile)

    let finalResult: ClassificationResult
    let resolvedLabel: UserLabel
    let confidence: number
    let summary = ''
    let source: 'fingerprint' | 'llm' | 'prefilter' = 'fingerprint'
    let llmUsage: { inputTokens: number; outputTokens: number; costUsd: number; model: string } | null = null

    if (fpResult) {
      const signal = applyClassificationSafetyRules(fpResult.result, fpResult.confidence, 'fingerprint')

      if (signal === 'FORCE_LLM_REVIEW') {
        // ── Step 8a: Lazy body fetch — only when LLM is needed ──
        const body = await fetchEmailBody(accessToken, job.gmail_message_id)

        const llmResult = await classifyWithLLM({
          from: emailHeaders.from,
          subject: emailHeaders.subject,
          headers: sanitizeForLLM(body.bodyPreview),
          tail: sanitizeForLLM(body.bodyTail),
          userRole,
          exposureMode,
        }, supabase, dynamicPrompt)

        if (llmResult) {
          const llmSignal = applyClassificationSafetyRules(llmResult.result, llmResult.confidence, 'llm')
          finalResult = llmSignal as ClassificationResult
          resolvedLabel = resolveLabelByName(llmResult.labelName, typedLabels)
          confidence = llmResult.confidence
          summary = stripPIIFromSummary(llmResult.summary)
          source = 'llm'
          if (llmResult._usage) llmUsage = llmResult._usage
        } else {
          finalResult = 'FILTRE'
          resolvedLabel = resolveLabel('FILTRE', typedLabels)
          confidence = fpResult.confidence * 0.8
          summary = fpResult.reason
        }
      } else {
        finalResult = signal as ClassificationResult
        resolvedLabel = resolveLabel(finalResult, typedLabels)
        confidence = fpResult.confidence
        summary = fpResult.reason
      }
    } else {
      // Fingerprinting couldn't classify — fetch body for LLM
      // ── Step 8b: Lazy body fetch — fingerprint failed ──
      const body = await fetchEmailBody(accessToken, job.gmail_message_id)

      const llmResult = await classifyWithLLM({
        from: emailHeaders.from,
        subject: emailHeaders.subject,
        headers: sanitizeForLLM(body.bodyPreview),
        tail: sanitizeForLLM(body.bodyTail),
        userRole,
        exposureMode,
      }, supabase, dynamicPrompt)

      if (llmResult) {
        const llmSignal = applyClassificationSafetyRules(llmResult.result, llmResult.confidence, 'llm')
        finalResult = llmSignal as ClassificationResult
        resolvedLabel = resolveLabelByName(llmResult.labelName, typedLabels)
        confidence = llmResult.confidence
        summary = stripPIIFromSummary(llmResult.summary)
        source = 'llm'
        if (llmResult._usage) llmUsage = llmResult._usage
      } else {
        finalResult = 'A_VOIR'
        resolvedLabel = resolveLabel('A_VOIR', typedLabels)
        confidence = 0.3
        summary = 'Unable to classify — manual review recommended'
        source = 'fingerprint'
      }
    }

    // Domain whitelist: never put whitelisted domain in Prospection/Spam (B1.1)
    if (whitelistMatch === 'domain' && (resolvedLabel.name === 'Prospection' || resolvedLabel.name === 'Spam')) {
      const sortedByPosition = [...typedLabels].sort((a, b) => a.position - b.position)
      resolvedLabel = sortedByPosition[0]!
      finalResult = deriveLegacyResult(resolvedLabel)
    }

    // Mode-specific confidence thresholds (B1.2)
    const firstLabel = [...typedLabels].sort((a, b) => a.position - b.position)[0]!
    const aVoirThreshold = exposureMode === 'strict' ? 0.8
      : exposureMode === 'permissive' ? 0.4
      : 0.6
    if (resolvedLabel.id !== firstLabel.id && confidence < aVoirThreshold) {
      resolvedLabel = firstLabel
      finalResult = deriveLegacyResult(resolvedLabel)
    }

    const processingTimeMs = Date.now() - startTime

    // Atomic save: classification + pipeline health in one transaction (B8.1)
    await saveClassificationResult(supabase, {
      userId: job.user_id,
      gmailMessageId: job.gmail_message_id,
      classificationResult: deriveLegacyResult(resolvedLabel),
      labelId: resolvedLabel.id,
      confidenceScore: confidence,
      summary,
      source,
      processingTimeMs,
      idempotencyKey: job.gmail_message_id,
      senderDisplay,
      subjectSnippet,
    })

    // Log LLM usage for cost tracking (best-effort, outside transaction)
    if (source === 'llm') {
      const inputTokens = llmUsage?.inputTokens ?? 0
      const outputTokens = llmUsage?.outputTokens ?? 0
      const costUsd = llmUsage?.costUsd ?? 0.001
      try {
        await supabase.from('llm_usage_logs').insert({
          user_id: job.user_id,
          gmail_message_id: job.gmail_message_id,
          model: llmUsage?.model ?? 'gpt-4o-mini',
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_usd: costUsd,
          latency_ms: processingTimeMs,
          classification_result: finalResult,
          label_name: resolvedLabel.name,
        })
      } catch (err) {
        console.warn('[COST] llm_usage_logs insert failed:', (err as Error).message)
      }
      console.log(`[COST] LLM: ${inputTokens}+${outputTokens} tokens, $${costUsd.toFixed(6)} (${finalResult} → ${resolvedLabel.name})`)
    } else {
      // Fingerprint-only classification: track bypass metric (no LLM, cost 0)
      await recordMetrics(supabase, 0, false)
    }

    // Gmail label application — outside transaction, with retry (B8.2)
    try {
      await withRetry(async () => {
        const gmailLabelMap = await ensureDynamicLabels(accessToken, typedLabels)
        const targetGmailLabelId = gmailLabelMap[resolvedLabel.id]
        if (targetGmailLabelId) {
          await applyDynamicLabel(accessToken, job.gmail_message_id, targetGmailLabelId, Object.values(gmailLabelMap))
        }
      }, { maxAttempts: 3, baseDelayMs: 1000, label: `applyLabel:${job.gmail_message_id}` })
    } catch (labelError) {
      ClassificationLogger.log({
        event: 'label_application_failed',
        email_id: job.gmail_message_id,
        label_name: resolvedLabel.name,
        error: (labelError as Error).message,
      })
    }

    await completeJob(supabase, job.id)

    ClassificationLogger.log({
      event: 'classification_complete',
      email_id: job.gmail_message_id,
      classification_result: finalResult,
      label_name: resolvedLabel.name,
      confidence_score: confidence,
      processing_time_ms: processingTimeMs,
      source,
    })
  } catch (error) {
    if (error instanceof GmailAuthError) {
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
