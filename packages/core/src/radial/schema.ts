import { z } from 'zod'

import { sharedGaugeConfigSchema } from '../schemas/shared.js'

export const radialFrameDesignSchema = z.enum([
  'blackMetal',
  'metal',
  'shinyMetal',
  'brass',
  'steel',
  'chrome',
  'gold',
  'anthracite',
  'tiltedGray',
  'tiltedBlack',
  'glossyMetal'
])

export const radialBackgroundColorSchema = z.enum([
  'DARK_GRAY',
  'SATIN_GRAY',
  'LIGHT_GRAY',
  'WHITE',
  'BLACK',
  'BEIGE',
  'BROWN',
  'RED',
  'GREEN',
  'BLUE',
  'ANTHRACITE',
  'MUD',
  'PUNCHED_SHEET',
  'CARBON',
  'STAINLESS',
  'BRUSHED_METAL',
  'BRUSHED_STAINLESS',
  'TURNED'
])

export const radialForegroundTypeSchema = z.enum(['type1', 'type2', 'type3', 'type4', 'type5'])

export const radialPointerColorSchema = z.enum([
  'RED',
  'GREEN',
  'BLUE',
  'ORANGE',
  'YELLOW',
  'CYAN',
  'MAGENTA',
  'WHITE',
  'GRAY',
  'BLACK',
  'RAITH',
  'GREEN_LCD',
  'JUG_GREEN'
])

export const radialStyleSchema = z
  .object({
    frameDesign: radialFrameDesignSchema.default('metal'),
    backgroundColor: radialBackgroundColorSchema.default('DARK_GRAY'),
    foregroundType: radialForegroundTypeSchema.default('type1'),
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
    alerts: z.array(radialAlertSchema).default([])
  })
  .strict()
  .default({ alerts: [] })

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
export type RadialPointerColorName = z.infer<typeof radialPointerColorSchema>
export type RadialStyle = z.infer<typeof radialStyleSchema>
export type RadialGaugeConfig = z.infer<typeof radialGaugeConfigSchema>
