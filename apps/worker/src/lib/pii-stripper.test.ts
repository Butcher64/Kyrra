import { describe, it, expect } from 'vitest'
import { stripPIIFromSummary, detectSensitiveContent, sanitizeForLLM } from './pii-stripper'

// ── Layer 2: stripPIIFromSummary — 6 PII regex patterns ──

describe('stripPIIFromSummary — email addresses', () => {
  it('redacts simple email address', () => {
    const result = stripPIIFromSummary('Contact alice@example.com for info')
    expect(result).toBe('Contact [REDACTED] for info')
  })

  it('redacts email with dots and plus', () => {
    const result = stripPIIFromSummary('From alice.bob+tag@sub.example.co.uk')
    expect(result).toContain('[REDACTED]')
    expect(result).not.toContain('alice')
  })
})

describe('stripPIIFromSummary — phone numbers', () => {
  it('redacts French phone number with spaces', () => {
    const result = stripPIIFromSummary('Call 06 12 34 56 78 for details')
    expect(result).toContain('[REDACTED]')
    expect(result).not.toContain('06 12')
  })

  it('redacts international phone number with prefix', () => {
    const result = stripPIIFromSummary('Reach us at +33 6 12 34 56 78')
    expect(result).toContain('[REDACTED]')
    expect(result).not.toContain('+33')
  })
})

describe('stripPIIFromSummary — street addresses', () => {
  // The regex pattern is: \b\d{1,5}\s[\w\s]+(?:rue|avenue|boulevard|street|road|av\.|bd\.)\b
  // It expects chars between number and keyword: "123 Main Street" format
  it('redacts English-style street address', () => {
    const result = stripPIIFromSummary('Office at 45 Main boulevard')
    expect(result).toContain('[REDACTED]')
    expect(result).not.toContain('45 Main boulevard')
  })

  it('redacts address with street', () => {
    const result = stripPIIFromSummary('Located at 123 Baker street')
    expect(result).toContain('[REDACTED]')
    expect(result).not.toContain('123 Baker street')
  })

  it('redacts French-style with text before keyword', () => {
    const result = stripPIIFromSummary('Siège au 8 grande avenue')
    expect(result).toContain('[REDACTED]')
    expect(result).not.toContain('8 grande avenue')
  })
})

describe('stripPIIFromSummary — postal codes', () => {
  it('redacts 5-digit French postal code', () => {
    const result = stripPIIFromSummary('Paris 75001 France')
    expect(result).toContain('[REDACTED]')
    expect(result).not.toContain('75001')
  })
})

describe('stripPIIFromSummary — IBAN patterns', () => {
  it('redacts IBAN-like pattern', () => {
    const result = stripPIIFromSummary('IBAN FR76 3000 6000')
    expect(result).toContain('[REDACTED]')
    expect(result).not.toContain('IBAN FR76 3000 6000')
  })

  it('redacts FR-prefixed IBAN', () => {
    const result = stripPIIFromSummary('Account: FR76 1234 5678')
    expect(result).toContain('[REDACTED]')
  })
})

describe('stripPIIFromSummary — SIRET-like patterns', () => {
  it('redacts SIRET-like number (9 digits)', () => {
    const result = stripPIIFromSummary('SIRET: 123 456 789')
    expect(result).toContain('[REDACTED]')
    expect(result).not.toContain('123 456 789')
  })

  it('redacts SIRET with dashes', () => {
    const result = stripPIIFromSummary('Code: 123-456-789')
    expect(result).toContain('[REDACTED]')
  })
})

describe('stripPIIFromSummary — multiple PII in one string', () => {
  it('redacts all PII types in a single summary', () => {
    const result = stripPIIFromSummary(
      'Contact alice@test.com at 06 12 34 56 78, 12 rue de la Paix 75001'
    )
    expect(result).not.toContain('alice@test.com')
    expect(result).not.toContain('06 12')
    expect(result).not.toContain('75001')
  })
})

describe('stripPIIFromSummary — no false positives', () => {
  it('preserves normal business text', () => {
    const input = 'Proposition commerciale pour votre entreprise de 50 personnes'
    expect(stripPIIFromSummary(input)).toBe(input)
  })

  it('preserves classification summaries', () => {
    const input = 'Prospecting tool detected: Lemlist (X-Mailer signature)'
    expect(stripPIIFromSummary(input)).toBe(input)
  })

  it('preserves text without any PII patterns', () => {
    const input = 'New proposal from Acme Corp about cloud services'
    expect(stripPIIFromSummary(input)).toBe(input)
  })
})

// ── Layer 3: detectSensitiveContent — Art. 9 RGPD ──

describe('detectSensitiveContent — health patterns', () => {
  it('detects "cancer" in content', () => {
    expect(detectSensitiveContent('Diagnostic de cancer confirmé')).toBe(true)
  })

  it('detects "maladie" in content', () => {
    expect(detectSensitiveContent('Arrêt maladie prolongé')).toBe(true)
  })

  it('detects "traitement" in content', () => {
    expect(detectSensitiveContent('Le traitement commence lundi')).toBe(true)
  })
})

describe('detectSensitiveContent — political/religious patterns', () => {
  it('detects "syndicat" in content', () => {
    expect(detectSensitiveContent('Réunion du syndicat demain')).toBe(true)
  })

  it('detects "politique" in content', () => {
    expect(detectSensitiveContent('Opinions politique du candidat')).toBe(true)
  })

  it('detects "religion" in content', () => {
    expect(detectSensitiveContent('Sa religion ne devrait pas importer')).toBe(true)
  })
})

describe('detectSensitiveContent — financial amounts', () => {
  it('detects EUR amounts', () => {
    expect(detectSensitiveContent('Salaire de 5 000 EUR brut')).toBe(true)
  })

  it('detects dollar amounts', () => {
    expect(detectSensitiveContent('Budget of 150 000 dollars annually')).toBe(true)
  })
})

describe('detectSensitiveContent — no false positives', () => {
  it('returns false for normal business email', () => {
    expect(detectSensitiveContent('Bonjour, voici notre proposition commerciale pour Q2')).toBe(false)
  })

  it('returns false for technical content', () => {
    expect(detectSensitiveContent('Deploy the new API endpoint to production')).toBe(false)
  })
})

// ── sanitizeForLLM ──

describe('sanitizeForLLM', () => {
  it('redacts health-related content with [SENSITIVE_REDACTED]', () => {
    const result = sanitizeForLLM('Le diagnostic est positif')
    expect(result).toContain('[SENSITIVE_REDACTED]')
    expect(result).not.toContain('diagnostic')
  })

  it('redacts political content', () => {
    const result = sanitizeForLLM('Adhésion au syndicat des cadres')
    expect(result).toContain('[SENSITIVE_REDACTED]')
    expect(result).not.toContain('syndicat')
  })

  it('redacts financial amounts', () => {
    const result = sanitizeForLLM('Virement de 10 000 EUR effectué')
    expect(result).toContain('[SENSITIVE_REDACTED]')
  })

  it('preserves non-sensitive content', () => {
    const input = 'Bonjour, merci pour votre réponse rapide.'
    expect(sanitizeForLLM(input)).toBe(input)
  })

  it('handles multiple sensitive patterns', () => {
    const result = sanitizeForLLM('Le traitement coûte 5 000€ et le diagnostic est en cours')
    expect(result).not.toContain('traitement')
    expect(result).not.toContain('diagnostic')
    // At least 2 redactions
    const count = (result.match(/\[SENSITIVE_REDACTED\]/g) ?? []).length
    expect(count).toBeGreaterThanOrEqual(2)
  })

  it('handles empty string', () => {
    expect(sanitizeForLLM('')).toBe('')
  })
})
