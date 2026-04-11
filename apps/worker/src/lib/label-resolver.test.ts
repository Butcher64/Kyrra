import { describe, it, expect } from 'vitest'
import { deriveLegacyResult, resolveLabel, resolveLabelByName } from './label-resolver'
import type { UserLabel } from '@kyrra/shared'

// Standard 7 default labels
const LABELS: UserLabel[] = [
  { id: 'l0', user_id: 'u1', name: 'Important', description: '', prompt: '', color: '#2e7d32', gmail_label_id: null, gmail_label_name: null, is_default: true, position: 0, created_at: '', updated_at: '' },
  { id: 'l1', user_id: 'u1', name: 'Transactionnel', description: '', prompt: '', color: '#1565c0', gmail_label_id: null, gmail_label_name: null, is_default: true, position: 1, created_at: '', updated_at: '' },
  { id: 'l2', user_id: 'u1', name: 'Notifications', description: '', prompt: '', color: '#00838f', gmail_label_id: null, gmail_label_name: null, is_default: true, position: 2, created_at: '', updated_at: '' },
  { id: 'l3', user_id: 'u1', name: 'Newsletter', description: '', prompt: '', color: '#e65100', gmail_label_id: null, gmail_label_name: null, is_default: true, position: 3, created_at: '', updated_at: '' },
  { id: 'l4', user_id: 'u1', name: 'Prospection utile', description: '', prompt: '', color: '#f57f17', gmail_label_id: null, gmail_label_name: null, is_default: true, position: 4, created_at: '', updated_at: '' },
  { id: 'l5', user_id: 'u1', name: 'Prospection', description: '', prompt: '', color: '#c62828', gmail_label_id: null, gmail_label_name: null, is_default: true, position: 5, created_at: '', updated_at: '' },
  { id: 'l6', user_id: 'u1', name: 'Spam', description: '', prompt: '', color: '#6a1b9a', gmail_label_id: null, gmail_label_name: null, is_default: true, position: 6, created_at: '', updated_at: '' },
]

// ── deriveLegacyResult ──

describe('deriveLegacyResult', () => {
  it('returns A_VOIR for position 0', () => {
    expect(deriveLegacyResult(0)).toBe('A_VOIR')
  })

  it('returns A_VOIR for position 2 (boundary)', () => {
    expect(deriveLegacyResult(2)).toBe('A_VOIR')
  })

  it('returns FILTRE for position 3', () => {
    expect(deriveLegacyResult(3)).toBe('FILTRE')
  })

  it('returns FILTRE for position 4 (boundary)', () => {
    expect(deriveLegacyResult(4)).toBe('FILTRE')
  })

  it('returns BLOQUE for position 5', () => {
    expect(deriveLegacyResult(5)).toBe('BLOQUE')
  })

  it('returns BLOQUE for position 10', () => {
    expect(deriveLegacyResult(10)).toBe('BLOQUE')
  })
})

// ── resolveLabel ──

describe('resolveLabel', () => {
  it('resolves A_VOIR to Important label', () => {
    const result = resolveLabel('A_VOIR', LABELS)
    expect(result.name).toBe('Important')
  })

  it('resolves FILTRE to Newsletter label', () => {
    const result = resolveLabel('FILTRE', LABELS)
    expect(result.name).toBe('Newsletter')
  })

  it('resolves BLOQUE to Prospection label', () => {
    const result = resolveLabel('BLOQUE', LABELS)
    expect(result.name).toBe('Prospection')
  })

  it('falls back to first label (lowest position) when A_VOIR default is missing', () => {
    const labelsWithoutImportant = LABELS.filter(l => l.name !== 'Important')
    const result = resolveLabel('A_VOIR', labelsWithoutImportant)
    // Should fall back to lowest position
    expect(result.position).toBeLessThanOrEqual(2)
  })

  it('falls back to last label (highest position) when BLOQUE default is missing', () => {
    const labelsWithoutProspection = LABELS.filter(l => l.name !== 'Prospection' && l.name !== 'Spam')
    const result = resolveLabel('BLOQUE', labelsWithoutProspection)
    // Should fall back to highest position
    const maxPos = Math.max(...labelsWithoutProspection.map(l => l.position))
    expect(result.position).toBe(maxPos)
  })

  it('falls back to median position label when FILTRE defaults are missing', () => {
    const labelsWithoutFiltre = LABELS.filter(l => l.name !== 'Newsletter' && l.name !== 'Notifications' && l.name !== 'Prospection utile')
    const result = resolveLabel('FILTRE', labelsWithoutFiltre)
    // Should fall back to middle position
    const sorted = [...labelsWithoutFiltre].sort((a, b) => a.position - b.position)
    const midIndex = Math.floor(sorted.length / 2)
    expect(result.position).toBe(sorted[midIndex]!.position)
  })
})

// ── resolveLabelByName ──

describe('resolveLabelByName', () => {
  it('resolves exact name match', () => {
    const result = resolveLabelByName('Newsletter', LABELS)
    expect(result.id).toBe('l3')
  })

  it('resolves case-insensitive match', () => {
    const result = resolveLabelByName('newsletter', LABELS)
    expect(result.id).toBe('l3')
  })

  it('resolves NEWSLETTER (upper case)', () => {
    const result = resolveLabelByName('NEWSLETTER', LABELS)
    expect(result.id).toBe('l3')
  })

  it('falls back to first label (lowest position) when name not found', () => {
    const result = resolveLabelByName('Unknown Label', LABELS)
    expect(result.position).toBe(0)
    expect(result.name).toBe('Important')
  })

  it('handles Prospection utile with spaces', () => {
    const result = resolveLabelByName('Prospection utile', LABELS)
    expect(result.id).toBe('l4')
  })
})
