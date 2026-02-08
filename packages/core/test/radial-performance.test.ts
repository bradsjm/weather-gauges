import { performance } from 'node:perf_hooks'

import { describe, expect, it } from 'vitest'

import { radialGaugeConfigSchema, renderRadialGauge, type RadialDrawContext } from '../src/index.js'

const PERFORMANCE_BUDGET_MS = {
  averageFrame: 12,
  p95Frame: 20
} as const

const createNoopContext = (): RadialDrawContext => {
  return {
    clearRect: () => undefined,
    beginPath: () => undefined,
    arc: () => undefined,
    stroke: () => undefined,
    fill: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    save: () => undefined,
    restore: () => undefined,
    fillText: () => undefined,
    strokeStyle: '#000000',
    fillStyle: '#000000',
    lineWidth: 1,
    font: '12px system-ui',
    textAlign: 'center',
    textBaseline: 'middle'
  }
}

const p95 = (values: number[]): number => {
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.floor(sorted.length * 0.95)
  return sorted[Math.min(index, sorted.length - 1)] ?? 0
}

describe('radial performance budget', () => {
  it('stays within frame budget for repeated renders', () => {
    const context = createNoopContext()
    const baseConfig = radialGaugeConfigSchema.parse({
      value: { min: 0, max: 100, current: 0 },
      size: { width: 240, height: 240 },
      text: { title: 'Load', unit: '%' },
      indicators: {
        threshold: { value: 75, show: true },
        alerts: [
          { id: 'warn', value: 75, message: 'warning', severity: 'warning' },
          { id: 'crit', value: 95, message: 'critical', severity: 'critical' }
        ]
      },
      segments: [
        { from: 0, to: 75, color: '#0f766e' },
        { from: 75, to: 95, color: '#b45309' },
        { from: 95, to: 100, color: '#b91c1c' }
      ]
    })

    const frameTimes: number[] = []

    for (let index = 0; index < 500; index += 1) {
      const value = (index * 7) % 101
      const start = performance.now()
      renderRadialGauge(context, {
        ...baseConfig,
        value: {
          ...baseConfig.value,
          current: value
        }
      })
      frameTimes.push(performance.now() - start)
    }

    const average = frameTimes.reduce((sum, next) => sum + next, 0) / frameTimes.length
    const p95Frame = p95(frameTimes)

    expect(average).toBeLessThan(PERFORMANCE_BUDGET_MS.averageFrame)
    expect(p95Frame).toBeLessThan(PERFORMANCE_BUDGET_MS.p95Frame)
  })
})
