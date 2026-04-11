import { describe, it, expect } from 'vitest'
import { prefilterEmail } from './prefilter'

describe('prefilterEmail', () => {
  // ── Skip when prior exchange exists ──

  it('returns null when whitelistMatch is exact', () => {
    expect(prefilterEmail('anyone@example.com', 'exact')).toBeNull()
  })

  it('returns null when whitelistMatch is domain', () => {
    expect(prefilterEmail('anyone@example.com', 'domain')).toBeNull()
  })

  // ── Known prospecting domains → BLOQUE ──

  it('classifies known prospecting domain as BLOQUE', () => {
    const result = prefilterEmail('rep@lemlist.com', 'none')
    expect(result).not.toBeNull()
    expect(result!.result).toBe('BLOQUE')
    expect(result!.confidence).toBe(0.93)
    expect(result!.reason).toContain('prospecting platform')
  })

  it('classifies instantly.ai as BLOQUE', () => {
    const result = prefilterEmail('hello@mail.instantly.ai', 'none')
    expect(result).not.toBeNull()
    expect(result!.result).toBe('BLOQUE')
  })

  it('classifies apollo-mail.com as BLOQUE', () => {
    const result = prefilterEmail('sales@apollo-mail.com', 'none')
    expect(result).not.toBeNull()
    expect(result!.result).toBe('BLOQUE')
  })

  // ── Known noise domains → FILTRE ──

  it('classifies linkedin.com as FILTRE', () => {
    const result = prefilterEmail('notifications@linkedin.com', 'none')
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
    expect(result!.confidence).toBe(0.80)
  })

  it('classifies mailchimp.com as FILTRE', () => {
    const result = prefilterEmail('campaign@mailchimp.com', 'none')
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
  })

  // ── Noreply addresses ──

  it('classifies noreply from unknown domain as FILTRE', () => {
    const result = prefilterEmail('noreply@randomcompany.com', 'none')
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
    expect(result!.confidence).toBe(0.75)
  })

  it('classifies no-reply variant as FILTRE', () => {
    const result = prefilterEmail('no-reply@news.whatever.com', 'none')
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
  })

  it('exempts noreply from transactional domains (stripe)', () => {
    const result = prefilterEmail('noreply@stripe.com', 'none')
    expect(result).toBeNull()
  })

  it('exempts noreply from transactional domains (github)', () => {
    const result = prefilterEmail('noreply@github.com', 'none')
    expect(result).toBeNull()
  })

  it('exempts noreply from transactional subdomains (mail.stripe.com)', () => {
    const result = prefilterEmail('noreply@mail.stripe.com', 'none')
    expect(result).toBeNull()
  })

  // ── Marketing subdomains ──

  it('classifies newsletter.* subdomain as FILTRE', () => {
    const result = prefilterEmail('info@newsletter.company.com', 'none')
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
    expect(result!.confidence).toBe(0.72)
    expect(result!.reason).toContain('Marketing subdomain')
  })

  it('classifies news.* subdomain as FILTRE', () => {
    const result = prefilterEmail('team@news.startup.io', 'none')
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
  })

  it('classifies marketing.* subdomain as FILTRE', () => {
    const result = prefilterEmail('promo@marketing.brand.com', 'none')
    expect(result).not.toBeNull()
    expect(result!.result).toBe('FILTRE')
    expect(result!.confidence).toBe(0.72)
  })

  // ── Unknown senders → null (go to fingerprinting) ──

  it('returns null for unknown personal sender', () => {
    const result = prefilterEmail('john@company.com', 'none')
    expect(result).toBeNull()
  })

  it('returns null for unknown domain', () => {
    const result = prefilterEmail('hello@newstartup.io', 'none')
    expect(result).toBeNull()
  })
})
