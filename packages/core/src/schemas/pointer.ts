import { z } from 'zod'

import { pointerTypeSchema } from '../pointers/schema.js'

export const gaugePointerTypeSchema = pointerTypeSchema

export const gaugePointerColorSchema = z.enum([
  'RED',
  'GREEN',
  'BLUE',
  'ORANGE',
  'YELLOW',
  'CYAN',
  'MAGENTA',
  'WHITE',
  'GRAY',
  'BLACK',
  'RAITH',
  'GREEN_LCD',
  'JUG_GREEN'
])

export type GaugePointerType = z.infer<typeof gaugePointerTypeSchema>
export type GaugePointerColorName = z.infer<typeof gaugePointerColorSchema>
