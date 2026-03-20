import type { ClassificationResult } from '../constants/classification'

// ClassificationSignal is a routing type used by SafetyRules
// FORCE_LLM_REVIEW is NEVER written to the database — it signals
// the worker to re-route the email to the LLM classification path
export type ClassificationSignal = ClassificationResult | 'FORCE_LLM_REVIEW'
