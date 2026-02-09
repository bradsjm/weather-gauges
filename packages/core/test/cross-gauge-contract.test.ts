import { describe, expect, it } from 'vitest'

import {
  compassGaugeConfigSchema,
  gaugeContract,
  radialBargraphGaugeConfigSchema,
  toGaugeContractState,
  validateCompassConfig,
  validateRadialBargraphConfig
} from '../src/index.js'

describe('cross-gauge contracts', () => {
  it('normalizes render results into unified contract state', () => {
    const radialBargraphState = toGaugeContractState('radial-bargraph', {
      value: 42,
      tone: 'accent',
      activeAlerts: []
    })

    const compassState = toGaugeContractState('compass', {
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
    expect(gaugeContract.valueChangeEvent).toBe('ss3-value-change')
    expect(gaugeContract.errorEvent).toBe('ss3-error')
    expect(gaugeContract.defaultAnimationDurationMs).toBe(500)
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
          path: 'heading'
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
})
