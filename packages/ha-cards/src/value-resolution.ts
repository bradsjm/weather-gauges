export type ValidationMode = 'clamp' | 'coerce' | 'strict'
export type GaugeType = 'radial' | 'radial-bargraph' | 'compass' | 'wind-direction'

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

export type HassEntity = {
  entity_id: string
  state: string
  attributes: Record<string, unknown>
}

export type HomeAssistant = {
  states: Record<string, HassEntity | undefined>
  callWS?(message: Record<string, unknown>): Promise<unknown>
}

type PresetRange = {
  min: number
  max: number
}

export type ResolveGaugeDataInput = {
  entity: string
  gaugeType: GaugeType
  attribute: string | undefined
  averageAttribute: string | undefined
  preset: MeasurementPreset
  title: string | undefined
  label: string | undefined
  unitOverride: string | undefined
  minOverride: number | undefined
  maxOverride: number | undefined
}

export type ResolvedGaugeData = {
  ok: true
  entityId: string
  value: number
  average?: number
  min?: number
  max?: number
  unit: string
  label: string
  preset: MeasurementPreset
}

type FailedGaugeData = {
  ok: false
  message: string
}

export type ResolveGaugeDataResult = ResolvedGaugeData | FailedGaugeData

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return undefined
    }

    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

const readAttributeString = (
  attributes: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = attributes[key]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

const resolvePresetTitle = (preset: MeasurementPreset): string => {
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

const resolvePresetUnit = (preset: MeasurementPreset): string => {
  if (preset === 'temperature') {
    return 'degC'
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
    return 'W/m2'
  }
  if (preset === 'cloud-base') {
    return 'm'
  }
  return ''
}

const detectPressureUnit = (value: number): 'hPa' | 'kPa' | 'inHg' => {
  if (value >= 900) {
    return 'hPa'
  }
  if (value >= 90) {
    return 'kPa'
  }
  return 'inHg'
}

const resolveEffectivePresetUnit = (
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

const resolvePresetRange = (preset: MeasurementPreset, unit: string): PresetRange | undefined => {
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
    if (normalizedUnit.includes('mph') || normalizedUnit.includes('kt')) {
      return { min: 0, max: 20 }
    }
    return { min: 0, max: 30 }
  }
  if (preset === 'rainfall' || preset === 'rain-rate') {
    return unit.toLowerCase().includes('in') ? { min: 0, max: 0.5 } : { min: 0, max: 10 }
  }
  if (preset === 'solar') {
    return { min: 0, max: 1000 }
  }
  if (preset === 'uv-index') {
    return { min: 0, max: 10 }
  }
  if (preset === 'cloud-base') {
    return unit.toLowerCase().includes('ft') ? { min: 0, max: 3000 } : { min: 0, max: 1000 }
  }
  return undefined
}

const resolveRawValue = (
  entity: HassEntity,
  attribute: string | undefined
): { rawValue: unknown; sourceLabel: string } => {
  if (!attribute) {
    return {
      rawValue: entity.state,
      sourceLabel: entity.entity_id
    }
  }

  return {
    rawValue: entity.attributes[attribute],
    sourceLabel: `${entity.entity_id} attribute "${attribute}"`
  }
}

const resolveRawUnit = (
  entity: HassEntity,
  attribute: string | undefined,
  unitOverride: string | undefined
): string => {
  if (unitOverride && unitOverride.trim().length > 0) {
    return unitOverride.trim()
  }

  if (attribute) {
    const attributeUnit = readAttributeString(entity.attributes, `${attribute}_unit`)
    if (attributeUnit) {
      return attributeUnit
    }
  }

  return readAttributeString(entity.attributes, 'unit_of_measurement') ?? ''
}

export const resolveGaugeData = (
  hass: HomeAssistant | undefined,
  input: ResolveGaugeDataInput
): ResolveGaugeDataResult => {
  if (!hass) {
    return { ok: false, message: 'Waiting for Home Assistant state updates.' }
  }

  const entity = hass.states[input.entity]
  if (!entity) {
    return { ok: false, message: `Entity "${input.entity}" is unavailable.` }
  }

  const { rawValue, sourceLabel } = resolveRawValue(entity, input.attribute)
  const value = toFiniteNumber(rawValue)
  if (value === undefined) {
    return { ok: false, message: `${sourceLabel} is not a numeric value.` }
  }

  const rawUnit = resolveRawUnit(entity, input.attribute, input.unitOverride)
  const unit = resolveEffectivePresetUnit(input.preset, rawUnit, value)

  const presetRange = resolvePresetRange(input.preset, unit)
  const min = input.minOverride ?? presetRange?.min
  const max = input.maxOverride ?? presetRange?.max

  if (min !== undefined && max !== undefined && min >= max) {
    return {
      ok: false,
      message: '`gauge_min` must be lower than `gauge_max` after applying defaults.'
    }
  }

  let average: number | undefined
  if (input.gaugeType === 'wind-direction' && input.averageAttribute) {
    average = toFiniteNumber(entity.attributes[input.averageAttribute])
  }

  const friendlyName = readAttributeString(entity.attributes, 'friendly_name')
  const label = input.label?.trim() || resolvePresetTitle(input.preset) || friendlyName || ''

  return {
    ok: true,
    entityId: entity.entity_id,
    value,
    ...(average !== undefined ? { average } : {}),
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
    unit,
    label,
    preset: input.preset
  }
}
