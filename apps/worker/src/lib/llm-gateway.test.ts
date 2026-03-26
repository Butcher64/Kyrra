import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  classifyWithLLM,
  isCircuitOpen,
  type EmailContent,
  type LLMClassificationResult,
} from './llm-gateway'

// ── Helpers ──

function makeEmail(overrides: Partial<EmailContent> = {}): EmailContent {
  return {
    from: overrides.from ?? 'sales@startup.com',
    subject: overrides.subject ?? 'Our SaaS can save you 40%',
    headers: overrides.headers ?? 'From: sales@startup.com\nSubject: Our SaaS can save you 40%',
    tail: overrides.tail ?? 'Best regards, The Team',
    userRole: overrides.userRole ?? 'CEO',
    exposureMode: overrides.exposureMode ?? 'normal',
  }
}

function makeSupabaseMock(circuitData: any = null) {
  const upsertFn = vi.fn().mockResolvedValue({ error: null })
  const singleFn = vi.fn().mockResolvedValue({ data: circuitData })
  const limitFn = vi.fn().mockReturnValue({ single: singleFn })
  const orderFn = vi.fn().mockReturnValue({ limit: limitFn })
  const selectFn = vi.fn().mockReturnValue({ order: orderFn })

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'llm_metrics_hourly') {
        return { select: selectFn, upsert: upsertFn }
      }
      return { select: selectFn, upsert: upsertFn }
    }),
    _upsertFn: upsertFn,
    _singleFn: singleFn,
  }
}

function makeOpenAIResponse(content: object | string) {
  const body = typeof content === 'string' ? content : JSON.stringify(content)
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({
      choices: [{ message: { content: body } }],
      usage: { prompt_tokens: 100, completion_tokens: 30 },
    }),
  }
}

// ── Setup ──

const originalFetch = globalThis.fetch

beforeEach(() => {
  vi.stubEnv('OPENAI_API_KEY', 'sk-test-key-123')
  globalThis.fetch = vi.fn()
})

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.unstubAllEnvs()
})

// ── isCircuitOpen ──

describe('isCircuitOpen', () => {
  it('returns false when no metrics data', async () => {
    const supabase = makeSupabaseMock(null)
    expect(await isCircuitOpen(supabase)).toBe(false)
  })

  it('returns true when bypass_rate > 0.70', async () => {
    const supabase = makeSupabaseMock({ bypass_rate: 0.85, total_cost_eur: 10 })
    expect(await isCircuitOpen(supabase)).toBe(true)
  })

  it('returns true when total_cost_eur > 500', async () => {
    const supabase = makeSupabaseMock({ bypass_rate: 0.10, total_cost_eur: 600 })
    expect(await isCircuitOpen(supabase)).toBe(true)
  })

  it('returns true when both thresholds exceeded', async () => {
    const supabase = makeSupabaseMock({ bypass_rate: 0.90, total_cost_eur: 800 })
    expect(await isCircuitOpen(supabase)).toBe(true)
  })

  it('returns false when both metrics below thresholds', async () => {
    const supabase = makeSupabaseMock({ bypass_rate: 0.50, total_cost_eur: 100 })
    expect(await isCircuitOpen(supabase)).toBe(false)
  })

  it('returns false when bypass_rate is exactly 0.70 (not >)', async () => {
    const supabase = makeSupabaseMock({ bypass_rate: 0.70, total_cost_eur: 0 })
    expect(await isCircuitOpen(supabase)).toBe(false)
  })

  it('returns false when total_cost_eur is exactly 500 (not >)', async () => {
    const supabase = makeSupabaseMock({ bypass_rate: 0, total_cost_eur: 500 })
    expect(await isCircuitOpen(supabase)).toBe(false)
  })

  it('handles missing fields with nullish coalescing (defaults to 0)', async () => {
    const supabase = makeSupabaseMock({})
    expect(await isCircuitOpen(supabase)).toBe(false)
  })
})

// ── classifyWithLLM ──

describe('classifyWithLLM — circuit breaker', () => {
  it('returns null when circuit breaker is open', async () => {
    const supabase = makeSupabaseMock({ bypass_rate: 0.90, total_cost_eur: 0 })
    const result = await classifyWithLLM(makeEmail(), supabase)
    expect(result).toBeNull()
    // fetch should never be called
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})

describe('classifyWithLLM — successful classification', () => {
  it('returns structured result on valid LLM response', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOpenAIResponse({ category: 'FILTRE', confidence: 0.87, summary: 'Generic prospecting email.' }),
    )

    const result = await classifyWithLLM(makeEmail(), supabase)

    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
    expect(result!.confidence).toBe(0.87)
    expect(result!.summary).toBe('Generic prospecting email.')
  })

  it('makes correct API call to OpenAI', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOpenAIResponse({ category: 'A_VOIR', confidence: 0.60, summary: 'Relevant email.' }),
    )

    await classifyWithLLM(makeEmail({ userRole: 'DRH', exposureMode: 'strict' }), supabase)

    expect(globalThis.fetch).toHaveBeenCalledOnce()
    const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]

    expect(url).toBe('https://api.openai.com/v1/chat/completions')
    expect(options.method).toBe('POST')
    expect(options.headers['Authorization']).toBe('Bearer sk-test-key-123')
    expect(options.headers['Content-Type']).toBe('application/json')

    const body = JSON.parse(options.body)
    expect(body.model).toBe('gpt-4o-mini')
    expect(body.temperature).toBe(0.1)
    expect(body.max_tokens).toBe(200)
    expect(body.response_format).toEqual({ type: 'json_object' })
    expect(body.messages).toHaveLength(2)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[1].role).toBe('user')
  })

  it('includes user role and exposure mode in prompt', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOpenAIResponse({ category: 'BLOQUE', confidence: 0.95, summary: 'Spam.' }),
    )

    await classifyWithLLM(makeEmail({ userRole: 'DSI', exposureMode: 'permissive' }), supabase)

    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    const systemPrompt: string = body.messages[0].content
    expect(systemPrompt).toContain('Role: DSI')
    expect(systemPrompt).toContain('Exposure mode: permissive')
  })

  it('uses sanitized content (headers + tail) in user message', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOpenAIResponse({ category: 'A_VOIR', confidence: 0.70, summary: 'Interesting.' }),
    )

    const email = makeEmail({
      headers: 'X-Special: value\nFrom: test@test.com',
      tail: '-- Signature end --',
    })
    await classifyWithLLM(email, supabase)

    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    const userMessage: string = body.messages[1].content
    expect(userMessage).toContain('X-Special: value')
    expect(userMessage).toContain('[...]')
    expect(userMessage).toContain('-- Signature end --')
  })

  it('records metrics after successful call', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOpenAIResponse({ category: 'FILTRE', confidence: 0.80, summary: 'Cold outreach.' }),
    )

    await classifyWithLLM(makeEmail(), supabase)

    // The second call to .from() should be for upsert (metrics recording)
    const fromCalls = supabase.from.mock.calls
    const metricsCallIndex = fromCalls.findIndex(
      (call: string[], i: number) => call[0] === 'llm_metrics_hourly' && i > 0,
    )
    expect(metricsCallIndex).toBeGreaterThan(0)
    expect(supabase._upsertFn).toHaveBeenCalled()
    const upsertArgs = supabase._upsertFn.mock.calls[0]
    expect(upsertArgs[0]).toHaveProperty('total_cost_eur', 0.001)
    expect(upsertArgs[0]).toHaveProperty('hour_bucket')
    expect(upsertArgs[1]).toEqual({ onConflict: 'hour_bucket' })
  })

  it('truncates summary to 200 characters', async () => {
    const supabase = makeSupabaseMock(null)
    const longSummary = 'A'.repeat(300)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOpenAIResponse({ category: 'FILTRE', confidence: 0.80, summary: longSummary }),
    )

    const result = await classifyWithLLM(makeEmail(), supabase)

    expect(result).not.toBeNull()
    expect(result!.summary).toHaveLength(200)
    expect(result!.summary).toBe('A'.repeat(200))
  })

  it('returns empty string when summary is not a string', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOpenAIResponse({ category: 'A_VOIR', confidence: 0.60, summary: 12345 }),
    )

    const result = await classifyWithLLM(makeEmail(), supabase)

    expect(result).not.toBeNull()
    expect(result!.summary).toBe('')
  })

  it('accepts all three valid categories', async () => {
    const supabase = makeSupabaseMock(null)

    for (const category of ['A_VOIR', 'FILTRE', 'BLOQUE'] as const) {
      ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeOpenAIResponse({ category, confidence: 0.90, summary: 'Test.' }),
      )

      const result = await classifyWithLLM(makeEmail(), supabase)
      expect(result).not.toBeNull()
      expect(result!.result).toBe(category)
    }
  })
})

describe('classifyWithLLM — error handling', () => {
  it('returns null on HTTP error (non-200)', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 429,
      json: vi.fn(),
    })

    const result = await classifyWithLLM(makeEmail(), supabase)
    expect(result).toBeNull()
  })

  it('returns null on HTTP 500', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    })

    const result = await classifyWithLLM(makeEmail(), supabase)
    expect(result).toBeNull()
  })

  it('returns null on empty choices', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ choices: [] }),
    })

    const result = await classifyWithLLM(makeEmail(), supabase)
    expect(result).toBeNull()
  })

  it('returns null when choices[0].message.content is null', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: null } }],
      }),
    })

    const result = await classifyWithLLM(makeEmail(), supabase)
    expect(result).toBeNull()
  })

  it('returns null on invalid JSON in response content', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'not valid json {{{' } }],
      }),
    })

    const result = await classifyWithLLM(makeEmail(), supabase)
    expect(result).toBeNull()
  })

  it('returns null on invalid category (not A_VOIR/FILTRE/BLOQUE)', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOpenAIResponse({ category: 'SPAM', confidence: 0.90, summary: 'Spam email.' }),
    )

    const result = await classifyWithLLM(makeEmail(), supabase)
    expect(result).toBeNull()
  })

  it('returns null on invalid confidence (negative)', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOpenAIResponse({ category: 'FILTRE', confidence: -0.5, summary: 'Test.' }),
    )

    const result = await classifyWithLLM(makeEmail(), supabase)
    expect(result).toBeNull()
  })

  it('returns null on invalid confidence (> 1)', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOpenAIResponse({ category: 'FILTRE', confidence: 1.5, summary: 'Test.' }),
    )

    const result = await classifyWithLLM(makeEmail(), supabase)
    expect(result).toBeNull()
  })

  it('returns null on non-number confidence', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOpenAIResponse({ category: 'FILTRE', confidence: 'high', summary: 'Test.' }),
    )

    const result = await classifyWithLLM(makeEmail(), supabase)
    expect(result).toBeNull()
  })

  it('returns null on timeout (AbortError after 14s)', async () => {
    const supabase = makeSupabaseMock(null)
    const abortError = new DOMException('The operation was aborted.', 'AbortError')
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(abortError)

    const result = await classifyWithLLM(makeEmail(), supabase)
    expect(result).toBeNull()
  })

  it('returns null on network error', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new TypeError('Failed to fetch'),
    )

    const result = await classifyWithLLM(makeEmail(), supabase)
    expect(result).toBeNull()
  })

  it('does not record metrics when LLM call fails', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    })

    await classifyWithLLM(makeEmail(), supabase)

    // from() is called once for circuit breaker check, not again for metrics
    const fromCalls = supabase.from.mock.calls
    const metricsCalls = fromCalls.filter(
      (call: string[], i: number) => i > 0 && call[0] === 'llm_metrics_hourly',
    )
    expect(metricsCalls).toHaveLength(0)
  })

  it('does not record metrics when validation fails', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOpenAIResponse({ category: 'INVALID', confidence: 0.90, summary: 'Test.' }),
    )

    await classifyWithLLM(makeEmail(), supabase)

    expect(supabase._upsertFn).not.toHaveBeenCalled()
  })
})

describe('classifyWithLLM — abort signal', () => {
  it('passes an AbortSignal to fetch', async () => {
    const supabase = makeSupabaseMock(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOpenAIResponse({ category: 'A_VOIR', confidence: 0.70, summary: 'OK.' }),
    )

    await classifyWithLLM(makeEmail(), supabase)

    const [, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })
})
