/**
 * ClassificationLogger — Whitelist-only field enforcer (Safeguard 2)
 * Zero email content in any log or Sentry context
 *
 * Allowed fields (hardcoded whitelist):
 * - email_id (gmail_message_id)
 * - classification_result
 * - confidence_score
 * - processing_time_ms
 * - source
 * - event
 * - user_id (for non-classification events: watch_renewed, reconciliation_queued)
 * - count (for aggregate events)
 *
 * Dev/Test: throws ClassificationLoggerViolation on illegal fields
 * Production: strips illegal fields + logs warning (never crash on logger violation)
 *
 * Source: [architecture.md — Safeguard 2, Enforcement Rule 3]
 */

const ALLOWED_FIELDS = new Set([
  'event',
  'email_id',
  'classification_result',
  'confidence_score',
  'processing_time_ms',
  'source',
  'user_id',
  'count',
  'deleted_count',
  'expires_at',
])

export class ClassificationLoggerViolation extends Error {
  public readonly illegalFields: string[]

  constructor(illegalFields: string[]) {
    super(`ClassificationLogger: illegal fields detected: ${illegalFields.join(', ')}`)
    this.name = 'ClassificationLoggerViolation'
    this.illegalFields = illegalFields
  }
}

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Log a classification event with whitelist-enforced fields
 * Throws in dev/test, strips in production
 */
function log(fields: Record<string, unknown>): void {
  const illegalFields = Object.keys(fields).filter((key) => !ALLOWED_FIELDS.has(key))

  if (illegalFields.length > 0) {
    if (!isProduction) {
      throw new ClassificationLoggerViolation(illegalFields)
    }

    // Production: strip illegal fields + warn (never crash)
    console.warn(`ClassificationLogger VIOLATION: stripping fields: ${illegalFields.join(', ')}`)
    for (const field of illegalFields) {
      delete fields[field]
    }
    // TODO: Sentry.captureMessage('ClassificationLogger violation', { level: 'fatal', extra: { illegalFields } })
  }

  console.log(JSON.stringify(fields))
}

export const ClassificationLogger = { log }
