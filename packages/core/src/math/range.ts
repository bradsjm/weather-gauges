export type NumericRange = {
  min: number
  max: number
}

const assertFiniteNumber = (value: number, label: string): void => {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`)
  }
}

const assertValidRange = (range: NumericRange): void => {
  assertFiniteNumber(range.min, 'range.min')
  assertFiniteNumber(range.max, 'range.max')

  if (range.max <= range.min) {
    throw new Error('range.max must be greater than range.min')
  }
}

const resolveRange = (minOrRange: number | NumericRange, maybeMax?: number): NumericRange => {
  if (typeof minOrRange === 'number') {
    if (maybeMax === undefined) {
      throw new Error('max is required when min is provided as a number')
    }

    return { min: minOrRange, max: maybeMax }
  }

  return minOrRange
}

export const createRange = (min: number, max: number): NumericRange => {
  const range = { min, max }
  assertValidRange(range)
  return range
}

export const rangeSpan = (range: NumericRange): number => {
  assertValidRange(range)
  return range.max - range.min
}

export const clamp = (
  value: number,
  minOrRange: number | NumericRange,
  maybeMax?: number
): number => {
  assertFiniteNumber(value, 'value')
  const range = resolveRange(minOrRange, maybeMax)
  assertValidRange(range)

  if (value < range.min) {
    return range.min
  }

  if (value > range.max) {
    return range.max
  }

  return value
}

export const normalize = (
  value: number,
  range: NumericRange,
  options: { clampToRange?: boolean } = {}
): number => {
  assertFiniteNumber(value, 'value')
  assertValidRange(range)

  const input = options.clampToRange === false ? value : clamp(value, range)
  return (input - range.min) / rangeSpan(range)
}

export const denormalize = (
  normalizedValue: number,
  range: NumericRange,
  options: { clampToUnit?: boolean } = {}
): number => {
  assertFiniteNumber(normalizedValue, 'normalizedValue')
  assertValidRange(range)

  const unitValue = options.clampToUnit === false ? normalizedValue : clamp(normalizedValue, 0, 1)
  return range.min + unitValue * rangeSpan(range)
}

export const mapRange = (
  value: number,
  inputRange: NumericRange,
  outputRange: NumericRange,
  options: { clampInput?: boolean } = {}
): number => {
  const normalized = normalize(value, inputRange, { clampToRange: options.clampInput === true })
  return denormalize(normalized, outputRange, { clampToUnit: false })
}

export const isWithinRange = (
  value: number,
  range: NumericRange,
  options: { inclusive?: boolean } = {}
): boolean => {
  assertFiniteNumber(value, 'value')
  assertValidRange(range)

  if (options.inclusive === false) {
    return value > range.min && value < range.max
  }

  return value >= range.min && value <= range.max
}
