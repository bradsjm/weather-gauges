import { z } from 'zod'

import {
  easingSchema,
  finiteNumberSchema,
  nonEmptyStringSchema,
  nonNegativeIntegerSchema,
  positiveIntegerSchema
} from './primitives.js'

/**
 * @module
 *
 * Shared gauge configuration schemas and types.
 *
 * This module provides reusable configuration schemas used across multiple gauge types.
 * All schemas are built using Zod for runtime validation and type safety.
 */

/**
 * Base schema for a numeric range with min and max values.
 *
 * @remarks
 * This is an internal base schema. Use {@link gaugeRangeSchema} for the validated
 * public schema that ensures max > min.
 */
const gaugeRangeBaseSchema = z
  .object({
    min: finiteNumberSchema,
    max: finiteNumberSchema
  })
  .strict()

/**
 * Schema for validating a numeric range.
 *
 * @remarks
 * Validates that max is strictly greater than min.
 *
 * @example
 * ```typescript
 * import { gaugeRangeSchema } from '@bradsjm/weather-gauges-core'
 *
 * const range = gaugeRangeSchema.parse({ min: 0, max: 100 })
 * ```
 */
export const gaugeRangeSchema = gaugeRangeBaseSchema.superRefine((value, ctx) => {
  if (value.max <= value.min) {
    ctx.addIssue({
      code: 'custom',
      path: ['max'],
      message: 'max must be greater than min'
    })
  }
})

/**
 * Base schema for a gauge value with range and current reading.
 *
 * @remarks
 * Internal base schema. Use {@link gaugeValueSchema} for validated public schema.
 */
const gaugeValueBaseSchema = gaugeRangeBaseSchema.extend({
  current: finiteNumberSchema
})

/**
 * Schema for validating a gauge value with range constraints.
 *
 * @remarks
 * Ensures that current value is within the [min, max] range.
 *
 * @example
 * ```typescript
 * import { gaugeValueSchema } from '@bradsjm/weather-gauges-core'
 *
 * const value = gaugeValueSchema.parse({
 *   min: 0,
 *   max: 100,
 *   current: 75
 * })
 * ```
 */
export const gaugeValueSchema = gaugeValueBaseSchema.superRefine((value, ctx) => {
  if (value.current < value.min || value.current > value.max) {
    ctx.addIssue({
      code: 'custom',
      path: ['current'],
      message: 'current must be within min and max range'
    })
  }
})

/**
 * Schema for validating gauge dimensions.
 *
 * @remarks
 * Requires positive integer values for width and height.
 *
 * @example
 * ```typescript
 * import { gaugeSizeSchema } from '@bradsjm/weather-gauges-core'
 *
 * const size = gaugeSizeSchema.parse({ width: 400, height: 400 })
 * ```
 */
export const gaugeSizeSchema = z
  .object({
    width: positiveIntegerSchema,
    height: positiveIntegerSchema
  })
  .strict()

/**
 * Schema for validating gauge animation settings.
 *
 * @remarks
 * - enabled: Whether animations should play (default: true)
 * - durationMs: Animation duration in milliseconds (default: 500)
 * - easing: Easing function to use (default: 'easeInOutCubic')
 *
 * @example
 * ```typescript
 * import { gaugeAnimationSchema } from '@bradsjm/weather-gauges-core'
 *
 * const animation = gaugeAnimationSchema.parse({
 *   enabled: true,
 *   durationMs: 1000,
 *   easing: 'easeInOutCubic'
 * })
 * ```
 */
export const gaugeAnimationSchema = z
  .object({
    enabled: z.boolean().default(true),
    durationMs: nonNegativeIntegerSchema.default(500),
    easing: easingSchema.default('easeInOutCubic')
  })
  .strict()

/**
 * Schema for validating gauge visibility settings.
 *
 * @remarks
 * Controls which visual elements are displayed. All defaults to true.
 *
 * @example
 * ```typescript
 * import { gaugeVisibilitySchema } from '@bradsjm/weather-gauges-core'
 *
 * const visibility = gaugeVisibilitySchema.parse({
 *   showFrame: true,
 *   showBackground: true,
 *   showForeground: true,
 *   showLcd: false
 * })
 * ```
 */
export const gaugeVisibilitySchema = z
  .object({
    showFrame: z.boolean().default(true),
    showBackground: z.boolean().default(true),
    showForeground: z.boolean().default(true),
    showLcd: z.boolean().default(true)
  })
  .strict()

/**
 * Schema for validating gauge text labels.
 *
 * @remarks
 * All fields are optional. Title and unit are displayed on the gauge face.
 *
 * @example
 * ```typescript
 * import { gaugeTextSchema } from '@bradsjm/weather-gauges-core'
 *
 * const text = gaugeTextSchema.parse({
 *   title: 'Temperature',
 *   unit: '°C',
 *   thresholdLabel: 'Warning'
 * })
 * ```
 */
export const gaugeTextSchema = z
  .object({
    title: nonEmptyStringSchema.optional(),
    unit: nonEmptyStringSchema.optional(),
    thresholdLabel: nonEmptyStringSchema.optional()
  })
  .strict()

/**
 * Detects the Image constructor in the current environment.
 *
 * @remarks
 * Returns undefined in environments without Image support (e.g., Node.js without canvas).
 */
const imageConstructor =
  typeof globalThis === 'object' && 'Image' in globalThis
    ? (globalThis.Image as typeof Image)
    : undefined

/**
 * Schema for validating an overlay image.
 *
 * @remarks
 * Accepts Image instances or other image-like objects (CanvasImageSource).
 */
export const gaugeOverlayImageSchema = imageConstructor
  ? z.instanceof(imageConstructor)
  : z.custom<CanvasImageSource>((value) => typeof value === 'object' && value !== null, {
      message: 'Expected an image-like object'
    })

/**
 * Schema for overlay position within the gauge.
 *
 * @remarks
 * Defines where the overlay image is positioned relative to the gauge center.
 * - center: Centered on the gauge
 * - top-left, top-right, bottom-left, bottom-right: Corner positions
 */
export const gaugeOverlayPositionSchema = z.enum([
  'center',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right'
])

/**
 * Schema for validating overlay configuration.
 *
 * @remarks
 * Configures an optional image overlay on the gauge face.
 *
 * - image: The image to overlay (optional)
 * - visible: Whether the overlay is shown (default: true)
 * - opacity: Transparency level from 0 to 1 (default: 0.3)
 * - position: Position of the overlay (default: 'center')
 * - scale: Size of the overlay relative to gauge (default: 0.5)
 *
 * @example
 * ```typescript
 * import { gaugeOverlaySchema } from '@bradsjm/weather-gauges-core'
 *
 * const overlay = gaugeOverlaySchema.parse({
 *   image: myImageElement,
 *   visible: true,
 *   opacity: 0.5,
 *   position: 'center',
 *   scale: 0.3
 * })
 * ```
 */
export const gaugeOverlaySchema = z
  .object({
    image: gaugeOverlayImageSchema.optional(),
    visible: z.boolean().default(true),
    opacity: z.number().finite().min(0).max(1).default(0.3),
    position: gaugeOverlayPositionSchema.default('center'),
    scale: z.number().finite().positive().default(0.5)
  })
  .strict()
  .optional()

/**
 * Schema for shared gauge configuration.
 *
 * @remarks
 * This schema contains configuration options common to all gauge types.
 * Individual gauge schemas extend this with type-specific options.
 *
 * Includes:
 * - value: The current value and range
 * - size: Gauge dimensions
 * - animation: Animation settings
 * - visibility: Visibility flags for gauge elements
 * - text: Text labels (title, unit, threshold label)
 *
 * @example
 * ```typescript
 * import { sharedGaugeConfigSchema } from '@bradsjm/weather-gauges-core'
 *
 * const config = sharedGaugeConfigSchema.parse({
 *   value: { current: 50, min: 0, max: 100 },
 *   size: { width: 300, height: 300 },
 *   text: { title: 'Pressure', unit: 'hPa' }
 * })
 * ```
 */
export const sharedGaugeConfigSchema = z
  .object({
    value: gaugeValueSchema,
    size: gaugeSizeSchema,
    animation: gaugeAnimationSchema.default(() => ({
      enabled: true,
      durationMs: 500,
      easing: 'easeInOutCubic' as const
    })),
    visibility: gaugeVisibilitySchema.default(() => ({
      showFrame: true,
      showBackground: true,
      showForeground: true,
      showLcd: true
    })),
    text: gaugeTextSchema.default({})
  })
  .strict()

/**
 * Represents a numeric range with min and max values.
 *
 * @remarks
 * Max value must be strictly greater than min value.
 */
export type GaugeRange = z.infer<typeof gaugeRangeSchema>

/**
 * Represents a gauge value with range and current reading.
 *
 * @remarks
 * Current value must be within the [min, max] range.
 */
export type GaugeValue = z.infer<typeof gaugeValueSchema>

/**
 * Represents gauge dimensions.
 *
 * @remarks
 * Both width and height must be positive integers.
 */
export type GaugeSize = z.infer<typeof gaugeSizeSchema>

/**
 * Represents animation configuration.
 *
 * @remarks
 * Controls animation behavior including enabled state, duration, and easing.
 */
export type GaugeAnimation = z.infer<typeof gaugeAnimationSchema>

/**
 * Represents visibility settings for gauge elements.
 *
 * @remarks
 * Controls display of frame, background, foreground, and LCD.
 */
export type GaugeVisibility = z.infer<typeof gaugeVisibilitySchema>

/**
 * Represents text labels displayed on the gauge.
 *
 * @remarks
 * Includes title, unit, and optional threshold label.
 */
export type GaugeText = z.infer<typeof gaugeTextSchema>

/**
 * Represents an optional image overlay configuration.
 *
 * @remarks
 * Defines image, opacity, position, and scale for overlay.
 */
export type GaugeOverlay = z.infer<typeof gaugeOverlaySchema>

/**
 * Base configuration shared across all gauge types.
 *
 * @remarks
 * Individual gauge types extend this with type-specific options.
 */
export type SharedGaugeConfig = z.infer<typeof sharedGaugeConfigSchema>
