import { describe, it, expect } from 'vitest'
import { fingerprintEmail, type EmailHeaders } from './fingerprinting'

function makeEmail(overrides: Partial<EmailHeaders> = {}): EmailHeaders {
  return {
    from: overrides.from ?? 'someone@example.com',
    subject: overrides.subject ?? 'Hello',
    headers: overrides.headers ?? {},
  }
}

// ── Layer 1: Tool signatures ──

describe('fingerprintEmail — Layer 1: Tool signatures', () => {
  const tools = [
    ['lemlist', 'Lemlist'],
    ['apollo', 'Apollo.io'],
    ['instantly', 'Instantly'],
    ['woodpecker', 'Woodpecker'],
    ['mailshake', 'Mailshake'],
    ['reply.io', 'Reply.io'],
    ['salesloft', 'SalesLoft'],
    ['outreach', 'Outreach'],
    ['hunter', 'Hunter.io'],
    ['snov', 'Snov.io'],
  ] as const

  for (const [pattern, toolName] of tools) {
    it(`detects ${toolName} via X-Mailer header`, () => {
      const email = makeEmail({
        headers: { 'x-mailer': `${pattern}-mailer/2.0` },
      })
      const result = fingerprintEmail(email)
      expect(result).not.toBeNull()
      expect(result!.classified).toBe(true)
      expect(result!.result).toBe('BLOQUE')
      expect(result!.confidence).toBe(0.95)
      expect(result!.reason).toContain(toolName)
    })
  }

  it('detects tool via Message-ID header', () => {
    const email = makeEmail({
      headers: { 'message-id': '<abc123.lemlist.com>' },
    })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('BLOQUE')
    expect(result!.reason).toContain('Lemlist')
  })

  it('detects tool case-insensitively in X-Mailer', () => {
    const email = makeEmail({
      headers: { 'x-mailer': 'APOLLO-Campaign-Manager' },
    })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('BLOQUE')
  })

  it('classifies malformed List-Unsubscribe as FILTRE', () => {
    const email = makeEmail({
      headers: { 'list-unsubscribe': 'some-broken-value' },
    })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
    expect(result!.confidence).toBe(0.70)
    expect(result!.reason).toContain('Malformed List-Unsubscribe')
  })

  it('does NOT flag List-Unsubscribe with mailto:', () => {
    const email = makeEmail({
      headers: { 'list-unsubscribe': '<mailto:unsub@example.com>' },
    })
    const result = fingerprintEmail(email)
    expect(result).toBeNull()
  })

  it('does NOT flag List-Unsubscribe with http URL', () => {
    const email = makeEmail({
      headers: { 'list-unsubscribe': '<http://example.com/unsub>' },
    })
    const result = fingerprintEmail(email)
    expect(result).toBeNull()
  })
})

// ── Layer 2: Domain reputation ──

describe('fingerprintEmail — Layer 2: Domain reputation', () => {
  it('detects known prospecting domain mail.instantly.ai', () => {
    const email = makeEmail({ from: 'sales@mail.instantly.ai' })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('BLOQUE')
    expect(result!.confidence).toBe(0.92)
    expect(result!.reason).toContain('mail.instantly.ai')
  })

  it('detects known prospecting domain outreach-mail.com', () => {
    const email = makeEmail({ from: 'rep@outreach-mail.com' })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('BLOQUE')
  })

  // B10.1: sendgrid.net is now allowlisted (B1.6) — use a non-allowlisted domain
  it('detects DKIM domain mismatch as FILTRE', () => {
    const email = makeEmail({
      from: 'hello@startup.com',
      headers: { 'dkim-signature': 'v=1; a=rsa-sha256; d=suspiciousbulk.net; s=sel;' },
    })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
    expect(result!.confidence).toBe(0.75)
    expect(result!.reason).toContain('DKIM domain mismatch')
  })

  it('does NOT flag matching DKIM domain', () => {
    const email = makeEmail({
      from: 'hello@example.com',
      headers: { 'dkim-signature': 'v=1; a=rsa-sha256; d=example.com; s=sel;' },
    })
    const result = fingerprintEmail(email)
    expect(result).toBeNull()
  })

  it('does NOT flag subdomain DKIM (sender subdomain of DKIM domain)', () => {
    const email = makeEmail({
      from: 'hello@mail.example.com',
      headers: { 'dkim-signature': 'v=1; a=rsa-sha256; d=example.com; s=sel;' },
    })
    const result = fingerprintEmail(email)
    expect(result).toBeNull()
  })

  it('detects SPF softfail as FILTRE', () => {
    const email = makeEmail({
      from: 'hello@legit.com',
      headers: { 'received-spf': 'softfail (domain of legit.com does not designate ...)' },
    })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
    expect(result!.reason).toContain('SPF')
  })

  it('detects SPF fail as FILTRE', () => {
    const email = makeEmail({
      from: 'hello@legit.com',
      headers: { 'received-spf': 'fail (domain of legit.com does not designate ...)' },
    })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
  })
})

// ── Layer 3: Subject patterns ──

describe('fingerprintEmail — Layer 3: Subject patterns (FR)', () => {
  it('detects fake reply thread "Re: "', () => {
    const email = makeEmail({ subject: 'Re: Notre discussion' })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
    expect(result!.confidence).toBe(0.65)
  })

  it('detects "Suite à notre échange"', () => {
    const email = makeEmail({ subject: 'Suite à notre échange de mardi' })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
  })

  it('detects "Relance" subject', () => {
    const email = makeEmail({ subject: 'Relance - proposition commerciale' })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
  })

  it('detects "Opportunité pour votre entreprise"', () => {
    const email = makeEmail({ subject: 'Opportunité pour votre entreprise' })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
  })

  it('detects "Partenariat"', () => {
    const email = makeEmail({ subject: 'Proposition de partenariat' })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
  })

  it('detects "Avez-vous eu le temps"', () => {
    const email = makeEmail({ subject: 'Avez-vous eu le temps de répondre ?' })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
  })
})

describe('fingerprintEmail — Layer 3: Subject patterns (EN)', () => {
  it('detects "Quick question"', () => {
    const email = makeEmail({ subject: 'Quick question about your team' })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
  })

  it('detects "Reaching out"', () => {
    const email = makeEmail({ subject: "I'm reaching out because..." })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
  })

  it('detects "Touching base"', () => {
    const email = makeEmail({ subject: 'Just touching base on our last call' })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
  })
})

// ── Null case + layer priority ──

describe('fingerprintEmail — null case + layer priority', () => {
  it('returns null for a clean email with no signals', () => {
    const email = makeEmail({
      from: 'colleague@company.com',
      subject: 'Meeting tomorrow at 10am',
      headers: {},
    })
    const result = fingerprintEmail(email)
    expect(result).toBeNull()
  })

  it('returns null for empty headers and benign subject', () => {
    const email = makeEmail({
      from: 'info@newsletter.com',
      subject: 'Your weekly summary',
      headers: {},
    })
    const result = fingerprintEmail(email)
    expect(result).toBeNull()
  })

  it('tool signature (Layer 1) takes priority over domain reputation (Layer 2)', () => {
    const email = makeEmail({
      from: 'hello@mail.instantly.ai', // Layer 2 would match
      headers: { 'x-mailer': 'lemlist-mailer/2.0' }, // Layer 1 should win
    })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.confidence).toBe(0.95) // Layer 1 confidence
    expect(result!.reason).toContain('Lemlist')
  })

  it('domain reputation (Layer 2) takes priority over subject patterns (Layer 3)', () => {
    const email = makeEmail({
      from: 'hello@mail.instantly.ai', // Layer 2 match
      subject: 'Quick question', // Layer 3 would also match
    })
    const result = fingerprintEmail(email)
    expect(result).not.toBeNull()
    expect(result!.confidence).toBe(0.92) // Layer 2 confidence
    expect(result!.reason).toContain('mail.instantly.ai')
  })

  it('handles missing from gracefully (empty domain)', () => {
    const email = makeEmail({ from: 'nodomain' })
    const result = fingerprintEmail(email)
    // Should not crash, just return null (empty domain won't match anything)
    expect(result).toBeNull()
  })
})
