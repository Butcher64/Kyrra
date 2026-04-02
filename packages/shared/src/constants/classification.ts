export const CLASSIFICATION_RESULTS = ['A_VOIR', 'FILTRE', 'BLOQUE'] as const
export type ClassificationResult = typeof CLASSIFICATION_RESULTS[number]

export const CLASSIFICATION_LABELS: Record<ClassificationResult, string> = {
  A_VOIR: 'À voir',
  FILTRE: 'Filtré',
  BLOQUE: 'Bloqué',
}

// System whitelisted senders — skip classification entirely (PM6)
// Emails from these addresses receive NO label (neutral in inbox)
export const SYSTEM_WHITELISTED_SENDERS = [
  'noreply@kyrra.io',
  'recap@kyrra.io',
  'support@kyrra.io',
] as const

// ── Scan tier limits (initial inbox scan after onboarding) ──

export const SCAN_TIER = {
  FREE: 500,       // Free plan: 500 most recent inbox emails
  PRO: 10_000,     // Pro plan: 10,000 most recent inbox emails
  UNLIMITED: 50_000, // Admin/beta_tester: effectively unlimited
} as const

/**
 * Determine the inbox scan limit based on user role and credit plan
 * Used by onboarding to decide how many inbox emails to queue for classification
 */
export function getScanLimit(role: string, dailyCreditLimit: number): number {
  if (role === 'admin' || role === 'beta_tester') return SCAN_TIER.UNLIMITED
  if (dailyCreditLimit === -1) return SCAN_TIER.UNLIMITED // Unlimited credits
  if (dailyCreditLimit > 30) return SCAN_TIER.PRO          // Pro plan
  return SCAN_TIER.FREE                                     // Free plan
}
