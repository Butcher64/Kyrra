import type { ClassificationResult } from '../constants/classification'

/**
 * Safety Rule 3: New users (< 14 days) — notify on every BLOQUE classification
 * Returns a notification flag alongside the unchanged result.
 * The worker uses the flag to trigger a low-confidence notification email.
 * Does NOT alter the classification result.
 */
export interface Rule3Result {
  result: ClassificationResult
  shouldNotify: boolean
}

export function applyRule3(
  result: ClassificationResult,
  accountAgeDays: number,
): Rule3Result {
  const shouldNotify = result === 'BLOQUE' && accountAgeDays < 14
  return { result, shouldNotify }
}
