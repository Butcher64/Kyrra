import { SYSTEM_WHITELISTED_SENDERS, applyClassificationSafetyRules } from '@kyrra/shared'
import { claimNextJob, completeJob, failJob } from './lib/queue-consumer'
import { fingerprintEmail, type EmailHeaders } from './lib/fingerprinting'
import { classifyWithLLM, type EmailContent } from './lib/llm-gateway'
import { stripPIIFromSummary, sanitizeForLLM } from './lib/pii-stripper'
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

    // TODO: Fetch email from Gmail API (in-memory only, never persisted)
    // For now, use placeholder data (Gmail API integration will be completed with gmail.ts)
    const emailHeaders: EmailHeaders = {
      from: 'placeholder@example.com',
      subject: 'Placeholder subject',
      headers: {},
    }

    // Check system whitelist (PM6 — skip @kyrra.io emails)
    const senderEmail = emailHeaders.from.toLowerCase()
    if (SYSTEM_WHITELISTED_SENDERS.some((addr: string) => senderEmail === addr)) {
      await completeJob(supabase, job.id)
      return // Skip classification — Kyrra's own emails
    }

    // TODO: Check user whitelist (SHA-256 hash comparison)

    // Step 1: Fingerprinting
    const fpResult = fingerprintEmail(emailHeaders)

    let finalResult: ClassificationResult
    let confidence: number
    let summary = ''
    let source: 'fingerprint' | 'llm' = 'fingerprint'

    if (fpResult) {
      // Apply safety rules to fingerprint result
      const signal = applyClassificationSafetyRules(fpResult.result, fpResult.confidence, 'fingerprint')

      if (signal === 'FORCE_LLM_REVIEW') {
        // Safety Rule 0 triggered — re-route to LLM
        const llmResult = await classifyWithLLM({
          from: emailHeaders.from,
          subject: emailHeaders.subject,
          headers: '', // TODO: truncated content
          tail: '',
          userRole: 'CEO', // TODO: from user profile
          exposureMode: 'normal', // TODO: from user settings
        }, supabase)

        if (llmResult) {
          const llmSignal = applyClassificationSafetyRules(llmResult.result, llmResult.confidence, 'llm')
          finalResult = llmSignal as ClassificationResult // LLM path never returns FORCE_LLM_REVIEW
          confidence = llmResult.confidence
          summary = stripPIIFromSummary(llmResult.summary)
          source = 'llm'
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
        headers: '', // TODO: truncated content
        tail: '',
        userRole: 'CEO',
        exposureMode: 'normal',
      }, supabase)

      if (llmResult) {
        const llmSignal = applyClassificationSafetyRules(llmResult.result, llmResult.confidence, 'llm')
        finalResult = llmSignal as ClassificationResult
        confidence = llmResult.confidence
        summary = stripPIIFromSummary(llmResult.summary)
        source = 'llm'
      } else {
        // Both fingerprint and LLM failed — classify as A_VOIR (doubt promotes)
        finalResult = 'A_VOIR'
        confidence = 0.3
        summary = 'Unable to classify — manual review recommended'
        source = 'fingerprint'
      }
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
      idempotency_key: `${job.gmail_message_id}-${Date.now()}`,
    })

    // TODO: Apply Gmail label (Story 2.6)

    // Update pipeline health
    await supabase
      .from('user_pipeline_health')
      .update({
        last_classified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', job.user_id)

    await completeJob(supabase, job.id)

    // ClassificationLogger — whitelist only fields
    console.log(JSON.stringify({
      event: 'classification_complete',
      email_id: job.gmail_message_id,
      classification_result: finalResult,
      confidence_score: confidence,
      processing_time_ms: processingTimeMs,
      source,
    }))
  } catch (error) {
    console.error('Classification error:', error)
    await failJob(supabase, job.id, (error as Error).message, job.retry_count)
  }
}
