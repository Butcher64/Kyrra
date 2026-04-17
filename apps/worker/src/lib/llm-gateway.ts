import type { ClassificationResult } from '@kyrra/shared'
import { withTimeout, TimeoutError } from './timeout'

/**
 * LLM Gateway — Handles ambiguous email classification via GPT-4o-mini
 * Circuit breaker: Supabase-backed (llm_metrics_hourly), survives restarts
 * Timeout: 10 seconds (10s margin before Railway SIGKILL at 20s) — B9.3
 *
 * Source: [architecture.md — ADR-004, LLM Gateway]
 */

// B9.3: Reduced from 14s to 10s — leaves 10s margin before Railway SIGKILL at 20s
const LLM_TIMEOUT_MS = 10_000

export interface LLMClassificationResult {
  result: ClassificationResult
  labelName: string
  confidence: number
  summary: string
  _usage?: { inputTokens: number; outputTokens: number; costUsd: number; model: string; latencyMs: number }
}

export interface EmailContent {
  from: string
  subject: string
  headers: string      // First 500 chars
  tail: string         // Last 50 chars
  userRole: string     // CEO, DRH, DSI
  exposureMode: string // strict, normal, permissive
}

/**
 * Check if circuit breaker is open (LLM should be bypassed)
 *
 * B9.4: opens on EITHER signal:
 *   1. Runaway cost:   total_cost_eur > 200€ this hour
 *   2. Degraded LLM:   error rate > 30% over >=10 LLM calls this hour
 *
 * Error rate guards against a broken upstream (OpenAI 5xx, schema changes,
 * timeouts) still being hammered hundreds of times per hour.
 */
const CIRCUIT_COST_LIMIT_EUR = 200
const CIRCUIT_ERROR_RATE_THRESHOLD = 0.30
const CIRCUIT_MIN_SAMPLE = 10

export async function isCircuitOpen(supabase: any): Promise<boolean> {
  const { data } = await supabase
    .from('llm_metrics_hourly')
    .select('total_cost_eur, llm_calls, llm_errors')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return false

  if ((data.total_cost_eur ?? 0) > CIRCUIT_COST_LIMIT_EUR) return true

  const llmCalls = data.llm_calls ?? 0
  const llmErrors = data.llm_errors ?? 0
  if (llmCalls >= CIRCUIT_MIN_SAMPLE) {
    const errorRate = llmErrors / llmCalls
    if (errorRate > CIRCUIT_ERROR_RATE_THRESHOLD) return true
  }

  return false
}

/**
 * Record LLM metrics for circuit breaker state via atomic RPC.
 * Increments cost + tracks bypass_rate (was broken: replaced instead of incrementing,
 * bypass_rate never calculated — circuit breaker was partially dead).
 */
export async function recordMetrics(
  supabase: any,
  costEur: number,
  wasLlm: boolean,
  wasError: boolean = false,
): Promise<void> {
  try {
    await withTimeout<unknown>(
      Promise.resolve(
        supabase.rpc('record_llm_metric', {
          p_cost_eur: costEur,
          p_was_llm: wasLlm,
          p_was_error: wasError,
        }),
      ),
      5_000,
      'record_llm_metric',
    )
  } catch (err) {
    // Best-effort: metric write must not block the classification path
    if (err instanceof TimeoutError) {
      console.warn('[llm-gateway] record_llm_metric timed out — continuing')
    } else {
      throw err
    }
  }
}

/**
 * Build the legacy hardcoded system prompt for 3-label classification.
 * Used when no systemPromptOverride is provided (backwards compat).
 */
function buildLegacyPrompt(email: EmailContent): string {
  return `You are Kyrra, an AI email classification system for B2B professionals.
Classify the incoming email as one of: A_VOIR (worth reviewing), FILTRE (filtered noise), BLOQUE (blocked spam/prospecting).

User context:
- Role: ${email.userRole} (business decision-maker)
- Exposure mode: ${email.exposureMode}

CRITICAL RULES — classify in this order:

1. TRANSACTIONAL/SERVICE emails are ALWAYS A_VOIR — NEVER classify as FILTRE or BLOQUE:
   - Authentication: OTP codes, verification emails, password resets, 2FA
   - Billing: invoices, payment confirmations, payment failures, subscription renewals
   - Security alerts: login notifications, suspicious activity, account warnings
   - Tool notifications: Slack, GitHub, Google Workspace, Notion, Figma, Linear, calendar invites
   - Account management: welcome emails, plan changes, usage alerts, quota warnings
   - Delivery/order: shipping confirmations, tracking, receipts

2. A_VOIR — Emails the user should see:
   - All transactional/service emails (rule 1 above)
   - Potentially relevant business emails matching user's industry/role
   - Emails from individuals (not mass-sent)
   - Anything you're uncertain about — when in doubt, A_VOIR

3. FILTRE — Noise the user probably doesn't need:
   - Generic marketing newsletters the user didn't subscribe to
   - Mass-sent commercial content not matching user's role
   - Automated digest/recap emails from platforms
   - Generic event invitations to unknown events

4. BLOQUE — Obvious unwanted outreach:
   - Cold prospecting/sales outreach from strangers
   - Mass-sent pitches using prospecting tools
   - Spam, phishing attempts, scam emails

KEY PRINCIPLE: When in doubt between FILTRE and A_VOIR, choose A_VOIR. A false negative (missing a real email) is far worse than a false positive (showing noise).

Respond with ONLY a JSON object:
{
  "category": "A_VOIR" | "FILTRE" | "BLOQUE",
  "confidence": 0.0 to 1.0,
  "summary": "One-line functional summary in the email's language (FR or EN). No PII."
}`
}

/**
 * Classify an email via LLM (GPT-4o-mini primary)
 * Returns structured classification or null on failure (→ rules fallback)
 *
 * @param systemPromptOverride — Dynamic prompt built from user's custom labels.
 *   When provided, replaces the legacy hardcoded prompt. Used by classification.ts
 *   to pass dynamically-built prompts for custom label sets.
 */
export async function classifyWithLLM(
  email: EmailContent,
  supabase: any,
  systemPromptOverride?: string,
): Promise<LLMClassificationResult | null> {
  // Check circuit breaker
  if (await isCircuitOpen(supabase)) {
    console.log('LLM circuit breaker open — routing to rules fallback')
    return null
  }

  const systemPrompt = systemPromptOverride ?? buildLegacyPrompt(email)

  const userMessage = `From: ${email.from}
Subject: ${email.subject}

--- Email content (truncated for privacy) ---
${email.headers}
[...]
${email.tail}
--- End ---`

  try {
    const llmStartTime = Date.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 200,
        temperature: 0.1,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.error('LLM API error:', response.status)
      await recordMetrics(supabase, 0, true, true) // B9.4: LLM attempt, counted as error
      return null // → rules fallback
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    const usage = data.usage

    if (!content) {
      await recordMetrics(supabase, 0, true, true)
      return null
    }

    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch {
      console.error('LLM returned non-JSON content')
      await recordMetrics(supabase, 0, true, true)
      return null
    }

    // Handle both response formats:
    // - Dynamic mode: { "label": "..." } (custom labels)
    // - Legacy mode:  { "category": "..." } (A_VOIR / FILTRE / BLOQUE)
    const labelName = parsed.label ?? parsed.category ?? ''
    const legacyResult = parsed.category as ClassificationResult | undefined

    if (!labelName && !legacyResult) {
      console.error('LLM returned neither label nor category')
      await recordMetrics(supabase, 0, true, true)
      return null // → rules fallback
    }

    // Map to legacy result for backwards compat (FR9 — prompt injection resistance)
    const validCategories = ['A_VOIR', 'FILTRE', 'BLOQUE']
    const result: ClassificationResult = validCategories.includes(legacyResult ?? '')
      ? legacyResult as ClassificationResult
      : 'A_VOIR'

    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      console.error('LLM returned invalid confidence:', parsed.confidence)
      await recordMetrics(supabase, 0, true, true)
      return null
    }

    // Compute cost from actual token usage
    const inputTokens = usage?.prompt_tokens ?? 0
    const outputTokens = usage?.completion_tokens ?? 0
    // GPT-4o-mini pricing: $0.15/1M input, $0.60/1M output
    const costUsd = (inputTokens * 0.15 + outputTokens * 0.60) / 1_000_000

    // Record metrics for circuit breaker
    await recordMetrics(supabase, costUsd, true)

    return {
      result,
      labelName,
      confidence: parsed.confidence,
      summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 200) : '',
      _usage: { inputTokens, outputTokens, costUsd, model: 'gpt-4o-mini', latencyMs: Date.now() - llmStartTime },
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.error('LLM timeout (>10s) — routing to rules fallback')
    } else {
      console.error('LLM classification error:', error)
    }
    // B9.4: attempted-LLM + failed → counts against error-rate circuit breaker
    try {
      await recordMetrics(supabase, 0, true, true)
    } catch {
      /* metrics best-effort */
    }
    return null // → rules fallback
  }
}
