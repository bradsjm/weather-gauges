import { z } from 'zod'

import { gaugeBackgroundColorSchema } from '../schemas/background.js'
import { gaugeForegroundTypeSchema, gaugeFrameDesignSchema } from '../schemas/frame.js'
import { gaugeKnobStyleSchema, gaugeKnobTypeSchema } from '../schemas/knob.js'
import { gaugePointerColorSchema, gaugePointerTypeSchema } from '../schemas/pointer.js'
import {
  sharedGaugeConfigSchema,
  gaugeAnimationSchema,
  gaugeVisibilitySchema,
  gaugeTextSchema,
  gaugeOverlaySchema
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

    if (value.current < value.min || value.current > value.max) {
      ctx.addIssue({
        code: 'custom',
        path: ['current'],
        message: 'current must be within min and max range'
      })
    }
  })

export const compassRoseSchema = z
  .object({
    showDegreeLabels: z.boolean().default(false),
    showOrdinalMarkers: z.boolean().default(true)
  })
  .strict()

export const compassScaleSchema = z
  .object({
    degreeScaleHalf: z.boolean().default(false)
  })
  .strict()

export const compassFrameDesignSchema = gaugeFrameDesignSchema

export const compassBackgroundColorSchema = gaugeBackgroundColorSchema

export const compassPointerTypeSchema = gaugePointerTypeSchema

export const compassForegroundTypeSchema = gaugeForegroundTypeSchema

export const compassKnobTypeSchema = gaugeKnobTypeSchema

export const compassKnobStyleSchema = gaugeKnobStyleSchema

export const compassPointerColorSchema = gaugePointerColorSchema

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
    backgroundColor: compassBackgroundColorSchema.default('dark-gray'),
    pointerType: compassPointerTypeSchema.default('slim-angular-needle'),
    pointerColor: compassPointerColorSchema.default('red'),
    knobType: compassKnobTypeSchema.default('standardKnob'),
    knobStyle: compassKnobStyleSchema.default('silver'),
    foregroundType: compassForegroundTypeSchema.default('top-arc-glass'),
    pointSymbols: compassPointSymbolsSchema,
    pointSymbolsVisible: z.boolean().default(true),
    showTickmarks: z.boolean().default(true),
    degreeScale: z.boolean().default(false),
    roseVisible: z.boolean().default(true),
    rotateFace: z.boolean().default(false),
    customLayer: gaugeOverlaySchema
  })
  .strict()

export const compassAlertSchema = z
  .object({
    id: z.string().trim().min(1),
    heading: z.number().finite().min(0).max(360),
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

export const compassGaugeConfigSchema = sharedGaugeConfigSchema
  .omit({ value: true })
  .extend({
    heading: compassHeadingSchema.default({
      current: 0,
      min: 0,
      max: 360
    }),
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
    scale: compassScaleSchema.default(() => ({
      degreeScaleHalf: false
    })),
    style: compassStyleSchema.default({
      frameDesign: 'metal',
      backgroundColor: 'dark-gray',
      pointerType: 'slim-angular-needle',
      pointerColor: 'red',
      knobType: 'standardKnob',
      knobStyle: 'silver',
      foregroundType: 'top-arc-glass',
      pointSymbols: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
      pointSymbolsVisible: true,
      showTickmarks: true,
      degreeScale: false,
      roseVisible: true,
      rotateFace: false,
      customLayer: undefined
    }),
    indicators: compassIndicatorsSchema
  })
  .superRefine((value, ctx) => {
    value.indicators.alerts.forEach((alert, index) => {
      if (alert.heading < value.heading.min || alert.heading > value.heading.max) {
        ctx.addIssue({
          code: 'custom',
          path: ['indicators', 'alerts', index, 'heading'],
          message: 'alert heading must be within min and max range'
        })
      }
    })
  })
  .strict()

export type CompassHeading = z.infer<typeof compassHeadingSchema>
export type CompassRose = z.infer<typeof compassRoseSchema>
export type CompassScale = z.infer<typeof compassScaleSchema>
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
