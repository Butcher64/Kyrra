import type { ClassificationResult } from '@kyrra/shared'

/**
 * Fingerprinting Engine — Rule-based classification (60-70% of emails)
 * 3 detection layers:
 *   Layer 1: Technical header fingerprints (~40%)
 *   Layer 2: Domain reputation (~15%)
 *   Layer 3: Subject pattern matching (~10%)
 *
 * Source: [architecture.md — FR2, FR3]
 */

export interface FingerprintResult {
  classified: boolean
  result: ClassificationResult
  confidence: number
  reason: string
}

// ── Layer 1: Prospecting tool signatures ──

const PROSPECTING_TOOL_HEADERS: Record<string, string> = {
  // X-Mailer patterns
  'lemlist': 'Lemlist',
  'apollo': 'Apollo.io',
  'instantly': 'Instantly',
  'woodpecker': 'Woodpecker',
  'mailshake': 'Mailshake',
  'reply.io': 'Reply.io',
  'salesloft': 'SalesLoft',
  'outreach': 'Outreach',
  'hunter': 'Hunter.io',
  'snov': 'Snov.io',
}

function checkToolSignatures(headers: Record<string, string>): FingerprintResult | null {
  const xMailer = (headers['x-mailer'] || '').toLowerCase()
  const messageId = (headers['message-id'] || '').toLowerCase()
  const listUnsubscribe = headers['list-unsubscribe'] || ''

  // Check X-Mailer for known prospecting tools
  for (const [pattern, toolName] of Object.entries(PROSPECTING_TOOL_HEADERS)) {
    if (xMailer.includes(pattern) || messageId.includes(pattern)) {
      return {
        classified: true,
        result: 'BLOQUE',
        confidence: 0.95,
        reason: `Prospecting tool detected: ${toolName} (X-Mailer signature)`,
      }
    }
  }

  // Check for malformed List-Unsubscribe (common in mass tools)
  if (listUnsubscribe && !listUnsubscribe.includes('mailto:') && !listUnsubscribe.includes('http')) {
    return {
      classified: true,
      result: 'FILTRE',
      confidence: 0.70,
      reason: 'Malformed List-Unsubscribe header',
    }
  }

  // Check for bulk-send timestamp clustering (multiple emails same second)
  const date = headers['date'] || ''
  if (date && date.includes(':00 ')) {
    // Round-second timestamps suggest automated sending
    // Low confidence — just a signal
  }

  return null
}

// ── Layer 2: Domain reputation ──

const KNOWN_PROSPECTING_DOMAINS = new Set([
  'mail.instantly.ai',
  'outreach-mail.com',
  'prospecting-mail.com',
  // This list will grow as fingerprints are collected
])

function checkDomainReputation(senderDomain: string, headers: Record<string, string>): FingerprintResult | null {
  // Check against known prospecting sending domains
  if (KNOWN_PROSPECTING_DOMAINS.has(senderDomain)) {
    return {
      classified: true,
      result: 'BLOQUE',
      confidence: 0.92,
      reason: `Known prospecting domain: ${senderDomain}`,
    }
  }

  // Check for DKIM domain mismatch (sender domain != DKIM signing domain)
  const dkimSignature = headers['dkim-signature'] || ''
  if (dkimSignature) {
    const dkimDomainMatch = dkimSignature.match(/d=([^;]+)/)
    if (dkimDomainMatch) {
      const dkimDomain = dkimDomainMatch[1]!.trim()
      if (dkimDomain !== senderDomain && !senderDomain.endsWith(`.${dkimDomain}`)) {
        return {
          classified: true,
          result: 'FILTRE',
          confidence: 0.75,
          reason: `DKIM domain mismatch: sender=${senderDomain}, DKIM=${dkimDomain}`,
        }
      }
    }
  }

  // Check for SPF softfail/fail
  const spfResult = (headers['received-spf'] || '').toLowerCase()
  if (spfResult.includes('softfail') || spfResult.includes('fail')) {
    return {
      classified: true,
      result: 'FILTRE',
      confidence: 0.70,
      reason: `SPF ${spfResult.includes('fail') ? 'fail' : 'softfail'} detected`,
    }
  }

  return null
}

// ── Layer 3: Subject pattern matching ──

const PROSPECTING_SUBJECT_PATTERNS = [
  /^re:\s/i,                           // Fake reply threads
  /suite\s+(à|a)\s+notre/i,            // "Suite à notre échange" (no actual exchange)
  /relance/i,                          // "Relance" (follow-up to nothing)
  /opportunit[ée]\s+pour\s+votre/i,    // "Opportunité pour votre entreprise"
  /partenariat/i,                       // Generic partnership pitch
  /avez-vous\s+eu\s+le\s+temps/i,      // "Have you had time to..."
  /quick\s+question/i,                  // Classic cold email opener
  /reaching\s+out/i,                    // "I'm reaching out because..."
  /touching\s+base/i,                   // "Just touching base"
]

function checkSubjectPatterns(subject: string): FingerprintResult | null {
  for (const pattern of PROSPECTING_SUBJECT_PATTERNS) {
    if (pattern.test(subject)) {
      return {
        classified: true,
        result: 'FILTRE',
        confidence: 0.65,
        reason: `Subject matches prospecting pattern: ${pattern.source}`,
      }
    }
  }

  return null
}

// ── Main fingerprinting function ──

export interface EmailHeaders {
  from: string
  subject: string
  headers: Record<string, string>
}

/**
 * Classify an email using rule-based fingerprinting
 * Returns null if fingerprinting cannot determine classification (→ route to LLM)
 */
export function fingerprintEmail(email: EmailHeaders): FingerprintResult | null {
  const senderDomain = email.from.split('@')[1]?.toLowerCase() || ''

  // Layer 1: Tool signatures (highest confidence)
  const toolResult = checkToolSignatures(email.headers)
  if (toolResult) return toolResult

  // Layer 2: Domain reputation
  const domainResult = checkDomainReputation(senderDomain, email.headers)
  if (domainResult) return domainResult

  // Layer 3: Subject patterns (lowest confidence)
  const subjectResult = checkSubjectPatterns(email.subject)
  if (subjectResult) return subjectResult

  // Cannot classify — route to LLM
  return null
}
