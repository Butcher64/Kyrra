import type { UserLabel } from '@kyrra/shared'
import { LEGACY_RESULT_TO_DEFAULT_LABEL } from '@kyrra/shared'
import type { ClassificationResult } from '@kyrra/shared'

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

  return userLabels.sort((a, b) => a.position - b.position)[0]!
}
