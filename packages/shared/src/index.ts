// @kyrra/shared — Shared types, schemas, constants, and rules

// Types
export type { ActionResult, AppError } from './types/action-result'
export type { ClassificationSignal } from './types/classification-signal'
export type { UserIntegration, PublicIntegration } from './types/integration'

// Constants
export {
  CLASSIFICATION_RESULTS,
  CLASSIFICATION_LABELS,
  SYSTEM_WHITELISTED_SENDERS,
} from './constants/classification'
export type { ClassificationResult } from './constants/classification'
export { ERROR_CODES } from './constants/errors'

// Schemas
export { emailClassificationSchema } from './schemas/email-classification'
export type { EmailClassificationInput } from './schemas/email-classification'
export { reclassifyParamsSchema } from './schemas/reclassify-params'
export type { ReclassifyParams } from './schemas/reclassify-params'
export { whitelistParamsSchema, removeWhitelistParamsSchema } from './schemas/whitelist-params'
export type { WhitelistParams, RemoveWhitelistParams } from './schemas/whitelist-params'
export { updateExposureModeSchema, updateNotificationsSchema } from './schemas/settings-params'
export type { UpdateExposureModeParams, UpdateNotificationsParams } from './schemas/settings-params'
export { feedbackParamsSchema } from './schemas/feedback-params'
export type { FeedbackParams } from './schemas/feedback-params'

// Rules
export { applyClassificationSafetyRules, applyClassificationSafetyRulesWithNotification } from './rules'
export { applyRule3, type Rule3Result } from './rules/rule-3-new-user-notification'
