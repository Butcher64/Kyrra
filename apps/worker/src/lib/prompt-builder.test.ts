import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, type UserProfile } from './prompt-builder'
import type { UserLabel } from '@kyrra/shared'

const makeLabel = (overrides: Partial<UserLabel> & { name: string; position: number; prompt: string }): UserLabel => ({
  id: `lbl-${overrides.position}`,
  user_id: 'u1',
  description: '',
  color: '#000',
  gmail_label_id: null,
  gmail_label_name: null,
  is_default: true,
  created_at: '',
  updated_at: '',
  ...overrides,
})

const LABELS: UserLabel[] = [
  makeLabel({ name: 'Important', position: 0, prompt: 'Known contacts and replies' }),
  makeLabel({ name: 'Transactionnel', position: 1, prompt: 'Invoices, auth, OTP' }),
  makeLabel({ name: 'Notifications', position: 2, prompt: 'Slack, GitHub, Linear' }),
  makeLabel({ name: 'Newsletter', position: 3, prompt: 'Subscribed newsletters' }),
  makeLabel({ name: 'Prospection', position: 5, prompt: 'Cold outreach' }),
  makeLabel({ name: 'Spam', position: 6, prompt: 'Mass mailing, phishing' }),
]

const FULL_PROFILE: UserProfile = {
  userRole: 'CEO',
  exposureMode: 'normal',
  sector: 'SaaS B2B',
  companyDescription: 'Email filtering AI for SMEs',
  prospectionUtile: 'DevOps tools, cloud infrastructure',
  prospectionNonSollicitee: 'HR software, insurance',
  interests: 'AI, email deliverability',
}

const MINIMAL_PROFILE: UserProfile = {
  userRole: 'DRH',
  exposureMode: 'strict',
}

describe('buildSystemPrompt', () => {
  // ── B8.4: empty labels validation ──

  it('throws when labels array is empty', () => {
    expect(() => buildSystemPrompt([], FULL_PROFILE)).toThrow('labels array is empty')
  })

  it('throws when labels is undefined-ish', () => {
    expect(() => buildSystemPrompt(undefined as any, FULL_PROFILE)).toThrow()
  })

  // ── Normal build ──

  it('builds prompt with all 6 labels in position order', () => {
    const prompt = buildSystemPrompt(LABELS, FULL_PROFILE)
    expect(prompt).toContain('1. "Important"')
    expect(prompt).toContain('2. "Transactionnel"')
    expect(prompt).toContain('6. "Spam"')
  })

  it('includes label prompts in output', () => {
    const prompt = buildSystemPrompt(LABELS, FULL_PROFILE)
    expect(prompt).toContain('Known contacts and replies')
    expect(prompt).toContain('Cold outreach')
    expect(prompt).toContain('Mass mailing, phishing')
  })

  it('includes user role and exposure mode', () => {
    const prompt = buildSystemPrompt(LABELS, FULL_PROFILE)
    expect(prompt).toContain('Role: CEO')
    expect(prompt).toContain('Exposure mode: normal')
  })

  it('includes sector and company description', () => {
    const prompt = buildSystemPrompt(LABELS, FULL_PROFILE)
    expect(prompt).toContain('Industry: SaaS B2B')
    expect(prompt).toContain('Company: Email filtering AI for SMEs')
  })

  it('includes interests', () => {
    const prompt = buildSystemPrompt(LABELS, FULL_PROFILE)
    expect(prompt).toContain('Professional interests: AI, email deliverability')
  })

  it('includes prospection guidance', () => {
    const prompt = buildSystemPrompt(LABELS, FULL_PROFILE)
    expect(prompt).toContain('USEFUL prospection')
    expect(prompt).toContain('DevOps tools, cloud infrastructure')
    expect(prompt).toContain('UNWANTED prospection')
    expect(prompt).toContain('HR software, insurance')
  })

  // ── Minimal profile ──

  it('builds prompt with minimal profile (no sector, no interests)', () => {
    const prompt = buildSystemPrompt(LABELS, MINIMAL_PROFILE)
    expect(prompt).toContain('Role: DRH')
    expect(prompt).toContain('Exposure mode: strict')
    expect(prompt).not.toContain('Industry:')
    expect(prompt).not.toContain('Professional interests:')
    expect(prompt).not.toContain('PROSPECTION RELEVANCE')
  })

  // ── Critical rules ──

  it('includes transactional protection rule', () => {
    const prompt = buildSystemPrompt(LABELS, FULL_PROFILE)
    expect(prompt).toContain('Transactional/service emails')
    expect(prompt).toContain('NEVER')
  })

  it('includes false-positive-is-worse rule', () => {
    const prompt = buildSystemPrompt(LABELS, FULL_PROFILE)
    expect(prompt).toContain('false negative')
    expect(prompt).toContain('far worse')
  })

  it('requests JSON output format', () => {
    const prompt = buildSystemPrompt(LABELS, FULL_PROFILE)
    expect(prompt).toContain('"label"')
    expect(prompt).toContain('"confidence"')
    expect(prompt).toContain('"summary"')
  })

  // ── Single label ──

  it('works with a single label', () => {
    const single = [makeLabel({ name: 'Important', position: 0, prompt: 'Everything' })]
    const prompt = buildSystemPrompt(single, MINIMAL_PROFILE)
    expect(prompt).toContain('1. "Important"')
    expect(prompt).not.toContain('2.')
  })

  // ── Ordering ──

  it('sorts labels by position regardless of input order', () => {
    const shuffled = [...LABELS].reverse()
    const prompt = buildSystemPrompt(shuffled, FULL_PROFILE)
    const importantIdx = prompt.indexOf('"Important"')
    const spamIdx = prompt.indexOf('"Spam"')
    expect(importantIdx).toBeLessThan(spamIdx)
  })
})
