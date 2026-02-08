import { z } from 'zod'

import {
  gaugeAnimationSchema,
  gaugeSizeSchema,
  gaugeTextSchema,
  gaugeValueSchema,
  gaugeVisibilitySchema,
  sharedGaugeConfigSchema
} from './schemas/shared.js'
import { radialGaugeConfigSchema } from './radial/schema.js'

export * from './schemas/primitives.js'
export * from './schemas/shared.js'
export * from './schemas/validation.js'
export * from './math/range.js'
export * from './math/ticks.js'
export * from './math/geometry.js'
export * from './animation/easing.js'
export * from './animation/timeline.js'
export * from './animation/scheduler.js'
export * from './render/context.js'
export * from './theme/tokens.js'
export * from './extensions/interfaces.js'
export * from './radial/schema.js'
export * from './radial/renderer.js'

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
