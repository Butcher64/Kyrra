import { hashAddress, hashDomain } from './whitelist-scan'

export type WhitelistMatch = 'exact' | 'domain' | 'none'

/**
 * Check if a sender email is whitelisted for a given user.
 * - exact match (address_hash) → skip classification entirely
 * - domain match (domain_hash) → allow classification but never BLOQUE
 * - no match → proceed normally
 *
 * Source: [epics-beta.md — B1.1]
 */
export async function checkWhitelist(
  supabase: any,
  userId: string,
  senderEmail: string,
): Promise<WhitelistMatch> {
  const addressHash = hashAddress(senderEmail)

  // Check exact address match first (indexed: idx_whitelist_user_address)
  const { data: exactMatch } = await supabase
    .from('whitelist_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('address_hash', addressHash)
    .limit(1)
    .maybeSingle()

  if (exactMatch) {
    return 'exact'
  }

  // Check domain match (indexed: idx_whitelist_user_domain)
  const domainHash = hashDomain(senderEmail)
  const { data: domainMatch } = await supabase
    .from('whitelist_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('domain_hash', domainHash)
    .limit(1)
    .maybeSingle()

  if (domainMatch) {
    return 'domain'
  }

  return 'none'
}
