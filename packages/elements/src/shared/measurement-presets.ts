export type MeasurementPreset =
  | ''
  | 'temperature'
  | 'humidity'
  | 'pressure'
  | 'wind-speed'
  | 'rainfall'
  | 'rain-rate'
  | 'solar'
  | 'uv-index'
  | 'cloud-base'

export type PresetRange = {
  min: number
  max: number
}

export type PresetSection = {
  from: number
  to: number
  color: string
}

const nonEmptySections = (sections: PresetSection[]): PresetSection[] =>
  sections.filter((section) => section.to > section.from)

const clipSection = (section: PresetSection, range: PresetRange): PresetSection | undefined => {
  const from = Math.max(range.min, section.from)
  const to = Math.min(range.max, section.to)
  if (to <= from) {
    return undefined
  }

  return {
    ...section,
    from,
    to
  }
}

const clippedSections = (sections: PresetSection[], range: PresetRange): PresetSection[] =>
  sections
    .map((section) => clipSection(section, range))
    .filter((section): section is PresetSection => section !== undefined)

export const resolvePresetTitle = (preset: MeasurementPreset): string => {
  if (preset === 'temperature') {
    return 'Temperature'
  }

  if (preset === 'humidity') {
    return 'Humidity'
  }

  if (preset === 'pressure') {
    return 'Pressure'
  }

  if (preset === 'wind-speed') {
    return 'Wind Speed'
  }

  if (preset === 'rainfall') {
    return 'Rainfall'
  }

  if (preset === 'rain-rate') {
    return 'Rain Rate'
  }

  if (preset === 'solar') {
    return 'Solar'
  }

  if (preset === 'uv-index') {
    return 'UV Index'
  }

  if (preset === 'cloud-base') {
    return 'Cloud Base'
  }

  return ''
}

export const resolvePresetUnit = (preset: MeasurementPreset): string => {
  if (preset === 'temperature') {
    return '°C'
  }

  if (preset === 'humidity') {
    return '%'
  }

  if (preset === 'pressure') {
    return 'hPa'
  }

  if (preset === 'wind-speed') {
    return 'km/h'
  }

  if (preset === 'rainfall') {
    return 'mm'
  }

  if (preset === 'rain-rate') {
    return 'mm/h'
  }

  if (preset === 'solar') {
    return 'W/m²'
  }

  if (preset === 'uv-index') {
    return ''
  }

  if (preset === 'cloud-base') {
    return 'm'
  }

  return ''
}

export const detectPressureUnit = (value: number): 'hPa' | 'kPa' | 'inHg' => {
  if (value >= 900) {
    return 'hPa'
  }

  if (value >= 90) {
    return 'kPa'
  }

  return 'inHg'
}

export const resolveEffectivePresetUnit = (
  preset: MeasurementPreset,
  rawUnit: string,
  valueForDetection: number
): string => {
  if (rawUnit.length > 0) {
    return rawUnit
  }

  if (preset === 'pressure') {
    return detectPressureUnit(valueForDetection)
  }

  return resolvePresetUnit(preset)
}

export const resolvePresetRange = (
  preset: MeasurementPreset,
  unit: string
): PresetRange | undefined => {
  if (preset === 'temperature') {
    return unit.toLowerCase().includes('f') ? { min: 0, max: 100 } : { min: -20, max: 40 }
  }

  if (preset === 'humidity') {
    return { min: 0, max: 100 }
  }

  if (preset === 'pressure') {
    const normalizedUnit = unit.toLowerCase()
    if (normalizedUnit.includes('kpa')) {
      return { min: 99, max: 103 }
    }
    if (normalizedUnit.includes('inhg')) {
      return { min: 29.2, max: 30.4 }
    }
    return { min: 990, max: 1030 }
  }

  if (preset === 'wind-speed') {
    const normalizedUnit = unit.toLowerCase()
    if (normalizedUnit.includes('mph')) {
      return { min: 0, max: 20 }
    }
    if (normalizedUnit.includes('kts') || normalizedUnit.includes('kt')) {
      return { min: 0, max: 20 }
    }
    return { min: 0, max: 30 }
  }

  if (preset === 'rainfall') {
    const normalizedUnit = unit.toLowerCase()
    return normalizedUnit.includes('in') ? { min: 0, max: 0.5 } : { min: 0, max: 10 }
  }

  if (preset === 'rain-rate') {
    const normalizedUnit = unit.toLowerCase()
    return normalizedUnit.includes('in') ? { min: 0, max: 0.5 } : { min: 0, max: 10 }
  }

  if (preset === 'solar') {
    return { min: 0, max: 1000 }
  }

  if (preset === 'uv-index') {
    return { min: 0, max: 10 }
  }

  if (preset === 'cloud-base') {
    const normalizedUnit = unit.toLowerCase()
    return normalizedUnit.includes('ft') ? { min: 0, max: 3000 } : { min: 0, max: 1000 }
  }

  return undefined
}

export const resolvePresetSections = (
  preset: MeasurementPreset,
  range: PresetRange,
  unit: string
): PresetSection[] => {
  if (preset === 'temperature') {
    const imperial = unit.toLowerCase().includes('f')
    const freezing = imperial ? 32 : 0
    const warm = imperial ? 77 : 25
    const hot = imperial ? 95 : 35

    return clippedSections(
      nonEmptySections([
        {
          from: range.min,
          to: Math.min(range.max, freezing),
          color: '#3b82f6'
        },
        {
          from: Math.max(range.min, freezing),
          to: Math.min(range.max, warm),
          color: '#22c55e'
        },
        {
          from: Math.max(range.min, warm),
          to: Math.min(range.max, hot),
          color: '#f59e0b'
        },
        {
          from: Math.max(range.min, hot),
          to: range.max,
          color: '#ef4444'
        }
      ]),
      range
    )
  }

  if (preset === 'humidity') {
    return clippedSections(
      [
        { from: 0, to: 20, color: '#f59e0b' },
        { from: 20, to: 80, color: '#22c55e' },
        { from: 80, to: 100, color: '#3b82f6' }
      ],
      range
    )
  }

  if (preset === 'pressure') {
    if (unit.toLowerCase().includes('kpa')) {
      return clippedSections(
        nonEmptySections([
          { from: range.min, to: 100.8, color: '#f59e0b' },
          { from: 100.8, to: 102.2, color: '#22c55e' },
          { from: 102.2, to: range.max, color: '#3b82f6' }
        ]),
        range
      )
    }

    if (unit.toLowerCase().includes('inhg')) {
      return clippedSections(
        nonEmptySections([
          { from: range.min, to: 29.8, color: '#f59e0b' },
          { from: 29.8, to: 30.2, color: '#22c55e' },
          { from: 30.2, to: range.max, color: '#3b82f6' }
        ]),
        range
      )
    }

    return clippedSections(
      nonEmptySections([
        { from: range.min, to: 1008, color: '#f59e0b' },
        { from: 1008, to: 1022, color: '#22c55e' },
        { from: 1022, to: range.max, color: '#3b82f6' }
      ]),
      range
    )
  }

  if (preset === 'wind-speed') {
    const normalizedUnit = unit.toLowerCase()
    const high = normalizedUnit.includes('mph') || normalizedUnit.includes('kt') ? 14 : 20
    const medium = normalizedUnit.includes('mph') || normalizedUnit.includes('kt') ? 8 : 12
    return clippedSections(
      nonEmptySections([
        { from: range.min, to: medium, color: '#22c55e' },
        { from: medium, to: high, color: '#f59e0b' },
        { from: high, to: range.max, color: '#ef4444' }
      ]),
      range
    )
  }

  if (preset === 'rainfall' || preset === 'rain-rate') {
    return clippedSections(
      nonEmptySections([
        { from: range.min, to: range.max * 0.25, color: '#93c5fd' },
        { from: range.max * 0.25, to: range.max * 0.6, color: '#3b82f6' },
        { from: range.max * 0.6, to: range.max, color: '#1d4ed8' }
      ]),
      range
    )
  }

  if (preset === 'solar') {
    return clippedSections(
      nonEmptySections([
        { from: range.min, to: 300, color: '#60a5fa' },
        { from: 300, to: 700, color: '#facc15' },
        { from: 700, to: range.max, color: '#f97316' }
      ]),
      range
    )
  }

  if (preset === 'uv-index') {
    return clippedSections(
      nonEmptySections([
        { from: range.min, to: 2, color: '#22c55e' },
        { from: 2, to: 5, color: '#facc15' },
        { from: 5, to: 7, color: '#f97316' },
        { from: 7, to: range.max, color: '#ef4444' }
      ]),
      range
    )
  }

  if (preset === 'cloud-base') {
    const normalizedUnit = unit.toLowerCase()
    if (normalizedUnit.includes('ft')) {
      return clippedSections(
        nonEmptySections([
          { from: range.min, to: 1000, color: '#ef4444' },
          { from: 1000, to: 2000, color: '#f59e0b' },
          { from: 2000, to: range.max, color: '#22c55e' }
        ]),
        range
      )
    }

    return clippedSections(
      nonEmptySections([
        { from: range.min, to: 300, color: '#ef4444' },
        { from: 300, to: 700, color: '#f59e0b' },
        { from: 700, to: range.max, color: '#22c55e' }
      ]),
      range
    )
  }

  return []
}

export const isPresetTrendEnabled = (preset: MeasurementPreset): boolean =>
  preset === 'temperature' || preset === 'pressure' || preset === 'wind-speed'
