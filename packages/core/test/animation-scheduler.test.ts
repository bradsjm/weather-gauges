import { describe, expect, it, vi } from 'vitest'

import { createAnimationScheduler, createTimeline, sampleTimeline } from '../src/index.js'

describe('timeline primitives', () => {
  it('samples linear transitions deterministically', () => {
    const timeline = createTimeline({
      from: 0,
      to: 100,
      durationMs: 1000,
      easing: 'linear',
      startTimeMs: 100
    })

    expect(sampleTimeline(timeline, 100)).toMatchObject({
      elapsedMs: 0,
      progress: 0,
      easedProgress: 0,
      value: 0,
      done: false
    })

    expect(sampleTimeline(timeline, 600)).toMatchObject({
      elapsedMs: 500,
      progress: 0.5,
      easedProgress: 0.5,
      value: 50,
      done: false
    })

    expect(sampleTimeline(timeline, 1100)).toMatchObject({
      elapsedMs: 1000,
      progress: 1,
      easedProgress: 1,
      value: 100,
      done: true
    })
  })

  it('supports easing and zero-duration timelines', () => {
    const eased = createTimeline({
      from: 0,
      to: 1,
      durationMs: 1000,
      easing: 'easeInOutCubic',
      startTimeMs: 0
    })

    const midpoint = sampleTimeline(eased, 500)
    expect(midpoint.easedProgress).toBeCloseTo(0.5)

    const instant = createTimeline({ from: 10, to: 20, durationMs: 0 })
    expect(sampleTimeline(instant, 0)).toMatchObject({
      progress: 1,
      easedProgress: 1,
      value: 20,
      done: true
    })
  })
})

describe('animation scheduler', () => {
  it('runs updates over time and completes with fake timers', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)

    const scheduler = createAnimationScheduler({ frameMs: 20 })
    const updates: number[] = []
    let completed = false

    scheduler.run({
      from: 0,
      to: 100,
      durationMs: 100,
      easing: 'linear',
      onUpdate: (sample) => {
        updates.push(Math.round(sample.value))
      },
      onComplete: () => {
        completed = true
      }
    })

    expect(updates[0]).toBe(0)

    vi.advanceTimersByTime(40)
    expect(updates).toEqual(expect.arrayContaining([20, 40]))
    expect(completed).toBe(false)

    vi.advanceTimersByTime(60)
    expect(completed).toBe(true)
    expect(updates[updates.length - 1]).toBe(100)

    vi.useRealTimers()
  })

  it('cancels active animations', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)

    const scheduler = createAnimationScheduler({ frameMs: 25 })
    const updates: number[] = []

    const handle = scheduler.run({
      from: 0,
      to: 100,
      durationMs: 200,
      easing: 'linear',
      onUpdate: (sample) => {
        updates.push(Math.round(sample.value))
      }
    })

    vi.advanceTimersByTime(50)
    handle.cancel()
    const countAfterCancel = updates.length

    vi.advanceTimersByTime(500)

    expect(handle.isRunning()).toBe(false)
    expect(updates.length).toBe(countAfterCancel)

    vi.useRealTimers()
  })
})
