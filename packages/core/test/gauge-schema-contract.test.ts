import { describe, expect, it } from 'vitest'

import {
  compassAlertSchema,
  radialBargraphAlertSchema,
  windDirectionAlertSchema,
  windDirectionGaugeConfigSchema
} from '../src/index.js'

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
})
