import { describe, it, expect } from 'vitest'
import { applyRule3 } from './rule-3-new-user-notification'

describe('Safety Rule 3: New user (< 14 days) + BLOQUE → notify', () => {
  // Core behavior: new user + BLOQUE → shouldNotify
  it('notifies on BLOQUE for user at day 0', () => {
    const { result, shouldNotify } = applyRule3('BLOQUE', 0)
    expect(result).toBe('BLOQUE')
    expect(shouldNotify).toBe(true)
  })

  it('notifies on BLOQUE for user at day 13', () => {
    const { result, shouldNotify } = applyRule3('BLOQUE', 13)
    expect(result).toBe('BLOQUE')
    expect(shouldNotify).toBe(true)
  })

  // Boundary: day 14 exactly → should NOT notify (>= 14 is established user)
  it('does not notify on BLOQUE for user at day 14 (boundary)', () => {
    const { result, shouldNotify } = applyRule3('BLOQUE', 14)
    expect(result).toBe('BLOQUE')
    expect(shouldNotify).toBe(false)
  })

  it('does not notify on BLOQUE for user at day 30', () => {
    const { result, shouldNotify } = applyRule3('BLOQUE', 30)
    expect(result).toBe('BLOQUE')
    expect(shouldNotify).toBe(false)
  })

  // Non-BLOQUE results: never notifies regardless of account age
  it('does not notify on FILTRE for new user', () => {
    const { shouldNotify } = applyRule3('FILTRE', 5)
    expect(shouldNotify).toBe(false)
  })

  it('does not notify on A_VOIR for new user', () => {
    const { shouldNotify } = applyRule3('A_VOIR', 1)
    expect(shouldNotify).toBe(false)
  })

  // Result is never modified by rule 3
  it('never modifies the classification result', () => {
    expect(applyRule3('BLOQUE', 5).result).toBe('BLOQUE')
    expect(applyRule3('FILTRE', 5).result).toBe('FILTRE')
    expect(applyRule3('A_VOIR', 5).result).toBe('A_VOIR')
    expect(applyRule3('BLOQUE', 20).result).toBe('BLOQUE')
  })
})
