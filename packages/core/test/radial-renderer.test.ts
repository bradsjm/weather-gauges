import { describe, expect, it, vi } from 'vitest'

import {
  animateRadialGauge,
  radialGaugeConfigSchema,
  renderRadialGauge,
  type RadialDrawContext,
  type RadialGaugeConfig
} from '../src/index.js'

type DrawOp =
  | { kind: 'clearRect'; width: number; height: number }
  | { kind: 'arc' }
  | { kind: 'lineTo' }
  | { kind: 'fillText'; text: string }

const createMockContext = () => {
  const operations: DrawOp[] = []

  const context: RadialDrawContext = {
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
    lineTo: () => {
      operations.push({ kind: 'lineTo' })
    },
    save: () => undefined,
    restore: () => undefined,
    fillText: (text) => {
      operations.push({ kind: 'fillText', text })
    },
    strokeStyle: '#000000',
    fillStyle: '#000000',
    lineWidth: 1,
    font: '12px system-ui',
    textAlign: 'center',
    textBaseline: 'middle'
  }

  return {
    context,
    operations
  }
}

const createConfig = (current = 50): RadialGaugeConfig => {
  return radialGaugeConfigSchema.parse({
    value: { min: 0, max: 100, current },
    size: { width: 240, height: 240 },
    text: { title: 'Pressure', unit: 'psi' },
    scale: { startAngle: -2, endAngle: 2, majorTickCount: 5, minorTicksPerMajor: 1 },
    segments: [
      { from: 0, to: 60, color: '#0f766e' },
      { from: 60, to: 90, color: '#b45309' },
      { from: 90, to: 100, color: '#b91c1c' }
    ],
    indicators: {
      threshold: { value: 80, show: true },
      alerts: [
        { id: 'warn', value: 75, message: 'warning', severity: 'warning' },
        { id: 'crit', value: 95, message: 'critical', severity: 'critical' }
      ]
    }
  })
}

describe('radial renderer', () => {
  it('renders ticks, segments, threshold, and labels', () => {
    const mock = createMockContext()
    const result = renderRadialGauge(mock.context, createConfig(82))

    expect(result.tone).toBe('warning')
    expect(result.activeAlerts.map((alert) => alert.id)).toEqual(['warn'])
    expect(mock.operations.some((operation) => operation.kind === 'clearRect')).toBe(true)
    expect(mock.operations.filter((operation) => operation.kind === 'arc').length).toBeGreaterThan(
      5
    )
    expect(
      mock.operations.filter((operation) => operation.kind === 'lineTo').length
    ).toBeGreaterThan(5)
    expect(
      mock.operations.some(
        (operation) => operation.kind === 'fillText' && operation.text.includes('Pressure')
      )
    ).toBe(true)
  })

  it('resolves critical alert tone', () => {
    const mock = createMockContext()
    const result = renderRadialGauge(mock.context, createConfig(99))
    expect(result.tone).toBe('danger')
    expect(result.activeAlerts[0]?.id).toBe('crit')
  })

  it('animates radial value using scheduler', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)

    const mock = createMockContext()
    const values: number[] = []

    const handle = animateRadialGauge({
      context: mock.context,
      config: createConfig(20),
      from: 20,
      to: 80,
      onFrame: (frame) => {
        values.push(Math.round(frame.value))
      }
    })

    vi.advanceTimersByTime(700)
    expect(values[0]).toBe(20)
    expect(values[values.length - 1]).toBe(80)
    expect(handle.isRunning()).toBe(false)

    vi.useRealTimers()
  })
})
