import { z } from 'zod'

export const gaugeValueSectionSchema = z
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

export const gaugeAngleSectionSchema = z
  .object({
    start: z.number().finite(),
    stop: z.number().finite(),
    color: z.string().trim().min(1)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.stop <= value.start) {
      ctx.addIssue({
        code: 'custom',
        path: ['stop'],
        message: 'stop must be greater than start'
      })
    }
  })

export type GaugeValueSection = z.infer<typeof gaugeValueSectionSchema>
export type GaugeAngleSection = z.infer<typeof gaugeAngleSectionSchema>
