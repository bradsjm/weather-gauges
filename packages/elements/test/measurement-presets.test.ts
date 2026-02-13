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
    expect(resolvePresetRange('', '')).toBeUndefined()
  })

  it('clips preset sections to active range', () => {
    const humiditySections = resolvePresetSections('humidity', { min: 50, max: 60 }, '%')
    expect(humiditySections).toEqual([{ from: 50, to: 60, color: '#22c55e' }])

    const pressureSections = resolvePresetSections('pressure', { min: 99, max: 103 }, 'kPa')
    expect(pressureSections).toHaveLength(3)
  })

  it('enables trend only for temperature and pressure presets', () => {
    expect(isPresetTrendEnabled('temperature')).toBe(true)
    expect(isPresetTrendEnabled('pressure')).toBe(true)
    expect(isPresetTrendEnabled('humidity')).toBe(false)
    expect(isPresetTrendEnabled('')).toBe(false)
  })
})
