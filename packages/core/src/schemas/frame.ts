import { z } from 'zod'

export const gaugeFrameDesignSchema = z.enum([
  'blackMetal',
  'metal',
  'shinyMetal',
  'brass',
  'steel',
  'chrome',
  'gold',
  'anthracite',
  'tiltedGray',
  'tiltedBlack',
  'glossyMetal'
])

export const gaugeForegroundTypeSchema = z.enum(['type1', 'type2', 'type3', 'type4', 'type5'])

export type GaugeFrameDesign = z.infer<typeof gaugeFrameDesignSchema>
export type GaugeForegroundType = z.infer<typeof gaugeForegroundTypeSchema>
