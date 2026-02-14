import { z } from 'zod'

export const gaugeBackgroundColorSchema = z.enum([
  'dark-gray',
  'satin-gray',
  'light-gray',
  'white',
  'black',
  'beige',
  'brown',
  'red',
  'green',
  'blue',
  'anthracite',
  'mud',
  'punched-sheet',
  'carbon',
  'stainless',
  'brushed-metal',
  'brushed-stainless',
  'turned'
])

export type GaugeBackgroundColorName = z.infer<typeof gaugeBackgroundColorSchema>
