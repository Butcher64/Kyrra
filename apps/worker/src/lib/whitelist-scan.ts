import { createHash } from 'node:crypto'

/**
 * Hash an email address with SHA-256 (non-reversible — FR27)
 */
export function hashAddress(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

/**
 * Extract domain from email and hash it
 */
export function hashDomain(email: string): string {
  const domain = email.toLowerCase().trim().split('@')[1]
  if (!domain) throw new Error(`Invalid email: ${email}`)
  return createHash('sha256').update(domain).digest('hex')
}

/**
 * Onboarding whitelist scan — processes sent history to build whitelist
 * Rate-limited to 20 calls/sec (40% of Gmail API quota)
 *
 * This function is called by the worker when an onboarding_scan is pending.
 * It fetches sent emails from the last 6 months, extracts recipients,
 * and stores SHA-256 hashes in the whitelist_entries table.
 */
export interface ScanProgress {
  total_sent: number
  emails_processed: number
  contacts_found: number
  prospecting_found: number
}

export interface WhitelistEntry {
  user_id: string
  address_hash: string
  domain_hash: string
  source: 'scan' | 'reclassification' | 'manual'
}

/**
 * Extract unique recipient addresses from Gmail sent messages
 * Returns deduplicated list of email addresses
 */
export function extractRecipients(messages: Array<{ to?: string; cc?: string; bcc?: string }>): string[] {
  const addresses = new Set<string>()

  for (const msg of messages) {
    const fields = [msg.to, msg.cc, msg.bcc].filter(Boolean)
    for (const field of fields) {
      // Parse email addresses from "Name <email>" or "email" format
      const matches = field!.match(/[\w.+-]+@[\w.-]+\.\w+/g)
      if (matches) {
        matches.forEach((addr) => addresses.add(addr.toLowerCase().trim()))
      }
    }
  }

  return [...addresses]
}

/**
 * Build whitelist entries from a list of email addresses
 */
export function buildWhitelistEntries(
  userId: string,
  addresses: string[],
): WhitelistEntry[] {
  return addresses.map((addr) => ({
    user_id: userId,
    address_hash: hashAddress(addr),
    domain_hash: hashDomain(addr),
    source: 'scan' as const,
  }))
}
