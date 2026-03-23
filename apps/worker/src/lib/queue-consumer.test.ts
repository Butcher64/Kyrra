import { describe, it, expect, vi } from 'vitest'
import { claimNextJob, completeJob, failJob } from './queue-consumer'

/**
 * Create a mock Supabase client that tracks chained method calls.
 * `returnData` is what .single() resolves to (for claimNextJob).
 */
function createMockSupabase(returnData: any = null) {
  const updateValues: Record<string, any>[] = []
  const eqFilters: Array<[string, any]> = []

  const chain = {
    update: vi.fn((values: any) => {
      updateValues.push(values)
      return chain
    }),
    eq: vi.fn((field: string, value: any) => {
      eqFilters.push([field, value])
      return chain
    }),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: returnData })),
  }

  return {
    from: vi.fn(() => chain),
    _chain: chain,
    _updateValues: updateValues,
    _eqFilters: eqFilters,
  }
}

// ── claimNextJob ──

describe('claimNextJob', () => {
  it('returns job data when a pending job exists', async () => {
    const job = { id: 'job-1', gmail_message_id: 'msg-1', user_id: 'u-1', retry_count: 0 }
    const supabase = createMockSupabase(job)

    const result = await claimNextJob(supabase)
    expect(result).toEqual(job)
  })

  it('returns null when no pending jobs exist', async () => {
    const supabase = createMockSupabase(null)

    const result = await claimNextJob(supabase)
    expect(result).toBeNull()
  })

  it('updates status to processing', async () => {
    const supabase = createMockSupabase({ id: 'job-1' })

    await claimNextJob(supabase)

    expect(supabase._chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'processing' }),
    )
  })

  it('sets claimed_at timestamp', async () => {
    const supabase = createMockSupabase({ id: 'job-1' })

    await claimNextJob(supabase)

    const updateArg = supabase._chain.update.mock.calls[0]![0]
    expect(updateArg.claimed_at).toBeDefined()
    // Should be a valid ISO string
    expect(new Date(updateArg.claimed_at).toISOString()).toBe(updateArg.claimed_at)
  })

  it('filters by status=pending and orders by created_at', async () => {
    const supabase = createMockSupabase(null)

    await claimNextJob(supabase)

    expect(supabase._chain.eq).toHaveBeenCalledWith('status', 'pending')
    expect(supabase._chain.order).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(supabase._chain.limit).toHaveBeenCalledWith(1)
  })

  it('queries from email_queue_items table', async () => {
    const supabase = createMockSupabase(null)

    await claimNextJob(supabase)

    expect(supabase.from).toHaveBeenCalledWith('email_queue_items')
  })
})

// ── completeJob ──

describe('completeJob', () => {
  it('updates job status to completed', async () => {
    const supabase = createMockSupabase()

    await completeJob(supabase, 'job-42')

    expect(supabase._chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed' }),
    )
  })

  it('sets processed_at timestamp', async () => {
    const supabase = createMockSupabase()

    await completeJob(supabase, 'job-42')

    const updateArg = supabase._chain.update.mock.calls[0]![0]
    expect(updateArg.processed_at).toBeDefined()
  })

  it('filters by job id', async () => {
    const supabase = createMockSupabase()

    await completeJob(supabase, 'job-42')

    expect(supabase._chain.eq).toHaveBeenCalledWith('id', 'job-42')
  })
})

// ── failJob — retry logic ──

describe('failJob — retry logic', () => {
  it('resets to pending when retryCount < 3', async () => {
    const supabase = createMockSupabase()

    await failJob(supabase, 'job-1', 'timeout', 0)

    expect(supabase._chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        retry_count: 1,
        error_message: 'timeout',
        claimed_at: null,
      }),
    )
  })

  it('increments retry_count correctly for retryCount=1', async () => {
    const supabase = createMockSupabase()

    await failJob(supabase, 'job-1', 'error', 1)

    const updateArg = supabase._chain.update.mock.calls[0]![0]
    expect(updateArg.retry_count).toBe(2)
    expect(updateArg.status).toBe('pending')
  })

  it('increments retry_count correctly for retryCount=2', async () => {
    const supabase = createMockSupabase()

    await failJob(supabase, 'job-1', 'error', 2)

    const updateArg = supabase._chain.update.mock.calls[0]![0]
    expect(updateArg.retry_count).toBe(3)
    expect(updateArg.status).toBe('pending')
  })

  it('marks as permanently failed when retryCount >= 3', async () => {
    const supabase = createMockSupabase()

    await failJob(supabase, 'job-1', 'max retries', 3)

    expect(supabase._chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        error_message: 'max retries',
      }),
    )
  })

  it('sets processed_at when permanently failed', async () => {
    const supabase = createMockSupabase()

    await failJob(supabase, 'job-1', 'done', 3)

    const updateArg = supabase._chain.update.mock.calls[0]![0]
    expect(updateArg.processed_at).toBeDefined()
  })

  it('does NOT set processed_at when retrying', async () => {
    const supabase = createMockSupabase()

    await failJob(supabase, 'job-1', 'retry', 0)

    const updateArg = supabase._chain.update.mock.calls[0]![0]
    expect(updateArg.processed_at).toBeUndefined()
  })

  it('clears claimed_at when retrying (so another worker can pick it up)', async () => {
    const supabase = createMockSupabase()

    await failJob(supabase, 'job-1', 'retry', 1)

    const updateArg = supabase._chain.update.mock.calls[0]![0]
    expect(updateArg.claimed_at).toBeNull()
  })

  it('stores error message on both retry and permanent failure paths', async () => {
    const supabaseRetry = createMockSupabase()
    await failJob(supabaseRetry, 'job-1', 'network timeout', 0)
    expect(supabaseRetry._chain.update.mock.calls[0]![0].error_message).toBe('network timeout')

    const supabaseFail = createMockSupabase()
    await failJob(supabaseFail, 'job-2', 'gave up', 3)
    expect(supabaseFail._chain.update.mock.calls[0]![0].error_message).toBe('gave up')
  })
})
