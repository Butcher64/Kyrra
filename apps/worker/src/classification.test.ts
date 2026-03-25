import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// ── Mocks ──

vi.mock('./lib/queue-consumer', () => ({
  claimNextJob: vi.fn(),
  completeJob: vi.fn(),
  failJob: vi.fn(),
}))

vi.mock('./lib/fingerprinting', () => ({
  fingerprintEmail: vi.fn(),
}))

vi.mock('./lib/llm-gateway', () => ({
  classifyWithLLM: vi.fn(),
}))

vi.mock('./lib/pii-stripper', () => ({
  stripPIIFromSummary: vi.fn((s: string) => s),
  sanitizeForLLM: vi.fn((s: string) => `[sanitized]${s}`),
}))

vi.mock('./lib/gmail', () => ({
  getValidAccessToken: vi.fn(),
  fetchEmail: vi.fn(),
  ensureLabels: vi.fn(),
  applyLabel: vi.fn(),
  GmailAuthError: class GmailAuthError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'GmailAuthError'
    }
  },
}))

vi.mock('./lib/classification-logger', () => ({
  ClassificationLogger: { log: vi.fn() },
}))

vi.mock('./lib/whitelist-check', () => ({
  checkWhitelist: vi.fn(),
}))

vi.mock('@kyrra/shared', () => ({
  SYSTEM_WHITELISTED_SENDERS: ['noreply@kyrra.io', 'recap@kyrra.io', 'support@kyrra.io'],
  applyClassificationSafetyRules: vi.fn(),
}))

// ── Imports (after mocks) ──

import { classificationLoop } from './classification'
import { claimNextJob, completeJob, failJob } from './lib/queue-consumer'
import { fingerprintEmail } from './lib/fingerprinting'
import { classifyWithLLM } from './lib/llm-gateway'
import { stripPIIFromSummary, sanitizeForLLM } from './lib/pii-stripper'
import { getValidAccessToken, fetchEmail, ensureLabels, applyLabel, GmailAuthError } from './lib/gmail'
import { ClassificationLogger } from './lib/classification-logger'
import { checkWhitelist } from './lib/whitelist-check'
import { applyClassificationSafetyRules } from '@kyrra/shared'

// ── Helpers ──

/**
 * Create a chainable mock Supabase client.
 * Every method returns the chain itself, except terminal methods
 * (.single(), .maybeSingle()) which resolve to { data: null } by default.
 * Override specific return values per test using `mockReturns`.
 */
function createMockSupabase(mockReturns: Record<string, any> = {}) {
  // Default terminal results for each table query
  const defaults: Record<string, any> = {
    'user_integrations.select.single': { data: null },
    'email_classifications.select.maybeSingle': { data: null },
    'user_settings.select.maybeSingle': { data: null },
    'rpc.increment_usage_counter': { data: 1 },
    ...mockReturns,
  }

  // Track the current table for resolving keys
  let currentTable = ''
  let currentOp = '' // 'select', 'insert', 'update', 'rpc'
  let rpcName = ''

  const chain: any = {}

  const chainMethods = ['from', 'select', 'insert', 'update', 'upsert', 'eq', 'order', 'limit']

  for (const method of chainMethods) {
    chain[method] = vi.fn((...args: any[]) => {
      if (method === 'from') {
        currentTable = args[0]
        currentOp = ''
      }
      if (method === 'select') currentOp = 'select'
      if (method === 'insert') currentOp = 'insert'
      if (method === 'update') currentOp = 'update'
      return chain
    })
  }

  chain.rpc = vi.fn((name: string, _params?: any) => {
    rpcName = name
    currentOp = 'rpc'
    // For rpc calls, return the result immediately since rpc is terminal
    const key = `rpc.${name}`
    if (key in defaults) return Promise.resolve(defaults[key])
    return Promise.resolve({ data: null })
  })

  chain.single = vi.fn(() => {
    const key = `${currentTable}.${currentOp}.single`
    if (key in defaults) return Promise.resolve(defaults[key])
    return Promise.resolve({ data: null })
  })

  chain.maybeSingle = vi.fn(() => {
    const key = `${currentTable}.${currentOp}.maybeSingle`
    if (key in defaults) return Promise.resolve(defaults[key])
    return Promise.resolve({ data: null })
  })

  return chain
}

/** Create a mock queue job with sensible defaults */
function createMockJob(overrides: Partial<{
  id: string
  user_id: string
  gmail_message_id: string
  retry_count: number
  status: string
}> = {}) {
  return {
    id: 'job-001',
    user_id: 'user-123',
    gmail_message_id: 'msg-abc',
    retry_count: 0,
    status: 'processing',
    ...overrides,
  }
}

/** Create a mock Gmail email payload */
function createMockGmailEmail(overrides: Partial<{
  from: string
  subject: string
  headers: Record<string, string>
  bodyPreview: string
  bodyTail: string
}> = {}) {
  return {
    id: 'msg-abc',
    threadId: 'thread-1',
    from: 'sender@example.com',
    to: 'user@test.com',
    subject: 'Hello World',
    headers: { from: 'sender@example.com', subject: 'Hello World' },
    snippet: 'Hello world snippet',
    bodyPreview: 'Hello world body preview text',
    bodyTail: 'regards',
    internalDate: '1711267200000',
    labelIds: ['INBOX'],
    ...overrides,
  }
}

/** Wire up all the "happy path" mocks so we can test individual steps by overriding */
function setupHappyPath(supabase: any) {
  const job = createMockJob()
  const email = createMockGmailEmail()

  ;(claimNextJob as Mock).mockResolvedValue(job)
  ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')
  ;(fetchEmail as Mock).mockResolvedValue(email)
  ;(checkWhitelist as Mock).mockResolvedValue('none')
  ;(fingerprintEmail as Mock).mockReturnValue(null)
  ;(classifyWithLLM as Mock).mockResolvedValue({
    result: 'FILTRE',
    confidence: 0.85,
    summary: 'Commercial prospecting email',
  })
  ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')
  ;(stripPIIFromSummary as Mock).mockImplementation((s: string) => s)
  ;(sanitizeForLLM as Mock).mockImplementation((s: string) => `[sanitized]${s}`)
  ;(ensureLabels as Mock).mockResolvedValue({ A_VOIR: 'lbl-1', FILTRE: 'lbl-2', BLOQUE: 'lbl-3' })
  ;(applyLabel as Mock).mockResolvedValue(undefined)
  ;(completeJob as Mock).mockResolvedValue(undefined)
  ;(failJob as Mock).mockResolvedValue(undefined)

  return { job, email }
}

// ── Tests ──

describe('classificationLoop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  // 1. No job available
  it('should sleep 1s and return when no job is available', async () => {
    const supabase = createMockSupabase()
    ;(claimNextJob as Mock).mockResolvedValue(null)

    const promise = classificationLoop(supabase)
    // Advance past the 1s sleep
    await vi.advanceTimersByTimeAsync(1000)
    await promise

    expect(claimNextJob).toHaveBeenCalledWith(supabase)
    expect(completeJob).not.toHaveBeenCalled()
    expect(failJob).not.toHaveBeenCalled()
  })

  // 2. No active integration
  it('should failJob when no active Gmail integration exists', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: null },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)

    await classificationLoop(supabase)

    expect(failJob).toHaveBeenCalledWith(supabase, 'job-001', 'NO_ACTIVE_INTEGRATION', 0)
    expect(completeJob).not.toHaveBeenCalled()
  })

  // 3. Token revoked
  it('should failJob with TOKEN_REVOKED when access token is null', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)
    ;(getValidAccessToken as Mock).mockResolvedValue(null)

    await classificationLoop(supabase)

    expect(failJob).toHaveBeenCalledWith(supabase, 'job-001', 'TOKEN_REVOKED', 0)
  })

  // 4. System whitelist (kyrra.io)
  it('should skip classification for system whitelisted senders (@kyrra.io)', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)
    ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')
    ;(fetchEmail as Mock).mockResolvedValue(
      createMockGmailEmail({ from: 'recap@kyrra.io' }),
    )

    await classificationLoop(supabase)

    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
    expect(checkWhitelist).not.toHaveBeenCalled()
    expect(fingerprintEmail).not.toHaveBeenCalled()
  })

  // 5. User whitelist exact match
  it('should skip classification and log when user whitelist exact match', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)
    ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')
    ;(fetchEmail as Mock).mockResolvedValue(createMockGmailEmail())
    ;(checkWhitelist as Mock).mockResolvedValue('exact')

    await classificationLoop(supabase)

    expect(ClassificationLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'classification_skipped',
        reason: 'whitelist_exact_match',
      }),
    )
    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
    expect(fingerprintEmail).not.toHaveBeenCalled()
  })

  // 6. Already classified (idempotency)
  it('should skip when email is already classified (idempotency)', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'email_classifications.select.maybeSingle': { data: { id: 'cls-existing' } },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)
    ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')
    ;(fetchEmail as Mock).mockResolvedValue(createMockGmailEmail())
    ;(checkWhitelist as Mock).mockResolvedValue('none')

    await classificationLoop(supabase)

    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
    expect(fingerprintEmail).not.toHaveBeenCalled()
  })

  // 7. Daily limit reached
  it('should skip classification and log when daily usage limit is reached', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: null },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)
    ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')
    ;(fetchEmail as Mock).mockResolvedValue(createMockGmailEmail())
    ;(checkWhitelist as Mock).mockResolvedValue('none')

    await classificationLoop(supabase)

    expect(ClassificationLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'classification_skipped',
        reason: 'daily_limit_reached',
      }),
    )
    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
    expect(fingerprintEmail).not.toHaveBeenCalled()
  })

  // 8. Fingerprint match -> direct classification (BLOQUE)
  it('should classify directly when fingerprint matches with passing safety rules', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'normal' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'BLOQUE',
      confidence: 0.95,
      reason: 'Prospecting tool detected: Lemlist',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('BLOQUE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(classifyWithLLM).not.toHaveBeenCalled()
    expect(supabase.insert).toHaveBeenCalled()
    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
  })

  // 9. Fingerprint + safety rules -> FORCE_LLM_REVIEW -> LLM succeeds
  it('should route to LLM when safety rules return FORCE_LLM_REVIEW', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'normal' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'BLOQUE',
      confidence: 0.82,
      reason: 'Domain reputation match',
    })
    // First call: fingerprint path returns FORCE_LLM_REVIEW
    // Second call: LLM path returns FILTRE
    ;(applyClassificationSafetyRules as Mock)
      .mockReturnValueOnce('FORCE_LLM_REVIEW')
      .mockReturnValueOnce('FILTRE')

    ;(classifyWithLLM as Mock).mockResolvedValue({
      result: 'FILTRE',
      confidence: 0.78,
      summary: 'Borderline prospecting email',
    })

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(classifyWithLLM).toHaveBeenCalled()
    expect(sanitizeForLLM).toHaveBeenCalled()
    expect(stripPIIFromSummary).toHaveBeenCalledWith('Borderline prospecting email')
    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
  })

  // 10. Fingerprint + FORCE_LLM_REVIEW -> LLM fails -> downgrade to FILTRE
  it('should downgrade to FILTRE when LLM fails after FORCE_LLM_REVIEW', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'normal' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'BLOQUE',
      confidence: 0.85,
      reason: 'Tool signature detected',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FORCE_LLM_REVIEW')
    ;(classifyWithLLM as Mock).mockResolvedValue(null) // LLM failure

    vi.useRealTimers()
    await classificationLoop(supabase)

    // Should insert FILTRE (downgraded from BLOQUE)
    expect(supabase.insert).toHaveBeenCalled()
    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('FILTRE')
    // Confidence should be reduced (0.85 * 0.8 = 0.68)
    expect(insertCall.confidence_score).toBeCloseTo(0.68)
    expect(completeJob).toHaveBeenCalled()
  })

  // 11. No fingerprint -> LLM route succeeds
  it('should route to LLM when fingerprinting returns null, LLM succeeds', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'DRH', exposure_mode: 'normal' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue(null)
    ;(classifyWithLLM as Mock).mockResolvedValue({
      result: 'A_VOIR',
      confidence: 0.75,
      summary: 'Relevant HR tool offer',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('A_VOIR')

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(classifyWithLLM).toHaveBeenCalled()
    expect(stripPIIFromSummary).toHaveBeenCalledWith('Relevant HR tool offer')
    expect(supabase.insert).toHaveBeenCalled()
    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('A_VOIR')
    expect(insertCall.source).toBe('llm')
  })

  // 12. No fingerprint -> LLM fails -> A_VOIR fallback
  it('should fallback to A_VOIR when both fingerprint and LLM fail', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: null },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue(null)
    ;(classifyWithLLM as Mock).mockResolvedValue(null) // LLM failure

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(supabase.insert).toHaveBeenCalled()
    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('A_VOIR')
    expect(insertCall.confidence_score).toBe(0.3)
    expect(insertCall.summary).toBe('Unable to classify — manual review recommended')
    expect(insertCall.source).toBe('fingerprint')
  })

  // 13. Domain whitelist: BLOQUE -> A_VOIR downgrade
  it('should downgrade BLOQUE to A_VOIR when sender domain is whitelisted', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'normal' } },
    })
    setupHappyPath(supabase)
    ;(checkWhitelist as Mock).mockResolvedValue('domain')
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'BLOQUE',
      confidence: 0.95,
      reason: 'Tool signature',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('BLOQUE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    // BLOQUE should be downgraded to A_VOIR for domain-whitelisted senders
    expect(supabase.insert).toHaveBeenCalled()
    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('A_VOIR')
  })

  // 14. Strict mode: confidence threshold 0.8
  it('should promote to A_VOIR when confidence < 0.8 in strict mode', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'strict' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'FILTRE',
      confidence: 0.75, // Below strict threshold of 0.8
      reason: 'Subject pattern match',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('A_VOIR')
  })

  // 15. Normal mode: confidence threshold 0.6
  it('should promote to A_VOIR when confidence < 0.6 in normal mode', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'normal' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'BLOQUE',
      confidence: 0.55, // Below normal threshold of 0.6
      reason: 'Weak domain reputation signal',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('BLOQUE')
    ;(checkWhitelist as Mock).mockResolvedValue('none')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('A_VOIR')
  })

  // 16. Permissive mode: confidence threshold 0.4
  it('should promote to A_VOIR when confidence < 0.4 in permissive mode', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'permissive' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'FILTRE',
      confidence: 0.35, // Below permissive threshold of 0.4
      reason: 'Very weak signal',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('A_VOIR')
  })

  // 16b. Permissive mode: should NOT promote when confidence >= 0.4
  it('should keep FILTRE when confidence >= 0.4 in permissive mode', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'permissive' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'FILTRE',
      confidence: 0.65,
      reason: 'Known prospecting pattern',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('FILTRE')
  })

  // 17. Classification saved with correct fields
  it('should save classification with all required fields', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'DSI', exposure_mode: 'normal' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue(null)
    ;(classifyWithLLM as Mock).mockResolvedValue({
      result: 'FILTRE',
      confidence: 0.88,
      summary: 'SaaS sales pitch for IT department',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(supabase.from).toHaveBeenCalledWith('email_classifications')
    expect(supabase.insert).toHaveBeenCalled()
    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall).toEqual(
      expect.objectContaining({
        user_id: 'user-123',
        gmail_message_id: 'msg-abc',
        classification_result: 'FILTRE',
        confidence_score: 0.88,
        summary: 'SaaS sales pitch for IT department',
        source: 'llm',
        idempotency_key: 'msg-abc',
      }),
    )
    expect(insertCall.processing_time_ms).toEqual(expect.any(Number))
  })

  // 18. Gmail label applied after classification
  it('should apply Gmail label after saving classification', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'normal' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'BLOQUE',
      confidence: 0.95,
      reason: 'Lemlist detected',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('BLOQUE')
    ;(checkWhitelist as Mock).mockResolvedValue('none')
    const labelMap = { A_VOIR: 'lbl-1', FILTRE: 'lbl-2', BLOQUE: 'lbl-3' }
    ;(ensureLabels as Mock).mockResolvedValue(labelMap)

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(ensureLabels).toHaveBeenCalledWith('valid-token')
    expect(applyLabel).toHaveBeenCalledWith('valid-token', 'msg-abc', 'BLOQUE', labelMap)
  })

  // 19. Gmail label failure is non-fatal
  it('should complete job even when Gmail label application fails', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'normal' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'FILTRE',
      confidence: 0.90,
      reason: 'Known pattern',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')
    ;(ensureLabels as Mock).mockRejectedValue(new Error('Gmail API 429'))

    // Suppress expected console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.useRealTimers()
    await classificationLoop(supabase)

    // Classification should still be saved and job completed
    expect(supabase.insert).toHaveBeenCalled()
    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
    expect(failJob).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  // 20. GmailAuthError -> mark integration revoked
  it('should mark integration as revoked on GmailAuthError', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)
    ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')
    ;(fetchEmail as Mock).mockRejectedValue(new GmailAuthError('Access token expired'))

    vi.useRealTimers()
    await classificationLoop(supabase)

    // Should update integration status to 'revoked'
    expect(supabase.from).toHaveBeenCalledWith('user_integrations')
    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'revoked' }),
    )
    expect(failJob).toHaveBeenCalledWith(supabase, 'job-001', 'TOKEN_REVOKED', 0)
  })

  // 21. Default user settings when no settings row
  it('should use default CEO/normal when user_settings row is missing', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: null }, // No settings row
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue(null)
    ;(classifyWithLLM as Mock).mockResolvedValue({
      result: 'FILTRE',
      confidence: 0.85,
      summary: 'Generic pitch',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    // LLM should have been called with default userRole='CEO' and exposureMode='normal'
    expect(classifyWithLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        userRole: 'CEO',
        exposureMode: 'normal',
      }),
      supabase,
    )
  })

  // 22. sanitizeForLLM called before LLM
  it('should sanitize email content before sending to LLM', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'normal' } },
    })
    const email = createMockGmailEmail({
      bodyPreview: 'Patient diagnosed with cancer at hospital',
      bodyTail: 'best regards',
    })
    setupHappyPath(supabase)
    ;(fetchEmail as Mock).mockResolvedValue(email)
    ;(fingerprintEmail as Mock).mockReturnValue(null)
    ;(classifyWithLLM as Mock).mockResolvedValue({
      result: 'A_VOIR',
      confidence: 0.7,
      summary: 'Medical related email',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('A_VOIR')

    vi.useRealTimers()
    await classificationLoop(supabase)

    // sanitizeForLLM should be called on both bodyPreview and bodyTail
    expect(sanitizeForLLM).toHaveBeenCalledWith('Patient diagnosed with cancer at hospital')
    expect(sanitizeForLLM).toHaveBeenCalledWith('best regards')
    // classifyWithLLM should receive the sanitized content
    expect(classifyWithLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.stringContaining('[sanitized]'),
        tail: expect.stringContaining('[sanitized]'),
      }),
      supabase,
    )
  })

  // 23. FILTRE with high confidence in strict mode should stay FILTRE
  it('should keep FILTRE when confidence >= 0.8 in strict mode', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'strict' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'FILTRE',
      confidence: 0.90, // Above strict threshold of 0.8
      reason: 'Clear prospecting pattern',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('FILTRE')
  })

  // 24. A_VOIR is never overridden by confidence threshold
  it('should never promote A_VOIR further (threshold check skips A_VOIR)', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'strict' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue(null)
    ;(classifyWithLLM as Mock).mockResolvedValue({
      result: 'A_VOIR',
      confidence: 0.35, // Below all thresholds, but already A_VOIR
      summary: 'Potential client email',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('A_VOIR')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    // A_VOIR should remain A_VOIR regardless of confidence
    expect(insertCall.classification_result).toBe('A_VOIR')
  })

  // 25. Pipeline health updated after classification
  it('should update user_pipeline_health after successful classification', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'normal' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'FILTRE',
      confidence: 0.85,
      reason: 'Pattern match',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    // user_pipeline_health should be updated
    expect(supabase.from).toHaveBeenCalledWith('user_pipeline_health')
    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        last_classified_at: expect.any(String),
        updated_at: expect.any(String),
      }),
    )
  })

  // 26. ClassificationLogger.log called with complete event after classification
  it('should log classification_complete event with all whitelisted fields', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'normal' } },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'BLOQUE',
      confidence: 0.95,
      reason: 'Lemlist detected',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('BLOQUE')
    ;(checkWhitelist as Mock).mockResolvedValue('none')

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(ClassificationLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'classification_complete',
        email_id: 'msg-abc',
        classification_result: 'BLOQUE',
        confidence_score: 0.95,
        processing_time_ms: expect.any(Number),
        source: 'fingerprint',
      }),
    )
  })

  // 27. Domain whitelist should not affect FILTRE classification
  it('should not downgrade FILTRE when sender domain is whitelisted (only BLOQUE is downgraded)', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'normal' } },
    })
    setupHappyPath(supabase)
    ;(checkWhitelist as Mock).mockResolvedValue('domain')
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'FILTRE',
      confidence: 0.85,
      reason: 'Subject pattern',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    // FILTRE should stay FILTRE — domain whitelist only affects BLOQUE
    expect(insertCall.classification_result).toBe('FILTRE')
  })

  // 28. Generic error -> failJob with error message
  it('should failJob with error message on generic errors', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)
    ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')
    ;(fetchEmail as Mock).mockRejectedValue(new Error('Gmail API error 500: Internal Server Error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(failJob).toHaveBeenCalledWith(
      supabase,
      'job-001',
      'Gmail API error 500: Internal Server Error',
      0,
    )
    consoleSpy.mockRestore()
  })

  // 29. System whitelist is case-insensitive
  it('should match system whitelist case-insensitively', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)
    ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')
    ;(fetchEmail as Mock).mockResolvedValue(
      createMockGmailEmail({ from: 'NoReply@Kyrra.IO' }),
    )

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
    expect(fingerprintEmail).not.toHaveBeenCalled()
  })

  // 30. LLM route with FORCE_LLM_REVIEW passes sanitized content
  it('should pass sanitized content to LLM during FORCE_LLM_REVIEW re-route', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'rpc.increment_usage_counter': { data: 1 },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'strict' } },
    })
    const email = createMockGmailEmail({
      from: 'sales@competitor.com',
      subject: 'Partnership opportunity',
      bodyPreview: 'We would like to discuss a syndicat partnership',
      bodyTail: 'Best regards',
    })
    setupHappyPath(supabase)
    ;(fetchEmail as Mock).mockResolvedValue(email)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true,
      result: 'BLOQUE',
      confidence: 0.82,
      reason: 'Subject pattern match',
    })
    ;(applyClassificationSafetyRules as Mock)
      .mockReturnValueOnce('FORCE_LLM_REVIEW')
      .mockReturnValueOnce('FILTRE')
    ;(classifyWithLLM as Mock).mockResolvedValue({
      result: 'FILTRE',
      confidence: 0.78,
      summary: 'Sales pitch about partnership',
    })

    vi.useRealTimers()
    await classificationLoop(supabase)

    // sanitizeForLLM should have been called on bodyPreview and bodyTail
    expect(sanitizeForLLM).toHaveBeenCalledWith('We would like to discuss a syndicat partnership')
    expect(sanitizeForLLM).toHaveBeenCalledWith('Best regards')

    // classifyWithLLM should have received from, subject, and sanitized content
    expect(classifyWithLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'sales@competitor.com',
        subject: 'Partnership opportunity',
        userRole: 'CEO',
        exposureMode: 'strict',
      }),
      supabase,
    )
  })
})
