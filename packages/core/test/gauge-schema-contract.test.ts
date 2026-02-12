import { describe, expect, it } from 'vitest'

import {
  compassAlertSchema,
  compassFrameDesignSchema,
  radialBargraphAlertSchema,
  radialBargraphGaugeConfigSchema,
  windDirectionAlertSchema,
  windDirectionGaugeConfigSchema
} from '../src/index.js'
import {
  radialBackgroundColorSchema,
  radialFrameDesignSchema,
  radialIndicatorsSchema
} from '../src/radial/schema.js'
import { gaugeBackgroundColorSchema } from '../src/schemas/background.js'
import { gaugeFrameDesignSchema } from '../src/schemas/frame.js'

describe('gauge schema contracts', () => {
  it('defaults alert severity to warning across compass, wind direction, and radial bargraph', () => {
    const compassAlert = compassAlertSchema.parse({
      id: 'compass-warning',
      heading: 45,
      message: 'compass alert'
    })
    const windDirectionAlert = windDirectionAlertSchema.parse({
      id: 'wind-warning',
      heading: 180,
      message: 'wind alert'
    })
    const radialAlert = radialBargraphAlertSchema.parse({
      id: 'radial-warning',
      value: 75,
      message: 'radial alert'
    })

    expect(compassAlert.severity).toBe('warning')
    expect(windDirectionAlert.severity).toBe('warning')
    expect(radialAlert.severity).toBe('warning')
  })

  it('accepts custom layer image objects in non-browser runtimes', () => {
    const result = windDirectionGaugeConfigSchema.safeParse({
      value: { latest: 90, average: 120 },
      size: { width: 220, height: 220 },
      style: {
        customLayer: {
          image: {},
          visible: true
        }
      }
    })

    expect(result.success).toBe(true)
  })

  it('keeps shared frame/background enum contracts aligned across gauge schemas', () => {
    expect(compassFrameDesignSchema.options).toEqual(gaugeFrameDesignSchema.options)
    expect(radialFrameDesignSchema.options).toEqual(gaugeFrameDesignSchema.options)
    expect(radialBackgroundColorSchema.options).toEqual(gaugeBackgroundColorSchema.options)
  })

  it('requires measured values when radial min/max visibility flags are enabled', () => {
    const result = radialIndicatorsSchema.safeParse({
      minMeasuredValueVisible: true,
      maxMeasuredValueVisible: true
    })

    expect(result.success).toBe(false)
    if (result.success) {
      return
    }

    const issues = result.error.issues.map((issue) => issue.path.join('.'))
    expect(issues).toContain('minMeasuredValue')
    expect(issues).toContain('maxMeasuredValue')
  })

  it('requires bargraph sections and gradient stops when dependent style flags are enabled', () => {
    const result = radialBargraphGaugeConfigSchema.safeParse({
      value: { min: 0, max: 100, current: 50 },
      size: { width: 220, height: 220 },
      style: {
        useSectionColors: true,
        useValueGradient: true
      }
    })

    expect(result.success).toBe(false)
    if (result.success) {
      return
    }

    const issues = result.error.issues.map((issue) => issue.path.join('.'))
    expect(issues).toContain('sections')
    expect(issues).toContain('valueGradientStops')
  })
})
