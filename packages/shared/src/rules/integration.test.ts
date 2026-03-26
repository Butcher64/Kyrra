import { describe, it, expect } from 'vitest'
import {
  applyClassificationSafetyRules,
  applyClassificationSafetyRulesWithNotification,
} from './index'

// ─── applyClassificationSafetyRules ─────────────────────────────────────

describe('applyClassificationSafetyRules — full chain', () => {
  // Rule 0 triggers: fingerprint + BLOQUE + <0.9 → FORCE_LLM_REVIEW
  it('returns FORCE_LLM_REVIEW for fingerprint BLOQUE at 0.85', () => {
    expect(applyClassificationSafetyRules('BLOQUE', 0.85, 'fingerprint')).toBe('FORCE_LLM_REVIEW')
  })

  // Rule 0 does NOT fire for LLM source
  it('does not trigger FORCE_LLM_REVIEW for LLM BLOQUE at 0.85', () => {
    const result = applyClassificationSafetyRules('BLOQUE', 0.85, 'llm')
    // LLM BLOQUE at 0.85 → Rule 0 passes, Rule 1 passes (>0.75), Rule 2 passes (>0.6)
    expect(result).toBe('BLOQUE')
  })

  // Rule 1 fires: BLOQUE + <0.75 → FILTRE (when source=llm, so Rule 0 doesn't intercept)
  it('downgrades LLM BLOQUE at 0.70 to FILTRE (Rule 1)', () => {
    const result = applyClassificationSafetyRules('BLOQUE', 0.70, 'llm')
    // Rule 0: llm → pass. Rule 1: BLOQUE <0.75 → FILTRE. Rule 2: 0.70 >= 0.6 → pass
    expect(result).toBe('FILTRE')
  })

  // Rule 2 fires: <0.60 → A_VOIR regardless of result
  it('promotes LLM BLOQUE at 0.55 to A_VOIR (Rule 2 overrides Rule 1)', () => {
    const result = applyClassificationSafetyRules('BLOQUE', 0.55, 'llm')
    // Rule 0: llm → pass. Rule 1: <0.75 → FILTRE. Rule 2: <0.60 → A_VOIR
    expect(result).toBe('A_VOIR')
  })

  it('promotes LLM FILTRE at 0.50 to A_VOIR (Rule 2)', () => {
    expect(applyClassificationSafetyRules('FILTRE', 0.50, 'llm')).toBe('A_VOIR')
  })

  it('promotes fingerprint FILTRE at 0.40 to A_VOIR (Rule 2)', () => {
    expect(applyClassificationSafetyRules('FILTRE', 0.40, 'fingerprint')).toBe('A_VOIR')
  })

  // A_VOIR is already the safest bucket — rules don't demote it
  it('keeps A_VOIR unchanged at high confidence', () => {
    expect(applyClassificationSafetyRules('A_VOIR', 0.95, 'llm')).toBe('A_VOIR')
  })

  it('keeps A_VOIR unchanged at low confidence', () => {
    expect(applyClassificationSafetyRules('A_VOIR', 0.30, 'llm')).toBe('A_VOIR')
  })

  // FILTRE at high confidence — no rules fire
  it('keeps FILTRE unchanged at confidence 0.80', () => {
    expect(applyClassificationSafetyRules('FILTRE', 0.80, 'llm')).toBe('FILTRE')
  })

  it('keeps FILTRE unchanged at confidence 0.60 (boundary)', () => {
    expect(applyClassificationSafetyRules('FILTRE', 0.60, 'llm')).toBe('FILTRE')
  })

  // BLOQUE at very high confidence from LLM — passes through
  it('keeps LLM BLOQUE at 0.95 (all rules pass)', () => {
    expect(applyClassificationSafetyRules('BLOQUE', 0.95, 'llm')).toBe('BLOQUE')
  })

  // Fingerprint BLOQUE at >= 0.9 — Rule 0 passes, all others pass
  it('keeps fingerprint BLOQUE at 0.92 (Rule 0 boundary passed)', () => {
    expect(applyClassificationSafetyRules('BLOQUE', 0.92, 'fingerprint')).toBe('BLOQUE')
  })

  // Fingerprint BLOQUE < 0.9 → Rule 0 intercepts before Rules 1-2
  it('returns FORCE_LLM_REVIEW for fingerprint BLOQUE at 0.55 (Rule 0 before Rule 2)', () => {
    expect(applyClassificationSafetyRules('BLOQUE', 0.55, 'fingerprint')).toBe('FORCE_LLM_REVIEW')
  })

  // Boundary: fingerprint BLOQUE at exactly 0.9
  it('keeps fingerprint BLOQUE at exactly 0.90 (boundary — no FORCE_LLM_REVIEW)', () => {
    expect(applyClassificationSafetyRules('BLOQUE', 0.90, 'fingerprint')).toBe('BLOQUE')
  })

  // Boundary: BLOQUE at exactly 0.75 — Rule 1 boundary
  it('keeps LLM BLOQUE at exactly 0.75 (boundary — no downgrade)', () => {
    expect(applyClassificationSafetyRules('BLOQUE', 0.75, 'llm')).toBe('BLOQUE')
  })

  // Boundary: confidence exactly 0.60 — Rule 2 boundary
  it('keeps BLOQUE at exactly 0.60 (Rule 2 boundary — no promote)', () => {
    // LLM BLOQUE at 0.60: Rule 0 passes (llm), Rule 1: <0.75 → FILTRE, Rule 2: 0.60 >= 0.60 → pass
    expect(applyClassificationSafetyRules('BLOQUE', 0.60, 'llm')).toBe('FILTRE')
  })
})

// ─── applyClassificationSafetyRulesWithNotification ─────────────────────

describe('applyClassificationSafetyRulesWithNotification', () => {
  it('sets shouldNotify=true for BLOQUE on new account (5 days)', () => {
    const { signal, shouldNotify } = applyClassificationSafetyRulesWithNotification(
      'BLOQUE', 0.95, 'llm', 5,
    )
    expect(signal).toBe('BLOQUE')
    expect(shouldNotify).toBe(true)
  })

  it('sets shouldNotify=false for BLOQUE on mature account (30 days)', () => {
    const { signal, shouldNotify } = applyClassificationSafetyRulesWithNotification(
      'BLOQUE', 0.95, 'llm', 30,
    )
    expect(signal).toBe('BLOQUE')
    expect(shouldNotify).toBe(false)
  })

  it('sets shouldNotify=false for FILTRE on new account', () => {
    const { signal, shouldNotify } = applyClassificationSafetyRulesWithNotification(
      'FILTRE', 0.80, 'llm', 3,
    )
    expect(signal).toBe('FILTRE')
    expect(shouldNotify).toBe(false)
  })

  it('sets shouldNotify=false for A_VOIR on new account', () => {
    const { signal, shouldNotify } = applyClassificationSafetyRulesWithNotification(
      'A_VOIR', 0.70, 'llm', 1,
    )
    expect(signal).toBe('A_VOIR')
    expect(shouldNotify).toBe(false)
  })

  it('sets shouldNotify=false for FORCE_LLM_REVIEW (routing signal)', () => {
    const { signal, shouldNotify } = applyClassificationSafetyRulesWithNotification(
      'BLOQUE', 0.85, 'fingerprint', 3,
    )
    // Rule 0 fires → FORCE_LLM_REVIEW, notification skipped
    expect(signal).toBe('FORCE_LLM_REVIEW')
    expect(shouldNotify).toBe(false)
  })

  // Boundary: exactly 14 days → NOT a new user
  it('sets shouldNotify=false for BLOQUE at exactly 14 days (boundary)', () => {
    const { shouldNotify } = applyClassificationSafetyRulesWithNotification(
      'BLOQUE', 0.95, 'llm', 14,
    )
    expect(shouldNotify).toBe(false)
  })

  // Boundary: 13 days → still a new user
  it('sets shouldNotify=true for BLOQUE at 13 days', () => {
    const { shouldNotify } = applyClassificationSafetyRulesWithNotification(
      'BLOQUE', 0.95, 'llm', 13,
    )
    expect(shouldNotify).toBe(true)
  })

  // Rule chain interaction: BLOQUE at 0.70 from LLM on new account
  // Rule 1 downgrades to FILTRE → Rule 3 won't notify (not BLOQUE anymore)
  it('does not notify when Rule 1 downgrades BLOQUE to FILTRE on new account', () => {
    const { signal, shouldNotify } = applyClassificationSafetyRulesWithNotification(
      'BLOQUE', 0.70, 'llm', 5,
    )
    expect(signal).toBe('FILTRE')
    expect(shouldNotify).toBe(false)
  })

  // Rule 2 promotes to A_VOIR → no notify
  it('does not notify when Rule 2 promotes to A_VOIR on new account', () => {
    const { signal, shouldNotify } = applyClassificationSafetyRulesWithNotification(
      'BLOQUE', 0.50, 'llm', 2,
    )
    expect(signal).toBe('A_VOIR')
    expect(shouldNotify).toBe(false)
  })
})
