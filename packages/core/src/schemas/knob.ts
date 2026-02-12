import { z } from 'zod'

export const gaugeKnobTypeSchema = z.enum(['standardKnob', 'metalKnob'])

export const gaugeKnobStyleSchema = z.enum(['black', 'brass', 'silver'])

export type GaugeKnobType = z.infer<typeof gaugeKnobTypeSchema>
export type GaugeKnobStyle = z.infer<typeof gaugeKnobStyleSchema>
