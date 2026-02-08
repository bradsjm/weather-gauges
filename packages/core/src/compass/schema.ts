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
    showDegreeLabels: z.boolean().default(true),
    showOrdinalMarkers: z.boolean().default(true)
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
      showDegreeLabels: true,
      showOrdinalMarkers: true
    })),
    indicators: compassIndicatorsSchema
  })
  .strict()

export type CompassHeading = z.infer<typeof compassHeadingSchema>
export type CompassRose = z.infer<typeof compassRoseSchema>
export type CompassAlert = z.infer<typeof compassAlertSchema>
export type CompassIndicators = z.infer<typeof compassIndicatorsSchema>
export type CompassGaugeConfig = z.infer<typeof compassGaugeConfigSchema>
