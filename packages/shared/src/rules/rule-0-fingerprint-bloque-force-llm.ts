import type { ClassificationResult } from '../constants/classification'
import type { ClassificationSignal } from '../types/classification-signal'

/**
 * Safety Rule 0: Fingerprint BLOQUE with confidence < 90% → force LLM review
 * Prevents high-confidence fingerprint false positives on critical emails
 * FORCE_LLM_REVIEW is a routing signal — NEVER written to DB
 */
export function applyRule0(
  result: ClassificationResult,
  confidence: number,
  source: 'fingerprint' | 'llm',
): ClassificationSignal {
  if (source === 'fingerprint' && result === 'BLOQUE' && confidence < 0.9) {
    return 'FORCE_LLM_REVIEW'
  }
  return result
}
