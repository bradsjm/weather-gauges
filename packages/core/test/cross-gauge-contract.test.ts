import { describe, expect, it } from 'vitest'

import {
  compassGaugeConfigSchema,
  gaugeContract,
  radialGaugeConfigSchema,
  radialBargraphGaugeConfigSchema,
  toGaugeContractError,
  toGaugeContractState,
  windDirectionGaugeConfigSchema,
  validateCompassConfig,
  validateRadialBargraphConfig
} from '../src/index.js'

describe('cross-gauge contracts', () => {
  it('normalizes render results into unified contract state', () => {
    const radialBargraphState = toGaugeContractState('radial-bargraph', {
      reading: 42,
      value: 42,
      tone: 'accent',
      activeAlerts: []
    })

    const compassState = toGaugeContractState('compass', {
      reading: 132,
      heading: 132,
      tone: 'danger',
      activeAlerts: [{ id: 'storm', heading: 130, message: 'storm', severity: 'critical' }]
    })

    expect(radialBargraphState).toMatchObject({
      kind: 'radial-bargraph',
      reading: 42,
      tone: 'accent'
    })
    expect(compassState).toMatchObject({ kind: 'compass', reading: 132, tone: 'danger' })
  })

  it('uses shared event names and default animation duration', () => {
    expect(gaugeContract.valueChangeEvent).toBe('wx-state-change')
    expect(gaugeContract.errorEvent).toBe('wx-error')
    expect(gaugeContract.defaultAnimationDurationMs).toBe(500)
  })

  it('normalizes structured error payloads', () => {
    const error = toGaugeContractError(
      'radial',
      [{ path: 'value.current', message: 'current must be within min and max range' }],
      'Invalid radial configuration'
    )

    expect(error).toEqual({
      kind: 'radial',
      code: 'invalid_config',
      message: 'Invalid radial configuration',
      issues: [{ path: 'value.current', message: 'current must be within min and max range' }]
    })
  })

  it('returns consistent structured validation semantics across gauges', () => {
    const radialBargraph = validateRadialBargraphConfig({})
    const compass = validateCompassConfig({})

    expect(radialBargraph.success).toBe(false)
    expect(compass.success).toBe(false)

    if (!radialBargraph.success && !compass.success) {
      expect(radialBargraph.errors[0]).toEqual(
        expect.objectContaining({
          code: 'invalid_type',
          path: 'value'
        })
      )
      expect(compass.errors[0]).toEqual(
        expect.objectContaining({
          code: 'invalid_type',
          path: 'size'
        })
      )
    }
  })

  it('keeps shared defaults aligned across radial-bargraph/compass', () => {
    const radialBargraph = radialBargraphGaugeConfigSchema.parse({
      value: { min: 0, max: 100, current: 5 },
      size: { width: 200, height: 200 },
      indicators: { alerts: [] }
    })

    const compass = compassGaugeConfigSchema.parse({
      heading: { current: 5 },
      size: { width: 220, height: 220 },
      indicators: { alerts: [] }
    })

    expect(radialBargraph.animation.durationMs).toBe(gaugeContract.defaultAnimationDurationMs)
    expect(compass.animation.durationMs).toBe(gaugeContract.defaultAnimationDurationMs)
  })

  it('enforces fixed heading domain for wind-direction configs', () => {
    expect(() =>
      windDirectionGaugeConfigSchema.parse({
        value: {
          latest: 361,
          average: 180
        },
        size: { width: 220, height: 220 }
      })
    ).toThrowError()

    expect(() =>
      windDirectionGaugeConfigSchema.parse({
        value: {
          latest: 90,
          average: 180
        },
        size: { width: 220, height: 220 }
      })
    ).not.toThrowError()
  })

  it('enforces range-bound indicator values for radial configs', () => {
    expect(() =>
      radialGaugeConfigSchema.parse({
        value: { min: 0, max: 100, current: 50 },
        size: { width: 220, height: 220 },
        indicators: {
          threshold: { value: 120, show: true },
          alerts: []
        }
      })
    ).toThrowError()

    expect(() =>
      radialGaugeConfigSchema.parse({
        value: { min: 0, max: 100, current: 50 },
        size: { width: 220, height: 220 },
        indicators: {
          threshold: { value: 80, show: true },
          alerts: [{ id: 'warn', value: 70, message: 'high', severity: 'warning' }]
        }
      })
    ).not.toThrowError()
  })

  it('enforces range-bound indicator values for radial-bargraph configs', () => {
    expect(() =>
      radialBargraphGaugeConfigSchema.parse({
        value: { min: 10, max: 40, current: 20 },
        size: { width: 220, height: 220 },
        indicators: {
          threshold: { value: 50, show: true },
          alerts: []
        }
      })
    ).toThrowError()

    expect(() =>
      radialBargraphGaugeConfigSchema.parse({
        value: { min: 10, max: 40, current: 20 },
        size: { width: 220, height: 220 },
        indicators: {
          threshold: { value: 30, show: true },
          alerts: [{ id: 'warn', value: 35, message: 'high', severity: 'warning' }]
        }
      })
    ).not.toThrowError()
  })
})
