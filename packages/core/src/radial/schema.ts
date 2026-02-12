import { z } from 'zod'

import { gaugeBackgroundColorSchema } from '../schemas/background.js'
import { gaugeFrameDesignSchema, gaugeForegroundTypeSchema } from '../schemas/frame.js'
import { gaugePointerColorSchema, gaugePointerTypeSchema } from '../schemas/pointer.js'
import { sharedGaugeConfigSchema } from '../schemas/shared.js'

export const radialFrameDesignSchema = gaugeFrameDesignSchema

export const radialBackgroundColorSchema = gaugeBackgroundColorSchema

export const radialForegroundTypeSchema = gaugeForegroundTypeSchema

export const radialPointerTypeSchema = gaugePointerTypeSchema

export const radialGaugeTypeSchema = z.enum(['type1', 'type2', 'type3', 'type4'])

export const radialPointerColorSchema = gaugePointerColorSchema

export const radialStyleSchema = z
  .object({
    frameDesign: radialFrameDesignSchema.default('metal'),
    backgroundColor: radialBackgroundColorSchema.default('DARK_GRAY'),
    foregroundType: radialForegroundTypeSchema.default('type1'),
    pointerType: radialPointerTypeSchema.default('type1'),
    gaugeType: radialGaugeTypeSchema.default('type4'),
    pointerColor: radialPointerColorSchema.default('RED')
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

export const radialSegmentSchema = z
  .object({
    from: z.number().finite(),
    to: z.number().finite(),
    color: z.string().trim().min(1)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.to <= value.from) {
      ctx.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'to must be greater than from'
      })
    }
  })

export const radialThresholdSchema = z
  .object({
    value: z.number().finite(),
    show: z.boolean().default(true)
  })
  .strict()

export const radialAlertSchema = z
  .object({
    id: z.string().trim().min(1),
    value: z.number().finite(),
    message: z.string().trim().min(1),
    severity: z.enum(['info', 'warning', 'critical']).default('warning')
  })
  .strict()

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
  .default({
    alerts: [],
    ledVisible: false,
    userLedVisible: false,
    trendVisible: false,
    trendState: 'down',
    minMeasuredValueVisible: false,
    maxMeasuredValueVisible: false
  })

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
      backgroundColor: 'DARK_GRAY',
      foregroundType: 'type1',
      pointerType: 'type1',
      gaugeType: 'type4',
      pointerColor: 'RED'
    }),
    segments: z.array(radialSegmentSchema).default([]),
    indicators: radialIndicatorsSchema
  })
  .strict()

export type RadialScale = z.infer<typeof radialScaleSchema>
export type RadialSegment = z.infer<typeof radialSegmentSchema>
export type RadialThreshold = z.infer<typeof radialThresholdSchema>
export type RadialAlert = z.infer<typeof radialAlertSchema>
export type RadialIndicators = z.infer<typeof radialIndicatorsSchema>
export type RadialFrameDesign = z.infer<typeof radialFrameDesignSchema>
export type RadialBackgroundColorName = z.infer<typeof radialBackgroundColorSchema>
export type RadialForegroundType = z.infer<typeof radialForegroundTypeSchema>
export type RadialPointerType = z.infer<typeof radialPointerTypeSchema>
export type RadialGaugeType = z.infer<typeof radialGaugeTypeSchema>
export type RadialPointerColorName = z.infer<typeof radialPointerColorSchema>
export type RadialStyle = z.infer<typeof radialStyleSchema>
export type RadialGaugeConfig = z.infer<typeof radialGaugeConfigSchema>
