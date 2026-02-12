import { describe, expect, it } from 'vitest'

import { normalizeCompassHeadingForScale } from '../src/render/compass-scales.js'

describe('normalizeCompassHeadingForScale', () => {
  it('uses 0..360 domain when half scale is disabled', () => {
    expect(normalizeCompassHeadingForScale(0, false)).toBe(0)
    expect(normalizeCompassHeadingForScale(90, false)).toBe(90)
    expect(normalizeCompassHeadingForScale(180, false)).toBe(180)
    expect(normalizeCompassHeadingForScale(359, false)).toBe(359)
    expect(normalizeCompassHeadingForScale(-1, false)).toBe(359)
  })

  it('uses -180..180 domain when half scale is enabled', () => {
    expect(normalizeCompassHeadingForScale(0, true)).toBe(0)
    expect(normalizeCompassHeadingForScale(90, true)).toBe(90)
    expect(normalizeCompassHeadingForScale(180, true)).toBe(180)
    expect(normalizeCompassHeadingForScale(181, true)).toBe(-179)
    expect(normalizeCompassHeadingForScale(270, true)).toBe(-90)
    expect(normalizeCompassHeadingForScale(359, true)).toBe(-1)
  })
})
