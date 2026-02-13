import { z } from 'zod'
import { gaugeBackgroundColorSchema } from '../schemas/background.js'
import { gaugeForegroundTypeSchema, gaugeFrameDesignSchema } from '../schemas/frame.js'
import { gaugeKnobStyleSchema, gaugeKnobTypeSchema } from '../schemas/knob.js'
import { gaugePointerColorSchema, gaugePointerTypeSchema } from '../schemas/pointer.js'
import { gaugeAngleSectionSchema } from '../schemas/sections.js'
import { gaugeOverlaySchema, sharedGaugeConfigSchema } from '../schemas/shared.js'

export const windDirectionPointerSchema = z
  .object({
    type: gaugePointerTypeSchema.default('type1'),
    color: gaugePointerColorSchema.default('RED')
  })
  .strict()

export const windDirectionValueSchema = z
  .object({
    latest: z.number().finite().min(0).max(360).default(0),
    average: z.number().finite().min(0).max(360).default(0)
  })
  .strict()

export const windDirectionLcdTitlesSchema = z
  .object({
    latest: z.string().default('Latest'),
    average: z.string().default('Average')
  })
  .strict()

export const windDirectionSectionSchema = gaugeAngleSectionSchema

export const windDirectionAlertSchema = z
  .object({
    id: z.string().min(1),
    heading: z.number().finite().min(0).max(360),
    severity: z.enum(['info', 'warning', 'critical']).default('warning'),
    message: z.string().min(1)
  })
  .strict()

export const windDirectionIndicatorsSchema = z
  .object({
    alerts: z.array(windDirectionAlertSchema).default([])
  })
  .strict()
  .default({ alerts: [] })

export const windDirectionCustomLayerSchema = gaugeOverlaySchema

export const windDirectionScaleSchema = z
  .object({
    degreeScaleHalf: z.boolean().default(false),
    niceScale: z.boolean().default(true),
    maxNoOfMajorTicks: z.number().int().min(2).default(12),
    maxNoOfMinorTicks: z.number().int().min(1).default(10)
  })
  .strict()

export const windDirectionStyleSchema = z
  .object({
    frameDesign: gaugeFrameDesignSchema.default('metal'),
    backgroundColor: gaugeBackgroundColorSchema.default('DARK_GRAY'),
    foregroundType: gaugeForegroundTypeSchema.default('type1'),
    pointerLatest: windDirectionPointerSchema.default({ type: 'type1', color: 'RED' }),
    pointerAverage: windDirectionPointerSchema.default({ type: 'type8', color: 'BLUE' }),
    knobType: gaugeKnobTypeSchema.default('standardKnob'),
    knobStyle: gaugeKnobStyleSchema.default('silver'),
    pointSymbols: z
      .array(z.string())
      .length(8)
      .default(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']),
    lcdColor: z
      .enum([
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
      .default('STANDARD'),
    digitalFont: z.boolean().default(false),
    useColorLabels: z.boolean().default(false),
    customLayer: windDirectionCustomLayerSchema
  })
  .strict()

export const windDirectionVisibilitySchema = z
  .object({
    showFrame: z.boolean().default(true),
    showBackground: z.boolean().default(true),
    showForeground: z.boolean().default(true),
    showLcd: z.boolean().default(true),
    showPointSymbols: z.boolean().default(true),
    showTickmarks: z.boolean().default(true),
    showDegreeScale: z.boolean().default(false),
    showRose: z.boolean().default(false)
  })
  .strict()

export const windDirectionGaugeConfigSchema = sharedGaugeConfigSchema
  .extend({
    value: windDirectionValueSchema,
    scale: windDirectionScaleSchema.default(() => ({
      degreeScaleHalf: false,
      niceScale: true,
      maxNoOfMajorTicks: 12,
      maxNoOfMinorTicks: 10
    })),
    style: windDirectionStyleSchema.default({
      frameDesign: 'metal',
      backgroundColor: 'DARK_GRAY',
      foregroundType: 'type1',
      pointerLatest: { type: 'type1', color: 'RED' },
      pointerAverage: { type: 'type8', color: 'BLUE' },
      knobType: 'standardKnob',
      knobStyle: 'silver',
      pointSymbols: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
      lcdColor: 'STANDARD',
      digitalFont: false,
      useColorLabels: false
    }),
    visibility: windDirectionVisibilitySchema.default({
      showFrame: true,
      showBackground: true,
      showForeground: true,
      showLcd: true,
      showPointSymbols: true,
      showTickmarks: true,
      showDegreeScale: false,
      showRose: false
    }),
    lcdTitles: windDirectionLcdTitlesSchema.default({
      latest: 'Latest',
      average: 'Average'
    }),
    sections: z.array(windDirectionSectionSchema).default([]),
    areas: z.array(windDirectionSectionSchema).default([]),
    indicators: windDirectionIndicatorsSchema
  })
  .strict()

export type WindDirectionPointer = z.infer<typeof windDirectionPointerSchema>
export type WindDirectionValue = z.infer<typeof windDirectionValueSchema>
export type WindDirectionLcdTitles = z.infer<typeof windDirectionLcdTitlesSchema>
export type WindDirectionSection = z.infer<typeof windDirectionSectionSchema>
export type WindDirectionCustomLayer = z.infer<typeof windDirectionCustomLayerSchema>
export type WindDirectionScale = z.infer<typeof windDirectionScaleSchema>
export type WindDirectionStyle = z.infer<typeof windDirectionStyleSchema>
export type WindDirectionVisibility = z.infer<typeof windDirectionVisibilitySchema>
export type WindDirectionAlert = z.infer<typeof windDirectionAlertSchema>
export type WindDirectionGaugeConfig = z.infer<typeof windDirectionGaugeConfigSchema>
