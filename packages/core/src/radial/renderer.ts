import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { createTickLine, valueToAngle } from '../math/geometry.js'
import { clamp } from '../math/range.js'
import { generateTicks } from '../math/ticks.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type { RadialAlert, RadialGaugeConfig } from './schema.js'

export type RadialDrawContext = {
  clearRect: (x: number, y: number, width: number, height: number) => void
  beginPath: () => void
  arc: (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean
  ) => void
  stroke: () => void
  fill: () => void
  moveTo: (x: number, y: number) => void
  lineTo: (x: number, y: number) => void
  save: () => void
  restore: () => void
  fillText: (text: string, x: number, y: number) => void
  strokeStyle: string | CanvasGradient | CanvasPattern
  fillStyle: string | CanvasGradient | CanvasPattern
  lineWidth: number
  font: string
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
}

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
    context.beginPath()
    context.fillStyle = paint.frameColor
    context.arc(centerX, centerY, radius, 0, Math.PI * 2)
    context.fill()
  }

  if (config.visibility.showBackground) {
    context.beginPath()
    context.fillStyle = paint.backgroundColor
    context.arc(centerX, centerY, radius * 0.9, 0, Math.PI * 2)
    context.fill()
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

  context.strokeStyle = paint.textColor

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
      radius * (isMajor ? 0.62 : 0.68),
      radius * 0.78,
      angle
    )

    context.beginPath()
    context.lineWidth = isMajor ? 2 : 1
    context.moveTo(line.start.x, line.start.y)
    context.lineTo(line.end.x, line.end.y)
    context.stroke()
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
  const line = createTickLine(centerX, centerY, radius * 0.55, radius * 0.82, angle)

  context.beginPath()
  context.strokeStyle = paint.warningColor
  context.lineWidth = 3
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
  const line = createTickLine(centerX, centerY, 0, radius * 0.56, angle)

  context.beginPath()
  context.strokeStyle =
    tone === 'danger'
      ? paint.dangerColor
      : tone === 'warning'
        ? paint.warningColor
        : paint.accentColor
  context.lineWidth = 4
  context.moveTo(line.start.x, line.start.y)
  context.lineTo(line.end.x, line.end.y)
  context.stroke()

  context.beginPath()
  context.fillStyle = paint.textColor
  context.arc(centerX, centerY, radius * 0.05, 0, Math.PI * 2)
  context.fill()
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

  const titleSize = Math.max(12, Math.round(radius * 0.12))
  const valueSize = Math.max(16, Math.round(radius * 0.18))

  if (config.text.title) {
    context.font = `600 ${titleSize}px ${paint.fontFamily}`
    context.fillText(config.text.title, centerX, centerY - radius * 0.38)
  }

  context.font = `700 ${valueSize}px ${paint.fontFamily}`
  const unitSuffix = config.text.unit ? ` ${config.text.unit}` : ''
  context.fillText(`${value.toFixed(1)}${unitSuffix}`, centerX, centerY + radius * 0.42)

  if (activeAlerts.length > 0) {
    const [primaryAlert] = activeAlerts
    if (!primaryAlert) {
      return
    }

    context.font = `500 ${Math.max(10, Math.round(radius * 0.09))}px ${paint.fontFamily}`
    context.fillText(primaryAlert.message, centerX, centerY + radius * 0.25)
  }
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
