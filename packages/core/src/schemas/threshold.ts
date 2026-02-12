import { z } from 'zod'

export const gaugeThresholdSchema = z
  .object({
    value: z.number().finite(),
    show: z.boolean().default(true)
  })
  .strict()

export type GaugeThreshold = z.infer<typeof gaugeThresholdSchema>
