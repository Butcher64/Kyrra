import type { ClassificationResult } from '@kyrra/shared'
import type { WhitelistMatch } from './whitelist-check'

/**
 * Pre-filter — Fast metadata-only classification before fingerprinting
 * Catches known domains and patterns without needing email body
 * Gated on "never exchanged" signal (whitelistMatch === 'none')
 *
 * Source: [pipeline-audit 2026-04-01 — Pre-filtering step]
 */

export interface PrefilterResult {
  classified: boolean
  result: ClassificationResult
  confidence: number
  reason: string
}

// Known notification/marketing sending infrastructure → FILTRE
// These domains send automated emails, not personal correspondence
const KNOWN_NOISE_DOMAINS = new Set([
  // Social / content platforms
  'linkedin.com',
  'facebookmail.com',
  'twitter.com',
  'x.com',
  'quora.com',
  'medium.com',
  'substack.com',
  // Email sending platforms (transactional/marketing)
  'mailchimp.com',
  'sendgrid.net',
  'hubspotmail.net',
  'constant-contact.com',
  'brevo.com',
  'mailjet.com',
  'amazonses.com',
  'intercom-mail.com',
  'mandrillapp.com',
  'mailgun.org',
  'postmarkapp.com',
  'sparkpostmail.com',
  'cmail19.com',
  'cmail20.com',
])

// Known prospecting tool sending infrastructure → BLOQUE
// These domains are exclusively used for cold outreach
const KNOWN_PROSPECTING_DOMAINS = new Set([
  'mail.instantly.ai',
  'outreach-mail.com',
  'prospecting-mail.com',
  'lemlist.com',
  'woodpeckermail.com',
  'reply-mail.io',
  'salesloft-mail.com',
  'snov.io',
  'hunter-mail.io',
  'apollo-mail.com',
])

// Domains whose noreply@ addresses send CRITICAL transactional emails
// (billing, auth, security alerts) — must NOT be prefiltered
const TRANSACTIONAL_NOREPLY_DOMAINS = new Set([
  // Payment / billing
  'stripe.com',
  'paypal.com',
  'gocardless.com',
  'mollie.com',
  'adyen.com',
  'wise.com',
  'revolut.com',
  'qonto.com',
  // Cloud / infrastructure
  'google.com',
  'googlecloud.com',
  'accounts.google.com',
  'amazon.com',
  'aws.amazon.com',
  'microsoft.com',
  'azure.com',
  'ovh.com',
  'ovhcloud.com',
  'scaleway.com',
  'digitalocean.com',
  'vercel.com',
  'netlify.com',
  'railway.com',
  'heroku.com',
  'cloudflare.com',
  // Dev tools
  'github.com',
  'gitlab.com',
  'bitbucket.org',
  'npmjs.com',
  'docker.com',
  // SaaS / productivity
  'notion.so',
  'figma.com',
  'linear.app',
  'slack.com',
  'zoom.us',
  'atlassian.com',
  'trello.com',
  'asana.com',
  'airtable.com',
  'hubspot.com',
  'salesforce.com',
  'intercom.io',
  // Auth / identity
  'auth0.com',
  'okta.com',
  'supabase.io',
  'supabase.com',
  'firebase.google.com',
  'clerk.com',
  // Communication
  'postmarkapp.com',
  'sendgrid.net',
  'twilio.com',
  'mailgun.com',
])

// Newsletter/marketing subdomain prefixes
const NOISE_SUBDOMAIN_PREFIXES = ['newsletter.', 'news.', 'marketing.']

/**
 * Pre-filter an email based on sender metadata and whitelist status
 * Returns instant classification for known domains, null if unknown (→ fingerprint)
 *
 * Key principle: if sender has been contacted before (whitelist hit),
 * skip pre-filter entirely — let fingerprint/LLM handle it
 */
export function prefilterEmail(
  senderEmail: string,
  whitelistMatch: WhitelistMatch,
): PrefilterResult | null {
  // If sender has prior exchange history, skip pre-filter
  if (whitelistMatch !== 'none') return null

  const senderDomain = senderEmail.split('@')[1]?.toLowerCase() ?? ''
  const localPart = senderEmail.split('@')[0]?.toLowerCase() ?? ''

  // Check known prospecting infrastructure (high confidence → BLOQUE)
  if (KNOWN_PROSPECTING_DOMAINS.has(senderDomain)) {
    return {
      classified: true,
      result: 'BLOQUE',
      confidence: 0.93,
      reason: `Known prospecting platform: ${senderDomain} (no prior exchange)`,
    }
  }

  // Check known noise/notification domains (→ FILTRE)
  if (KNOWN_NOISE_DOMAINS.has(senderDomain)) {
    return {
      classified: true,
      result: 'FILTRE',
      confidence: 0.80,
      reason: `Known notification/marketing domain: ${senderDomain} (no prior exchange)`,
    }
  }

  // Check noreply pattern — but EXEMPT known service/SaaS domains
  // noreply@stripe.com is a billing email, not noise
  const isNoreply = localPart === 'noreply' || localPart === 'no-reply' || localPart === 'ne-pas-repondre' || localPart === 'no_reply'
  if (isNoreply && !isTransactionalDomain(senderDomain)) {
    return {
      classified: true,
      result: 'FILTRE',
      confidence: 0.75,
      reason: `No-reply address: ${senderEmail} (no prior exchange)`,
    }
  }

  // Check newsletter/marketing subdomain patterns
  for (const prefix of NOISE_SUBDOMAIN_PREFIXES) {
    if (senderDomain.startsWith(prefix)) {
      return {
        classified: true,
        result: 'FILTRE',
        confidence: 0.72,
        reason: `Marketing subdomain: ${senderDomain} (no prior exchange)`,
      }
    }
  }

  return null
}

/**
 * Check if a domain is a known service/SaaS that sends transactional emails
 * Matches exact domain or parent domain (e.g., accounts.google.com → google.com)
 */
function isTransactionalDomain(domain: string): boolean {
  if (TRANSACTIONAL_NOREPLY_DOMAINS.has(domain)) return true
  // Check parent domain (e.g., mail.stripe.com → stripe.com)
  const parts = domain.split('.')
  if (parts.length > 2) {
    const parentDomain = parts.slice(-2).join('.')
    if (TRANSACTIONAL_NOREPLY_DOMAINS.has(parentDomain)) return true
  }
  return false
}
