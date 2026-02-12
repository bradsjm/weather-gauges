import { z } from 'zod'

import { gaugeBackgroundColorSchema } from '../schemas/background.js'
import { gaugeForegroundTypeSchema, gaugeFrameDesignSchema } from '../schemas/frame.js'
import { gaugePointerColorSchema } from '../schemas/pointer.js'
import { gaugeValueSectionSchema } from '../schemas/sections.js'
import { radialGaugeTypeSchema } from '../radial/schema.js'
import { sharedGaugeConfigSchema } from '../schemas/shared.js'
import { gaugeThresholdSchema } from '../schemas/threshold.js'

export const radialBargraphLabelNumberFormatSchema = z.enum([
  'standard',
  'fractional',
  'scientific'
])

export const radialBargraphTickLabelOrientationSchema = z.enum(['horizontal', 'tangent', 'normal'])

export const radialBargraphLcdColorSchema = z.enum([
  'STANDARD',
  'STANDARD_GREEN',
  'BLUE',
  'ORANGE',
  'RED',
  'YELLOW',
  'WHITE',
  'GRAY',
  'BLACK'
])

export const radialBargraphSectionSchema = gaugeValueSectionSchema

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
    backgroundColor: gaugeBackgroundColorSchema.default('DARK_GRAY'),
    foregroundType: gaugeForegroundTypeSchema.default('type1'),
    gaugeType: radialGaugeTypeSchema.default('type4'),
    valueColor: gaugePointerColorSchema.default('RED'),
    lcdColor: radialBargraphLcdColorSchema.default('STANDARD'),
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
      backgroundColor: 'DARK_GRAY',
      foregroundType: 'type1',
      gaugeType: 'type4',
      valueColor: 'RED',
      lcdColor: 'STANDARD',
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
export type RadialBargraphGaugeConfig = z.infer<typeof radialBargraphGaugeConfigSchema>
