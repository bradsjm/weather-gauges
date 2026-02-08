import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { createTickLine, valueToAngle } from '../math/geometry.js'
import { clamp } from '../math/range.js'
import { generateTicks } from '../math/ticks.js'
import {
  drawLegacyCenterKnob,
  drawLegacyRadialBackgroundDark,
  drawLegacyRadialForeground,
  drawLegacyRadialFrameMetal
} from '../render/legacy-materials.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type { RadialAlert, RadialGaugeConfig } from './schema.js'

export type RadialDrawContext = CanvasRenderingContext2D

export type RadialRenderResult = {
  value: number
  tone: 'accent' | 'warning' | 'danger'
  activeAlerts: RadialAlert[]
}

export type RadialRenderOptions = {
  value?: number
  paint?: Partial<ThemePaint>
}

export type RadialAnimationOptions = {
  context: RadialDrawContext
  config: RadialGaugeConfig
  from: number
  to: number
  paint?: Partial<ThemePaint>
  onFrame?: (result: RadialRenderResult) => void
  onComplete?: (result: RadialRenderResult) => void
}

const mergePaint = (paint?: Partial<ThemePaint>): ThemePaint => {
  return {
    ...resolveThemePaint(),
    ...paint
  }
}

const createLinearGradientSafe = (
  context: RadialDrawContext,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fallbackColor: string
): CanvasGradient | string => {
  if (typeof context.createLinearGradient !== 'function') {
    return fallbackColor
  }

  return context.createLinearGradient(x0, y0, x1, y1)
}

const closePathSafe = (context: RadialDrawContext): void => {
  if (typeof context.closePath === 'function') {
    context.closePath()
  }
}

const resolveActiveAlerts = (value: number, alerts: RadialAlert[]): RadialAlert[] => {
  return alerts
    .filter((alert) => value >= alert.value)
    .sort((left, right) => right.value - left.value)
}

const resolveTone = (
  config: RadialGaugeConfig,
  activeAlerts: RadialAlert[]
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

const drawBackground = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  paint: ThemePaint,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  if (config.visibility.showFrame) {
    drawLegacyRadialFrameMetal(context, centerX, centerY, radius)
  }

  if (config.visibility.showBackground) {
    drawLegacyRadialBackgroundDark(context, centerX, centerY, radius)
  }
}

const drawSegments = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  for (const segment of config.segments) {
    const startAngle = valueToAngle(
      segment.from,
      config.value,
      config.scale.startAngle,
      config.scale.endAngle
    )
    const endAngle = valueToAngle(
      segment.to,
      config.value,
      config.scale.startAngle,
      config.scale.endAngle
    )

    context.beginPath()
    context.strokeStyle = segment.color
    context.lineWidth = Math.max(4, radius * 0.06)
    context.arc(centerX, centerY, radius * 0.78, startAngle, endAngle)
    context.stroke()
  }
}

const drawTicks = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  paint: ThemePaint,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const ticks = generateTicks(config.value, {
    majorTickCount: config.scale.majorTickCount,
    minorTicksPerMajor: config.scale.minorTicksPerMajor
  })

  const tickGradient = createLinearGradientSafe(
    context,
    centerX,
    centerY - radius,
    centerX,
    centerY + radius,
    paint.textColor
  )
  if (typeof tickGradient !== 'string') {
    tickGradient.addColorStop(0, 'rgba(255,255,255,0.95)')
    tickGradient.addColorStop(0.45, paint.textColor)
    tickGradient.addColorStop(1, 'rgba(0,0,0,0.65)')
  }
  context.strokeStyle = tickGradient

  for (const tick of ticks) {
    const angle = valueToAngle(
      tick.value,
      config.value,
      config.scale.startAngle,
      config.scale.endAngle
    )
    const isMajor = tick.kind === 'major'
    const line = createTickLine(
      centerX,
      centerY,
      radius * (isMajor ? 0.73 : 0.75),
      radius * 0.79,
      angle
    )

    context.beginPath()
    context.lineWidth = isMajor ? 1.5 : 1
    context.moveTo(line.start.x, line.start.y)
    context.lineTo(line.end.x, line.end.y)
    context.stroke()

    if (isMajor) {
      const labelValue = Math.round(tick.value)
      const labelLine = createTickLine(centerX, centerY, radius * 0.625, radius * 0.625, angle)
      context.fillStyle = paint.textColor
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.font = `600 ${Math.max(8, Math.round(radius * 0.078))}px ${paint.fontFamily}`
      context.fillText(`${labelValue}`, labelLine.start.x, labelLine.start.y)
    }
  }
}

const drawThreshold = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  paint: ThemePaint,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const threshold = config.indicators.threshold
  if (!threshold || !threshold.show) {
    return
  }

  const angle = valueToAngle(
    clamp(threshold.value, config.value.min, config.value.max),
    config.value,
    config.scale.startAngle,
    config.scale.endAngle
  )
  const line = createTickLine(centerX, centerY, radius * 0.56, radius * 0.82, angle)

  context.beginPath()
  context.strokeStyle = paint.warningColor
  context.lineWidth = Math.max(2, radius * 0.013)
  context.moveTo(line.start.x, line.start.y)
  context.lineTo(line.end.x, line.end.y)
  context.stroke()
}

const drawNeedle = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  paint: ThemePaint,
  value: number,
  centerX: number,
  centerY: number,
  radius: number,
  tone: 'accent' | 'warning' | 'danger'
): void => {
  const angle = valueToAngle(value, config.value, config.scale.startAngle, config.scale.endAngle)
  const needleColor =
    tone === 'danger'
      ? paint.dangerColor
      : tone === 'warning'
        ? paint.warningColor
        : paint.accentColor

  if (typeof context.translate === 'function' && typeof context.rotate === 'function') {
    context.save()
    context.translate(centerX, centerY)
    context.rotate(angle + Math.PI / 2)
    context.shadowColor = 'rgba(0,0,0,0.4)'
    context.shadowBlur = radius * 0.025
    context.shadowOffsetY = radius * 0.01

    context.beginPath()
    context.moveTo(0, -radius * 0.56)
    context.lineTo(radius * 0.025, radius * 0.05)
    context.lineTo(0, radius * 0.11)
    context.lineTo(-radius * 0.025, radius * 0.05)
    closePathSafe(context)

    const needleGradient = createLinearGradientSafe(
      context,
      0,
      -radius * 0.56,
      0,
      radius * 0.11,
      needleColor
    )
    if (typeof needleGradient !== 'string') {
      needleGradient.addColorStop(0, needleColor)
      needleGradient.addColorStop(0.6, '#f2f2f2')
      needleGradient.addColorStop(1, '#4f4f4f')
    }
    context.fillStyle = needleGradient
    context.fill()

    context.beginPath()
    context.moveTo(0, -radius * 0.56)
    context.lineTo(radius * 0.025, radius * 0.05)
    context.lineTo(0, radius * 0.11)
    context.lineTo(-radius * 0.025, radius * 0.05)
    closePathSafe(context)
    context.strokeStyle = 'rgba(0,0,0,0.35)'
    context.lineWidth = Math.max(1, radius * 0.005)
    context.stroke()

    context.restore()
  } else {
    const line = createTickLine(centerX, centerY, 0, radius * 0.56, angle)
    context.beginPath()
    context.strokeStyle = needleColor
    context.lineWidth = Math.max(2, radius * 0.016)
    context.moveTo(line.start.x, line.start.y)
    context.lineTo(line.end.x, line.end.y)
    context.stroke()
  }

  drawLegacyCenterKnob(context, centerX, centerY, radius)
}

const drawLabels = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  paint: ThemePaint,
  value: number,
  activeAlerts: RadialAlert[],
  centerX: number,
  centerY: number,
  radius: number
): void => {
  context.fillStyle = paint.textColor
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  const titleSize = Math.max(10, Math.round(radius * 0.085))

  if (config.text.title) {
    context.font = `600 ${titleSize}px ${paint.fontFamily}`
    context.fillText(config.text.title, centerX, centerY - radius * 0.22)
  }

  if (typeof context.fillRect === 'function') {
    const lcdWidth = radius * 0.58
    const lcdHeight = radius * 0.2
    const lcdX = centerX - lcdWidth / 2
    const lcdY = centerY + radius * 0.22
    context.fillStyle = '#b6c0b0'
    context.fillRect(lcdX, lcdY, lcdWidth, lcdHeight)
    context.strokeStyle = 'rgba(20,20,20,0.5)'
    context.lineWidth = Math.max(1, radius * 0.006)
    context.strokeRect(lcdX, lcdY, lcdWidth, lcdHeight)
    context.fillStyle = '#1f2933'
    context.textAlign = 'right'
    context.font = `700 ${Math.max(12, Math.round(radius * 0.14))}px ${paint.fontFamily}`
    context.fillText(`${value.toFixed(2)}`, lcdX + lcdWidth * 0.94, lcdY + lcdHeight * 0.58)
    context.textAlign = 'center'
  } else {
    context.font = `700 ${Math.max(14, Math.round(radius * 0.16))}px ${paint.fontFamily}`
    context.fillText(`${value.toFixed(2)}`, centerX, centerY + radius * 0.32)
  }

  if (activeAlerts.length > 0) {
    const [primaryAlert] = activeAlerts
    if (!primaryAlert) {
      return
    }

    context.font = `500 ${Math.max(9, Math.round(radius * 0.07))}px ${paint.fontFamily}`
    context.fillText(primaryAlert.message, centerX, centerY + radius * 0.46)
  }
}

const drawForeground = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  if (!config.visibility.showForeground) {
    return
  }

  drawLegacyRadialForeground(context, centerX, centerY, radius)
}

export const renderRadialGauge = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  options: RadialRenderOptions = {}
): RadialRenderResult => {
  const paint = mergePaint(options.paint)
  const value = clamp(options.value ?? config.value.current, config.value.min, config.value.max)
  const centerX = config.size.width / 2
  const centerY = config.size.height / 2
  const radius = Math.min(config.size.width, config.size.height) * 0.48
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

  context.clearRect(0, 0, config.size.width, config.size.height)

  drawBackground(context, config, paint, centerX, centerY, radius)
  drawSegments(context, config, centerX, centerY, radius)
  drawTicks(context, config, paint, centerX, centerY, radius)
  drawThreshold(context, config, paint, centerX, centerY, radius)
  drawNeedle(context, config, paint, value, centerX, centerY, radius, tone)
  drawLabels(context, config, paint, value, activeAlerts, centerX, centerY, radius)
  drawForeground(context, config, centerX, centerY, radius)

  return {
    value,
    tone,
    activeAlerts
  }
}

export const animateRadialGauge = (options: RadialAnimationOptions): AnimationRunHandle => {
  const scheduler = createAnimationScheduler()

  const renderWithValue = (value: number): RadialRenderResult => {
    return renderRadialGauge(
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
