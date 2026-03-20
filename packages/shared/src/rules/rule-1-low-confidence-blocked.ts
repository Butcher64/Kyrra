import type { ClassificationResult } from '../constants/classification'

/**
 * Safety Rule 1: Confidence < 75% + BLOQUE → downgrade to FILTRE
 * Prevents blocking emails when classification is uncertain
 */
export function applyRule1(
  result: ClassificationResult,
  confidence: number,
): ClassificationResult {
  if (result === 'BLOQUE' && confidence < 0.75) {
    return 'FILTRE'
  }
  return result
}
