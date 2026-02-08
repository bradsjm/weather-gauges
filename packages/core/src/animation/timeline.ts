import { clamp } from '../math/range.js'
import { easingSchema } from '../schemas/primitives.js'
import { resolveEasing, type EasingFunction, type EasingName } from './easing.js'

export type TimelineConfig = {
  from: number
  to: number
  durationMs: number
  easing?: EasingName | EasingFunction
  startTimeMs?: number
}

export type Timeline = {
  from: number
  to: number
  durationMs: number
  easing: EasingFunction
  startTimeMs: number
}

export type TimelineSample = {
  elapsedMs: number
  progress: number
  easedProgress: number
  value: number
  done: boolean
}

const assertFiniteNumber = (value: number, label: string): void => {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`)
  }
}

export const createTimeline = (config: TimelineConfig): Timeline => {
  assertFiniteNumber(config.from, 'from')
  assertFiniteNumber(config.to, 'to')
  assertFiniteNumber(config.durationMs, 'durationMs')

  if (config.durationMs < 0) {
    throw new Error('durationMs must be greater than or equal to 0')
  }

  const startTimeMs = config.startTimeMs ?? 0
  assertFiniteNumber(startTimeMs, 'startTimeMs')

  const easingInput = config.easing ?? easingSchema.enum.easeInOutCubic

  return {
    from: config.from,
    to: config.to,
    durationMs: config.durationMs,
    easing: resolveEasing(easingInput),
    startTimeMs
  }
}

export const sampleTimeline = (timeline: Timeline, nowMs: number): TimelineSample => {
  assertFiniteNumber(nowMs, 'nowMs')

  const elapsedMs = Math.max(0, nowMs - timeline.startTimeMs)
  const rawProgress = timeline.durationMs === 0 ? 1 : elapsedMs / timeline.durationMs
  const progress = clamp(rawProgress, 0, 1)
  const easedProgress = clamp(timeline.easing(progress), 0, 1)
  const value = timeline.from + (timeline.to - timeline.from) * easedProgress

  return {
    elapsedMs,
    progress,
    easedProgress,
    value,
    done: progress >= 1
  }
}
