import { describe, expect, it, vi } from 'vitest'

import {
  animateLinearGauge,
  linearGaugeConfigSchema,
  renderLinearGauge,
  type LinearDrawContext,
  type LinearGaugeConfig
} from '../src/index.js'

type DrawOp =
  | { kind: 'clearRect'; width: number; height: number }
  | { kind: 'fillRect' }
  | { kind: 'lineTo' }
  | { kind: 'fillText'; text: string }

const createMockContext = () => {
  const operations: DrawOp[] = []

  const context: LinearDrawContext = {
    clearRect: (_x, _y, width, height) => {
      operations.push({ kind: 'clearRect', width, height })
    },
    fillRect: () => {
      operations.push({ kind: 'fillRect' })
    },
    beginPath: () => undefined,
    arc: () => undefined,
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

const createConfig = (current = 50): LinearGaugeConfig => {
  return linearGaugeConfigSchema.parse({
    value: { min: 0, max: 100, current },
    size: { width: 130, height: 280 },
    text: { title: 'Level', unit: '%' },
    scale: { majorTickCount: 6, minorTicksPerMajor: 1, vertical: true },
    segments: [
      { from: 0, to: 65, color: '#0f766e' },
      { from: 65, to: 85, color: '#b45309' },
      { from: 85, to: 100, color: '#b91c1c' }
    ],
    indicators: {
      threshold: { value: 70, show: true },
      alerts: [
        { id: 'warn', value: 75, message: 'warning', severity: 'warning' },
        { id: 'crit', value: 95, message: 'critical', severity: 'critical' }
      ]
    }
  })
}

describe('linear renderer', () => {
  it('renders bars, ticks, threshold, and labels', () => {
    const mock = createMockContext()
    const result = renderLinearGauge(mock.context, createConfig(82))

    expect(result.tone).toBe('warning')
    expect(result.activeAlerts.map((alert) => alert.id)).toEqual(['warn'])
    expect(mock.operations.some((operation) => operation.kind === 'clearRect')).toBe(true)
    expect(
      mock.operations.filter((operation) => operation.kind === 'fillRect').length
    ).toBeGreaterThan(5)
    expect(
      mock.operations.filter((operation) => operation.kind === 'lineTo').length
    ).toBeGreaterThan(5)
    expect(
      mock.operations.some(
        (operation) => operation.kind === 'fillText' && operation.text.includes('Level')
      )
    ).toBe(true)
  })

  it('resolves critical tone for highest alert', () => {
    const mock = createMockContext()
    const result = renderLinearGauge(mock.context, createConfig(99))
    expect(result.tone).toBe('danger')
    expect(result.activeAlerts[0]?.id).toBe('crit')
  })

  it('animates linear values', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)

    const mock = createMockContext()
    const values: number[] = []

    const handle = animateLinearGauge({
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
