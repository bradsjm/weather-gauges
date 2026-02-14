/**
 * @module
 *
 * Radial bargraph gauge configuration schemas and types.
 *
 * This module provides Zod schemas for validating and typing
 * radial bargraph gauge configurations, including gauge types,
 * label formats, tick orientations, and value gradients.
 */
import { z } from 'zod'

import { gaugeBackgroundColorSchema } from '../schemas/background.js'
import { gaugeForegroundTypeSchema, gaugeFrameDesignSchema } from '../schemas/frame.js'
import { gaugePointerColorSchema } from '../schemas/pointer.js'
import { gaugeValueSectionSchema } from '../schemas/sections.js'
import { sharedGaugeConfigSchema } from '../schemas/shared.js'
import { gaugeThresholdSchema } from '../schemas/threshold.js'

/**
 * Schema for validating radial bargraph gauge type.
 *
 * @remarks
 * Defines the arc coverage of the radial bargraph:
 * - half: 180-degree arc (semicircle)
 * - three-quarter: 270-degree arc
 * - full-gap: Full circle with a small gap at the bottom
 *
 * @example
 * ```typescript
 * import { radialBargraphGaugeTypeSchema } from '@bradsjm/weather-gauges-core'
 *
 * const type = radialBargraphGaugeTypeSchema.parse('full-gap')
 * ```
 */
export const radialBargraphGaugeTypeSchema = z.enum(['half', 'three-quarter', 'full-gap'])

export const radialBargraphLabelNumberFormatSchema = z.enum([
  'standard',
  'fractional',
  'scientific'
])

export const radialBargraphTickLabelOrientationSchema = z.enum(['horizontal', 'tangent', 'normal'])

export const radialBargraphLcdColorSchema = z.enum([
  'standard',
  'standard-green',
  'blue',
  'orange',
  'red',
  'yellow',
  'white',
  'gray',
  'black'
])

export const radialBargraphSectionSchema = gaugeValueSectionSchema

/**
 * Schema for validating a value gradient stop.
 *
 * @remarks
 * Defines a color at a specific position in a value gradient.
 *
 * - fraction: Position in range [0, 1] where 0 is start and 1 is end
 * - color: Color to use at this position
 *
 * @example
 * ```typescript
 * import { radialBargraphValueGradientStopSchema } from '@bradsjm/weather-gauges-core'
 *
 * const stop = radialBargraphValueGradientStopSchema.parse({
 *   fraction: 0.5,
 *   color: '#ff0000'
 * })
 * ```
 */
export const radialBargraphValueGradientStopSchema = z
  .object({
    fraction: z.number().min(0).max(1),
    color: z.string().trim().min(1)
  })
  .strict()

export const radialBargraphThresholdSchema = gaugeThresholdSchema

export const radialBargraphAlertSchema = z
  .object({
    id: z.string().trim().min(1),
    value: z.number().finite(),
    message: z.string().trim().min(1),
    severity: z.enum(['info', 'warning', 'critical']).default('warning')
  })
  .strict()

export const radialBargraphIndicatorsSchema = z
  .object({
    threshold: radialBargraphThresholdSchema.optional(),
    alerts: z.array(radialBargraphAlertSchema).default([]),
    ledVisible: z.boolean().default(false),
    userLedVisible: z.boolean().default(false),
    trendVisible: z.boolean().default(false),
    trendState: z.enum(['up', 'steady', 'down', 'off']).default('off')
  })
  .strict()
  .default({
    alerts: [],
    ledVisible: false,
    userLedVisible: false,
    trendVisible: false,
    trendState: 'off'
  })

export const radialBargraphScaleSchema = z
  .object({
    niceScale: z.boolean().default(true),
    maxNoOfMajorTicks: z.number().int().min(2).default(10),
    maxNoOfMinorTicks: z.number().int().min(1).default(10),
    fractionalScaleDecimals: z.number().int().min(0).max(8).default(1)
  })
  .strict()

export const radialBargraphStyleSchema = z
  .object({
    frameDesign: gaugeFrameDesignSchema.default('metal'),
    backgroundColor: gaugeBackgroundColorSchema.default('dark-gray'),
    foregroundType: gaugeForegroundTypeSchema.default('top-arc-glass'),
    gaugeType: radialBargraphGaugeTypeSchema.default('full-gap'),
    valueColor: gaugePointerColorSchema.default('red'),
    lcdColor: radialBargraphLcdColorSchema.default('standard'),
    digitalFont: z.boolean().default(false),
    labelNumberFormat: radialBargraphLabelNumberFormatSchema.default('standard'),
    tickLabelOrientation: radialBargraphTickLabelOrientationSchema.default('normal'),
    useSectionColors: z.boolean().default(false),
    useValueGradient: z.boolean().default(false)
  })
  .strict()

export const radialBargraphGaugeConfigSchema = sharedGaugeConfigSchema
  .extend({
    scale: radialBargraphScaleSchema.default(() => ({
      niceScale: true,
      maxNoOfMajorTicks: 10,
      maxNoOfMinorTicks: 10,
      fractionalScaleDecimals: 1
    })),
    style: radialBargraphStyleSchema.default({
      frameDesign: 'metal',
      backgroundColor: 'dark-gray',
      foregroundType: 'top-arc-glass',
      gaugeType: 'full-gap',
      valueColor: 'red',
      lcdColor: 'standard',
      digitalFont: false,
      labelNumberFormat: 'standard',
      tickLabelOrientation: 'normal',
      useSectionColors: false,
      useValueGradient: false
    }),
    sections: z.array(radialBargraphSectionSchema).default([]),
    valueGradientStops: z.array(radialBargraphValueGradientStopSchema).default([]),
    lcdDecimals: z.number().int().min(0).max(6).default(2),
    indicators: radialBargraphIndicatorsSchema
  })
  .superRefine((value, ctx) => {
    const { min, max } = value.value

    if (value.style.useValueGradient && value.valueGradientStops.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['valueGradientStops'],
        message: 'valueGradientStops are required when useValueGradient is true'
      })
    }

    if (value.style.useSectionColors && value.sections.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['sections'],
        message: 'sections are required when useSectionColors is true'
      })
    }

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
  })
  .strict()

export type RadialBargraphLabelNumberFormat = z.infer<typeof radialBargraphLabelNumberFormatSchema>
export type RadialBargraphTickLabelOrientation = z.infer<
  typeof radialBargraphTickLabelOrientationSchema
>
export type RadialBargraphLcdColorName = z.infer<typeof radialBargraphLcdColorSchema>
export type RadialBargraphSection = z.infer<typeof radialBargraphSectionSchema>
export type RadialBargraphValueGradientStop = z.infer<typeof radialBargraphValueGradientStopSchema>
export type RadialBargraphThreshold = z.infer<typeof radialBargraphThresholdSchema>
export type RadialBargraphAlert = z.infer<typeof radialBargraphAlertSchema>
export type RadialBargraphIndicators = z.infer<typeof radialBargraphIndicatorsSchema>
export type RadialBargraphScale = z.infer<typeof radialBargraphScaleSchema>
export type RadialBargraphStyle = z.infer<typeof radialBargraphStyleSchema>
/**
 * Complete radial bargraph gauge configuration.
 *
 * @remarks
 * Extends {@link SharedGaugeConfig} with radial bargraph-specific options:
 * - scale: Nice scale settings for automatic tick calculation
 * - style: Visual style (gauge type, colors, label formats)
 * - sections: Colored segments for value ranges
 * - valueGradientStops: Color gradient stops for value bar
 * - lcdDecimals: Number of decimal places in LCD display
 * - indicators: Thresholds, alerts, LEDs, and trends
 *
 * @example
 * ```typescript
 * import { radialBargraphGaugeConfigSchema } from '@bradsjm/weather-gauges-core'
 *
 * const config = radialBargraphGaugeConfigSchema.parse({
 *   value: { current: 75, min: 0, max: 100 },
 *   size: { width: 400, height: 400 },
 *   style: { gaugeType: 'full-gap', valueColor: 'red' }
 * })
 * ```
 */
export type RadialBargraphGaugeConfig = z.infer<typeof radialBargraphGaugeConfigSchema>
