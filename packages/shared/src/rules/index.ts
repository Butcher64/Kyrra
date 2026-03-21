import type { ClassificationResult } from '../constants/classification'
import type { ClassificationSignal } from '../types/classification-signal'
import { applyRule0 } from './rule-0-fingerprint-bloque-force-llm'
import { applyRule1 } from './rule-1-low-confidence-blocked'
import { applyRule2 } from './rule-2-very-low-confidence'
import { applyRule3, type Rule3Result } from './rule-3-new-user-notification'

/**
 * Apply all classification safety rules in order.
 * Returns ClassificationSignal (may include FORCE_LLM_REVIEW routing signal).
 * The worker must handle FORCE_LLM_REVIEW before writing to DB.
 *
 * Rule order matters:
 * - Rule 0: fingerprint BLOQUE <90% → FORCE_LLM_REVIEW (routing, never DB)
 * - Rule 1: BLOQUE <75% → FILTRE (downgrade)
 * - Rule 2: any <60% → A_VOIR (promote)
 * - Rule 3: new user (<14 days) + BLOQUE → notify (does not alter result)
 */
export function applyClassificationSafetyRules(
  result: ClassificationResult,
  confidence: number,
  source: 'fingerprint' | 'llm',
): ClassificationSignal {
  // Rule 0: may return FORCE_LLM_REVIEW
  const signal = applyRule0(result, confidence, source)
  if (signal === 'FORCE_LLM_REVIEW') {
    return signal
  }

  // Rules 1-2 operate on ClassificationResult only
  let finalResult = signal as ClassificationResult
  finalResult = applyRule1(finalResult, confidence)
  finalResult = applyRule2(finalResult, confidence)

  return finalResult
}

/**
 * Apply safety rules including rule 3 (new user notification).
 * Returns both the classification signal and a notification flag.
 * Use this variant in the classification worker when account age is known.
 */
export function applyClassificationSafetyRulesWithNotification(
  result: ClassificationResult,
  confidence: number,
  source: 'fingerprint' | 'llm',
  accountAgeDays: number,
): { signal: ClassificationSignal; shouldNotify: boolean } {
  const signal = applyClassificationSafetyRules(result, confidence, source)

  // Rule 3 applies to the final result (after rules 0-2)
  if (signal === 'FORCE_LLM_REVIEW') {
    return { signal, shouldNotify: false }
  }

  const { shouldNotify } = applyRule3(signal as ClassificationResult, accountAgeDays)
  return { signal, shouldNotify }
}

export { applyRule0 } from './rule-0-fingerprint-bloque-force-llm'
export { applyRule1 } from './rule-1-low-confidence-blocked'
export { applyRule2 } from './rule-2-very-low-confidence'
export { applyRule3, type Rule3Result } from './rule-3-new-user-notification'
