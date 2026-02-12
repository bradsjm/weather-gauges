import { describe, expect, it } from 'vitest'

import { normalizeAngle360, normalizeAngleInRange } from '../src/render/gauge-angles.js'

describe('gauge angle normalization', () => {
  it('normalizes angles to 0..360', () => {
    expect(normalizeAngle360(0)).toBe(0)
    expect(normalizeAngle360(360)).toBe(0)
    expect(normalizeAngle360(721)).toBe(1)
    expect(normalizeAngle360(-1)).toBe(359)
  })

  it('normalizes angles to an arbitrary wrapped range', () => {
    expect(normalizeAngleInRange(360, 0, 360)).toBe(0)
    expect(normalizeAngleInRange(-10, 0, 360)).toBe(350)
    expect(normalizeAngleInRange(181, -180, 180)).toBe(-179)
    expect(normalizeAngleInRange(-181, -180, 180)).toBe(179)
  })
})
