import { describe, expect, it } from 'vitest'
import { formatMoney, isValidDateRange, normalizeVietnamese } from './utils'

describe('utils', () => {
  it('formats VND values', () => {
    expect(formatMoney(2500000)).toContain('2.500.000')
  })

  it('normalizes Vietnamese text', () => {
    expect(normalizeVietnamese('Hội An 2025')).toBe('hoi an 2025')
  })

  it('validates date ranges', () => {
    expect(isValidDateRange('2025-05-10', '2025-05-12')).toBe(true)
    expect(isValidDateRange('2025-05-12', '2025-05-10')).toBe(false)
  })
})
