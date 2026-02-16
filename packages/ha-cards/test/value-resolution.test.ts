import { describe, expect, it } from 'vitest'

import { resolveGaugeData, type HomeAssistant } from '../src/value-resolution.js'

const createHass = (states: HomeAssistant['states']): HomeAssistant => ({ states })

describe('resolveGaugeData', () => {
  it('returns waiting message before hass is available', () => {
    const result = resolveGaugeData(undefined, {
      entity: 'sensor.outdoor_temperature',
      gaugeType: 'radial',
      attribute: undefined,
      averageAttribute: undefined,
      preset: 'temperature',
      title: undefined,
      label: undefined,
      unitOverride: undefined,
      minOverride: undefined,
      maxOverride: undefined
    })

    expect(result).toEqual({ ok: false, message: 'Waiting for Home Assistant state updates.' })
  })

  it('extracts numeric value and unit from state and attributes', () => {
    const hass = createHass({
      'sensor.outdoor_temperature': {
        entity_id: 'sensor.outdoor_temperature',
        state: '21.5',
        attributes: {
          unit_of_measurement: 'degC',
          friendly_name: 'Outdoor Temperature'
        }
      }
    })

    const result = resolveGaugeData(hass, {
      entity: 'sensor.outdoor_temperature',
      gaugeType: 'radial',
      attribute: undefined,
      averageAttribute: undefined,
      preset: 'temperature',
      title: undefined,
      label: undefined,
      unitOverride: undefined,
      minOverride: undefined,
      maxOverride: undefined
    })

    expect(result).toMatchObject({
      ok: true,
      value: 21.5,
      unit: 'degC',
      label: 'Temperature',
      min: -20,
      max: 40
    })
  })

  it('reads attribute value and attribute-specific unit when provided', () => {
    const hass = createHass({
      'weather.station': {
        entity_id: 'weather.station',
        state: 'sunny',
        attributes: {
          pressure: 101.2,
          pressure_unit: 'kPa'
        }
      }
    })

    const result = resolveGaugeData(hass, {
      entity: 'weather.station',
      gaugeType: 'radial-bargraph',
      attribute: 'pressure',
      averageAttribute: undefined,
      preset: 'pressure',
      title: undefined,
      label: 'Sea Level Pressure',
      unitOverride: undefined,
      minOverride: undefined,
      maxOverride: undefined
    })

    expect(result).toMatchObject({
      ok: true,
      value: 101.2,
      unit: 'kPa',
      label: 'Sea Level Pressure',
      min: 99,
      max: 103
    })
  })

  it('supports average attribute for wind-direction gauges', () => {
    const hass = createHass({
      'sensor.wind_direction': {
        entity_id: 'sensor.wind_direction',
        state: '182',
        attributes: {
          average_heading: '165'
        }
      }
    })

    const result = resolveGaugeData(hass, {
      entity: 'sensor.wind_direction',
      gaugeType: 'wind-direction',
      attribute: undefined,
      averageAttribute: 'average_heading',
      preset: '',
      title: undefined,
      label: 'Wind Direction',
      unitOverride: 'deg',
      minOverride: undefined,
      maxOverride: undefined
    })

    expect(result).toMatchObject({
      ok: true,
      value: 182,
      average: 165,
      unit: 'deg',
      label: 'Wind Direction'
    })
  })

  it('returns error when resolved range is invalid', () => {
    const hass = createHass({
      'sensor.pressure': {
        entity_id: 'sensor.pressure',
        state: '1011',
        attributes: {
          unit_of_measurement: 'hPa'
        }
      }
    })

    const result = resolveGaugeData(hass, {
      entity: 'sensor.pressure',
      gaugeType: 'radial',
      attribute: undefined,
      averageAttribute: undefined,
      preset: 'pressure',
      title: undefined,
      label: undefined,
      unitOverride: undefined,
      minOverride: 1030,
      maxOverride: 1020
    })

    expect(result).toEqual({
      ok: false,
      message: '`gauge_min` must be lower than `gauge_max` after applying defaults.'
    })
  })
})
