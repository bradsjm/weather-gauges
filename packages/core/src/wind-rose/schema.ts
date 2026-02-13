import { z } from 'zod'

import { gaugeBackgroundColorSchema } from '../schemas/background.js'
import { gaugeForegroundTypeSchema, gaugeFrameDesignSchema } from '../schemas/frame.js'
import { gaugeKnobStyleSchema, gaugeKnobTypeSchema } from '../schemas/knob.js'
import { sharedGaugeConfigSchema } from '../schemas/shared.js'

const imageConstructor =
  typeof globalThis === 'object' && 'Image' in globalThis
    ? (globalThis.Image as typeof Image)
    : undefined

const windRoseCustomLayerImageSchema = imageConstructor
  ? z.instanceof(imageConstructor)
  : z.custom<HTMLImageElement>((value) => typeof value === 'object' && value !== null, {
      message: 'Expected an image-like object'
    })

export const windRoseBinSizes = [8, 16, 32] as const

const directionTolerance = 0.0001

const normalizeDirection = (direction: number): number => {
  const normalized = ((direction % 360) + 360) % 360
  return normalized === 360 ? 0 : normalized
}

const circularDifference = (left: number, right: number): number => {
  const normalizedLeft = normalizeDirection(left)
  const normalizedRight = normalizeDirection(right)
  const direct = Math.abs(normalizedLeft - normalizedRight)
  return Math.min(direct, 360 - direct)
}

const isDirectionAlignedToBin = (direction: number, binStep: number): boolean => {
  const normalized = normalizeDirection(direction)
  const nearestBin = Math.round(normalized / binStep)
  const expectedDirection = normalizeDirection(nearestBin * binStep)
  return circularDifference(normalized, expectedDirection) <= directionTolerance
}

export const windRosePetalSchema = z
  .object({
    direction: z.number().finite().min(0).max(360),
    value: z.number().finite().min(0),
    color: z.string().trim().min(1).optional()
  })
  .strict()

export const windRoseValueSchema = z
  .object({
    petals: z.array(windRosePetalSchema),
    maxValue: z.number().finite().positive()
  })
  .strict()
  .superRefine((value, ctx) => {
    const petalCount = value.petals.length
    if (!windRoseBinSizes.includes(petalCount as (typeof windRoseBinSizes)[number])) {
      ctx.addIssue({
        code: 'custom',
        path: ['petals'],
        message: 'petals must contain exactly 8, 16, or 32 bins'
      })
      return
    }

    const binStep = 360 / petalCount
    const occupiedBins = new Set<number>()

    value.petals.forEach((petal, index) => {
      if (!isDirectionAlignedToBin(petal.direction, binStep)) {
        ctx.addIssue({
          code: 'custom',
          path: ['petals', index, 'direction'],
          message: `direction must align to ${binStep} degree bin increments`
        })
      }

      const normalizedDirection = normalizeDirection(petal.direction)
      const binIndex = Math.round(normalizedDirection / binStep) % petalCount
      if (occupiedBins.has(binIndex)) {
        ctx.addIssue({
          code: 'custom',
          path: ['petals', index, 'direction'],
          message: 'direction bins must be unique'
        })
      }
      occupiedBins.add(binIndex)

      if (petal.value > value.maxValue) {
        ctx.addIssue({
          code: 'custom',
          path: ['petals', index, 'value'],
          message: 'value must be less than or equal to maxValue'
        })
      }
    })

    if (occupiedBins.size !== petalCount) {
      ctx.addIssue({
        code: 'custom',
        path: ['petals'],
        message: 'petals must provide one value for each direction bin'
      })
    }
  })

export const windRoseGradientSchema = z
  .object({
    centerColor: z.string().trim().min(1).default('#f5a68a'),
    edgeColor: z.string().trim().min(1).default('#d6452f'),
    centerAlpha: z.number().finite().min(0).max(1).default(0.25),
    edgeAlpha: z.number().finite().min(0).max(1).default(0.7)
  })
  .strict()

export const windRoseCustomLayerSchema = z
  .object({
    image: windRoseCustomLayerImageSchema.optional(),
    visible: z.boolean().default(true)
  })
  .strict()
  .optional()

export const windRoseStyleSchema = z
  .object({
    frameDesign: gaugeFrameDesignSchema.default('metal'),
    backgroundColor: gaugeBackgroundColorSchema.default('DARK_GRAY'),
    foregroundType: gaugeForegroundTypeSchema.default('type1'),
    knobType: gaugeKnobTypeSchema.default('standardKnob'),
    knobStyle: gaugeKnobStyleSchema.default('silver'),
    pointSymbols: z
      .array(z.string())
      .length(8)
      .default(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']),
    roseGradient: windRoseGradientSchema.default({
      centerColor: '#f5a68a',
      edgeColor: '#d6452f',
      centerAlpha: 0.25,
      edgeAlpha: 0.7
    }),
    showOutline: z.boolean().default(true),
    roseLineColor: z.string().trim().min(1).default('#8d2f1f'),
    customLayer: windRoseCustomLayerSchema
  })
  .strict()

export const windRoseVisibilitySchema = z
  .object({
    showFrame: z.boolean().default(true),
    showBackground: z.boolean().default(true),
    showForeground: z.boolean().default(true),
    showLcd: z.boolean().default(false),
    showPointSymbols: z.boolean().default(true),
    showTickmarks: z.boolean().default(true),
    showDegreeScale: z.boolean().default(false)
  })
  .strict()

export const windRoseGaugeConfigSchema = sharedGaugeConfigSchema
  .extend({
    value: windRoseValueSchema,
    style: windRoseStyleSchema.default({
      frameDesign: 'metal',
      backgroundColor: 'DARK_GRAY',
      foregroundType: 'type1',
      knobType: 'standardKnob',
      knobStyle: 'silver',
      pointSymbols: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
      roseGradient: {
        centerColor: '#f5a68a',
        edgeColor: '#d6452f',
        centerAlpha: 0.25,
        edgeAlpha: 0.7
      },
      showOutline: true,
      roseLineColor: '#8d2f1f'
    }),
    visibility: windRoseVisibilitySchema.default({
      showFrame: true,
      showBackground: true,
      showForeground: true,
      showLcd: false,
      showPointSymbols: true,
      showTickmarks: true,
      showDegreeScale: false
    })
  })
  .strict()

export type WindRosePetal = z.infer<typeof windRosePetalSchema>
export type WindRoseValue = z.infer<typeof windRoseValueSchema>
export type WindRoseGradient = z.infer<typeof windRoseGradientSchema>
export type WindRoseCustomLayer = z.infer<typeof windRoseCustomLayerSchema>
export type WindRoseStyle = z.infer<typeof windRoseStyleSchema>
export type WindRoseVisibility = z.infer<typeof windRoseVisibilitySchema>
export type WindRoseGaugeConfig = z.infer<typeof windRoseGaugeConfigSchema>
