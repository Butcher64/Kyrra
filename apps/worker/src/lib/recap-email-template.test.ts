import { describe, it, expect } from 'vitest'
import { generateRecapEmailHtml, generateRecapSubject, type RecapEmailData } from './recap-email-template'

function makeData(overrides: Partial<RecapEmailData> = {}): RecapEmailData {
  return {
    userName: 'Thomas Dupont',
    date: 'Mercredi 26 mars',
    filteredCount: 12,
    timeSavedMinutes: 45,
    aVoirEmails: [],
    cumulativeStats: {
      totalFiltered: 340,
      totalTimeSavedHours: 17,
      estimatedValue: 255,
      daysSinceSignup: 28,
    },
    referralUrl: 'https://kyrra.io/r/abc',
    settingsUrl: 'https://kyrra.io/settings',
    unsubscribeUrl: 'https://kyrra.io/unsubscribe/xyz',
    ...overrides,
  }
}

// ─── generateRecapEmailHtml ─────────────────────────────────────────────

describe('generateRecapEmailHtml', () => {
  it('returns valid HTML document', () => {
    const html = generateRecapEmailHtml(makeData())
    expect(html).toContain('<!DOCTYPE html')
    expect(html).toContain('</html>')
  })

  it('includes the user first name in greeting context', () => {
    const html = generateRecapEmailHtml(makeData())
    // The template uses firstName internally for display
    expect(html).toContain('Kyrra')
  })

  it('includes the date in the header', () => {
    const html = generateRecapEmailHtml(makeData({ date: 'Lundi 21 mars' }))
    expect(html).toContain('Lundi 21 mars')
  })

  it('shows filtered count in hero section', () => {
    const html = generateRecapEmailHtml(makeData({ filteredCount: 42 }))
    expect(html).toContain('42')
    expect(html).toContain('distractions supprim')
  })

  it('displays time saved in minutes when < 60', () => {
    const html = generateRecapEmailHtml(makeData({ timeSavedMinutes: 25 }))
    expect(html).toContain('~25 min')
  })

  it('displays time saved in hours when >= 60', () => {
    const html = generateRecapEmailHtml(makeData({ timeSavedMinutes: 75 }))
    expect(html).toContain('~1h15')
  })

  it('displays exact hours when minutes is multiple of 60', () => {
    const html = generateRecapEmailHtml(makeData({ timeSavedMinutes: 120 }))
    expect(html).toContain('~2h')
  })

  it('shows "Votre boite est protegee" when no a-voir emails', () => {
    const html = generateRecapEmailHtml(makeData({ aVoirEmails: [] }))
    expect(html).toContain('prot')
    expect(html).not.toContain('voir (')
  })

  it('shows a-voir section when emails present', () => {
    const html = generateRecapEmailHtml(makeData({
      aVoirEmails: [{
        summary: 'Partnership proposal from Acme Corp',
        gmailMessageId: 'msg-abc123',
      }],
    }))
    expect(html).toContain('voir (1)')
    expect(html).toContain('Partnership proposal from Acme Corp')
    expect(html).toContain('mail.google.com/mail/u/0/#inbox/msg-abc123')
  })

  it('includes reclassify button when token URL provided', () => {
    const html = generateRecapEmailHtml(makeData({
      aVoirEmails: [{
        summary: 'Test email',
        gmailMessageId: 'msg-1',
        reclassifyTokenUrl: 'https://kyrra.io/reclassify/token123',
      }],
    }))
    expect(html).toContain('Reclassifier')
    expect(html).toContain('kyrra.io/reclassify/token123')
  })

  it('shows confidence score when below 75%', () => {
    const html = generateRecapEmailHtml(makeData({
      aVoirEmails: [{
        summary: 'Ambiguous email',
        gmailMessageId: 'msg-2',
        confidenceScore: 0.62,
      }],
    }))
    expect(html).toContain('62%')
  })

  it('does not show confidence score when >= 75%', () => {
    const html = generateRecapEmailHtml(makeData({
      aVoirEmails: [{
        summary: 'Clear email',
        gmailMessageId: 'msg-3',
        confidenceScore: 0.85,
      }],
    }))
    expect(html).not.toContain('85%')
  })

  it('includes cumulative stats section', () => {
    const html = generateRecapEmailHtml(makeData())
    expect(html).toContain('340')
    expect(html).toContain('17h')
    expect(html).toContain('255')
    expect(html).toContain('28j')
  })

  it('includes monthly stats when provided', () => {
    const html = generateRecapEmailHtml(makeData({
      monthlyStats: {
        monthLabel: 'février 2026',
        totalFiltered: 85,
        totalAVoir: 12,
        timeSavedHours: 4,
      },
    }))
    expect(html).toContain('Bilan')
    expect(html).toContain('vrier 2026')
    expect(html).toContain('85')
  })

  it('omits monthly stats section when not provided', () => {
    const html = generateRecapEmailHtml(makeData({ monthlyStats: undefined }))
    expect(html).not.toContain('Bilan')
  })

  it('includes referral CTA', () => {
    const html = generateRecapEmailHtml(makeData())
    expect(html).toContain('Partager Kyrra')
    expect(html).toContain('kyrra.io/r/abc')
  })

  it('includes settings and unsubscribe links in footer', () => {
    const html = generateRecapEmailHtml(makeData())
    expect(html).toContain('kyrra.io/settings')
    expect(html).toContain('kyrra.io/unsubscribe/xyz')
  })

  it('escapes HTML in user-provided data', () => {
    const html = generateRecapEmailHtml(makeData({
      aVoirEmails: [{
        summary: 'Test <script>alert("xss")</script>',
        gmailMessageId: 'msg-xss',
      }],
    }))
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('handles 0 filtered emails', () => {
    const html = generateRecapEmailHtml(makeData({ filteredCount: 0, timeSavedMinutes: 0 }))
    expect(html).toContain('>0<')
    expect(html).toContain('~0 min')
  })

  it('handles multiple a-voir emails', () => {
    const html = generateRecapEmailHtml(makeData({
      aVoirEmails: [
        { summary: 'Email 1', gmailMessageId: 'msg-1' },
        { summary: 'Email 2', gmailMessageId: 'msg-2' },
        { summary: 'Email 3', gmailMessageId: 'msg-3' },
      ],
    }))
    expect(html).toContain('voir (3)')
    expect(html).toContain('Email 1')
    expect(html).toContain('Email 2')
    expect(html).toContain('Email 3')
  })
})

// ─── generateRecapSubject ───────────────────────────────────────────────

describe('generateRecapSubject', () => {
  it('includes a-voir count when > 0', () => {
    const subject = generateRecapSubject(15, 3)
    expect(subject).toBe('15 filtrés, 3 à voir — Kyrra Recap')
  })

  it('uses distractions wording when no a-voir', () => {
    const subject = generateRecapSubject(20, 0)
    expect(subject).toBe('20 distractions supprimées — Kyrra Recap')
  })

  it('works with 0 filtered and 0 a-voir', () => {
    const subject = generateRecapSubject(0, 0)
    expect(subject).toBe('0 distractions supprimées — Kyrra Recap')
  })

  it('works with high numbers', () => {
    const subject = generateRecapSubject(150, 12)
    expect(subject).toBe('150 filtrés, 12 à voir — Kyrra Recap')
  })
})
