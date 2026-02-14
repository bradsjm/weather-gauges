import { z } from 'zod'

import { pointerTypeSchema } from '../pointers/schema.js'

export const gaugePointerTypeSchema = pointerTypeSchema

export const gaugePointerColorSchema = z.enum([
  'red',
  'green',
  'blue',
  'orange',
  'yellow',
  'cyan',
  'magenta',
  'white',
  'gray',
  'black',
  'raith',
  'green-lcd',
  'jug-green'
])

export type GaugePointerType = z.infer<typeof gaugePointerTypeSchema>
export type GaugePointerColorName = z.infer<typeof gaugePointerColorSchema>
