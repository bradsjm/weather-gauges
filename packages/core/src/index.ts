import { z } from 'zod'

import {
  gaugeAnimationSchema,
  gaugeSizeSchema,
  gaugeTextSchema,
  gaugeValueSchema,
  gaugeVisibilitySchema,
  sharedGaugeConfigSchema
} from './schemas/shared.js'

export * from './schemas/primitives.js'
export * from './schemas/shared.js'
export * from './schemas/validation.js'

export const radialGaugeConfigSchema = sharedGaugeConfigSchema

export const linearGaugeConfigSchema = sharedGaugeConfigSchema

export const compassGaugeConfigSchema = z
  .object({
    heading: gaugeValueSchema,
    size: gaugeSizeSchema,
    animation: gaugeAnimationSchema,
    visibility: gaugeVisibilitySchema,
    text: gaugeTextSchema
  })
  .strict()

export type RadialGaugeConfig = z.infer<typeof radialGaugeConfigSchema>
export type LinearGaugeConfig = z.infer<typeof linearGaugeConfigSchema>
export type CompassGaugeConfig = z.infer<typeof compassGaugeConfigSchema>

export const version = '0.0.0'
