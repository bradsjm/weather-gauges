import { describe, expect, it, vi } from 'vitest'

import {
  animateCompassGauge,
  renderCompassGauge,
  type CompassDrawContext
} from '../src/compass/renderer.js'
import { compassGaugeConfigSchema, type CompassGaugeConfig } from '../src/compass/schema.js'

type DrawOp =
  | { kind: 'clearRect'; width: number; height: number }
  | { kind: 'arc' }
  | { kind: 'lineTo' }
  | { kind: 'translate'; x: number; y: number }
  | { kind: 'rotate'; angle: number }
  | { kind: 'fillText'; text: string }

const createMockContext = () => {
  const operations: DrawOp[] = []

  const context = {
    clearRect: (_x, _y, width, height) => {
      operations.push({ kind: 'clearRect', width, height })
    },
    beginPath: () => undefined,
    arc: () => {
      operations.push({ kind: 'arc' })
    },
    stroke: () => undefined,
    fill: () => undefined,
    moveTo: () => undefined,
    bezierCurveTo: () => undefined,
    lineTo: () => {
      operations.push({ kind: 'lineTo' })
    },
    closePath: () => undefined,
    save: () => undefined,
    restore: () => undefined,
    translate: (x, y) => {
      operations.push({ kind: 'translate', x, y })
    },
    rotate: (angle) => {
      operations.push({ kind: 'rotate', angle })
    },
    fillText: (text) => {
      operations.push({ kind: 'fillText', text })
    },
    strokeStyle: '#000000',
    fillStyle: '#000000',
    lineWidth: 1,
    font: '12px system-ui',
    textAlign: 'center',
    textBaseline: 'middle'
  } as unknown as CompassDrawContext

  return {
    context,
    operations
  }
}

const createConfig = (current = 45): CompassGaugeConfig => {
  return compassGaugeConfigSchema.parse({
    heading: { min: 0, max: 360, current },
    size: { width: 240, height: 240 },
    text: { title: 'Heading', unit: 'deg' },
    indicators: {
      alerts: [
        { id: 'warn-east', heading: 90, message: 'east wind', severity: 'warning' },
        { id: 'crit-south', heading: 180, message: 'storm', severity: 'critical' }
      ]
    }
  })
}

const getRenderedTexts = (operations: DrawOp[]): string[] => {
  return operations
    .filter(
      (operation): operation is Extract<DrawOp, { kind: 'fillText' }> =>
        operation.kind === 'fillText'
    )
    .map((operation) => operation.text)
}

const hasRotateNear = (operations: DrawOp[], target: number, tolerance = 0.0001): boolean => {
  return operations.some((operation) => {
    if (operation.kind !== 'rotate') {
      return false
    }

    return Math.abs(operation.angle - target) <= tolerance
  })
}

const firstOperationIndex = (
  operations: DrawOp[],
  predicate: (operation: DrawOp) => boolean
): number => {
  return operations.findIndex(predicate)
}

describe('compass renderer', () => {
  it('renders rose, needle, and heading labels', () => {
    const mock = createMockContext()
    const result = renderCompassGauge(mock.context, createConfig(88), {
      showHeadingReadout: true
    })

    expect(result.tone).toBe('warning')
    expect(result.activeAlerts.map((alert) => alert.id)).toEqual(['warn-east'])
    expect(mock.operations.some((operation) => operation.kind === 'clearRect')).toBe(true)
    expect(mock.operations.filter((operation) => operation.kind === 'arc').length).toBeGreaterThan(
      2
    )
    expect(
      mock.operations.filter((operation) => operation.kind === 'lineTo').length
    ).toBeGreaterThan(0)
    expect(
      mock.operations.some(
        (operation) => operation.kind === 'fillText' && operation.text.includes('Heading')
      )
    ).toBe(true)
  })

  it('resolves critical alert tone', () => {
    const mock = createMockContext()
    const result = renderCompassGauge(mock.context, createConfig(178))
    expect(result.tone).toBe('danger')
    expect(result.activeAlerts[0]?.id).toBe('crit-south')
  })

  it('renders heading readout only when enabled', () => {
    const withReadout = createMockContext()
    renderCompassGauge(withReadout.context, createConfig(88), { showHeadingReadout: true })

    const withoutReadout = createMockContext()
    renderCompassGauge(withoutReadout.context, createConfig(88), { showHeadingReadout: false })

    const readoutTexts = getRenderedTexts(withReadout.operations)
    const noReadoutTexts = getRenderedTexts(withoutReadout.operations)

    expect(readoutTexts).toContain('Heading')
    expect(readoutTexts).toContain('deg')
    expect(noReadoutTexts).not.toContain('Heading')
    expect(noReadoutTexts).not.toContain('deg')
  })

  it('respects point symbol visibility', () => {
    const baseConfig = createConfig(45)

    const withSymbols = createMockContext()
    renderCompassGauge(
      withSymbols.context,
      compassGaugeConfigSchema.parse({
        ...baseConfig,
        rose: { showDegreeLabels: false, showOrdinalMarkers: true },
        style: {
          ...baseConfig.style,
          degreeScale: false,
          pointSymbolsVisible: true
        }
      })
    )

    const withoutSymbols = createMockContext()
    renderCompassGauge(
      withoutSymbols.context,
      compassGaugeConfigSchema.parse({
        ...baseConfig,
        rose: { showDegreeLabels: false, showOrdinalMarkers: true },
        style: {
          ...baseConfig.style,
          degreeScale: false,
          pointSymbolsVisible: false
        }
      })
    )

    const symbolTexts = getRenderedTexts(withSymbols.operations)
    const hiddenSymbolTexts = getRenderedTexts(withoutSymbols.operations)

    expect(symbolTexts).toContain('N')
    expect(symbolTexts).toContain('E')
    expect(hiddenSymbolTexts).not.toContain('N')
    expect(hiddenSymbolTexts).not.toContain('E')
  })

  it('renders numeric labels when degree scale is enabled', () => {
    const baseConfig = createConfig(45)

    const degreeScaleMock = createMockContext()
    renderCompassGauge(
      degreeScaleMock.context,
      compassGaugeConfigSchema.parse({
        ...baseConfig,
        rose: { showDegreeLabels: true, showOrdinalMarkers: true },
        style: {
          ...baseConfig.style,
          degreeScale: true,
          pointSymbolsVisible: true
        }
      })
    )

    const texts = getRenderedTexts(degreeScaleMock.operations)
    expect(texts.some((text) => /^\d{1,3}$/.test(text))).toBe(true)
  })

  it('applies opposite-face rotation when rotateFace is enabled', () => {
    const heading = 90
    const radFactor = Math.PI / 180
    const baseConfig = createConfig(heading)

    const rotateFaceOn = createMockContext()
    renderCompassGauge(
      rotateFaceOn.context,
      compassGaugeConfigSchema.parse({
        ...baseConfig,
        style: {
          ...baseConfig.style,
          rotateFace: true
        }
      })
    )

    const rotateFaceOff = createMockContext()
    renderCompassGauge(
      rotateFaceOff.context,
      compassGaugeConfigSchema.parse({
        ...baseConfig,
        style: {
          ...baseConfig.style,
          rotateFace: false
        }
      })
    )

    expect(hasRotateNear(rotateFaceOn.operations, -(heading * radFactor))).toBe(true)
    expect(hasRotateNear(rotateFaceOff.operations, -(heading * radFactor))).toBe(false)

    const firstNorthSymbolOn = firstOperationIndex(
      rotateFaceOn.operations,
      (operation) => operation.kind === 'fillText' && operation.text === 'N'
    )
    const firstNorthSymbolOff = firstOperationIndex(
      rotateFaceOff.operations,
      (operation) => operation.kind === 'fillText' && operation.text === 'N'
    )
    const firstNegativeRotateOn = firstOperationIndex(
      rotateFaceOn.operations,
      (operation) => operation.kind === 'rotate' && operation.angle < 0
    )
    const firstNegativeRotateOff = firstOperationIndex(
      rotateFaceOff.operations,
      (operation) => operation.kind === 'rotate' && operation.angle < 0
    )

    expect(firstNorthSymbolOn).toBeGreaterThan(-1)
    expect(firstNorthSymbolOff).toBeGreaterThan(-1)
    expect(firstNegativeRotateOn).toBeGreaterThan(-1)
    expect(firstNegativeRotateOn).toBeLessThan(firstNorthSymbolOn)
    expect(firstNegativeRotateOff).toBe(-1)
  })

  it('keeps pointer fixed when rotateFace is enabled', () => {
    const heading = 37
    const radFactor = Math.PI / 180
    const baseConfig = createConfig(heading)

    const rotateFaceOn = createMockContext()
    renderCompassGauge(
      rotateFaceOn.context,
      compassGaugeConfigSchema.parse({
        ...baseConfig,
        style: {
          ...baseConfig.style,
          rotateFace: true,
          roseVisible: false
        }
      })
    )

    const rotateFaceOff = createMockContext()
    renderCompassGauge(
      rotateFaceOff.context,
      compassGaugeConfigSchema.parse({
        ...baseConfig,
        style: {
          ...baseConfig.style,
          rotateFace: false,
          roseVisible: false
        }
      })
    )

    expect(hasRotateNear(rotateFaceOn.operations, heading * radFactor)).toBe(false)
    expect(hasRotateNear(rotateFaceOff.operations, heading * radFactor)).toBe(true)
    expect(hasRotateNear(rotateFaceOn.operations, -(heading * radFactor))).toBe(true)
  })

  it('animates compass heading', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)

    const mock = createMockContext()
    const headings: number[] = []

    const handle = animateCompassGauge({
      context: mock.context,
      config: createConfig(30),
      from: 30,
      to: 210,
      onFrame: (frame) => {
        headings.push(Math.round(frame.heading))
      }
    })

    vi.advanceTimersByTime(700)
    expect(headings[0]).toBe(30)
    expect(headings[headings.length - 1]).toBe(210)
    expect(handle.isRunning()).toBe(false)

    vi.useRealTimers()
  })
})
