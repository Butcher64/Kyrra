/**
 * Queue Consumer — Atomic job claiming (ADR-001)
 * ALWAYS use claimNextJob() — NEVER SELECT + UPDATE (race condition)
 *
 * Source: [architecture.md — Communication Patterns, Queue Atomicity]
 */

/**
 * Atomically claim the next pending job from the queue
 * Uses UPDATE...WHERE status='pending' ORDER BY created_at LIMIT 1
 * Returns null if no pending jobs (another worker claimed it first)
 */
export async function claimNextJob(supabase: any) {
  const { data } = await supabase
    .from('email_queue_items')
    .update({
      status: 'processing',
      claimed_at: new Date().toISOString(),
    })
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .select()
    .single()

  return data // null = no pending job
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
