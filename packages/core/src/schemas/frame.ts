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

export const gaugeForegroundTypeSchema = z.enum(['top-arc-glass', 'side-reflection-glass', 'dome-glass', 'center-glow-glass', 'sweep-glass'])

export type GaugeFrameDesign = z.infer<typeof gaugeFrameDesignSchema>
export type GaugeForegroundType = z.infer<typeof gaugeForegroundTypeSchema>
