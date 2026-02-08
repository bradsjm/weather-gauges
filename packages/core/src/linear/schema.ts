import { z } from 'zod'

import { sharedGaugeConfigSchema } from '../schemas/shared.js'

export const linearFrameDesignSchema = z.enum([
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

export const linearBackgroundColorSchema = z.enum([
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

export const linearStyleSchema = z
  .object({
    gaugeType: z.enum(['type1', 'type2']).default('type1'),
    frameDesign: linearFrameDesignSchema.default('metal'),
    backgroundColor: linearBackgroundColorSchema.default('DARK_GRAY'),
    valueColor: z
      .enum([
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
      .default('RED')
  })
  .strict()

export const linearScaleSchema = z
  .object({
    majorTickCount: z.number().int().min(2).default(7),
    minorTicksPerMajor: z.number().int().min(0).default(2),
    vertical: z.boolean().default(true)
  })
  .strict()

export const linearSegmentSchema = z
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

export const linearThresholdSchema = z
  .object({
    value: z.number().finite(),
    show: z.boolean().default(true)
  })
  .strict()

export const linearAlertSchema = z
  .object({
    id: z.string().trim().min(1),
    value: z.number().finite(),
    message: z.string().trim().min(1),
    severity: z.enum(['info', 'warning', 'critical']).default('warning')
  })
  .strict()

export const linearIndicatorsSchema = z
  .object({
    threshold: linearThresholdSchema.optional(),
    alerts: z.array(linearAlertSchema).default([]),
    ledVisible: z.boolean().default(false),
    minMeasuredValueVisible: z.boolean().default(false),
    maxMeasuredValueVisible: z.boolean().default(false),
    minMeasuredValue: z.number().finite().optional(),
    maxMeasuredValue: z.number().finite().optional()
  })
  .strict()
  .default({
    alerts: [],
    ledVisible: false,
    minMeasuredValueVisible: false,
    maxMeasuredValueVisible: false
  })

export const linearGaugeConfigSchema = sharedGaugeConfigSchema
  .extend({
    scale: linearScaleSchema.default(() => ({
      majorTickCount: 7,
      minorTicksPerMajor: 2,
      vertical: true
    })),
    style: linearStyleSchema.default({
      gaugeType: 'type1',
      frameDesign: 'metal',
      backgroundColor: 'DARK_GRAY',
      valueColor: 'RED'
    }),
    segments: z.array(linearSegmentSchema).default([]),
    indicators: linearIndicatorsSchema
  })
  .strict()

export type LinearScale = z.infer<typeof linearScaleSchema>
export type LinearSegment = z.infer<typeof linearSegmentSchema>
export type LinearThreshold = z.infer<typeof linearThresholdSchema>
export type LinearAlert = z.infer<typeof linearAlertSchema>
export type LinearIndicators = z.infer<typeof linearIndicatorsSchema>
export type LinearFrameDesign = z.infer<typeof linearFrameDesignSchema>
export type LinearBackgroundColorName = z.infer<typeof linearBackgroundColorSchema>
export type LinearStyle = z.infer<typeof linearStyleSchema>
export type LinearGaugeConfig = z.infer<typeof linearGaugeConfigSchema>
