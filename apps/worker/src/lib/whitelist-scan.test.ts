import { describe, it, expect } from 'vitest'
import {
  hashAddress,
  hashDomain,
  extractRecipients,
  buildWhitelistEntries,
} from './whitelist-scan'

// ─── hashAddress ────────────────────────────────────────────────────────

describe('hashAddress', () => {
  it('returns a 64-char hex string (SHA-256)', () => {
    const hash = hashAddress('alice@example.com')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('is deterministic (same input → same output)', () => {
    expect(hashAddress('alice@example.com')).toBe(hashAddress('alice@example.com'))
  })

  it('lowercases before hashing (case-insensitive)', () => {
    expect(hashAddress('Alice@Example.COM')).toBe(hashAddress('alice@example.com'))
  })

  it('trims whitespace before hashing', () => {
    expect(hashAddress('  alice@example.com  ')).toBe(hashAddress('alice@example.com'))
  })

  it('produces different hashes for different addresses', () => {
    expect(hashAddress('alice@example.com')).not.toBe(hashAddress('bob@example.com'))
  })
})

// ─── hashDomain ─────────────────────────────────────────────────────────

describe('hashDomain', () => {
  it('returns a 64-char hex string (SHA-256)', () => {
    const hash = hashDomain('alice@example.com')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('hashes only the domain part', () => {
    // Two different users at the same domain → same domain hash
    expect(hashDomain('alice@example.com')).toBe(hashDomain('bob@example.com'))
  })

  it('produces different hashes for different domains', () => {
    expect(hashDomain('alice@example.com')).not.toBe(hashDomain('alice@other.com'))
  })

  it('is case-insensitive', () => {
    expect(hashDomain('ALICE@EXAMPLE.COM')).toBe(hashDomain('alice@example.com'))
  })

  it('throws for invalid email without @', () => {
    expect(() => hashDomain('not-an-email')).toThrow('Invalid email')
  })

  it('throws for empty string', () => {
    expect(() => hashDomain('')).toThrow('Invalid email')
  })
})

// ─── extractRecipients ──────────────────────────────────────────────────

describe('extractRecipients', () => {
  it('extracts simple email from "to" field', () => {
    const result = extractRecipients([{ to: 'alice@example.com' }])
    expect(result).toEqual(['alice@example.com'])
  })

  it('extracts email from "Name <email>" format', () => {
    const result = extractRecipients([{ to: 'Alice Smith <alice@example.com>' }])
    expect(result).toEqual(['alice@example.com'])
  })

  it('extracts from to, cc, and bcc fields', () => {
    const result = extractRecipients([{
      to: 'alice@example.com',
      cc: 'bob@example.com',
      bcc: 'carol@example.com',
    }])
    expect(result).toHaveLength(3)
    expect(result).toContain('alice@example.com')
    expect(result).toContain('bob@example.com')
    expect(result).toContain('carol@example.com')
  })

  it('deduplicates addresses across messages', () => {
    const result = extractRecipients([
      { to: 'alice@example.com' },
      { to: 'alice@example.com' },
      { cc: 'alice@example.com' },
    ])
    expect(result).toEqual(['alice@example.com'])
  })

  it('deduplicates case-insensitively', () => {
    const result = extractRecipients([
      { to: 'Alice@Example.COM' },
      { to: 'alice@example.com' },
    ])
    expect(result).toEqual(['alice@example.com'])
  })

  it('handles multiple addresses in a single field', () => {
    const result = extractRecipients([{
      to: 'Alice <alice@example.com>, Bob <bob@example.com>',
    }])
    expect(result).toHaveLength(2)
    expect(result).toContain('alice@example.com')
    expect(result).toContain('bob@example.com')
  })

  it('returns empty array for messages with no recipients', () => {
    const result = extractRecipients([{}])
    expect(result).toEqual([])
  })

  it('returns empty array for empty messages list', () => {
    const result = extractRecipients([])
    expect(result).toEqual([])
  })

  it('handles addresses with dots and plus signs', () => {
    const result = extractRecipients([{
      to: 'first.last+tag@sub.domain.com',
    }])
    expect(result).toEqual(['first.last+tag@sub.domain.com'])
  })

  it('handles addresses with hyphens', () => {
    const result = extractRecipients([{
      to: 'user-name@my-company.co.uk',
    }])
    expect(result).toContain('user-name@my-company.co.uk')
  })
})

// ─── buildWhitelistEntries ──────────────────────────────────────────────

describe('buildWhitelistEntries', () => {
  it('builds entries with correct structure', () => {
    const entries = buildWhitelistEntries('user-1', ['alice@example.com'])
    expect(entries).toHaveLength(1)
    expect(entries[0]).toEqual({
      user_id: 'user-1',
      address_hash: hashAddress('alice@example.com'),
      domain_hash: hashDomain('alice@example.com'),
      source: 'scan',
    })
  })

  it('builds multiple entries from multiple addresses', () => {
    const entries = buildWhitelistEntries('user-1', [
      'alice@example.com',
      'bob@other.com',
    ])
    expect(entries).toHaveLength(2)
    expect(entries[0].user_id).toBe('user-1')
    expect(entries[1].user_id).toBe('user-1')
    expect(entries[0].address_hash).not.toBe(entries[1].address_hash)
  })

  it('returns empty array for no addresses', () => {
    const entries = buildWhitelistEntries('user-1', [])
    expect(entries).toEqual([])
  })

  it('always sets source to "scan"', () => {
    const entries = buildWhitelistEntries('user-1', ['test@test.com'])
    expect(entries[0].source).toBe('scan')
  })
})
