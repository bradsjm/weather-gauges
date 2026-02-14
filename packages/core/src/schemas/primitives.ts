import { z } from 'zod'

/**
 * @module
 *
 * Primitive schema validation utilities.
 *
 * This module provides fundamental Zod schemas used throughout the gauge configuration system.
 * These schemas validate basic data types like numbers, strings, and enums.
 */

/**
 * Schema for validating a finite number.
 *
 * @remarks
 * Rejects NaN and Infinity values.
 *
 * @example
 * ```typescript
 * import { finiteNumberSchema } from '@bradsjm/weather-gauges-core'
 *
 * const value = finiteNumberSchema.parse(42.5) // OK
 * finiteNumberSchema.parse(Infinity) // Error: must be a finite number
 * ```
 */
export const finiteNumberSchema = z.number().finite({ message: 'must be a finite number' })

/**
 * Schema for validating a positive integer.
 *
 * @remarks
 * Requires integer value greater than zero. Useful for counts and sizes.
 *
 * @example
 * ```typescript
 * import { positiveIntegerSchema } from '@bradsjm/weather-gauges-core'
 *
 * const value = positiveIntegerSchema.parse(5) // OK
 * positiveIntegerSchema.parse(-1) // Error: must be greater than 0
 * positiveIntegerSchema.parse(1.5) // Error: must be an integer
 * ```
 */
export const positiveIntegerSchema = z
  .number()
  .int({ message: 'must be an integer' })
  .gt(0, { message: 'must be greater than 0' })

/**
 * Schema for validating a non-negative integer.
 *
 * @remarks
 * Requires integer value greater than or equal to zero. Useful for counts and sizes.
 *
 * @example
 * ```typescript
 * import { nonNegativeIntegerSchema } from '@bradsjm/weather-gauges-core'
 *
 * const value = nonNegativeIntegerSchema.parse(0) // OK
 * nonNegativeIntegerSchema.parse(-1) // Error: must be greater than or equal to 0
 * ```
 */
export const nonNegativeIntegerSchema = z
  .number()
  .int({ message: 'must be an integer' })
  .min(0, { message: 'must be greater than or equal to 0' })

/**
 * Schema for validating a non-empty string.
 *
 * @remarks
 * Trims whitespace and ensures at least one character remains.
 *
 * @example
 * ```typescript
 * import { nonEmptyStringSchema } from '@bradsjm/weather-gauges-core'
 *
 * const value = nonEmptyStringSchema.parse('Hello') // OK
 * nonEmptyStringSchema.parse('   ') // Error: must not be empty
 * ```
 */
export const nonEmptyStringSchema = z.string().trim().min(1, { message: 'must not be empty' })

/**
 * Schema for validating easing function names.
 *
 * @remarks
 * Defines available easing functions for animations.
 * - linear: Constant speed animation
 * - easeInOutCubic: Smooth acceleration and deceleration
 *
 * @example
 * ```typescript
 * import { easingSchema } from '@bradsjm/weather-gauges-core'
 *
 * const easing = easingSchema.parse('easeInOutCubic')
 * ```
 */
export const easingSchema = z.enum(['linear', 'easeInOutCubic'])
