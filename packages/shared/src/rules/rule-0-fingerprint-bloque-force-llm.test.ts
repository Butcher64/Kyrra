import { describe, it, expect } from 'vitest'
import { applyRule0 } from './rule-0-fingerprint-bloque-force-llm'

describe('Safety Rule 0: Fingerprint BLOQUE → FORCE_LLM_REVIEW', () => {
  // Core behavior: fingerprint + BLOQUE + confidence < 0.9 → FORCE_LLM_REVIEW
  it('returns FORCE_LLM_REVIEW when fingerprint BLOQUE at confidence 0.89', () => {
    expect(applyRule0('BLOQUE', 0.89, 'fingerprint')).toBe('FORCE_LLM_REVIEW')
  })

  it('returns FORCE_LLM_REVIEW when fingerprint BLOQUE at confidence 0.5', () => {
    expect(applyRule0('BLOQUE', 0.5, 'fingerprint')).toBe('FORCE_LLM_REVIEW')
  })

  it('returns FORCE_LLM_REVIEW when fingerprint BLOQUE at confidence 0.0', () => {
    expect(applyRule0('BLOQUE', 0.0, 'fingerprint')).toBe('FORCE_LLM_REVIEW')
  })

  // Boundary: confidence = 0.90 exactly → should NOT trigger (>= 0.9 passes through)
  it('passes through BLOQUE at confidence exactly 0.90 (boundary)', () => {
    expect(applyRule0('BLOQUE', 0.9, 'fingerprint')).toBe('BLOQUE')
  })

  it('passes through BLOQUE at confidence 0.95', () => {
    expect(applyRule0('BLOQUE', 0.95, 'fingerprint')).toBe('BLOQUE')
  })

  it('passes through BLOQUE at confidence 1.0', () => {
    expect(applyRule0('BLOQUE', 1.0, 'fingerprint')).toBe('BLOQUE')
  })

  // LLM source: never triggers FORCE_LLM_REVIEW (would cause infinite loop)
  it('passes through LLM BLOQUE at low confidence (no re-route)', () => {
    expect(applyRule0('BLOQUE', 0.5, 'llm')).toBe('BLOQUE')
  })

  it('passes through LLM BLOQUE at confidence 0.89', () => {
    expect(applyRule0('BLOQUE', 0.89, 'llm')).toBe('BLOQUE')
  })

  // Non-BLOQUE results: never triggers regardless of source or confidence
  it('passes through FILTRE from fingerprint at low confidence', () => {
    expect(applyRule0('FILTRE', 0.5, 'fingerprint')).toBe('FILTRE')
  })

  it('passes through A_VOIR from fingerprint at low confidence', () => {
    expect(applyRule0('A_VOIR', 0.3, 'fingerprint')).toBe('A_VOIR')
  })

  it('passes through FILTRE from LLM', () => {
    expect(applyRule0('FILTRE', 0.7, 'llm')).toBe('FILTRE')
  })

  it('passes through A_VOIR from LLM', () => {
    expect(applyRule0('A_VOIR', 0.8, 'llm')).toBe('A_VOIR')
  })
})
