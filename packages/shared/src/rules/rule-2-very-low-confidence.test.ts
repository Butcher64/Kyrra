import { describe, it, expect } from 'vitest'
import { applyRule2 } from './rule-2-very-low-confidence'

describe('Safety Rule 2: Any result + confidence < 60% → A_VOIR', () => {
  // Core behavior: very low confidence → always promote to A_VOIR
  it('promotes BLOQUE to A_VOIR at confidence 0.59', () => {
    expect(applyRule2('BLOQUE', 0.59)).toBe('A_VOIR')
  })

  it('promotes FILTRE to A_VOIR at confidence 0.3', () => {
    expect(applyRule2('FILTRE', 0.3)).toBe('A_VOIR')
  })

  it('promotes BLOQUE to A_VOIR at confidence 0.0', () => {
    expect(applyRule2('BLOQUE', 0.0)).toBe('A_VOIR')
  })

  // A_VOIR stays A_VOIR (no-op but correct behavior)
  it('keeps A_VOIR at low confidence (idempotent)', () => {
    expect(applyRule2('A_VOIR', 0.3)).toBe('A_VOIR')
  })

  // Boundary: confidence = 0.60 exactly → should NOT promote
  it('keeps BLOQUE at confidence exactly 0.60 (boundary)', () => {
    expect(applyRule2('BLOQUE', 0.6)).toBe('BLOQUE')
  })

  it('keeps FILTRE at confidence exactly 0.60 (boundary)', () => {
    expect(applyRule2('FILTRE', 0.6)).toBe('FILTRE')
  })

  // Above threshold: no effect
  it('keeps BLOQUE at confidence 0.75', () => {
    expect(applyRule2('BLOQUE', 0.75)).toBe('BLOQUE')
  })

  it('keeps FILTRE at confidence 0.8', () => {
    expect(applyRule2('FILTRE', 0.8)).toBe('FILTRE')
  })

  it('keeps A_VOIR at confidence 0.9', () => {
    expect(applyRule2('A_VOIR', 0.9)).toBe('A_VOIR')
  })
})
