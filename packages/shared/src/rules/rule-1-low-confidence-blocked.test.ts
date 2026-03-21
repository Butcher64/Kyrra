import { describe, it, expect } from 'vitest'
import { applyRule1 } from './rule-1-low-confidence-blocked'

describe('Safety Rule 1: BLOQUE + confidence < 75% → FILTRE', () => {
  // Core behavior: BLOQUE with low confidence gets downgraded
  it('downgrades BLOQUE to FILTRE at confidence 0.74', () => {
    expect(applyRule1('BLOQUE', 0.74)).toBe('FILTRE')
  })

  it('downgrades BLOQUE to FILTRE at confidence 0.5', () => {
    expect(applyRule1('BLOQUE', 0.5)).toBe('FILTRE')
  })

  it('downgrades BLOQUE to FILTRE at confidence 0.0', () => {
    expect(applyRule1('BLOQUE', 0.0)).toBe('FILTRE')
  })

  // Boundary: confidence = 0.75 exactly → should NOT downgrade
  it('keeps BLOQUE at confidence exactly 0.75 (boundary)', () => {
    expect(applyRule1('BLOQUE', 0.75)).toBe('BLOQUE')
  })

  it('keeps BLOQUE at confidence 0.9', () => {
    expect(applyRule1('BLOQUE', 0.9)).toBe('BLOQUE')
  })

  it('keeps BLOQUE at confidence 1.0', () => {
    expect(applyRule1('BLOQUE', 1.0)).toBe('BLOQUE')
  })

  // Non-BLOQUE results: never affected
  it('passes through FILTRE regardless of confidence', () => {
    expect(applyRule1('FILTRE', 0.5)).toBe('FILTRE')
    expect(applyRule1('FILTRE', 0.3)).toBe('FILTRE')
  })

  it('passes through A_VOIR regardless of confidence', () => {
    expect(applyRule1('A_VOIR', 0.5)).toBe('A_VOIR')
    expect(applyRule1('A_VOIR', 0.1)).toBe('A_VOIR')
  })
})
