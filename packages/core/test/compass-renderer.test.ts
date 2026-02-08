import { describe, expect, it, vi } from 'vitest'

import {
  animateCompassGauge,
  compassGaugeConfigSchema,
  renderCompassGauge,
  type CompassDrawContext,
  type CompassGaugeConfig
} from '../src/index.js'

type DrawOp =
  | { kind: 'clearRect'; width: number; height: number }
  | { kind: 'arc' }
  | { kind: 'lineTo' }
  | { kind: 'fillText'; text: string }

const createMockContext = () => {
  const operations: DrawOp[] = []

  const context: CompassDrawContext = {
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

describe('compass renderer', () => {
  it('renders rose, needle, and heading labels', () => {
    const mock = createMockContext()
    const result = renderCompassGauge(mock.context, createConfig(88))

    expect(result.tone).toBe('warning')
    expect(result.activeAlerts.map((alert) => alert.id)).toEqual(['warn-east'])
    expect(mock.operations.some((operation) => operation.kind === 'clearRect')).toBe(true)
    expect(mock.operations.filter((operation) => operation.kind === 'arc').length).toBeGreaterThan(
      2
    )
    expect(
      mock.operations.filter((operation) => operation.kind === 'lineTo').length
    ).toBeGreaterThan(10)
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
