import { describe, expect, it } from 'vitest'

import {
  compassGaugeConfigSchema,
  windDirectionGaugeConfigSchema,
  windRoseGaugeConfigSchema
} from '../src/index.js'

describe('overlay custom layer defaults', () => {
  it('applies overlay defaults for wind-direction', () => {
    const image = {}
    const config = windDirectionGaugeConfigSchema.parse({
      value: {
        latest: 180,
        average: 175
      },
      size: { width: 220, height: 220 },
      style: {
        customLayer: {
          image
        }
      }
    })

    expect(config.style.customLayer).toEqual({
      image,
      visible: true,
      opacity: 0.3,
      position: 'center',
      scale: 0.5
    })
  })

  it('applies overlay defaults for wind-rose', () => {
    const image = {}
    const petals = Array.from({ length: 8 }, (_, index) => ({
      direction: index * 45,
      value: 5
    }))
    const config = windRoseGaugeConfigSchema.parse({
      value: {
        petals,
        maxValue: 10
      },
      size: { width: 220, height: 220 },
      style: {
        customLayer: {
          image
        }
      }
    })

    expect(config.style.customLayer).toEqual({
      image,
      visible: true,
      opacity: 0.3,
      position: 'center',
      scale: 0.5
    })
  })

  it('applies overlay defaults for compass', () => {
    const image = {}
    const config = compassGaugeConfigSchema.parse({
      heading: {
        current: 180
      },
      size: { width: 220, height: 220 },
      style: {
        customLayer: {
          image
        }
      }
    })

    expect(config.style.customLayer).toEqual({
      image,
      visible: true,
      opacity: 0.3,
      position: 'center',
      scale: 0.5
    })
  })
})
