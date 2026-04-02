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
  fetchEmailMetadata: vi.fn(),
  fetchEmailBody: vi.fn(),
  ensureDynamicLabels: vi.fn(),
  applyDynamicLabel: vi.fn(),
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

vi.mock('./lib/prefilter', () => ({
  prefilterEmail: vi.fn(),
}))

vi.mock('./lib/prompt-builder', () => ({
  buildSystemPrompt: vi.fn(() => 'mock-system-prompt'),
}))

vi.mock('@kyrra/shared', () => ({
  SYSTEM_WHITELISTED_SENDERS: ['noreply@kyrra.io', 'recap@kyrra.io', 'support@kyrra.io'],
  applyClassificationSafetyRules: vi.fn(),
  LEGACY_RESULT_TO_DEFAULT_LABEL: {
    A_VOIR: ['Important'],
    FILTRE: ['Newsletter', 'Notifications', 'Prospection utile'],
    BLOQUE: ['Prospection', 'Spam'],
  },
}))

// ── Imports (after mocks) ──

import { classificationLoop } from './classification'
import { claimNextJob, completeJob, failJob } from './lib/queue-consumer'
import { fingerprintEmail } from './lib/fingerprinting'
import { classifyWithLLM } from './lib/llm-gateway'
import { stripPIIFromSummary, sanitizeForLLM } from './lib/pii-stripper'
import { getValidAccessToken, fetchEmailMetadata, fetchEmailBody, ensureDynamicLabels, applyDynamicLabel, GmailAuthError } from './lib/gmail'
import { ClassificationLogger } from './lib/classification-logger'
import { checkWhitelist } from './lib/whitelist-check'
import { prefilterEmail } from './lib/prefilter'
import { applyClassificationSafetyRules } from '@kyrra/shared'

// ── Constants ──

const MOCK_USER_LABELS = [
  { id: 'lbl-important', user_id: 'user-123', name: 'Important', description: '', prompt: '', color: '#2d4a8a', gmail_label_id: null, gmail_label_name: null, is_default: true, position: 0 },
  { id: 'lbl-transac', user_id: 'user-123', name: 'Transactionnel', description: '', prompt: '', color: '#4a7a2d', gmail_label_id: null, gmail_label_name: null, is_default: true, position: 1 },
  { id: 'lbl-notif', user_id: 'user-123', name: 'Notifications', description: '', prompt: '', color: '#7a5a2d', gmail_label_id: null, gmail_label_name: null, is_default: true, position: 2 },
  { id: 'lbl-news', user_id: 'user-123', name: 'Newsletter', description: '', prompt: '', color: '#5a5a5a', gmail_label_id: null, gmail_label_name: null, is_default: true, position: 3 },
  { id: 'lbl-prospu', user_id: 'user-123', name: 'Prospection utile', description: '', prompt: '', color: '#8a6a2d', gmail_label_id: null, gmail_label_name: null, is_default: true, position: 4 },
  { id: 'lbl-prosp', user_id: 'user-123', name: 'Prospection', description: '', prompt: '', color: '#8a4a2d', gmail_label_id: null, gmail_label_name: null, is_default: true, position: 5 },
  { id: 'lbl-spam', user_id: 'user-123', name: 'Spam', description: '', prompt: '', color: '#8a2d2d', gmail_label_id: null, gmail_label_name: null, is_default: true, position: 6 },
]

const MOCK_GMAIL_LABEL_MAP: Record<string, string> = {
  'lbl-important': 'gmail-important',
  'lbl-transac': 'gmail-transac',
  'lbl-notif': 'gmail-notif',
  'lbl-news': 'gmail-news',
  'lbl-prospu': 'gmail-prospu',
  'lbl-prosp': 'gmail-prosp',
  'lbl-spam': 'gmail-spam',
}

// ── Helpers ──

/**
 * Chainable + thenable mock Supabase client.
 * Terminal methods (.single(), .maybeSingle()) return Promises.
 * The chain itself is thenable for non-terminal queries (insert, update, select without terminal).
 */
function createMockSupabase(mockReturns: Record<string, any> = {}) {
  const defaults: Record<string, any> = {
    'user_integrations.select.single': { data: null },
    'email_classifications.select.maybeSingle': { data: null },
    'user_settings.select.maybeSingle': { data: null },
    'usage_counters.select.maybeSingle': { data: null },
    'user_labels.select': { data: MOCK_USER_LABELS },
    'rpc.increment_usage_counter': { data: 1 },
    ...mockReturns,
  }

  let currentTable = ''
  let currentOp = ''

  const chain: any = {}

  const chainMethods = ['from', 'select', 'insert', 'update', 'upsert', 'eq', 'order', 'limit', 'gte', 'in', 'lte']

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

  // Make chain thenable for non-terminal queries (insert, update, select-without-terminal)
  chain.then = (resolve: any, reject?: any) => {
    const key = `${currentTable}.${currentOp}`
    if (key in defaults) return Promise.resolve(defaults[key]).then(resolve, reject)
    if (currentOp === 'insert' || currentOp === 'update') {
      return Promise.resolve({ data: null, error: null }).then(resolve, reject)
    }
    return Promise.resolve({ data: null }).then(resolve, reject)
  }

  return chain
}

function createMockJob(overrides: Partial<{
  id: string; user_id: string; gmail_message_id: string; retry_count: number
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

function createMockMetadata(overrides: Partial<{
  from: string; subject: string; headers: Record<string, string>
}> = {}) {
  return {
    from: 'sender@example.com',
    subject: 'Hello World',
    headers: { from: 'sender@example.com', subject: 'Hello World' },
    ...overrides,
  }
}

function createMockBody(overrides: Partial<{
  bodyPreview: string; bodyTail: string
}> = {}) {
  return {
    bodyPreview: 'Hello world body preview text',
    bodyTail: 'regards',
    ...overrides,
  }
}

/** Standard user_settings that passes the credit check (daily_credit_limit > 0) */
const SETTINGS_CEO_NORMAL = { user_role: 'CEO', exposure_mode: 'normal', daily_credit_limit: 1000 }
const SETTINGS_CEO_STRICT = { user_role: 'CEO', exposure_mode: 'strict', daily_credit_limit: 1000 }
const SETTINGS_CEO_PERMISSIVE = { user_role: 'CEO', exposure_mode: 'permissive', daily_credit_limit: 1000 }

/** Wire up all happy-path mocks so tests can override individual steps */
function setupHappyPath(supabase: any) {
  const job = createMockJob()
  const metadata = createMockMetadata()
  const body = createMockBody()

  ;(claimNextJob as Mock).mockResolvedValue(job)
  ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')
  ;(fetchEmailMetadata as Mock).mockResolvedValue(metadata)
  ;(fetchEmailBody as Mock).mockResolvedValue(body)
  ;(checkWhitelist as Mock).mockResolvedValue('none')
  ;(prefilterEmail as Mock).mockReturnValue(null)
  ;(fingerprintEmail as Mock).mockReturnValue(null)
  ;(classifyWithLLM as Mock).mockResolvedValue({
    result: 'FILTRE',
    confidence: 0.85,
    summary: 'Commercial prospecting email',
    labelName: 'Newsletter',
  })
  ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')
  ;(stripPIIFromSummary as Mock).mockImplementation((s: string) => s)
  ;(sanitizeForLLM as Mock).mockImplementation((s: string) => `[sanitized]${s}`)
  ;(ensureDynamicLabels as Mock).mockResolvedValue(MOCK_GMAIL_LABEL_MAP)
  ;(applyDynamicLabel as Mock).mockResolvedValue(undefined)
  ;(completeJob as Mock).mockResolvedValue(undefined)
  ;(failJob as Mock).mockResolvedValue(undefined)

  return { job, metadata, body }
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
    await vi.advanceTimersByTimeAsync(1000)
    await promise

    expect(claimNextJob).toHaveBeenCalledWith(supabase)
    expect(completeJob).not.toHaveBeenCalled()
  })

  // 2. No active integration
  it('should failJob when no active Gmail integration exists', async () => {
    const supabase = createMockSupabase()
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)

    await classificationLoop(supabase)

    expect(failJob).toHaveBeenCalledWith(supabase, 'job-001', 'NO_ACTIVE_INTEGRATION', 0)
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

  // 3b. No labels configured
  it('should completeJob without classifying when user has no labels', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_labels.select': { data: [] },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)
    ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')

    await classificationLoop(supabase)

    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
    expect(fetchEmailMetadata).not.toHaveBeenCalled()
  })

  // 4. System whitelist (kyrra.io)
  it('should skip classification for system whitelisted senders', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)
    ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')
    ;(fetchEmailMetadata as Mock).mockResolvedValue(
      createMockMetadata({ from: 'recap@kyrra.io', headers: { from: 'recap@kyrra.io' } }),
    )

    await classificationLoop(supabase)

    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
    expect(checkWhitelist).not.toHaveBeenCalled()
  })

  // 5. User whitelist exact match
  it('should skip classification and log when user whitelist exact match', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)
    ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')
    ;(fetchEmailMetadata as Mock).mockResolvedValue(createMockMetadata())
    ;(checkWhitelist as Mock).mockResolvedValue('exact')

    await classificationLoop(supabase)

    expect(ClassificationLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'classification_skipped', reason: 'whitelist_exact_match' }),
    )
    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
  })

  // 6. Already classified (idempotency)
  it('should skip when email is already classified', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'email_classifications.select.maybeSingle': { data: { id: 'cls-existing' } },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)
    ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')
    ;(fetchEmailMetadata as Mock).mockResolvedValue(createMockMetadata())
    ;(checkWhitelist as Mock).mockResolvedValue('none')

    await classificationLoop(supabase)

    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
    expect(fingerprintEmail).not.toHaveBeenCalled()
  })

  // 7. Daily limit reached
  it('should skip classification when daily usage limit is reached', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'normal', daily_credit_limit: 30 } },
      'usage_counters.select.maybeSingle': { data: { count: 30 } },
    })
    setupHappyPath(supabase)
    ;(prefilterEmail as Mock).mockReturnValue(null)

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(ClassificationLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'classification_skipped', reason: 'daily_limit_reached' }),
    )
    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
  })

  // 7b. No credits (daily_credit_limit = 0)
  it('should skip classification when user has no credits', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: { user_role: 'CEO', exposure_mode: 'normal', daily_credit_limit: 0 } },
    })
    setupHappyPath(supabase)
    ;(prefilterEmail as Mock).mockReturnValue(null)

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(ClassificationLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'classification_skipped', reason: 'no_credits' }),
    )
  })

  // 7c. Prefilter match → instant classification without body fetch
  it('should classify instantly via prefilter without fetching body', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
    })
    setupHappyPath(supabase)
    ;(prefilterEmail as Mock).mockReturnValue({
      result: 'BLOQUE',
      confidence: 0.95,
      reason: 'Known bulk sender domain',
    })

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(fetchEmailBody).not.toHaveBeenCalled()
    expect(fingerprintEmail).not.toHaveBeenCalled()
    expect(supabase.insert).toHaveBeenCalled()
    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.source).toBe('prefilter')
    expect(insertCall.label_id).toBe('lbl-prosp') // BLOQUE → Prospection (first candidate, position 5)
    expect(insertCall.classification_result).toBe('BLOQUE')
    expect(completeJob).toHaveBeenCalled()
  })

  // 8. Fingerprint match → direct classification
  it('should classify directly when fingerprint matches', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_NORMAL },
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
    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('BLOQUE')
    expect(insertCall.label_id).toBe('lbl-prosp') // BLOQUE → Prospection (first candidate)
    expect(completeJob).toHaveBeenCalled()
  })

  // 9. Fingerprint + safety rules → FORCE_LLM_REVIEW → LLM succeeds
  it('should route to LLM when safety rules return FORCE_LLM_REVIEW', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_NORMAL },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true, result: 'BLOQUE', confidence: 0.82, reason: 'Domain reputation',
    })
    ;(applyClassificationSafetyRules as Mock)
      .mockReturnValueOnce('FORCE_LLM_REVIEW')
      .mockReturnValueOnce('FILTRE')
    ;(classifyWithLLM as Mock).mockResolvedValue({
      result: 'FILTRE', confidence: 0.78, summary: 'Borderline prospecting', labelName: 'Newsletter',
    })

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(classifyWithLLM).toHaveBeenCalled()
    expect(fetchEmailBody).toHaveBeenCalled()
    expect(sanitizeForLLM).toHaveBeenCalled()
    expect(completeJob).toHaveBeenCalled()
  })

  // 10. FORCE_LLM_REVIEW → LLM fails → downgrade to FILTRE
  it('should downgrade to FILTRE when LLM fails after FORCE_LLM_REVIEW', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_NORMAL },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true, result: 'BLOQUE', confidence: 0.85, reason: 'Tool signature',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FORCE_LLM_REVIEW')
    ;(classifyWithLLM as Mock).mockResolvedValue(null)

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('FILTRE')
    expect(insertCall.label_id).toBe('lbl-news') // FILTRE → Newsletter (position 3)
    expect(insertCall.confidence_score).toBeCloseTo(0.68) // 0.85 * 0.8
  })

  // 11. No fingerprint → LLM succeeds
  it('should route to LLM when fingerprinting returns null', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: { ...SETTINGS_CEO_NORMAL, user_role: 'DRH' } },
    })
    setupHappyPath(supabase)
    ;(classifyWithLLM as Mock).mockResolvedValue({
      result: 'A_VOIR', confidence: 0.75, summary: 'Relevant HR tool offer', labelName: 'Important',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('A_VOIR')

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(classifyWithLLM).toHaveBeenCalled()
    expect(fetchEmailBody).toHaveBeenCalled()
    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('A_VOIR')
    expect(insertCall.label_id).toBe('lbl-important')
    expect(insertCall.source).toBe('llm')
  })

  // 12. No fingerprint → LLM fails → A_VOIR fallback
  it('should fallback to A_VOIR when both fingerprint and LLM fail', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_NORMAL },
    })
    setupHappyPath(supabase)
    ;(classifyWithLLM as Mock).mockResolvedValue(null)

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('A_VOIR')
    expect(insertCall.label_id).toBe('lbl-important')
    expect(insertCall.confidence_score).toBe(0.3)
    expect(insertCall.summary).toBe('Unable to classify — manual review recommended')
  })

  // 13. Domain whitelist: BLOQUE → A_VOIR downgrade
  it('should downgrade to A_VOIR when sender domain is whitelisted and label is Prospection/Spam', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_NORMAL },
    })
    setupHappyPath(supabase)
    ;(checkWhitelist as Mock).mockResolvedValue('domain')
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true, result: 'BLOQUE', confidence: 0.95, reason: 'Tool signature',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('BLOQUE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('A_VOIR')
    expect(insertCall.label_id).toBe('lbl-important')
  })

  // 14. Strict mode: confidence < 0.8 → promote to A_VOIR
  it('should promote to A_VOIR when confidence < 0.8 in strict mode', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_STRICT },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true, result: 'FILTRE', confidence: 0.75, reason: 'Subject pattern',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('A_VOIR')
    expect(insertCall.label_id).toBe('lbl-important')
  })

  // 15. Normal mode: confidence < 0.6 → promote to A_VOIR
  it('should promote to A_VOIR when confidence < 0.6 in normal mode', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_NORMAL },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true, result: 'BLOQUE', confidence: 0.55, reason: 'Weak signal',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('BLOQUE')
    ;(checkWhitelist as Mock).mockResolvedValue('none')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('A_VOIR')
  })

  // 16. Permissive mode: confidence < 0.4 → promote to A_VOIR
  it('should promote to A_VOIR when confidence < 0.4 in permissive mode', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_PERMISSIVE },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true, result: 'FILTRE', confidence: 0.35, reason: 'Very weak signal',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('A_VOIR')
  })

  // 16b. Permissive mode: confidence >= 0.4 → keep FILTRE
  it('should keep FILTRE when confidence >= 0.4 in permissive mode', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_PERMISSIVE },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true, result: 'FILTRE', confidence: 0.65, reason: 'Known pattern',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('FILTRE')
  })

  // 17. Classification saved with correct fields
  it('should save classification with all required fields including label_id', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: { ...SETTINGS_CEO_NORMAL, user_role: 'DSI' } },
    })
    setupHappyPath(supabase)
    ;(classifyWithLLM as Mock).mockResolvedValue({
      result: 'FILTRE', confidence: 0.88, summary: 'SaaS sales pitch', labelName: 'Newsletter',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall).toEqual(
      expect.objectContaining({
        user_id: 'user-123',
        gmail_message_id: 'msg-abc',
        classification_result: 'FILTRE',
        label_id: 'lbl-news',
        confidence_score: 0.88,
        summary: 'SaaS sales pitch',
        source: 'llm',
        idempotency_key: 'msg-abc',
        sender_display: expect.any(String),
        subject_snippet: expect.any(String),
      }),
    )
    expect(insertCall.processing_time_ms).toEqual(expect.any(Number))
  })

  // 18. Gmail dynamic label applied after classification
  it('should apply dynamic Gmail label after saving classification', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_NORMAL },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true, result: 'BLOQUE', confidence: 0.95, reason: 'Lemlist detected',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('BLOQUE')
    ;(checkWhitelist as Mock).mockResolvedValue('none')

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(ensureDynamicLabels).toHaveBeenCalledWith('valid-token', expect.any(Array))
    expect(applyDynamicLabel).toHaveBeenCalledWith(
      'valid-token',
      'msg-abc',
      'gmail-prosp', // BLOQUE → Prospection label's gmail ID
      expect.any(Array),
    )
  })

  // 19. Gmail label failure is non-fatal
  it('should complete job even when Gmail label application fails', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_NORMAL },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true, result: 'FILTRE', confidence: 0.90, reason: 'Known pattern',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')
    ;(ensureDynamicLabels as Mock).mockRejectedValue(new Error('Gmail API 429'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(supabase.insert).toHaveBeenCalled()
    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
    expect(failJob).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  // 20. GmailAuthError → mark integration revoked
  it('should mark integration as revoked on GmailAuthError', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)
    ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')
    ;(fetchEmailMetadata as Mock).mockRejectedValue(new GmailAuthError('Access token expired'))

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(supabase.from).toHaveBeenCalledWith('user_integrations')
    expect(supabase.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'revoked' }))
    expect(failJob).toHaveBeenCalledWith(supabase, 'job-001', 'TOKEN_REVOKED', 0)
  })

  // 21. Default user settings when no settings row — credits still available via admin role
  it('should use default CEO/normal when user_settings is missing but admin bypasses credit check', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      // role='admin' bypasses the credit check entirely, simulating a no-settings scenario
      'user_settings.select.maybeSingle': { data: { role: 'admin' } },
    })
    setupHappyPath(supabase)
    ;(classifyWithLLM as Mock).mockResolvedValue({
      result: 'FILTRE', confidence: 0.85, summary: 'Generic pitch', labelName: 'Newsletter',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    // LLM should have been called with default userRole='CEO' and exposureMode='normal'
    expect(classifyWithLLM).toHaveBeenCalledWith(
      expect.objectContaining({ userRole: 'CEO', exposureMode: 'normal' }),
      supabase,
      expect.any(String), // dynamicPrompt
    )
  })

  // 22. sanitizeForLLM called before LLM
  it('should sanitize email content before sending to LLM', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_NORMAL },
    })
    setupHappyPath(supabase)
    ;(fetchEmailBody as Mock).mockResolvedValue(
      createMockBody({ bodyPreview: 'Patient diagnosed with cancer', bodyTail: 'best regards' }),
    )
    ;(classifyWithLLM as Mock).mockResolvedValue({
      result: 'A_VOIR', confidence: 0.7, summary: 'Medical email', labelName: 'Important',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('A_VOIR')

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(sanitizeForLLM).toHaveBeenCalledWith('Patient diagnosed with cancer')
    expect(sanitizeForLLM).toHaveBeenCalledWith('best regards')
    expect(classifyWithLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.stringContaining('[sanitized]'),
        tail: expect.stringContaining('[sanitized]'),
      }),
      supabase,
      expect.any(String),
    )
  })

  // 23. Strict mode: confidence >= 0.8 → keep FILTRE
  it('should keep FILTRE when confidence >= 0.8 in strict mode', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_STRICT },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true, result: 'FILTRE', confidence: 0.90, reason: 'Clear pattern',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('FILTRE')
  })

  // 24. A_VOIR never overridden by confidence threshold
  it('should never promote A_VOIR further', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_STRICT },
    })
    setupHappyPath(supabase)
    ;(classifyWithLLM as Mock).mockResolvedValue({
      result: 'A_VOIR', confidence: 0.35, summary: 'Potential client', labelName: 'Important',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('A_VOIR')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('A_VOIR')
  })

  // 25. Pipeline health updated after classification
  it('should update user_pipeline_health after successful classification', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_NORMAL },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true, result: 'FILTRE', confidence: 0.85, reason: 'Pattern',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(supabase.from).toHaveBeenCalledWith('user_pipeline_health')
    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ last_classified_at: expect.any(String) }),
    )
  })

  // 26. ClassificationLogger.log called with label_name
  it('should log classification_complete with label_name', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_NORMAL },
    })
    setupHappyPath(supabase)
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true, result: 'BLOQUE', confidence: 0.95, reason: 'Lemlist detected',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('BLOQUE')
    ;(checkWhitelist as Mock).mockResolvedValue('none')

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(ClassificationLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'classification_complete',
        email_id: 'msg-abc',
        label_name: 'Prospection',
        confidence_score: 0.95,
        source: 'fingerprint',
      }),
    )
  })

  // 27. Domain whitelist should not affect FILTRE
  it('should not downgrade FILTRE when sender domain is whitelisted', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_NORMAL },
    })
    setupHappyPath(supabase)
    ;(checkWhitelist as Mock).mockResolvedValue('domain')
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true, result: 'FILTRE', confidence: 0.85, reason: 'Subject pattern',
    })
    ;(applyClassificationSafetyRules as Mock).mockReturnValue('FILTRE')

    vi.useRealTimers()
    await classificationLoop(supabase)

    const insertCall = (supabase.insert as Mock).mock.calls[0][0]
    expect(insertCall.classification_result).toBe('FILTRE')
  })

  // 28. Generic error → failJob
  it('should failJob with error message on generic errors', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
    })
    const job = createMockJob()
    ;(claimNextJob as Mock).mockResolvedValue(job)
    ;(getValidAccessToken as Mock).mockResolvedValue('valid-token')
    ;(fetchEmailMetadata as Mock).mockRejectedValue(new Error('Gmail API error 500'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(failJob).toHaveBeenCalledWith(supabase, 'job-001', 'Gmail API error 500', 0)
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
    ;(fetchEmailMetadata as Mock).mockResolvedValue(
      createMockMetadata({ from: 'NoReply@Kyrra.IO', headers: { from: 'NoReply@Kyrra.IO' } }),
    )

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(completeJob).toHaveBeenCalledWith(supabase, 'job-001')
    expect(fingerprintEmail).not.toHaveBeenCalled()
  })

  // 30. FORCE_LLM_REVIEW passes sanitized content
  it('should pass sanitized content to LLM during FORCE_LLM_REVIEW', async () => {
    const supabase = createMockSupabase({
      'user_integrations.select.single': { data: { id: 'int-1', user_id: 'user-123' } },
      'user_settings.select.maybeSingle': { data: SETTINGS_CEO_STRICT },
    })
    setupHappyPath(supabase)
    ;(fetchEmailMetadata as Mock).mockResolvedValue(
      createMockMetadata({ from: 'sales@competitor.com', subject: 'Partnership', headers: { from: 'sales@competitor.com', subject: 'Partnership' } }),
    )
    ;(fetchEmailBody as Mock).mockResolvedValue(
      createMockBody({ bodyPreview: 'We would like to discuss', bodyTail: 'Best regards' }),
    )
    ;(fingerprintEmail as Mock).mockReturnValue({
      classified: true, result: 'BLOQUE', confidence: 0.82, reason: 'Subject pattern',
    })
    ;(applyClassificationSafetyRules as Mock)
      .mockReturnValueOnce('FORCE_LLM_REVIEW')
      .mockReturnValueOnce('FILTRE')
    ;(classifyWithLLM as Mock).mockResolvedValue({
      result: 'FILTRE', confidence: 0.78, summary: 'Sales pitch', labelName: 'Newsletter',
    })

    vi.useRealTimers()
    await classificationLoop(supabase)

    expect(sanitizeForLLM).toHaveBeenCalledWith('We would like to discuss')
    expect(sanitizeForLLM).toHaveBeenCalledWith('Best regards')
    expect(classifyWithLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'sales@competitor.com',
        subject: 'Partnership',
        userRole: 'CEO',
        exposureMode: 'strict',
      }),
      supabase,
      expect.any(String),
    )
  })
})
