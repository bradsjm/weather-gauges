/**
 * @module
 *
 * Trend calculation utilities for time-series data.
 *
 * This module provides functions for analyzing directional trends in data
 * by comparing values within a configurable time window.
 */

/**
 * Represents the trend state of a value.
 *
 * @remarks
 * - up: Value is increasing
 * - down: Value is decreasing
 * - steady: Value is stable within threshold
 * - null: Insufficient data to determine trend
 */
export type TrendState = 'up' | 'down' | 'steady' | null

/**
 * Represents a single data sample for trend analysis.
 *
 * @remarks
 * Combines a timestamp with its corresponding value.
 * Used as input for trend calculation.
 *
 * @property timestamp - Unix timestamp in milliseconds
 * @property value - The numeric value at that timestamp
 */
export type TrendSample = {
  timestamp: number
  value: number
}

/**
 * Options for configuring trend calculation.
 *
 * @remarks
 * Controls sensitivity and time window for trend analysis.
 *
 * @property threshold - Minimum change to consider trend 'up' or 'down' (default: 0.5)
 * @property windowMs - Time window in milliseconds to consider samples (default: 600000 / 10 minutes)
 */
export type TrendCalculatorOptions = {
  threshold?: number
  windowMs?: number
}

const DEFAULT_THRESHOLD = 0.5
const DEFAULT_WINDOW_MS = 600000

const assertFiniteNumber = (value: number, name: string): void => {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`)
  }
}

const validateOptions = ({
  threshold,
  windowMs
}: TrendCalculatorOptions): Required<TrendCalculatorOptions> => {
  const resolvedThreshold = threshold ?? DEFAULT_THRESHOLD
  const resolvedWindowMs = windowMs ?? DEFAULT_WINDOW_MS

  assertFiniteNumber(resolvedThreshold, 'threshold')
  assertFiniteNumber(resolvedWindowMs, 'windowMs')

  if (resolvedThreshold < 0) {
    throw new Error('threshold must be greater than or equal to 0')
  }

  if (resolvedWindowMs <= 0) {
    throw new Error('windowMs must be greater than 0')
  }

  return {
    threshold: resolvedThreshold,
    windowMs: resolvedWindowMs
  }
}

const normalizeSamples = (values: TrendSample[]): TrendSample[] => {
  return [...values]
    .filter((sample) => Number.isFinite(sample.timestamp) && Number.isFinite(sample.value))
    .sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Calculates the trend state from a series of time-stamped samples.
 *
 * @param values - Array of trend samples with timestamps
 * @param options - Optional configuration for trend calculation
 * @returns The calculated trend state: 'up', 'down', 'steady', or null
 *
 * @remarks
 * Analyzes samples within the configured time window to determine if values
 * are trending up, down, or are stable. Requires at least 2 samples
 * within the time window to determine a trend.
 *
 * @example
 * ```typescript
 * import { calculateTrend, type TrendSample } from '@bradsjm/weather-gauges-core'
 *
 * const samples: TrendSample[] = [
 *   { timestamp: 1000, value: 70 },
 *   { timestamp: 2000, value: 72 },
 *   { timestamp: 3000, value: 71 }
 * ]
 *
 * const trend = calculateTrend(samples, { threshold: 1, windowMs: 5000 })
 * console.log(trend) // 'up'
 * ```
 */
export const calculateTrend = (
  values: TrendSample[],
  options: TrendCalculatorOptions = {}
): TrendState => {
  if (values.length < 2) {
    return null
  }

  const { threshold, windowMs } = validateOptions(options)
  const samples = normalizeSamples(values)

  if (samples.length < 2) {
    return null
  }

  const latestTimestamp = samples[samples.length - 1]?.timestamp
  if (latestTimestamp === undefined) {
    return null
  }

  const windowStart = latestTimestamp - windowMs
  const inWindow = samples.filter((sample) => sample.timestamp >= windowStart)

  if (inWindow.length < 2) {
    return null
  }

  const first = inWindow[0]
  const last = inWindow[inWindow.length - 1]
  if (!first || !last) {
    return null
  }

  const delta = last.value - first.value
  if (Math.abs(delta) < threshold) {
    return 'steady'
  }

  return delta > 0 ? 'up' : 'down'
}

/**
 * Trend calculator object providing a functional API.
 *
 * @remarks
 * Provides an alternative functional interface for trend calculation
 * when using object-oriented patterns.
 *
 * @example
 * ```typescript
 * import { TrendCalculator } from '@bradsjm/weather-gauges-core'
 *
 * const result = TrendCalculator.calculate(samples, { threshold: 1 })
 * ```
 */
export const TrendCalculator = {
  calculate: calculateTrend
}
