/**
 * Timeout wrapper for async operations (B9.1)
 * Prevents worker loops from hanging indefinitely on Supabase/external calls.
 */

export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

/**
 * Wrap an async operation with a timeout.
 * Resolves with the operation result, or rejects with TimeoutError.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string = 'operation',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timer!)
    return result
  } catch (error) {
    clearTimeout(timer!)
    throw error
  }
}
