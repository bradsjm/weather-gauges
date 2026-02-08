import { describe, expect, it } from 'vitest'

import {
  clamp,
  createRange,
  createTickLine,
  generateTicks,
  isWithinRange,
  mapRange,
  normalize,
  polarToCartesian,
  rangeSpan,
  valueToAngle
} from '../src/index.js'

describe('range primitives', () => {
  it('creates valid ranges and computes span', () => {
    const range = createRange(-50, 50)
    expect(range).toEqual({ min: -50, max: 50 })
    expect(rangeSpan(range)).toBe(100)
  })

  it('clamps values at both bounds', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(15, { min: 0, max: 10 })).toBe(10)
    expect(clamp(5, { min: 0, max: 10 })).toBe(5)
  })

  it('normalizes and maps ranges with optional clamping', () => {
    expect(normalize(50, { min: 0, max: 100 })).toBe(0.5)
    expect(normalize(125, { min: 0, max: 100 })).toBe(1)
    expect(normalize(125, { min: 0, max: 100 }, { clampToRange: false })).toBe(1.25)
    expect(mapRange(50, { min: 0, max: 100 }, { min: 0, max: 1 })).toBe(0.5)
  })

  it('evaluates range membership', () => {
    const range = { min: 0, max: 10 }
    expect(isWithinRange(0, range)).toBe(true)
    expect(isWithinRange(10, range)).toBe(true)
    expect(isWithinRange(10, range, { inclusive: false })).toBe(false)
  })

  it('throws actionable errors for invalid ranges', () => {
    expect(() => createRange(10, 10)).toThrowError('range.max must be greater than range.min')
    expect(() => normalize(5, { min: Number.NaN, max: 100 })).toThrowError(
      'range.min must be a finite number'
    )
  })
})

describe('tick primitives', () => {
  it('generates evenly distributed major and minor ticks', () => {
    const ticks = generateTicks(
      { min: 0, max: 100 },
      {
        majorTickCount: 3,
        minorTicksPerMajor: 1
      }
    )

    expect(ticks).toEqual([
      { kind: 'major', value: 0, position: 0 },
      { kind: 'minor', value: 25, position: 0.25 },
      { kind: 'major', value: 50, position: 0.5 },
      { kind: 'minor', value: 75, position: 0.75 },
      { kind: 'major', value: 100, position: 1 }
    ])
  })

  it('supports excluding bound majors', () => {
    const ticks = generateTicks(
      { min: 0, max: 100 },
      {
        majorTickCount: 5,
        includeBounds: false
      }
    )

    expect(ticks).toEqual([
      { kind: 'major', value: 25, position: 0.25 },
      { kind: 'major', value: 50, position: 0.5 },
      { kind: 'major', value: 75, position: 0.75 }
    ])
  })

  it('rejects invalid tick options', () => {
    expect(() => generateTicks({ min: 0, max: 100 }, { majorTickCount: 1 })).toThrowError(
      'majorTickCount must be an integer greater than or equal to 2'
    )
  })
})

describe('geometry primitives', () => {
  it('maps values to angle ranges', () => {
    const angle = valueToAngle(50, { min: 0, max: 100 }, -Math.PI / 2, Math.PI / 2)
    expect(angle).toBe(0)
  })

  it('computes cartesian points from polar coordinates', () => {
    const point = polarToCartesian(10, 20, 5, 0)
    expect(point).toEqual({ x: 15, y: 20 })
  })

  it('creates tick line endpoints', () => {
    const tick = createTickLine(0, 0, 10, 20, Math.PI)
    expect(tick.start.x).toBeCloseTo(-10)
    expect(tick.start.y).toBeCloseTo(0)
    expect(tick.end.x).toBeCloseTo(-20)
    expect(tick.end.y).toBeCloseTo(0)
  })
})
