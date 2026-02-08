import {
  createTimeline,
  sampleTimeline,
  type TimelineConfig,
  type TimelineSample
} from './timeline.js'

export type AnimationRunConfig = TimelineConfig & {
  onUpdate: (sample: TimelineSample) => void
  onComplete?: (sample: TimelineSample) => void
}

export type AnimationRunHandle = {
  cancel: () => void
  isRunning: () => boolean
  latest: () => TimelineSample
}

type TimerHandle = ReturnType<typeof setTimeout>

type SchedulerClock = {
  now: () => number
  setTimeout: (fn: () => void, delayMs: number) => TimerHandle
  clearTimeout: (handle: TimerHandle) => void
}

export type AnimationSchedulerOptions = {
  frameMs?: number
  clock?: SchedulerClock
}

const defaultClock: SchedulerClock = {
  now: () => Date.now(),
  setTimeout: (fn, delayMs) => setTimeout(fn, delayMs),
  clearTimeout: (handle) => clearTimeout(handle)
}

export const createAnimationScheduler = (
  options: AnimationSchedulerOptions = {}
): {
  run: (config: AnimationRunConfig) => AnimationRunHandle
} => {
  const frameMs = options.frameMs ?? 16
  const clock = options.clock ?? defaultClock

  if (!Number.isFinite(frameMs) || frameMs <= 0) {
    throw new Error('frameMs must be a finite number greater than 0')
  }

  const run = (config: AnimationRunConfig): AnimationRunHandle => {
    const timeline = createTimeline({ ...config, startTimeMs: clock.now() })
    let timer: TimerHandle | undefined
    let running = true
    let latest = sampleTimeline(timeline, timeline.startTimeMs)

    const finalize = (): void => {
      running = false
      if (timer !== undefined) {
        clock.clearTimeout(timer)
        timer = undefined
      }
    }

    const tick = (): void => {
      latest = sampleTimeline(timeline, clock.now())
      config.onUpdate(latest)

      if (latest.done) {
        finalize()
        config.onComplete?.(latest)
        return
      }

      timer = clock.setTimeout(tick, frameMs)
    }

    config.onUpdate(latest)

    if (latest.done) {
      finalize()
      config.onComplete?.(latest)
    } else {
      timer = clock.setTimeout(tick, frameMs)
    }

    return {
      cancel: () => {
        finalize()
      },
      isRunning: () => running,
      latest: () => latest
    }
  }

  return { run }
}
