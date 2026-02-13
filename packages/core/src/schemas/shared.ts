import { z } from 'zod'

import {
  easingSchema,
  finiteNumberSchema,
  nonEmptyStringSchema,
  nonNegativeIntegerSchema,
  positiveIntegerSchema
} from './primitives.js'

const gaugeRangeBaseSchema = z
  .object({
    min: finiteNumberSchema,
    max: finiteNumberSchema
  })
  .strict()

export const gaugeRangeSchema = gaugeRangeBaseSchema.superRefine((value, ctx) => {
  if (value.max <= value.min) {
    ctx.addIssue({
      code: 'custom',
      path: ['max'],
      message: 'max must be greater than min'
    })
  }
})

const gaugeValueBaseSchema = gaugeRangeBaseSchema.extend({
  current: finiteNumberSchema
})

export const gaugeValueSchema = gaugeValueBaseSchema.superRefine((value, ctx) => {
  if (value.current < value.min || value.current > value.max) {
    ctx.addIssue({
      code: 'custom',
      path: ['current'],
      message: 'current must be within min and max range'
    })
  }
})

export const gaugeSizeSchema = z
  .object({
    width: positiveIntegerSchema,
    height: positiveIntegerSchema
  })
  .strict()

export const gaugeAnimationSchema = z
  .object({
    enabled: z.boolean().default(true),
    durationMs: nonNegativeIntegerSchema.default(500),
    easing: easingSchema.default('easeInOutCubic')
  })
  .strict()

export const gaugeVisibilitySchema = z
  .object({
    showFrame: z.boolean().default(true),
    showBackground: z.boolean().default(true),
    showForeground: z.boolean().default(true),
    showLcd: z.boolean().default(true)
  })
  .strict()

export const gaugeTextSchema = z
  .object({
    title: nonEmptyStringSchema.optional(),
    unit: nonEmptyStringSchema.optional(),
    thresholdLabel: nonEmptyStringSchema.optional()
  })
  .strict()

const imageConstructor =
  typeof globalThis === 'object' && 'Image' in globalThis
    ? (globalThis.Image as typeof Image)
    : undefined

export const gaugeOverlayImageSchema = imageConstructor
  ? z.instanceof(imageConstructor)
  : z.custom<CanvasImageSource>((value) => typeof value === 'object' && value !== null, {
      message: 'Expected an image-like object'
    })

export const gaugeOverlayPositionSchema = z.enum([
  'center',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right'
])

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

export type GaugeRange = z.infer<typeof gaugeRangeSchema>
export type GaugeValue = z.infer<typeof gaugeValueSchema>
export type GaugeSize = z.infer<typeof gaugeSizeSchema>
export type GaugeAnimation = z.infer<typeof gaugeAnimationSchema>
export type GaugeVisibility = z.infer<typeof gaugeVisibilitySchema>
export type GaugeText = z.infer<typeof gaugeTextSchema>
export type GaugeOverlay = z.infer<typeof gaugeOverlaySchema>
export type SharedGaugeConfig = z.infer<typeof sharedGaugeConfigSchema>
