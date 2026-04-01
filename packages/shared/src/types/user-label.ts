export interface UserLabel {
  id: string
  user_id: string
  name: string
  description: string
  prompt: string
  color: string
  gmail_label_id: string | null
  gmail_label_name: string | null
  is_default: boolean
  position: number
}

/**
 * The 7 default Kyrra labels with pre-built AI classification prompts.
 * Created automatically for each new user during onboarding.
 */
export const DEFAULT_LABELS: Omit<UserLabel, 'id' | 'user_id' | 'gmail_label_id' | 'gmail_label_name'>[] = [
  {
    name: 'Important',
    description: 'Emails importants de contacts connus',
    prompt: 'Emails from known contacts, direct personal correspondence, replies in ongoing conversations.',
    color: '#2e7d32',
    is_default: true,
    position: 0,
  },
  {
    name: 'Transactionnel',
    description: 'Emails transactionnels et de service',
    prompt: 'Transactional and service emails: invoices, payment confirmations, payment failures, authentication codes (OTP, 2FA), password resets, security alerts, account management notifications, subscription renewals, delivery tracking, receipts.',
    color: '#1565c0',
    is_default: true,
    position: 1,
  },
  {
    name: 'Notifications',
    description: 'Notifications automatiques des outils SaaS',
    prompt: 'Automated notifications from SaaS tools and productivity apps: Slack messages, GitHub notifications, Google Workspace alerts, calendar invitations, CI/CD build results, Notion updates, Figma comments, Linear tickets, project management tools.',
    color: '#00838f',
    is_default: true,
    position: 2,
  },
  {
    name: 'Newsletter',
    description: 'Newsletters et abonnements de contenu',
    prompt: 'Newsletter and content subscriptions the user opted into: industry news digests, blog updates, marketing emails from services the user uses, weekly recaps, curated content.',
    color: '#e65100',
    is_default: true,
    position: 3,
  },
  {
    name: 'Prospection utile',
    description: 'Prospection commerciale potentiellement pertinente',
    prompt: 'Commercial outreach that could be relevant to the user\'s role and industry. Not mass-sent \u2014 shows signs of personalization or relevance.',
    color: '#f57f17',
    is_default: true,
    position: 4,
  },
  {
    name: 'Prospection',
    description: 'Prospection commerciale generique non sollicitee',
    prompt: 'Generic cold outreach and sales pitches. Unsolicited commercial contact from strangers with no specific relevance to the user\'s role.',
    color: '#c62828',
    is_default: true,
    position: 5,
  },
  {
    name: 'Spam',
    description: 'Spam, phishing et sequences automatisees',
    prompt: 'Mass-sent prospecting via tools (Lemlist, Apollo, Instantly), phishing attempts, scam emails, automated sequences.',
    color: '#6a1b9a',
    is_default: true,
    position: 6,
  },
]

/**
 * Maps legacy 3-bucket ClassificationResult values to default label names.
 * Used during migration and backward compatibility with the old pipeline.
 */
export const LEGACY_RESULT_TO_DEFAULT_LABEL: Record<string, string[]> = {
  'A_VOIR': ['Important'],
  'FILTRE': ['Newsletter', 'Notifications', 'Prospection utile'],
  'BLOQUE': ['Prospection', 'Spam'],
}
