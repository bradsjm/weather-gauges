/**
 * @module
 *
 * Animation timeline utilities.
 *
 * This module provides functions for creating and sampling animation timelines,
 * enabling smooth value transitions with configurable easing functions.
 */

import { clamp } from '../math/range.js'
import { easingSchema } from '../schemas/primitives.js'
import { resolveEasing, type EasingFunction, type EasingName } from './easing.js'

/**
 * Configuration options for creating an animation timeline.
 *
 * @remarks
 * Defines the animation parameters including start/end values,
 * duration, easing function, and optional start time.
 *
 * @property from - The starting value of the animation
 * @property to - The target/ending value of the animation
 * @property durationMs - Duration of animation in milliseconds
 * @property easing - Easing function to use (default: 'easeInOutCubic')
 * @property startTimeMs - Optional start time in milliseconds (default: current time)
 */
export type TimelineConfig = {
  from: number
  to: number
  durationMs: number
  easing?: EasingName | EasingFunction
  startTimeMs?: number
}

/**
 * Represents an active animation timeline.
 *
 * @remarks
 * Contains all configuration needed to sample the timeline at any point.
 *
 * @property from - The starting value
 * @property to - The target value
 * @property durationMs - Animation duration in milliseconds
 * @property easing - The resolved easing function
 * @property startTimeMs - Timestamp when animation started
 */
export type Timeline = {
  from: number
  to: number
  durationMs: number
  easing: EasingFunction
  startTimeMs: number
}

/**
 * Sampled state of an animation timeline at a specific point.
 *
 * @remarks
 * Contains interpolated values and metadata about animation progress.
 *
 * @property elapsedMs - Time elapsed since animation started (in milliseconds)
 * @property progress - Linear progress from 0 to 1
 * @property easedProgress - Progress after applying easing function
 * @property value - Interpolated value at this point
 * @property done - Whether animation has completed (progress >= 1)
 */
export type TimelineSample = {
  elapsedMs: number
  progress: number
  easedProgress: number
  value: number
  done: boolean
}

/**
 * Asserts that a value is a finite number.
 *
 * @param value - The value to check
 * @param label - The label to use in error message
 * @throws Error if value is NaN or Infinity
 */
const assertFiniteNumber = (value: number, label: string): void => {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`)
  }
}

/**
 * Creates an animation timeline from configuration.
 *
 * @param config - Timeline configuration options
 * @returns A timeline object ready for sampling
 * @throws Error if from, to, durationMs, or startTimeMs are not finite
 * @throws Error if durationMs is negative
 *
 * @remarks
 * Creates a timeline that can be sampled at any point in time using
 * {@link sampleTimeline}. The timeline uses the specified easing function
 * to create smooth, natural-looking transitions.
 *
 * @example
 * ```typescript
 * import { createTimeline } from '@bradsjm/weather-gauges-core'
 *
 * const timeline = createTimeline({
 *   from: 0,
 *   to: 100,
 *   durationMs: 1000,
 *   easing: 'easeInOutCubic'
 * })
 * ```
 */
export const createTimeline = (config: TimelineConfig): Timeline => {
  assertFiniteNumber(config.from, 'from')
  assertFiniteNumber(config.to, 'to')
  assertFiniteNumber(config.durationMs, 'durationMs')

  if (config.durationMs < 0) {
    throw new Error('durationMs must be greater than or equal to 0')
  }

  const startTimeMs = config.startTimeMs ?? 0
  assertFiniteNumber(startTimeMs, 'startTimeMs')

  const easingInput = config.easing ?? easingSchema.enum.easeInOutCubic

  return {
    from: config.from,
    to: config.to,
    durationMs: config.durationMs,
    easing: resolveEasing(easingInput),
    startTimeMs
  }
}

/**
 * Samples a timeline at a specific point in time.
 *
 * @param timeline - The timeline to sample
 * @param nowMs - Current timestamp in milliseconds
 * @returns Sampled state of the timeline at the specified time
 *
 * @remarks
 * Calculates the interpolated value at the given time point using the timeline's
 * easing function. Progress is clamped to [0, 1] and will be complete
 * when progress reaches 1.0.
 *
 * @example
 * ```typescript
 * import { createTimeline, sampleTimeline } from '@bradsjm/weather-gauges-core'
 *
 * const timeline = createTimeline({
 *   from: 0,
 *   to: 100,
 *   durationMs: 1000
 * })
 *
 * // Sample at 500ms (halfway through)
 * const sample = sampleTimeline(timeline, 500)
 * console.log(sample.progress) // ~0.5
 * console.log(sample.value) // ~50
 *
 * // Sample after animation completes
 * const done = sampleTimeline(timeline, 2000)
 * console.log(done.done) // true
 * console.log(done.value) // 100
 * ```
 */
export const sampleTimeline = (timeline: Timeline, nowMs: number): TimelineSample => {
  assertFiniteNumber(nowMs, 'nowMs')

  const elapsedMs = Math.max(0, nowMs - timeline.startTimeMs)
  const rawProgress = timeline.durationMs === 0 ? 1 : elapsedMs / timeline.durationMs
  const progress = clamp(rawProgress, 0, 1)
  const easedProgress = clamp(timeline.easing(progress), 0, 1)
  const value = timeline.from + (timeline.to - timeline.from) * easedProgress

  return {
    elapsedMs,
    progress,
    easedProgress,
    value,
    done: progress >= 1
  }
}
