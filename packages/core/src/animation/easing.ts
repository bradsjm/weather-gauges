import type { z } from 'zod'

import { easingSchema } from '../schemas/primitives.js'

export type EasingName = z.infer<typeof easingSchema>

export type EasingFunction = (progress: number) => number

const clampUnit = (value: number): number => {
  if (value <= 0) {
    return 0
  }

  if (value >= 1) {
    return 1
  }

  return value
}

export const linearEasing: EasingFunction = (progress) => clampUnit(progress)

export const easeInOutCubicEasing: EasingFunction = (progress) => {
  const t = clampUnit(progress)
  if (t < 0.5) {
    return 4 * t * t * t
  }

  return 1 - Math.pow(-2 * t + 2, 3) / 2
}

export const easingFunctions: Record<EasingName, EasingFunction> = {
  linear: linearEasing,
  easeInOutCubic: easeInOutCubicEasing
}

export const resolveEasing = (easing: EasingName | EasingFunction): EasingFunction => {
  if (typeof easing === 'function') {
    return easing
  }

  return easingFunctions[easingSchema.parse(easing)]
}
