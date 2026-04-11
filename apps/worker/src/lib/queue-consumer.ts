/**
 * Queue Consumer — Atomic job claiming (ADR-001)
 * Uses a Postgres function for atomic SELECT FOR UPDATE SKIP LOCKED
 */

import { withTimeout } from './timeout'

const RPC_TIMEOUT_MS = 10_000 // B9.1: 10s timeout on RPC calls

/**
 * Atomically claim the next pending job from the queue
 * Uses Postgres function with FOR UPDATE SKIP LOCKED for true atomicity
 * Returns null if no pending jobs
 */
export async function claimNextJob(supabase: any) {
  // Force the Supabase builder to resolve as a real Promise (not just thenable)
  // so withTimeout can actually race against it
  const { data, error } = await withTimeout<{ data: any; error: any }>(
    Promise.resolve(supabase.rpc('claim_next_queue_item')),
    RPC_TIMEOUT_MS,
    'claimNextJob',
  )

  if (error) {
    console.error('[queue] claimNextJob RPC error:', error.message)
    return null
  }

  // RPC returns an array — get the first item
  if (!data || data.length === 0) return null
  return data[0]
}

/**
 * Mark a job as completed
 */
export async function completeJob(supabase: any, jobId: string) {
  await supabase
    .from('email_queue_items')
    .update({
      status: 'completed',
      processed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
}

/**
 * Mark a job as failed with error message
 * Increments retry_count. After 3 retries → stays failed.
 */
export async function failJob(supabase: any, jobId: string, errorMessage: string, retryCount: number) {
  if (retryCount < 3) {
    // Retry: reset to pending with incremented count
    await supabase
      .from('email_queue_items')
      .update({
        status: 'pending',
        retry_count: retryCount + 1,
        error_message: errorMessage,
        claimed_at: null,
      })
      .eq('id', jobId)
  } else {
    // Max retries reached — mark as failed permanently
    await supabase
      .from('email_queue_items')
      .update({
        status: 'failed',
        error_message: errorMessage,
        processed_at: new Date().toISOString(),
      })
      .eq('id', jobId)
  }
}
