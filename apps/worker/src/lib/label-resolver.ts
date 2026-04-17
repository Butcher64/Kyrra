import type { UserLabel } from '@kyrra/shared'
import { LEGACY_RESULT_TO_DEFAULT_LABEL } from '@kyrra/shared'
import type { ClassificationResult } from '@kyrra/shared'

const DEFAULT_NAME_TO_LEGACY: Record<string, ClassificationResult> = {
  'Important': 'A_VOIR',
  'Transactionnel': 'A_VOIR',
  'Notifications': 'A_VOIR',
  'Newsletter': 'FILTRE',
  'Prospection utile': 'FILTRE',
  'Prospection': 'BLOQUE',
  'Spam': 'BLOQUE',
}

/**
 * Derive the legacy classification_result from a label.
 * For Kyrra default labels, maps by the canonical name (stable across reorders).
 * For custom user labels, falls back to the position-based mapping
 * (position 0-2 → A_VOIR, 3-4 → FILTRE, 5+ → BLOQUE).
 */
export function deriveLegacyResult(
  labelOrPosition: UserLabel | number,
): ClassificationResult {
  if (typeof labelOrPosition === 'number') {
    const p = labelOrPosition
    if (p <= 2) return 'A_VOIR'
    if (p <= 4) return 'FILTRE'
    return 'BLOQUE'
  }
  const label = labelOrPosition
  if (label.is_default) {
    const mapped = DEFAULT_NAME_TO_LEGACY[label.name]
    if (mapped) return mapped
  }
  const p = label.position
  if (p <= 2) return 'A_VOIR'
  if (p <= 4) return 'FILTRE'
  return 'BLOQUE'
}

/**
 * Resolve a legacy ClassificationResult (from fingerprint/prefilter) to a user label.
 * Strategy: find the user's default label that matches the legacy result.
 * If user deleted the default, fall back by position (first = safest).
 */
export function resolveLabel(
  legacyResult: ClassificationResult,
  userLabels: UserLabel[],
): UserLabel {
  const candidateNames = LEGACY_RESULT_TO_DEFAULT_LABEL[legacyResult] ?? ['Important']

  for (const name of candidateNames) {
    const match = userLabels.find((l) => l.is_default && l.name === name)
    if (match) return match
  }

  // Fallback by position
  if (legacyResult === 'BLOQUE') {
    const sorted = [...userLabels].sort((a, b) => b.position - a.position)
    return sorted[0]!
  }
  if (legacyResult === 'A_VOIR') {
    const sorted = [...userLabels].sort((a, b) => a.position - b.position)
    return sorted[0]!
  }
  const sorted = [...userLabels].sort((a, b) => a.position - b.position)
  return sorted[Math.floor(sorted.length / 2)]!
}

/**
 * Resolve an LLM-returned label name to a user label.
 * Falls back to the first label (most visible) if name doesn't match.
 */
export function resolveLabelByName(
  labelName: string,
  userLabels: UserLabel[],
): UserLabel {
  const match = userLabels.find((l) => l.name === labelName)
  if (match) return match

  const ciMatch = userLabels.find((l) => l.name.toLowerCase() === labelName.toLowerCase())
  if (ciMatch) return ciMatch

  return [...userLabels].sort((a, b) => a.position - b.position)[0]!
}
