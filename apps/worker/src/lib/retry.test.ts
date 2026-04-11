import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withRetry } from './retry'

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should retry and succeed on 2nd attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('429'))
      .mockResolvedValue('ok')

    const promise = withRetry(fn, { baseDelayMs: 100 })
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should retry and succeed on 3rd attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValue('ok')

    const promise = withRetry(fn, { baseDelayMs: 100 })
    await vi.advanceTimersByTimeAsync(500)
    const result = await promise

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should throw last error after all attempts exhausted', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('err-1'))
      .mockRejectedValueOnce(new Error('err-2'))
      .mockRejectedValueOnce(new Error('err-3'))

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 50 })
    await vi.advanceTimersByTimeAsync(500)

    await expect(promise).rejects.toThrow('err-3')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should respect maxAttempts=1 (no retry)', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'))

    await expect(
      withRetry(fn, { maxAttempts: 1 }),
    ).rejects.toThrow('fail')

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should log warning on retry attempts', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValue('ok')

    const promise = withRetry(fn, { baseDelayMs: 50, label: 'testOp' })
    await vi.advanceTimersByTimeAsync(200)
    await promise

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[RETRY] testOp attempt 1/3 failed: transient'),
    )
  })

  it('should use exponential backoff (delay doubles each attempt)', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('ok')

    // jitter=0 for deterministic test
    const promise = withRetry(fn, { baseDelayMs: 100, jitter: 0 })

    // After 100ms: 1st retry fires (100ms * 2^0 = 100ms)
    await vi.advanceTimersByTimeAsync(100)
    expect(fn).toHaveBeenCalledTimes(2)

    // After another 200ms: 2nd retry fires (100ms * 2^1 = 200ms)
    await vi.advanceTimersByTimeAsync(200)
    const result = await promise
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
