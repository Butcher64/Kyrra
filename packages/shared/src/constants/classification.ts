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
