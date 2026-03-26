import { describe, it, expect } from 'vitest'
import { emailClassificationSchema } from '../email-classification'
import { reclassifyParamsSchema } from '../reclassify-params'
import { whitelistParamsSchema, removeWhitelistParamsSchema } from '../whitelist-params'
import { feedbackParamsSchema } from '../feedback-params'
import {
  updateExposureModeSchema,
  updateNotificationsSchema,
  saveConsentSchema,
} from '../settings-params'

// ─── emailClassificationSchema ──────────────────────────────────────────

describe('emailClassificationSchema', () => {
  it('accepts valid A_VOIR classification', () => {
    const result = emailClassificationSchema.parse({
      gmail_message_id: 'msg-123',
      classification_result: 'A_VOIR',
      confidence_score: 0.85,
    })
    expect(result.classification_result).toBe('A_VOIR')
    expect(result.source).toBe('fingerprint') // default
  })

  it('accepts valid FILTRE classification', () => {
    const result = emailClassificationSchema.parse({
      gmail_message_id: 'msg-456',
      classification_result: 'FILTRE',
      confidence_score: 0.7,
      summary: 'Cold outreach from SaaS vendor',
      source: 'llm',
    })
    expect(result.classification_result).toBe('FILTRE')
    expect(result.source).toBe('llm')
    expect(result.summary).toBe('Cold outreach from SaaS vendor')
  })

  it('accepts valid BLOQUE classification', () => {
    const result = emailClassificationSchema.parse({
      gmail_message_id: 'msg-789',
      classification_result: 'BLOQUE',
      confidence_score: 0.95,
      summary: null,
    })
    expect(result.summary).toBeNull()
  })

  it('rejects empty gmail_message_id', () => {
    expect(() => emailClassificationSchema.parse({
      gmail_message_id: '',
      classification_result: 'A_VOIR',
      confidence_score: 0.5,
    })).toThrow()
  })

  it('rejects invalid classification_result', () => {
    expect(() => emailClassificationSchema.parse({
      gmail_message_id: 'msg-1',
      classification_result: 'SPAM',
      confidence_score: 0.5,
    })).toThrow()
  })

  it('rejects confidence_score below 0', () => {
    expect(() => emailClassificationSchema.parse({
      gmail_message_id: 'msg-1',
      classification_result: 'A_VOIR',
      confidence_score: -0.1,
    })).toThrow()
  })

  it('rejects confidence_score above 1', () => {
    expect(() => emailClassificationSchema.parse({
      gmail_message_id: 'msg-1',
      classification_result: 'A_VOIR',
      confidence_score: 1.01,
    })).toThrow()
  })

  it('accepts boundary confidence_score 0', () => {
    const result = emailClassificationSchema.parse({
      gmail_message_id: 'msg-1',
      classification_result: 'FILTRE',
      confidence_score: 0,
    })
    expect(result.confidence_score).toBe(0)
  })

  it('accepts boundary confidence_score 1', () => {
    const result = emailClassificationSchema.parse({
      gmail_message_id: 'msg-1',
      classification_result: 'FILTRE',
      confidence_score: 1,
    })
    expect(result.confidence_score).toBe(1)
  })

  it('accepts missing summary (optional)', () => {
    const result = emailClassificationSchema.parse({
      gmail_message_id: 'msg-1',
      classification_result: 'BLOQUE',
      confidence_score: 0.9,
    })
    expect(result.summary).toBeUndefined()
  })

  it('rejects invalid source value', () => {
    expect(() => emailClassificationSchema.parse({
      gmail_message_id: 'msg-1',
      classification_result: 'FILTRE',
      confidence_score: 0.8,
      source: 'manual',
    })).toThrow()
  })
})

// ─── reclassifyParamsSchema ─────────────────────────────────────────────

describe('reclassifyParamsSchema', () => {
  it('accepts valid reclassification params', () => {
    const result = reclassifyParamsSchema.parse({
      email_id: 'uuid-123',
      gmail_message_id: 'msg-abc',
      idempotency_key: 'key-xyz',
    })
    expect(result.email_id).toBe('uuid-123')
  })

  it('rejects empty email_id', () => {
    expect(() => reclassifyParamsSchema.parse({
      email_id: '',
      gmail_message_id: 'msg-1',
      idempotency_key: 'key-1',
    })).toThrow()
  })

  it('rejects empty gmail_message_id', () => {
    expect(() => reclassifyParamsSchema.parse({
      email_id: 'uuid-1',
      gmail_message_id: '',
      idempotency_key: 'key-1',
    })).toThrow()
  })

  it('rejects empty idempotency_key', () => {
    expect(() => reclassifyParamsSchema.parse({
      email_id: 'uuid-1',
      gmail_message_id: 'msg-1',
      idempotency_key: '',
    })).toThrow()
  })

  it('rejects missing fields', () => {
    expect(() => reclassifyParamsSchema.parse({
      email_id: 'uuid-1',
    })).toThrow()
  })
})

// ─── whitelistParamsSchema ──────────────────────────────────────────────

describe('whitelistParamsSchema', () => {
  it('accepts valid email address', () => {
    const result = whitelistParamsSchema.parse({
      email_address: 'alice@example.com',
    })
    expect(result.email_address).toBe('alice@example.com')
  })

  it('rejects invalid email format', () => {
    expect(() => whitelistParamsSchema.parse({
      email_address: 'not-an-email',
    })).toThrow()
  })

  it('rejects empty string as email', () => {
    expect(() => whitelistParamsSchema.parse({
      email_address: '',
    })).toThrow()
  })
})

describe('removeWhitelistParamsSchema', () => {
  it('accepts valid address_hash', () => {
    const result = removeWhitelistParamsSchema.parse({
      address_hash: 'abc123hash',
    })
    expect(result.address_hash).toBe('abc123hash')
  })

  it('rejects empty address_hash', () => {
    expect(() => removeWhitelistParamsSchema.parse({
      address_hash: '',
    })).toThrow()
  })
})

// ─── feedbackParamsSchema ───────────────────────────────────────────────

describe('feedbackParamsSchema', () => {
  it('accepts false_positive reason', () => {
    const result = feedbackParamsSchema.parse({
      gmail_message_id: 'msg-1',
      reason: 'false_positive',
    })
    expect(result.reason).toBe('false_positive')
  })

  it('accepts wrong_category reason', () => {
    const result = feedbackParamsSchema.parse({
      gmail_message_id: 'msg-2',
      reason: 'wrong_category',
    })
    expect(result.reason).toBe('wrong_category')
  })

  it('accepts whitelist_sender reason', () => {
    const result = feedbackParamsSchema.parse({
      gmail_message_id: 'msg-3',
      reason: 'whitelist_sender',
    })
    expect(result.reason).toBe('whitelist_sender')
  })

  it('rejects invalid reason', () => {
    expect(() => feedbackParamsSchema.parse({
      gmail_message_id: 'msg-1',
      reason: 'spam',
    })).toThrow()
  })

  it('rejects empty gmail_message_id', () => {
    expect(() => feedbackParamsSchema.parse({
      gmail_message_id: '',
      reason: 'false_positive',
    })).toThrow()
  })
})

// ─── updateExposureModeSchema ───────────────────────────────────────────

describe('updateExposureModeSchema', () => {
  it.each(['strict', 'normal', 'permissive'] as const)('accepts %s mode', (mode) => {
    const result = updateExposureModeSchema.parse({ exposure_mode: mode })
    expect(result.exposure_mode).toBe(mode)
  })

  it('rejects invalid mode', () => {
    expect(() => updateExposureModeSchema.parse({
      exposure_mode: 'aggressive',
    })).toThrow()
  })
})

// ─── updateNotificationsSchema ──────────────────────────────────────────

describe('updateNotificationsSchema', () => {
  it('accepts minimal valid input (only notifications_enabled)', () => {
    const result = updateNotificationsSchema.parse({
      notifications_enabled: true,
    })
    expect(result.notifications_enabled).toBe(true)
    expect(result.recap_enabled).toBeUndefined()
  })

  it('accepts full valid input with recap_time_utc HH:MM', () => {
    const result = updateNotificationsSchema.parse({
      notifications_enabled: false,
      recap_enabled: true,
      recap_time_utc: '08:00',
    })
    expect(result.recap_time_utc).toBe('08:00')
  })

  it('accepts recap_time_utc with seconds HH:MM:SS', () => {
    const result = updateNotificationsSchema.parse({
      notifications_enabled: true,
      recap_time_utc: '14:30:00',
    })
    expect(result.recap_time_utc).toBe('14:30:00')
  })

  it('rejects invalid recap_time_utc format', () => {
    expect(() => updateNotificationsSchema.parse({
      notifications_enabled: true,
      recap_time_utc: '8:00',
    })).toThrow()
  })

  it('rejects non-boolean notifications_enabled', () => {
    expect(() => updateNotificationsSchema.parse({
      notifications_enabled: 'yes',
    })).toThrow()
  })
})

// ─── saveConsentSchema ──────────────────────────────────────────────────

describe('saveConsentSchema', () => {
  it('accepts consent_given=true with recap_consent=true', () => {
    const result = saveConsentSchema.parse({
      consent_given: true,
      recap_consent: true,
    })
    expect(result.consent_given).toBe(true)
    expect(result.recap_consent).toBe(true)
  })

  it('accepts consent_given=true with recap_consent=false', () => {
    const result = saveConsentSchema.parse({
      consent_given: true,
      recap_consent: false,
    })
    expect(result.recap_consent).toBe(false)
  })

  it('rejects consent_given=false (must be literal true)', () => {
    expect(() => saveConsentSchema.parse({
      consent_given: false,
      recap_consent: true,
    })).toThrow()
  })

  it('rejects missing consent_given', () => {
    expect(() => saveConsentSchema.parse({
      recap_consent: true,
    })).toThrow()
  })

  it('rejects missing recap_consent', () => {
    expect(() => saveConsentSchema.parse({
      consent_given: true,
    })).toThrow()
  })
})
