import type { ClassificationResult } from '@kyrra/shared'

/**
 * LLM Gateway — Handles ambiguous email classification via GPT-4o-mini
 * Circuit breaker: Supabase-backed (llm_metrics_hourly), survives restarts
 * Timeout: 14 seconds (6s margin before Railway SIGKILL at 20s)
 *
 * Source: [architecture.md — ADR-004, LLM Gateway]
 */

const LLM_TIMEOUT_MS = 14_000

export interface LLMClassificationResult {
  result: ClassificationResult
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
 */
export async function isCircuitOpen(supabase: any): Promise<boolean> {
  const { data } = await supabase
    .from('llm_metrics_hourly')
    .select('bypass_rate, total_cost_eur')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return false

  return (data.bypass_rate ?? 0) > 0.70 || (data.total_cost_eur ?? 0) > 500
}

/**
 * Record LLM metrics for circuit breaker state
 */
async function recordMetrics(
  supabase: any,
  costEur: number,
  wasLlm: boolean,
): Promise<void> {
  const hourBucket = new Date()
  hourBucket.setMinutes(0, 0, 0)

  await supabase
    .from('llm_metrics_hourly')
    .upsert({
      hour_bucket: hourBucket.toISOString(),
      total_cost_eur: costEur,
      // bypass_rate and users_count updated by aggregation
    }, { onConflict: 'hour_bucket' })
}

/**
 * Classify an email via LLM (GPT-4o-mini primary)
 * Returns structured classification or null on failure (→ rules fallback)
 */
export async function classifyWithLLM(
  email: EmailContent,
  supabase: any,
): Promise<LLMClassificationResult | null> {
  // Check circuit breaker
  if (await isCircuitOpen(supabase)) {
    console.log('LLM circuit breaker open — routing to rules fallback')
    return null
  }

  const systemPrompt = `You are Kyrra, an AI email classification system for B2B professionals.
Classify the incoming email as one of: A_VOIR (worth reviewing), FILTRE (filtered noise), BLOQUE (blocked spam/prospecting).

User context:
- Role: ${email.userRole}
- Exposure mode: ${email.exposureMode}

Rules:
- A_VOIR: Potentially relevant commercial email matching user's industry/needs
- FILTRE: Generic commercial prospecting, not relevant to user's role
- BLOQUE: Obvious mass prospecting, spam tools, irrelevant pitches

Respond with ONLY a JSON object:
{
  "category": "A_VOIR" | "FILTRE" | "BLOQUE",
  "confidence": 0.0 to 1.0,
  "summary": "One-line functional summary in the email's language (FR or EN). No PII."
}`

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
      return null // → rules fallback
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    const usage = data.usage

    if (!content) return null

    const parsed = JSON.parse(content)

    // Validate structured output (FR9 — prompt injection resistance)
    const validCategories = ['A_VOIR', 'FILTRE', 'BLOQUE']
    if (!validCategories.includes(parsed.category)) {
      console.error('LLM returned invalid category:', parsed.category)
      return null // → rules fallback
    }

    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      console.error('LLM returned invalid confidence:', parsed.confidence)
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
      result: parsed.category as ClassificationResult,
      confidence: parsed.confidence,
      summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 200) : '',
      _usage: { inputTokens, outputTokens, costUsd, model: 'gpt-4o-mini', latencyMs: Date.now() - llmStartTime },
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.error('LLM timeout (>14s) — routing to rules fallback')
    } else {
      console.error('LLM classification error:', error)
    }
    return null // → rules fallback
  }
}
