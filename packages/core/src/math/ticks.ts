import { createRange, normalize, type NumericRange } from './range.js'

export type TickKind = 'major' | 'minor'

export type Tick = {
  value: number
  position: number
  kind: TickKind
}

export type TickGenerationOptions = {
  majorTickCount: number
  minorTicksPerMajor?: number
  includeBounds?: boolean
}

const assertTickOptions = (options: TickGenerationOptions): void => {
  if (!Number.isInteger(options.majorTickCount) || options.majorTickCount < 2) {
    throw new Error('majorTickCount must be an integer greater than or equal to 2')
  }

  if (
    options.minorTicksPerMajor !== undefined &&
    (!Number.isInteger(options.minorTicksPerMajor) || options.minorTicksPerMajor < 0)
  ) {
    throw new Error('minorTicksPerMajor must be an integer greater than or equal to 0')
  }
}

const shouldIncludeMajorTick = (
  index: number,
  lastIndex: number,
  includeBounds: boolean
): boolean => {
  if (includeBounds) {
    return true
  }

  return index > 0 && index < lastIndex
}

export const generateTicks = (range: NumericRange, options: TickGenerationOptions): Tick[] => {
  createRange(range.min, range.max)
  assertTickOptions(options)

  const majorTickCount = options.majorTickCount
  const minorTicksPerMajor = options.minorTicksPerMajor ?? 0
  const includeBounds = options.includeBounds !== false

  const majorStep = (range.max - range.min) / (majorTickCount - 1)
  const ticks: Tick[] = []

  for (let majorIndex = 0; majorIndex < majorTickCount; majorIndex += 1) {
    const majorValue = range.min + majorStep * majorIndex

    if (shouldIncludeMajorTick(majorIndex, majorTickCount - 1, includeBounds)) {
      ticks.push({
        kind: 'major',
        value: majorValue,
        position: normalize(majorValue, range, { clampToRange: false })
      })
    }

    if (majorIndex === majorTickCount - 1 || minorTicksPerMajor === 0) {
      continue
    }

    const minorStep = majorStep / (minorTicksPerMajor + 1)

    for (let minorIndex = 1; minorIndex <= minorTicksPerMajor; minorIndex += 1) {
      const minorValue = majorValue + minorStep * minorIndex
      ticks.push({
        kind: 'minor',
        value: minorValue,
        position: normalize(minorValue, range, { clampToRange: false })
      })
    }
  }

  return ticks
}
