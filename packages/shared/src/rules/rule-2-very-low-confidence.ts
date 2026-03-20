import type { ClassificationResult } from '../constants/classification'

/**
 * Safety Rule 2: Confidence < 60% → promote to A_VOIR
 * Very uncertain classifications should always be surfaced for user review
 */
export function applyRule2(
  result: ClassificationResult,
  confidence: number,
): ClassificationResult {
  if (confidence < 0.6) {
    return 'A_VOIR'
  }
  return result
}
