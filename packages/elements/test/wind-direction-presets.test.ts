import { describe, expect, it } from 'vitest'
import { resolveWindDirectionTextDefaults } from '../src/shared/wind-direction-presets.js'

describe('wind-direction preset defaults', () => {
  it('applies wind-direction fallback text when preset is enabled', () => {
    const resolved = resolveWindDirectionTextDefaults({
      preset: 'wind-direction',
      title: '',
      unit: '',
      averageLabel: '',
      hasTitleAttr: false,
      hasUnitAttr: false,
      hasAverageLabelAttr: false
    })

    expect(resolved).toEqual({
      title: 'Wind Direction',
      unit: '°',
      latestLabel: 'Latest',
      averageLabel: 'Average'
    })
  })

  it('preserves explicit values over preset defaults', () => {
    const resolved = resolveWindDirectionTextDefaults({
      preset: 'wind-direction',
      title: 'Wind',
      unit: 'deg',
      averageLabel: 'Mean',
      hasTitleAttr: true,
      hasUnitAttr: true,
      hasAverageLabelAttr: true
    })

    expect(resolved).toEqual({
      title: 'Wind',
      unit: 'deg',
      latestLabel: 'Latest',
      averageLabel: 'Mean'
    })
  })

  it('keeps empty defaults when preset is disabled', () => {
    const resolved = resolveWindDirectionTextDefaults({
      preset: '',
      title: '',
      unit: '',
      averageLabel: '',
      hasTitleAttr: false,
      hasUnitAttr: false,
      hasAverageLabelAttr: false
    })

    expect(resolved).toEqual({
      title: '',
      unit: '',
      latestLabel: '',
      averageLabel: ''
    })
  })
})
