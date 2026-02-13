import { describe, expect, it } from 'vitest'
import { resolveWindDirectionTextDefaults } from '../src/shared/wind-direction-presets.js'

describe('wind-direction preset defaults', () => {
  it('applies wind-direction fallback text when preset is enabled', () => {
    const resolved = resolveWindDirectionTextDefaults({
      preset: 'wind-direction',
      title: '',
      unit: '',
      lcdTitleLatest: '',
      lcdTitleAverage: '',
      hasTitleAttr: false,
      hasUnitAttr: false,
      hasLcdTitleLatestAttr: false,
      hasLcdTitleAverageAttr: false
    })

    expect(resolved).toEqual({
      title: 'Wind Direction',
      unit: '°',
      lcdTitleLatest: 'Latest',
      lcdTitleAverage: 'Average'
    })
  })

  it('preserves explicit values over preset defaults', () => {
    const resolved = resolveWindDirectionTextDefaults({
      preset: 'wind-direction',
      title: 'Wind',
      unit: 'deg',
      lcdTitleLatest: 'Now',
      lcdTitleAverage: 'Mean',
      hasTitleAttr: true,
      hasUnitAttr: true,
      hasLcdTitleLatestAttr: true,
      hasLcdTitleAverageAttr: true
    })

    expect(resolved).toEqual({
      title: 'Wind',
      unit: 'deg',
      lcdTitleLatest: 'Now',
      lcdTitleAverage: 'Mean'
    })
  })

  it('keeps empty defaults when preset is disabled', () => {
    const resolved = resolveWindDirectionTextDefaults({
      preset: '',
      title: '',
      unit: '',
      lcdTitleLatest: '',
      lcdTitleAverage: '',
      hasTitleAttr: false,
      hasUnitAttr: false,
      hasLcdTitleLatestAttr: false,
      hasLcdTitleAverageAttr: false
    })

    expect(resolved).toEqual({
      title: '',
      unit: '',
      lcdTitleLatest: '',
      lcdTitleAverage: ''
    })
  })
})
