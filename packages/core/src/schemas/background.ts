import { z } from 'zod'

export const gaugeBackgroundColorSchema = z.enum([
  'DARK_GRAY',
  'SATIN_GRAY',
  'LIGHT_GRAY',
  'WHITE',
  'BLACK',
  'BEIGE',
  'BROWN',
  'RED',
  'GREEN',
  'BLUE',
  'ANTHRACITE',
  'MUD',
  'PUNCHED_SHEET',
  'CARBON',
  'STAINLESS',
  'BRUSHED_METAL',
  'BRUSHED_STAINLESS',
  'TURNED'
])

export type GaugeBackgroundColorName = z.infer<typeof gaugeBackgroundColorSchema>
