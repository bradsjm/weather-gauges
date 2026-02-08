import { describe, expect, it } from 'vitest'

import { validateGaugeRange, validateGaugeValue, validateSharedGaugeConfig } from '../src/index.js'

describe('shared schema validation', () => {
  it('returns structured error details when range is invalid', () => {
    const result = validateGaugeRange({ min: 10, max: 10 })

    expect(result.success).toBe(false)
    if (result.success) {
      return
    }

    expect(result.errors).toEqual(
      expect.arrayContaining([
        {
          code: 'custom',
          path: 'max',
          message: 'max must be greater than min'
        }
      ])
    )
  })

  it('returns structured error details when current is out of range', () => {
    const result = validateGaugeValue({ min: 0, max: 100, current: 120 })

    expect(result.success).toBe(false)
    if (result.success) {
      return
    }

    expect(result.errors).toEqual(
      expect.arrayContaining([
        {
          code: 'custom',
          path: 'current',
          message: 'current must be within min and max range'
        }
      ])
    )
  })

  it('returns path-aware type errors for invalid nested values', () => {
    const result = validateSharedGaugeConfig({
      value: { min: 0, max: 100, current: '42' },
      size: { width: 240, height: 240 }
    })

    expect(result.success).toBe(false)
    if (result.success) {
      return
    }

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'invalid_type',
          path: 'value.current',
          message: expect.stringContaining('number')
        })
      ])
    )
  })

  it('applies shared defaults for omitted sections', () => {
    const result = validateSharedGaugeConfig({
      value: { min: 0, max: 100, current: 42 },
      size: { width: 240, height: 240 }
    })

    expect(result.success).toBe(true)
    if (!result.success) {
      return
    }

    expect(result.data.animation).toEqual({
      enabled: true,
      durationMs: 500,
      easing: 'easeInOutCubic'
    })
    expect(result.data.visibility).toEqual({
      showFrame: true,
      showBackground: true,
      showForeground: true,
      showLcd: true
    })
  })
})
