/**
 * Generic async retry with exponential backoff + jitter
 * Used for external API calls (Gmail, Postmark) where transient failures are expected.
 */

export interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number
  /** Base delay in ms before first retry (default: 1000) */
  baseDelayMs?: number
  /** Jitter factor 0-1 to randomize delay ±N% (default: 0.25) */
  jitter?: number
  /** Label for logging (e.g., 'applyDynamicLabel') */
  label?: string
}

/**
 * Execute an async function with retry on failure.
 * Backoff: baseDelay * 2^(attempt-1) ± jitter
 *
 * @returns The result of fn() on success
 * @throws The last error after all attempts are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    jitter = 0.25,
    label = 'operation',
  } = options

  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxAttempts) {
        break
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      const jitterRange = delay * jitter
      const jitteredDelay = delay + (Math.random() * 2 - 1) * jitterRange

      console.warn(
        `[RETRY] ${label} attempt ${attempt}/${maxAttempts} failed: ${lastError.message}. Retrying in ${Math.round(jitteredDelay)}ms...`,
      )

      await new Promise((resolve) => setTimeout(resolve, jitteredDelay))
    }
  }

  throw lastError!
}
