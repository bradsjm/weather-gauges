import type { z } from 'zod'

import { easingSchema } from '../schemas/primitives.js'

/**
 * @module
 *
 * Easing functions for animations.
 *
 * This module provides easing functions to control the rate of change
 * during animations, allowing for smooth, natural-looking transitions.
 */

/**
 * Name of a built-in easing function.
 *
 * @remarks
 * Available easing functions:
 * - linear: Constant speed throughout animation
 * - easeInOutCubic: Smooth acceleration at start, smooth deceleration at end
 */
export type EasingName = z.infer<typeof easingSchema>

/**
 * Easing function signature.
 *
 * @param progress - Animation progress from 0 to 1
 * @returns Eased progress value, typically clamped to [0, 1]
 *
 * @remarks
 * Easing functions take a linear progress value and return a modified
 * progress value to create non-linear animation effects.
 *
 * @example
 * ```typescript
 * import type { EasingFunction } from '@bradsjm/weather-gauges-core'
 *
 * const customEasing: EasingFunction = (t) => {
 *   return t * t // Quadratic ease-in
 * }
 * ```
 */
export type EasingFunction = (progress: number) => number

/**
 * Clamps a value to the unit range [0, 1].
 *
 * @param value - The value to clamp
 * @returns Clamped value in [0, 1]
 *
 * @remarks
 * Internal utility to ensure easing function outputs stay within valid range.
 */
const clampUnit = (value: number): number => {
  if (value <= 0) {
    return 0
  }

  if (value >= 1) {
    return 1
  }

  return value
}

/**
 * Linear easing function - constant speed throughout animation.
 *
 * @param progress - Animation progress from 0 to 1
 * @returns Same as input progress (clamped to [0, 1])
 *
 * @remarks
 * Provides no acceleration or deceleration - animation plays at constant speed.
 * Suitable for simple transitions where you want linear interpolation.
 *
 * @example
 * ```typescript
 * import { linearEasing } from '@bradsjm/weather-gauges-core'
 *
 * linearEasing(0)   // 0
 * linearEasing(0.5) // 0.5
 * linearEasing(1)   // 1
 * ```
 */
export const linearEasing: EasingFunction = (progress) => clampUnit(progress)

/**
 * Ease-in-out cubic easing function - smooth acceleration and deceleration.
 *
 * @param progress - Animation progress from 0 to 1
 * @returns Eased progress with cubic curve
 *
 * @remarks
 * Animation accelerates smoothly at the start and decelerates smoothly at the end.
 * Creates a more natural, polished feel compared to linear easing.
 * Based on cubic polynomial curve.
 *
 * @example
 * ```typescript
 * import { easeInOutCubicEasing } from '@bradsjm/weather-gauges-core'
 *
 * easeInOutCubicEasing(0)   // 0
 * easeInOutCubicEasing(0.25) // 0.125
 * easeInOutCubicEasing(0.5) // 0.5
 * easeInOutCubicEasing(0.75) // 0.875
 * easeInOutCubicEasing(1)   // 1
 * ```
 */
export const easeInOutCubicEasing: EasingFunction = (progress) => {
  const t = clampUnit(progress)
  if (t < 0.5) {
    return 4 * t * t * t
  }

  return 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Registry of built-in easing functions.
 *
 * @remarks
 * Maps easing function names to their implementations.
 * Use {@link resolveEasing} to safely resolve easing names to functions.
 *
 * @example
 * ```typescript
 * import { easingFunctions } from '@bradsjm/weather-gauges-core'
 *
 * const fn = easingFunctions['easeInOutCubic']
 * fn(0.5) // 0.5
 * ```
 */
export const easingFunctions: Record<EasingName, EasingFunction> = {
  linear: linearEasing,
  easeInOutCubic: easeInOutCubicEasing
}

/**
 * Resolves an easing name or function to an easing function.
 *
 * @param easing - Either an easing name or custom easing function
 * @returns An easing function
 * @throws Error if easing is an invalid name
 *
 * @remarks
 * Accepts both built-in easing names (from {@link EasingName}) and custom
 * easing functions. If a name is provided, it's validated against available options.
 *
 * @example
 * ```typescript
 * import { resolveEasing } from '@bradsjm/weather-gauges-core'
 *
 * // Using built-in easing
 * const linear = resolveEasing('linear')
 * linear(0.5) // 0.5
 *
 * // Using custom easing
 * const custom = resolveEasing((t) => t * t)
 * custom(0.5) // 0.25
 * ```
 */
export const resolveEasing = (easing: EasingName | EasingFunction): EasingFunction => {
  if (typeof easing === 'function') {
    return easing
  }

  return easingFunctions[easingSchema.parse(easing)]
}
