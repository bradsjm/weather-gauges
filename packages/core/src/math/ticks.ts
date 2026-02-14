import { createRange, normalize, type NumericRange } from './range.js'

/**
 * @module
 *
 * Tick generation utilities for gauges and scales.
 *
 * This module provides functions for generating major and minor tick marks
 * based on a numeric range. Ticks are normalized to [0, 1] unit positions
 * for easy mapping to gauge angles or visual positions.
 */

/**
 * Type of tick mark on a scale or gauge.
 *
 * @remarks
 * - major: Primary tick marks with labels
 * - minor: Smaller tick marks between major ticks
 */
export type TickKind = 'major' | 'minor'

/**
 * Represents a single tick mark on a scale or gauge.
 *
 * @remarks
 * Each tick contains its value, normalized position, and type.
 * Position is normalized to [0, 1] unit range for easy mapping.
 */
export type Tick = {
  /** The actual value of the tick mark */
  value: number
  /** Normalized position in [0, 1] unit range */
  position: number
  /** Whether this is a major or minor tick */
  kind: TickKind
}

/**
 * Options for configuring tick generation.
 *
 * @remarks
 * Controls the density and layout of generated tick marks.
 *
 * @example
 * ```typescript
 * import { generateTicks, type TickGenerationOptions } from '@bradsjm/weather-gauges-core'
 *
 * const options: TickGenerationOptions = {
 *   majorTickCount: 10,
 *   minorTicksPerMajor: 4,
 *   includeBounds: true
 * }
 * ```
 */
export type TickGenerationOptions = {
  /** Number of major ticks to generate (must be >= 2) */
  majorTickCount: number
  /** Number of minor ticks between each major tick (default: 0) */
  minorTicksPerMajor?: number
  /** Whether to include tick marks at range boundaries (default: true) */
  includeBounds?: boolean
}

const assertTickOptions = (options: TickGenerationOptions): void => {
  if (!Number.isInteger(options.majorTickCount) || options.majorTickCount < 2) {
    throw new Error('majorTickCount must be an integer greater than or equal to 2')
  }

  if (
    options.minorTicksPerMajor !== undefined &&
    (!Number.isInteger(options.minorTicksPerMajor) || options.minorTicksPerMajor < 0)
  ) {
    throw new Error('minorTicksPerMajor must be an integer greater than or equal to 0')
  }
}

const shouldIncludeMajorTick = (
  index: number,
  lastIndex: number,
  includeBounds: boolean
): boolean => {
  if (includeBounds) {
    return true
  }

  return index > 0 && index < lastIndex
}

/**
 * Generates major and minor ticks for a numeric range.
 *
 * @param range - The range to generate ticks for
 * @param options - Configuration for tick generation
 * @returns Array of tick objects with values and positions
 * @throws Error if majorTickCount < 2 or minorTicksPerMajor < 0
 *
 * @remarks
 * Major ticks are evenly distributed across the range. Minor ticks are
 * evenly spaced between major ticks. All positions are normalized to [0, 1].
 *
 * @example
 * ```typescript
 * import { generateTicks } from '@bradsjm/weather-gauges-core'
 *
 * const ticks = generateTicks(
 *   { min: 0, max: 100 },
 *   { majorTickCount: 5, minorTicksPerMajor: 4 }
 * )
 * // Returns 21 ticks: 5 major (0, 25, 50, 75, 100) + 16 minor
 * ```
 */
export const generateTicks = (range: NumericRange, options: TickGenerationOptions): Tick[] => {
  createRange(range.min, range.max)
  assertTickOptions(options)

  const majorTickCount = options.majorTickCount
  const minorTicksPerMajor = options.minorTicksPerMajor ?? 0
  const includeBounds = options.includeBounds !== false

  const majorStep = (range.max - range.min) / (majorTickCount - 1)
  const ticks: Tick[] = []

  for (let majorIndex = 0; majorIndex < majorTickCount; majorIndex += 1) {
    const majorValue = range.min + majorStep * majorIndex

    if (shouldIncludeMajorTick(majorIndex, majorTickCount - 1, includeBounds)) {
      ticks.push({
        kind: 'major',
        value: majorValue,
        position: normalize(majorValue, range, { clampToRange: false })
      })
    }

    if (majorIndex === majorTickCount - 1 || minorTicksPerMajor === 0) {
      continue
    }

    const minorStep = majorStep / (minorTicksPerMajor + 1)

    for (let minorIndex = 1; minorIndex <= minorTicksPerMajor; minorIndex += 1) {
      const minorValue = majorValue + minorStep * minorIndex
      ticks.push({
        kind: 'minor',
        value: minorValue,
        position: normalize(minorValue, range, { clampToRange: false })
      })
    }
  }

  return ticks
}
