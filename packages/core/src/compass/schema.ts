import { z } from 'zod'

import {
  gaugeAnimationSchema,
  gaugeSizeSchema,
  gaugeTextSchema,
  gaugeVisibilitySchema
} from '../schemas/shared.js'

export const compassHeadingSchema = z
  .object({
    current: z.number().finite(),
    min: z.number().finite().default(0),
    max: z.number().finite().default(360)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.max <= value.min) {
      ctx.addIssue({
        code: 'custom',
        path: ['max'],
        message: 'max must be greater than min'
      })
    }
  })

export const compassRoseSchema = z
  .object({
    showDegreeLabels: z.boolean().default(false),
    showOrdinalMarkers: z.boolean().default(true)
  })
  .strict()

export const compassFrameDesignSchema = z.enum([
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

export const compassBackgroundColorSchema = z.enum([
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

export const compassPointerTypeSchema = z.enum([
  'type1',
  'type2',
  'type3',
  'type4',
  'type5',
  'type6',
  'type7',
  'type8',
  'type9',
  'type10',
  'type11',
  'type12',
  'type13',
  'type14',
  'type15',
  'type16'
])

export const compassForegroundTypeSchema = z.enum(['type1', 'type2', 'type3', 'type4', 'type5'])

export const compassKnobTypeSchema = z.enum(['standardKnob', 'metalKnob'])

export const compassKnobStyleSchema = z.enum(['black', 'brass', 'silver'])

export const compassPointerColorSchema = z.enum([
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

export const compassPointSymbolsSchema = z
  .tuple([
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1)
  ])
  .default(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'])

export const compassStyleSchema = z
  .object({
    frameDesign: compassFrameDesignSchema.default('metal'),
    backgroundColor: compassBackgroundColorSchema.default('DARK_GRAY'),
    pointerType: compassPointerTypeSchema.default('type2'),
    pointerColor: compassPointerColorSchema.default('RED'),
    knobType: compassKnobTypeSchema.default('standardKnob'),
    knobStyle: compassKnobStyleSchema.default('silver'),
    foregroundType: compassForegroundTypeSchema.default('type1'),
    pointSymbols: compassPointSymbolsSchema,
    pointSymbolsVisible: z.boolean().default(true),
    degreeScale: z.boolean().default(false),
    roseVisible: z.boolean().default(true),
    rotateFace: z.boolean().default(false),
    customLayer: z.unknown().optional()
  })
  .strict()

export const compassAlertSchema = z
  .object({
    id: z.string().trim().min(1),
    heading: z.number().finite(),
    message: z.string().trim().min(1),
    severity: z.enum(['info', 'warning', 'critical']).default('warning')
  })
  .strict()

export const compassIndicatorsSchema = z
  .object({
    alerts: z.array(compassAlertSchema).default([])
  })
  .strict()
  .default({ alerts: [] })

export const compassGaugeConfigSchema = z
  .object({
    heading: compassHeadingSchema,
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
    text: gaugeTextSchema.default({}),
    rose: compassRoseSchema.default(() => ({
      showDegreeLabels: false,
      showOrdinalMarkers: true
    })),
    style: compassStyleSchema.default({
      frameDesign: 'metal',
      backgroundColor: 'DARK_GRAY',
      pointerType: 'type2',
      pointerColor: 'RED',
      knobType: 'standardKnob',
      knobStyle: 'silver',
      foregroundType: 'type1',
      pointSymbols: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
      pointSymbolsVisible: true,
      degreeScale: false,
      roseVisible: true,
      rotateFace: false,
      customLayer: undefined
    }),
    indicators: compassIndicatorsSchema
  })
  .strict()

export type CompassHeading = z.infer<typeof compassHeadingSchema>
export type CompassRose = z.infer<typeof compassRoseSchema>
export type CompassAlert = z.infer<typeof compassAlertSchema>
export type CompassIndicators = z.infer<typeof compassIndicatorsSchema>
export type CompassFrameDesign = z.infer<typeof compassFrameDesignSchema>
export type CompassBackgroundColorName = z.infer<typeof compassBackgroundColorSchema>
export type CompassPointerType = z.infer<typeof compassPointerTypeSchema>
export type CompassForegroundType = z.infer<typeof compassForegroundTypeSchema>
export type CompassKnobType = z.infer<typeof compassKnobTypeSchema>
export type CompassKnobStyle = z.infer<typeof compassKnobStyleSchema>
export type CompassPointerColorName = z.infer<typeof compassPointerColorSchema>
export type CompassStyle = z.infer<typeof compassStyleSchema>
export type CompassGaugeConfig = z.infer<typeof compassGaugeConfigSchema>
