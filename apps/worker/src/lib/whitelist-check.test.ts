import { describe, it, expect, vi } from 'vitest'
import { checkWhitelist } from './whitelist-check'
import { hashAddress, hashDomain } from './whitelist-scan'

/**
 * Creates a mock Supabase client for whitelist queries.
 * addressRows/domainRows simulate what whitelist_entries returns.
 */
function createMockSupabase(addressRows: any[] = [], domainRows: any[] = []) {
  let callCount = 0
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation(function (this: any) {
          return {
            eq: vi.fn().mockImplementation(function (this: any) {
              return {
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockImplementation(() => {
                    const rows = callCount === 0 ? addressRows : domainRows
                    callCount++
                    return Promise.resolve({
                      data: rows.length > 0 ? rows[0] : null,
                    })
                  }),
                }),
              }
            }),
          }
        }),
      }),
    }),
  }
}

describe('checkWhitelist', () => {
  const userId = 'user-123'
  const senderEmail = 'alice@example.com'

  it('returns "exact" when sender address hash matches', async () => {
    const supabase = createMockSupabase([{ id: 'entry-1' }], [])
    const result = await checkWhitelist(supabase, userId, senderEmail)
    expect(result).toBe('exact')
  })

  it('returns "domain" when domain hash matches but address does not', async () => {
    const supabase = createMockSupabase([], [{ id: 'entry-2' }])
    const result = await checkWhitelist(supabase, userId, senderEmail)
    expect(result).toBe('domain')
  })

  it('returns "none" when neither address nor domain matches', async () => {
    const supabase = createMockSupabase([], [])
    const result = await checkWhitelist(supabase, userId, senderEmail)
    expect(result).toBe('none')
  })

  it('is case-insensitive (hashAddress lowercases)', () => {
    expect(hashAddress('Alice@Example.COM')).toBe(hashAddress('alice@example.com'))
  })

  it('exact match takes priority over domain match', async () => {
    // Both exact and domain would match, but exact is checked first
    const supabase = createMockSupabase([{ id: 'entry-1' }], [{ id: 'entry-2' }])
    const result = await checkWhitelist(supabase, userId, senderEmail)
    expect(result).toBe('exact')
  })

  it('handles system whitelist senders gracefully (no crash on @kyrra.io)', async () => {
    const supabase = createMockSupabase([], [])
    const result = await checkWhitelist(supabase, userId, 'noreply@kyrra.io')
    expect(result).toBe('none')
  })

  it('domain hash is computed from domain part only', () => {
    // Two different addresses at same domain should have same domain hash
    expect(hashDomain('alice@example.com')).toBe(hashDomain('bob@example.com'))
    // Different domains should not match
    expect(hashDomain('alice@example.com')).not.toBe(hashDomain('alice@other.com'))
  })
})
