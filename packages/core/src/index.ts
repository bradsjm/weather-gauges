import { z } from 'zod'

export const gaugeRangeSchema = z.object({
  min: z.number(),
  max: z.number()
})

export type GaugeRange = z.infer<typeof gaugeRangeSchema>

export type RadialGaugeConfig = GaugeRange & {
  value: number
}

export type LinearGaugeConfig = GaugeRange & {
  value: number
}

export type CompassGaugeConfig = {
  heading: number
}

export const version = '0.0.0'
