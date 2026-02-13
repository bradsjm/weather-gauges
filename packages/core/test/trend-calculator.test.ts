import { describe, expect, it } from 'vitest'

import { TrendCalculator, calculateTrend } from '../src/index.js'

describe('trend calculator', () => {
  it('returns null when less than two samples are available', () => {
    expect(calculateTrend([])).toBeNull()
    expect(calculateTrend([{ timestamp: 1000, value: 12 }])).toBeNull()
  })

  it('detects upward and downward trends', () => {
    const rising = [
      { timestamp: 1000, value: 10 },
      { timestamp: 2000, value: 12 },
      { timestamp: 3000, value: 14 }
    ]
    const falling = [
      { timestamp: 1000, value: 14 },
      { timestamp: 2000, value: 12 },
      { timestamp: 3000, value: 10 }
    ]

    expect(calculateTrend(rising)).toBe('up')
    expect(TrendCalculator.calculate(falling)).toBe('down')
  })

  it('returns steady when delta is below threshold', () => {
    const values = [
      { timestamp: 1000, value: 10 },
      { timestamp: 2000, value: 10.2 },
      { timestamp: 3000, value: 10.3 }
    ]

    expect(calculateTrend(values)).toBe('steady')
    expect(calculateTrend(values, { threshold: 0.2 })).toBe('up')
  })

  it('evaluates only values inside the configured window', () => {
    const values = [
      { timestamp: 1000, value: 30 },
      { timestamp: 1500, value: 25 },
      { timestamp: 4000, value: 10 },
      { timestamp: 4500, value: 20 }
    ]

    expect(calculateTrend(values, { windowMs: 1000 })).toBe('up')
  })

  it('handles unsorted samples and ignores invalid entries', () => {
    const values = [
      { timestamp: 5000, value: 20 },
      { timestamp: Number.NaN, value: 100 },
      { timestamp: 3000, value: 10 },
      { timestamp: 4000, value: Number.NaN }
    ]

    expect(calculateTrend(values, { threshold: 0.1 })).toBe('up')
  })

  it('throws actionable errors for invalid options', () => {
    const values = [
      { timestamp: 1000, value: 10 },
      { timestamp: 2000, value: 11 }
    ]

    expect(() => calculateTrend(values, { threshold: -1 })).toThrowError(
      'threshold must be greater than or equal to 0'
    )
    expect(() => calculateTrend(values, { windowMs: 0 })).toThrowError(
      'windowMs must be greater than 0'
    )
  })
})
