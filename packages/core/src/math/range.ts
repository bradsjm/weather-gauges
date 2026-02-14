/**
 * @module
 *
 * Numeric range utility functions.
 *
 * This module provides functions for working with numeric ranges including:
 * - Creating and validating ranges
 * - Clamping values to ranges
 * - Normalizing values to [0, 1] unit range
 * - Denormalizing from unit range back to value range
 * - Mapping values between ranges
 * - Checking if values are within ranges
 */

/**
 * Represents a numeric range with min and max values.
 *
 * @remarks
 * Max value must be strictly greater than min value.
 */
export type NumericRange = {
  min: number
  max: number
}

/**
 * Throws an error if the value is not finite.
 *
 * @param value - The value to check
 * @param label - The label to use in the error message
 * @throws Error if value is NaN or Infinity
 */
const assertFiniteNumber = (value: number, label: string): void => {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`)
  }
}

/**
 * Throws an error if the range is invalid.
 *
 * @param range - The range to validate
 * @throws Error if min or max are not finite, or if max <= min
 */
const assertValidRange = (range: NumericRange): void => {
  assertFiniteNumber(range.min, 'range.min')
  assertFiniteNumber(range.max, 'range.max')

  if (range.max <= range.min) {
    throw new Error('range.max must be greater than range.min')
  }
}

/**
 * Resolves a number or range to a range object.
 *
 * @param minOrRange - Either a number (min value) or a range object
 * @param maybeMax - Required when minOrRange is a number
 * @returns A range object
 * @throws Error if minOrRange is a number and maybeMax is undefined
 */
const resolveRange = (minOrRange: number | NumericRange, maybeMax?: number): NumericRange => {
  if (typeof minOrRange === 'number') {
    if (maybeMax === undefined) {
      throw new Error('max is required when min is provided as a number')
    }

    return { min: minOrRange, max: maybeMax }
  }

  return minOrRange
}

/**
 * Creates a validated numeric range.
 *
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns A validated range object
 * @throws Error if min or max are not finite, or if max <= min
 *
 * @example
 * ```typescript
 * import { createRange } from '@bradsjm/weather-gauges-core'
 *
 * const range = createRange(0, 100)
 * // { min: 0, max: 100 }
 * ```
 */
export const createRange = (min: number, max: number): NumericRange => {
  const range = { min, max }
  assertValidRange(range)
  return range
}

/**
 * Calculates the span (difference) of a range.
 *
 * @param range - The range to calculate span for
 * @returns The difference between max and min
 *
 * @example
 * ```typescript
 * import { createRange, rangeSpan } from '@bradsjm/weather-gauges-core'
 *
 * const range = createRange(0, 100)
 * const span = rangeSpan(range) // 100
 * ```
 */
export const rangeSpan = (range: NumericRange): number => {
  assertValidRange(range)
  return range.max - range.min
}

/**
 * Clamps a value to be within a range.
 *
 * @param value - The value to clamp
 * @param minOrRange - Either the minimum value or a range object
 * @param maybeMax - Required when minOrRange is a number
 * @returns The clamped value within [min, max]
 *
 * @example
 * ```typescript
 * import { clamp } from '@bradsjm/weather-gauges-core'
 *
 * clamp(50, 0, 100) // 50
 * clamp(150, 0, 100) // 100
 * clamp(-50, 0, 100) // 0
 *
 * // Using range object
 * clamp(50, { min: 0, max: 100 }) // 50
 * ```
 */
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

/**
 * Normalizes a value to the [0, 1] unit range.
 *
 * @param value - The value to normalize
 * @param range - The range to normalize from
 * @param options - Options for normalization
 * @param options.clampToRange - Whether to clamp value to range before normalizing (default: true)
 * @returns A value between 0 and 1
 *
 * @remarks
 * When clampToRange is false, values outside the range can produce results outside [0, 1].
 *
 * @example
 * ```typescript
 * import { normalize } from '@bradsjm/weather-gauges-core'
 *
 * const range = { min: 0, max: 100 }
 * normalize(50, range) // 0.5
 * normalize(75, range) // 0.75
 *
 * // Without clamping
 * normalize(150, range, { clampToRange: false }) // 1.5
 * ```
 */
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

/**
 * Denormalizes a unit range value back to a specific range.
 *
 * @param normalizedValue - The value in [0, 1] unit range
 * @param range - The range to map to
 * @param options - Options for denormalization
 * @param options.clampToUnit - Whether to clamp normalizedValue to [0, 1] (default: true)
 * @returns The mapped value in the specified range
 *
 * @remarks
 * When clampToUnit is false, unit values outside [0, 1] will produce values outside the range.
 *
 * @example
 * ```typescript
 * import { denormalize } from '@bradsjm/weather-gauges-core'
 *
 * const range = { min: 0, max: 100 }
 * denormalize(0.5, range) // 50
 * denormalize(0.75, range) // 75
 *
 * // Without clamping
 * denormalize(1.5, range, { clampToUnit: false }) // 150
 * ```
 */
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

/**
 * Maps a value from one range to another.
 *
 * @param value - The value to map
 * @param inputRange - The input range
 * @param outputRange - The output range
 * @param options - Options for mapping
 * @param options.clampInput - Whether to clamp value to input range before mapping (default: false)
 * @returns The mapped value in the output range
 *
 * @remarks
 * Useful for converting values between different scales (e.g., temperature units, percentages).
 *
 * @example
 * ```typescript
 * import { mapRange } from '@bradsjm/weather-gauges-core'
 *
 * // Map temperature from Celsius to Fahrenheit range
 * const celsiusRange = { min: 0, max: 100 }
 * const fahrenheitRange = { min: 32, max: 212 }
 * mapRange(50, celsiusRange, fahrenheitRange) // 122
 *
 * // Map percentage to 0-10 scale
 * mapRange(75, { min: 0, max: 100 }, { min: 0, max: 10 }) // 7.5
 * ```
 */
export const mapRange = (
  value: number,
  inputRange: NumericRange,
  outputRange: NumericRange,
  options: { clampInput?: boolean } = {}
): number => {
  const normalized = normalize(value, inputRange, { clampToRange: options.clampInput === true })
  return denormalize(normalized, outputRange, { clampToUnit: false })
}

/**
 * Checks if a value is within a range.
 *
 * @param value - The value to check
 * @param range - The range to check against
 * @param options - Options for checking
 * @param options.inclusive - Whether range boundaries are included (default: true)
 * @returns True if value is within range, false otherwise
 *
 * @remarks
 * By default, boundaries are inclusive. Set inclusive to false for exclusive range checking.
 *
 * @example
 * ```typescript
 * import { isWithinRange } from '@bradsjm/weather-gauges-core'
 *
 * const range = { min: 0, max: 100 }
 * isWithinRange(50, range) // true
 * isWithinRange(0, range) // true (inclusive)
 * isWithinRange(100, range) // true (inclusive)
 * isWithinRange(150, range) // false
 *
 * // Exclusive boundaries
 * isWithinRange(0, range, { inclusive: false }) // false
 * isWithinRange(100, range, { inclusive: false }) // false
 * ```
 */
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
