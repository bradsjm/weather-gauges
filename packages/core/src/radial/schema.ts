/**
 * @module
 *
 * Radial gauge configuration schemas and types.
 *
 * This module provides Zod schemas for validating and typing
 * radial gauge configurations, including gauge types, orientations,
 * scale settings, and indicator configurations.
 */
import { z } from 'zod'

import { gaugeBackgroundColorSchema } from '../schemas/background.js'
import { gaugeFrameDesignSchema, gaugeForegroundTypeSchema } from '../schemas/frame.js'
import { gaugePointerColorSchema, gaugePointerTypeSchema } from '../schemas/pointer.js'
import { gaugeValueSectionSchema } from '../schemas/sections.js'
import { sharedGaugeConfigSchema } from '../schemas/shared.js'
import { gaugeThresholdSchema } from '../schemas/threshold.js'

export const radialFrameDesignSchema = gaugeFrameDesignSchema

export const radialBackgroundColorSchema = gaugeBackgroundColorSchema

export const radialForegroundTypeSchema = gaugeForegroundTypeSchema

export const radialPointerTypeSchema = gaugePointerTypeSchema

/**
 * Schema for validating radial gauge type.
 *
 * @remarks
 * Defines the visual style and arc coverage of the radial gauge:
 * - half: 180-degree arc (semicircle)
 * - three-quarter: 270-degree arc
 * - full-gap: Full circle with a small gap at the bottom
 * - quarter-offset: 270-degree arc offset from vertical
 *
 * @example
 * ```typescript
 * import { radialGaugeTypeSchema } from '@bradsjm/weather-gauges-core'
 *
 * const type = radialGaugeTypeSchema.parse('full-gap')
 * ```
 */
export const radialGaugeTypeSchema = z.enum(['half', 'three-quarter', 'full-gap', 'quarter-offset'])

/**
 * Schema for validating radial gauge orientation.
 *
 * @remarks
 * Defines which direction the gauge arc points:
 * - north: Points upward (12 o'clock position)
 * - east: Points to the right (3 o'clock position)
 * - west: Points to the left (9 o'clock position)
 *
 * @example
 * ```typescript
 * import { radialOrientationSchema } from '@bradsjm/weather-gauges-core'
 *
 * const orientation = radialOrientationSchema.parse('north')
 * ```
 */
export const radialOrientationSchema = z.enum(['north', 'east', 'west'])

export const radialPointerColorSchema = gaugePointerColorSchema

export const radialStyleSchema = z
  .object({
    frameDesign: radialFrameDesignSchema.default('metal'),
    backgroundColor: radialBackgroundColorSchema.default('dark-gray'),
    foregroundType: radialForegroundTypeSchema.default('top-arc-glass'),
    pointerType: radialPointerTypeSchema.default('classic-compass-needle'),
    gaugeType: radialGaugeTypeSchema.default('full-gap'),
    orientation: radialOrientationSchema.default('north'),
    pointerColor: radialPointerColorSchema.default('red')
  })
  .strict()

export const radialScaleSchema = z
  .object({
    startAngle: z
      .number()
      .finite()
      .default((-3 * Math.PI) / 4),
    endAngle: z
      .number()
      .finite()
      .default((3 * Math.PI) / 4),
    majorTickCount: z.number().int().min(2).default(9),
    minorTicksPerMajor: z.number().int().min(0).default(4)
  })
  .strict()

export const radialSegmentSchema = gaugeValueSectionSchema

export const radialAreaSchema = gaugeValueSectionSchema

export const radialThresholdSchema = gaugeThresholdSchema

export const radialAlertSchema = z
  .object({
    id: z.string().trim().min(1),
    value: z.number().finite(),
    message: z.string().trim().min(1),
    severity: z.enum(['info', 'warning', 'critical']).default('warning')
  })
  .strict()

/**
 * Schema for validating radial gauge indicator settings.
 *
 * @remarks
 * Configures various indicators displayed on the gauge:
 * - threshold: Optional threshold line marker
 * - alerts: Array of value-based alerts
 * - ledVisible: Whether to show LED indicator (default: false)
 * - userLedVisible: Whether to show user LED indicator (default: false)
 * - trendVisible: Whether to show trend indicator (default: false)
 * - trendState: Trend direction to display (default: 'down')
 * - minMeasuredValueVisible: Whether to show min measured value (default: false)
 * - maxMeasuredValueVisible: Whether to show max measured value (default: false)
 * - minMeasuredValue: Minimum measured value (required when visible)
 * - maxMeasuredValue: Maximum measured value (required when visible)
 *
 * @example
 * ```typescript
 * import { radialIndicatorsSchema } from '@bradsjm/weather-gauges-core'
 *
 * const indicators = radialIndicatorsSchema.parse({
 *   threshold: { value: 80, show: true },
 *   ledVisible: true,
 *   trendVisible: true,
 *   trendState: 'up'
 * })
 * ```
 */
export const radialIndicatorsSchema = z
  .object({
    threshold: radialThresholdSchema.optional(),
    alerts: z.array(radialAlertSchema).default([]),
    ledVisible: z.boolean().default(false),
    userLedVisible: z.boolean().default(false),
    trendVisible: z.boolean().default(false),
    trendState: z.enum(['up', 'steady', 'down']).default('down'),
    minMeasuredValueVisible: z.boolean().default(false),
    maxMeasuredValueVisible: z.boolean().default(false),
    minMeasuredValue: z.number().finite().optional(),
    maxMeasuredValue: z.number().finite().optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.minMeasuredValueVisible && typeof value.minMeasuredValue !== 'number') {
      ctx.addIssue({
        code: 'custom',
        path: ['minMeasuredValue'],
        message: 'minMeasuredValue is required when minMeasuredValueVisible is true'
      })
    }

    if (value.maxMeasuredValueVisible && typeof value.maxMeasuredValue !== 'number') {
      ctx.addIssue({
        code: 'custom',
        path: ['maxMeasuredValue'],
        message: 'maxMeasuredValue is required when maxMeasuredValueVisible is true'
      })
    }

    if (
      typeof value.minMeasuredValue === 'number' &&
      typeof value.maxMeasuredValue === 'number' &&
      value.minMeasuredValue > value.maxMeasuredValue
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['maxMeasuredValue'],
        message: 'maxMeasuredValue must be greater than or equal to minMeasuredValue'
      })
    }
  })
  .default({
    alerts: [],
    ledVisible: false,
    userLedVisible: false,
    trendVisible: false,
    trendState: 'down',
    minMeasuredValueVisible: false,
    maxMeasuredValueVisible: false
  })

/**
 * Complete radial gauge configuration.
 *
 * @remarks
 * Extends {@link SharedGaugeConfig} with radial-specific options:
 * - scale: Scale settings (start/end angles, tick counts)
 * - style: Visual style (gauge type, orientation, pointer, colors)
 * - segments: Colored segments for value ranges
 * - areas: Filled areas for value ranges
 * - indicators: Thresholds, alerts, LEDs, trends, measured values
 *
 * @example
 * ```typescript
 * import { radialGaugeConfigSchema } from '@bradsjm/weather-gauges-core'
 *
 * const config = radialGaugeConfigSchema.parse({
 *   value: { current: 75, min: 0, max: 100 },
 *   size: { width: 400, height: 400 },
 *   scale: { startAngle: -Math.PI * 0.75, endAngle: Math.PI * 0.75 },
 *   style: { gaugeType: 'full-gap', orientation: 'north' }
 * })
 * ```
 */
export const radialGaugeConfigSchema = sharedGaugeConfigSchema
  .extend({
    scale: radialScaleSchema.default(() => ({
      startAngle: (-3 * Math.PI) / 4,
      endAngle: (3 * Math.PI) / 4,
      majorTickCount: 9,
      minorTicksPerMajor: 4
    })),
    style: radialStyleSchema.default({
      frameDesign: 'metal',
      backgroundColor: 'dark-gray',
      foregroundType: 'top-arc-glass',
      pointerType: 'classic-compass-needle',
      gaugeType: 'full-gap',
      orientation: 'north',
      pointerColor: 'red'
    }),
    segments: z.array(radialSegmentSchema).default([]),
    areas: z.array(radialAreaSchema).default([]),
    indicators: radialIndicatorsSchema
  })
  .superRefine((value, ctx) => {
    const { min, max } = value.value

    const thresholdValue = value.indicators.threshold?.value
    if (typeof thresholdValue === 'number' && (thresholdValue < min || thresholdValue > max)) {
      ctx.addIssue({
        code: 'custom',
        path: ['indicators', 'threshold', 'value'],
        message: 'threshold value must be within min and max range'
      })
    }

    value.indicators.alerts.forEach((alert, index) => {
      if (alert.value < min || alert.value > max) {
        ctx.addIssue({
          code: 'custom',
          path: ['indicators', 'alerts', index, 'value'],
          message: 'alert value must be within min and max range'
        })
      }
    })

    if (
      value.indicators.minMeasuredValueVisible &&
      typeof value.indicators.minMeasuredValue === 'number' &&
      (value.indicators.minMeasuredValue < min || value.indicators.minMeasuredValue > max)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['indicators', 'minMeasuredValue'],
        message: 'minMeasuredValue must be within min and max range'
      })
    }

    if (
      value.indicators.maxMeasuredValueVisible &&
      typeof value.indicators.maxMeasuredValue === 'number' &&
      (value.indicators.maxMeasuredValue < min || value.indicators.maxMeasuredValue > max)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['indicators', 'maxMeasuredValue'],
        message: 'maxMeasuredValue must be within min and max range'
      })
    }
  })
  .strict()

export type RadialScale = z.infer<typeof radialScaleSchema>
export type RadialSegment = z.infer<typeof radialSegmentSchema>
export type RadialArea = z.infer<typeof radialAreaSchema>
export type RadialThreshold = z.infer<typeof radialThresholdSchema>
export type RadialAlert = z.infer<typeof radialAlertSchema>
export type RadialIndicators = z.infer<typeof radialIndicatorsSchema>
export type RadialFrameDesign = z.infer<typeof radialFrameDesignSchema>
export type RadialBackgroundColorName = z.infer<typeof radialBackgroundColorSchema>
export type RadialForegroundType = z.infer<typeof radialForegroundTypeSchema>
export type RadialPointerType = z.infer<typeof radialPointerTypeSchema>
export type RadialGaugeType = z.infer<typeof radialGaugeTypeSchema>
export type RadialOrientation = z.infer<typeof radialOrientationSchema>
export type RadialPointerColorName = z.infer<typeof radialPointerColorSchema>
export type RadialStyle = z.infer<typeof radialStyleSchema>
export type RadialGaugeConfig = z.infer<typeof radialGaugeConfigSchema>
