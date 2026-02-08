import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { createTickLine, polarToCartesian, valueToAngle } from '../math/geometry.js'
import { clamp } from '../math/range.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type { CompassAlert, CompassGaugeConfig } from './schema.js'

import type { RadialDrawContext } from '../radial/renderer.js'

export type CompassDrawContext = RadialDrawContext

export type CompassRenderResult = {
  heading: number
  tone: 'accent' | 'warning' | 'danger'
  activeAlerts: CompassAlert[]
}

export type CompassRenderOptions = {
  heading?: number
  paint?: Partial<ThemePaint>
}

export type CompassAnimationOptions = {
  context: CompassDrawContext
  config: CompassGaugeConfig
  from: number
  to: number
  paint?: Partial<ThemePaint>
  onFrame?: (result: CompassRenderResult) => void
  onComplete?: (result: CompassRenderResult) => void
}

const mergePaint = (paint?: Partial<ThemePaint>): ThemePaint => ({
  ...resolveThemePaint(),
  ...paint
})

const normalizeHeading = (heading: number, min: number, max: number): number => {
  const span = max - min
  if (span <= 0) {
    return heading
  }

  const normalized = (((heading - min) % span) + span) % span
  return min + normalized
}

const resolveActiveAlerts = (heading: number, alerts: CompassAlert[]): CompassAlert[] => {
  const tolerance = 8
  return alerts.filter((alert) => Math.abs(alert.heading - heading) <= tolerance)
}

const resolveTone = (activeAlerts: CompassAlert[]): 'accent' | 'warning' | 'danger' => {
  if (activeAlerts.some((alert) => alert.severity === 'critical')) {
    return 'danger'
  }

  if (activeAlerts.some((alert) => alert.severity === 'warning')) {
    return 'warning'
  }

  return 'accent'
}

const drawRose = (
  context: CompassDrawContext,
  config: CompassGaugeConfig,
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

  context.strokeStyle = paint.textColor

  for (let index = 0; index < 36; index += 1) {
    const isMajor = index % 3 === 0
    const angle = valueToAngle(index, { min: 0, max: 36 }, -Math.PI / 2, (3 * Math.PI) / 2, {
      clampToRange: false
    })
    const line = createTickLine(
      centerX,
      centerY,
      radius * (isMajor ? 0.67 : 0.73),
      radius * 0.82,
      angle
    )

    context.beginPath()
    context.lineWidth = isMajor ? 2 : 1
    context.moveTo(line.start.x, line.start.y)
    context.lineTo(line.end.x, line.end.y)
    context.stroke()
  }

  if (config.rose.showOrdinalMarkers) {
    const markers = [
      { label: 'N', angle: -Math.PI / 2 },
      { label: 'E', angle: 0 },
      { label: 'S', angle: Math.PI / 2 },
      { label: 'W', angle: Math.PI }
    ]

    context.fillStyle = paint.textColor
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = `600 ${Math.max(12, Math.round(radius * 0.14))}px ${paint.fontFamily}`

    for (const marker of markers) {
      const point = polarToCartesian(centerX, centerY, radius * 0.55, marker.angle)
      context.fillText(marker.label, point.x, point.y)
    }
  }
}

const drawNeedle = (
  context: CompassDrawContext,
  config: CompassGaugeConfig,
  paint: ThemePaint,
  heading: number,
  tone: 'accent' | 'warning' | 'danger',
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const angle = valueToAngle(heading, config.heading, -Math.PI / 2, (3 * Math.PI) / 2, {
    clampToRange: false
  })
  const line = createTickLine(centerX, centerY, 0, radius * 0.64, angle)

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
  context: CompassDrawContext,
  config: CompassGaugeConfig,
  paint: ThemePaint,
  heading: number,
  activeAlerts: CompassAlert[],
  centerX: number,
  centerY: number,
  radius: number
): void => {
  context.fillStyle = paint.textColor
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  if (config.text.title) {
    context.font = `600 ${Math.max(12, Math.round(radius * 0.12))}px ${paint.fontFamily}`
    context.fillText(config.text.title, centerX, centerY + radius * 0.44)
  }

  context.font = `700 ${Math.max(16, Math.round(radius * 0.17))}px ${paint.fontFamily}`
  context.fillText(`${Math.round(heading)}°`, centerX, centerY + radius * 0.29)

  const [primaryAlert] = activeAlerts
  if (primaryAlert) {
    context.font = `500 ${Math.max(10, Math.round(radius * 0.09))}px ${paint.fontFamily}`
    context.fillText(primaryAlert.message, centerX, centerY + radius * 0.16)
  }
}

export const renderCompassGauge = (
  context: CompassDrawContext,
  config: CompassGaugeConfig,
  options: CompassRenderOptions = {}
): CompassRenderResult => {
  const paint = mergePaint(options.paint)
  const heading = normalizeHeading(
    clamp(options.heading ?? config.heading.current, config.heading.min, config.heading.max),
    config.heading.min,
    config.heading.max
  )
  const centerX = config.size.width / 2
  const centerY = config.size.height / 2
  const radius = Math.min(config.size.width, config.size.height) * 0.48
  const activeAlerts = resolveActiveAlerts(heading, config.indicators.alerts)
  const tone = resolveTone(activeAlerts)

  context.clearRect(0, 0, config.size.width, config.size.height)
  drawRose(context, config, paint, centerX, centerY, radius)
  drawNeedle(context, config, paint, heading, tone, centerX, centerY, radius)
  drawLabels(context, config, paint, heading, activeAlerts, centerX, centerY, radius)

  return {
    heading,
    tone,
    activeAlerts
  }
}

export const animateCompassGauge = (options: CompassAnimationOptions): AnimationRunHandle => {
  const scheduler = createAnimationScheduler()

  const renderWithHeading = (heading: number): CompassRenderResult => {
    return renderCompassGauge(
      options.context,
      options.config,
      options.paint ? { heading, paint: options.paint } : { heading }
    )
  }

  return scheduler.run({
    from: options.from,
    to: options.to,
    durationMs: options.config.animation.enabled ? options.config.animation.durationMs : 0,
    easing: options.config.animation.easing,
    onUpdate: (sample) => {
      const result = renderWithHeading(sample.value)
      options.onFrame?.(result)
    },
    onComplete: () => {
      const result = renderWithHeading(options.to)
      options.onComplete?.(result)
    }
  })
}
