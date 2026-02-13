import { describe, expect, it } from 'vitest'
import {
  detectPressureUnit,
  isPresetTrendEnabled,
  resolveEffectivePresetUnit,
  resolvePresetRange,
  resolvePresetSections,
  resolvePresetTitle,
  resolvePresetUnit
} from '../src/shared/measurement-presets.js'

describe('measurement presets', () => {
  it('resolves default titles and units', () => {
    expect(resolvePresetTitle('temperature')).toBe('Temperature')
    expect(resolvePresetUnit('temperature')).toBe('°C')
    expect(resolvePresetTitle('humidity')).toBe('Humidity')
    expect(resolvePresetUnit('humidity')).toBe('%')
    expect(resolvePresetTitle('pressure')).toBe('Pressure')
    expect(resolvePresetUnit('pressure')).toBe('hPa')
    expect(resolvePresetTitle('wind-speed')).toBe('Wind Speed')
    expect(resolvePresetUnit('wind-speed')).toBe('km/h')
    expect(resolvePresetTitle('rainfall')).toBe('Rainfall')
    expect(resolvePresetUnit('rainfall')).toBe('mm')
    expect(resolvePresetTitle('rain-rate')).toBe('Rain Rate')
    expect(resolvePresetUnit('rain-rate')).toBe('mm/h')
    expect(resolvePresetTitle('solar')).toBe('Solar')
    expect(resolvePresetUnit('solar')).toBe('W/m²')
    expect(resolvePresetTitle('uv-index')).toBe('UV Index')
    expect(resolvePresetUnit('uv-index')).toBe('')
    expect(resolvePresetTitle('cloud-base')).toBe('Cloud Base')
    expect(resolvePresetUnit('cloud-base')).toBe('m')
    expect(resolvePresetTitle('')).toBe('')
    expect(resolvePresetUnit('')).toBe('')
  })

  it('detects pressure units from value magnitude', () => {
    expect(detectPressureUnit(1012)).toBe('hPa')
    expect(detectPressureUnit(101)).toBe('kPa')
    expect(detectPressureUnit(30.1)).toBe('inHg')
  })

  it('resolves effective preset unit with explicit override', () => {
    expect(resolveEffectivePresetUnit('pressure', 'kPa', 1012)).toBe('kPa')
    expect(resolveEffectivePresetUnit('pressure', '', 1012)).toBe('hPa')
    expect(resolveEffectivePresetUnit('temperature', '', 20)).toBe('°C')
  })

  it('resolves preset ranges by unit context', () => {
    expect(resolvePresetRange('temperature', '°F')).toEqual({ min: 0, max: 100 })
    expect(resolvePresetRange('temperature', '°C')).toEqual({ min: -20, max: 40 })
    expect(resolvePresetRange('humidity', '%')).toEqual({ min: 0, max: 100 })
    expect(resolvePresetRange('pressure', 'kPa')).toEqual({ min: 99, max: 103 })
    expect(resolvePresetRange('pressure', 'inHg')).toEqual({ min: 29.2, max: 30.4 })
    expect(resolvePresetRange('pressure', 'hPa')).toEqual({ min: 990, max: 1030 })
    expect(resolvePresetRange('wind-speed', 'km/h')).toEqual({ min: 0, max: 30 })
    expect(resolvePresetRange('wind-speed', 'mph')).toEqual({ min: 0, max: 20 })
    expect(resolvePresetRange('rainfall', 'mm')).toEqual({ min: 0, max: 10 })
    expect(resolvePresetRange('rainfall', 'in')).toEqual({ min: 0, max: 0.5 })
    expect(resolvePresetRange('rain-rate', 'mm/h')).toEqual({ min: 0, max: 10 })
    expect(resolvePresetRange('solar', 'W/m²')).toEqual({ min: 0, max: 1000 })
    expect(resolvePresetRange('uv-index', '')).toEqual({ min: 0, max: 10 })
    expect(resolvePresetRange('cloud-base', 'm')).toEqual({ min: 0, max: 1000 })
    expect(resolvePresetRange('cloud-base', 'ft')).toEqual({ min: 0, max: 3000 })
    expect(resolvePresetRange('', '')).toBeUndefined()
  })

  it('clips preset sections to active range', () => {
    const humiditySections = resolvePresetSections('humidity', { min: 50, max: 60 }, '%')
    expect(humiditySections).toEqual([{ from: 50, to: 60, color: '#22c55e' }])

    const pressureSections = resolvePresetSections('pressure', { min: 99, max: 103 }, 'kPa')
    expect(pressureSections).toHaveLength(3)

    const uvSections = resolvePresetSections('uv-index', { min: 0, max: 10 }, '')
    expect(uvSections).toHaveLength(4)

    const rainfallSections = resolvePresetSections('rainfall', { min: 0, max: 10 }, 'mm')
    expect(rainfallSections).toHaveLength(3)
  })

  it('enables trend only for temperature and pressure presets', () => {
    expect(isPresetTrendEnabled('temperature')).toBe(true)
    expect(isPresetTrendEnabled('pressure')).toBe(true)
    expect(isPresetTrendEnabled('wind-speed')).toBe(true)
    expect(isPresetTrendEnabled('humidity')).toBe(false)
    expect(isPresetTrendEnabled('rainfall')).toBe(false)
    expect(isPresetTrendEnabled('')).toBe(false)
  })
})
