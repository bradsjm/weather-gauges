import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { clamp, mapRange } from '../math/range.js'
import { generateTicks } from '../math/ticks.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type { LinearAlert, LinearGaugeConfig } from './schema.js'

import type { RadialDrawContext } from '../radial/renderer.js'

export type LinearDrawContext = RadialDrawContext & {
  fillRect: (x: number, y: number, width: number, height: number) => void
}

export type LinearRenderResult = {
  value: number
  tone: 'accent' | 'warning' | 'danger'
  activeAlerts: LinearAlert[]
}

export type LinearRenderOptions = {
  value?: number
  paint?: Partial<ThemePaint>
}

export type LinearAnimationOptions = {
  context: LinearDrawContext
  config: LinearGaugeConfig
  from: number
  to: number
  paint?: Partial<ThemePaint>
  onFrame?: (result: LinearRenderResult) => void
  onComplete?: (result: LinearRenderResult) => void
}

const mergePaint = (paint?: Partial<ThemePaint>): ThemePaint => ({
  ...resolveThemePaint(),
  ...paint
})

const resolveActiveAlerts = (value: number, alerts: LinearAlert[]): LinearAlert[] => {
  return alerts
    .filter((alert) => value >= alert.value)
    .sort((left, right) => right.value - left.value)
}

const resolveTone = (
  config: LinearGaugeConfig,
  activeAlerts: LinearAlert[]
): 'accent' | 'warning' | 'danger' => {
  if (activeAlerts.some((alert) => alert.severity === 'critical')) {
    return 'danger'
  }

  if (activeAlerts.some((alert) => alert.severity === 'warning')) {
    return 'warning'
  }

  const threshold = config.indicators.threshold
  if (threshold && threshold.show && config.value.current >= threshold.value) {
    return 'warning'
  }

  return 'accent'
}

const drawFrame = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  paint: ThemePaint,
  width: number,
  height: number
): void => {
  if (config.visibility.showFrame) {
    context.fillStyle = paint.frameColor
    context.fillRect(0, 0, width, height)
  }

  if (config.visibility.showBackground) {
    context.fillStyle = paint.backgroundColor
    context.fillRect(width * 0.05, height * 0.05, width * 0.9, height * 0.9)
  }
}

const drawSegments = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  width: number,
  height: number
): void => {
  const innerX = width * 0.24
  const innerY = height * 0.12
  const innerWidth = width * 0.52
  const innerHeight = height * 0.76

  for (const segment of config.segments) {
    const startUnit = mapRange(segment.from, config.value, { min: 0, max: 1 }, { clampInput: true })
    const endUnit = mapRange(segment.to, config.value, { min: 0, max: 1 }, { clampInput: true })

    context.fillStyle = segment.color
    if (config.scale.vertical) {
      const segmentTop = innerY + innerHeight * (1 - endUnit)
      const segmentHeight = innerHeight * (endUnit - startUnit)
      context.fillRect(innerX, segmentTop, innerWidth, segmentHeight)
    } else {
      const segmentLeft = innerX + innerWidth * startUnit
      const segmentWidth = innerWidth * (endUnit - startUnit)
      context.fillRect(segmentLeft, innerY, segmentWidth, innerHeight)
    }
  }
}

const drawTicks = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  paint: ThemePaint,
  width: number,
  height: number
): void => {
  const ticks = generateTicks(config.value, {
    majorTickCount: config.scale.majorTickCount,
    minorTicksPerMajor: config.scale.minorTicksPerMajor
  })

  context.strokeStyle = paint.textColor

  for (const tick of ticks) {
    const isMajor = tick.kind === 'major'
    context.beginPath()
    context.lineWidth = isMajor ? 2 : 1

    if (config.scale.vertical) {
      const y = height * 0.88 - tick.position * height * 0.76
      context.moveTo(width * 0.8, y)
      context.lineTo(width * (isMajor ? 0.95 : 0.9), y)
    } else {
      const x = width * 0.12 + tick.position * width * 0.76
      context.moveTo(x, height * 0.8)
      context.lineTo(x, height * (isMajor ? 0.95 : 0.9))
    }

    context.stroke()
  }
}

const drawThreshold = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  paint: ThemePaint,
  width: number,
  height: number
): void => {
  const threshold = config.indicators.threshold
  if (!threshold || !threshold.show) {
    return
  }

  const thresholdUnit = mapRange(
    clamp(threshold.value, config.value.min, config.value.max),
    config.value,
    { min: 0, max: 1 },
    { clampInput: true }
  )

  context.strokeStyle = paint.warningColor
  context.lineWidth = 3
  context.beginPath()

  if (config.scale.vertical) {
    const y = height * 0.88 - thresholdUnit * height * 0.76
    context.moveTo(width * 0.08, y)
    context.lineTo(width * 0.92, y)
  } else {
    const x = width * 0.12 + thresholdUnit * width * 0.76
    context.moveTo(x, height * 0.08)
    context.lineTo(x, height * 0.92)
  }

  context.stroke()
}

const drawPointer = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  paint: ThemePaint,
  value: number,
  tone: 'accent' | 'warning' | 'danger',
  width: number,
  height: number
): void => {
  const pointerUnit = mapRange(value, config.value, { min: 0, max: 1 }, { clampInput: true })
  context.fillStyle =
    tone === 'danger'
      ? paint.dangerColor
      : tone === 'warning'
        ? paint.warningColor
        : paint.accentColor

  if (config.scale.vertical) {
    const y = height * 0.88 - pointerUnit * height * 0.76
    context.fillRect(width * 0.24, y - 4, width * 0.52, 8)
  } else {
    const x = width * 0.12 + pointerUnit * width * 0.76
    context.fillRect(x - 4, height * 0.24, 8, height * 0.52)
  }
}

const drawLabels = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  paint: ThemePaint,
  value: number,
  activeAlerts: LinearAlert[],
  width: number,
  height: number
): void => {
  context.fillStyle = paint.textColor
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  if (config.text.title) {
    context.font = `600 ${Math.max(11, Math.round(width * 0.09))}px ${paint.fontFamily}`
    context.fillText(config.text.title, width / 2, height * 0.08)
  }

  context.font = `700 ${Math.max(12, Math.round(width * 0.11))}px ${paint.fontFamily}`
  const unitSuffix = config.text.unit ? ` ${config.text.unit}` : ''
  context.fillText(`${value.toFixed(1)}${unitSuffix}`, width / 2, height * 0.94)

  const [primaryAlert] = activeAlerts
  if (primaryAlert) {
    context.font = `500 ${Math.max(10, Math.round(width * 0.075))}px ${paint.fontFamily}`
    context.fillText(primaryAlert.message, width / 2, height * 0.18)
  }
}

export const renderLinearGauge = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  options: LinearRenderOptions = {}
): LinearRenderResult => {
  const paint = mergePaint(options.paint)
  const value = clamp(options.value ?? config.value.current, config.value.min, config.value.max)
  const width = config.size.width
  const height = config.size.height
  const activeAlerts = resolveActiveAlerts(value, config.indicators.alerts)
  const tone = resolveTone(
    {
      ...config,
      value: {
        ...config.value,
        current: value
      }
    },
    activeAlerts
  )

  context.clearRect(0, 0, width, height)
  drawFrame(context, config, paint, width, height)
  drawSegments(context, config, width, height)
  drawTicks(context, config, paint, width, height)
  drawThreshold(context, config, paint, width, height)
  drawPointer(context, config, paint, value, tone, width, height)
  drawLabels(context, config, paint, value, activeAlerts, width, height)

  return {
    value,
    tone,
    activeAlerts
  }
}

export const animateLinearGauge = (options: LinearAnimationOptions): AnimationRunHandle => {
  const scheduler = createAnimationScheduler()

  const renderWithValue = (value: number): LinearRenderResult => {
    return renderLinearGauge(
      options.context,
      options.config,
      options.paint ? { value, paint: options.paint } : { value }
    )
  }

  return scheduler.run({
    from: options.from,
    to: options.to,
    durationMs: options.config.animation.enabled ? options.config.animation.durationMs : 0,
    easing: options.config.animation.easing,
    onUpdate: (sample) => {
      const result = renderWithValue(sample.value)
      options.onFrame?.(result)
    },
    onComplete: () => {
      const result = renderWithValue(options.to)
      options.onComplete?.(result)
    }
  })
}
