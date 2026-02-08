import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { createTickLine, polarToCartesian, valueToAngle } from '../math/geometry.js'
import { clamp } from '../math/range.js'
import {
  drawLegacyCenterKnob,
  drawLegacyCompassRose,
  drawLegacyRadialBackground,
  drawLegacyRadialForeground,
  drawLegacyRadialFrame
} from '../render/legacy-materials.js'
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

const createLinearGradientSafe = (
  context: CompassDrawContext,
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

const closePathSafe = (context: CompassDrawContext): void => {
  if (typeof context.closePath === 'function') {
    context.closePath()
  }
}

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
    drawLegacyRadialFrame(context, centerX, centerY, radius)
  }

  if (config.visibility.showBackground) {
    drawLegacyRadialBackground(context, paint, centerX, centerY, radius)
    drawLegacyCompassRose(context, centerX, centerY, radius)
  }

  const degreeMode = config.rose.showDegreeLabels

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
    tickGradient.addColorStop(0.4, paint.textColor)
    tickGradient.addColorStop(1, 'rgba(0,0,0,0.6)')
  }
  context.strokeStyle = tickGradient

  for (let degree = 0; degree < 360; degree += 2.5) {
    const normalized = degree / 10
    const angle = valueToAngle(normalized, { min: 0, max: 36 }, -Math.PI / 2, (3 * Math.PI) / 2, {
      clampToRange: false
    })
    const major = degreeMode ? degree % 10 === 0 : degree % 5 === 0
    const cardinal = !degreeMode && degree % 45 === 0

    const line = createTickLine(
      centerX,
      centerY,
      radius * (cardinal ? 0.58 : major ? 0.62 : 0.68),
      radius * 0.82,
      angle
    )

    context.beginPath()
    context.lineWidth = cardinal
      ? Math.max(2.4, radius * 0.013)
      : major
        ? Math.max(1.6, radius * 0.009)
        : 1
    context.moveTo(line.start.x, line.start.y)
    context.lineTo(line.end.x, line.end.y)
    context.stroke()
  }

  if (!degreeMode && config.rose.showOrdinalMarkers) {
    const markers = [
      { label: 'N', angle: -Math.PI / 2 },
      { label: 'NE', angle: -Math.PI / 4 },
      { label: 'E', angle: 0 },
      { label: 'SE', angle: Math.PI / 4 },
      { label: 'S', angle: Math.PI / 2 },
      { label: 'SW', angle: (3 * Math.PI) / 4 },
      { label: 'W', angle: Math.PI },
      { label: 'NW', angle: (-3 * Math.PI) / 4 }
    ]

    context.fillStyle = paint.textColor
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = `600 ${Math.max(11, Math.round(radius * 0.11))}px ${paint.fontFamily}`

    for (const marker of markers) {
      const point = polarToCartesian(centerX, centerY, radius * 0.51, marker.angle)
      context.fillText(marker.label, point.x, point.y)
    }
  }

  if (degreeMode) {
    context.fillStyle = paint.textColor
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = `500 ${Math.max(9, Math.round(radius * 0.075))}px ${paint.fontFamily}`
    for (let degree = 0; degree < 360; degree += 10) {
      const angle = (degree * Math.PI) / 180 - Math.PI / 2
      const point = polarToCartesian(centerX, centerY, radius * 0.7, angle)
      context.fillText(`${degree}`, point.x, point.y)
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
  const pointerColor =
    tone === 'danger'
      ? paint.dangerColor
      : tone === 'warning'
        ? paint.warningColor
        : paint.accentColor

  if (
    typeof context.translate === 'function' &&
    typeof context.rotate === 'function' &&
    typeof context.bezierCurveTo === 'function'
  ) {
    const diameter = radius * 2
    const sx = (value: number): number => (value - 0.5) * diameter
    const sy = (value: number): number => (value - 0.5) * diameter

    context.save()
    context.translate(centerX, centerY)
    context.rotate(angle + Math.PI / 2)
    context.shadowColor = 'rgba(0,0,0,0.35)'
    context.shadowBlur = radius * 0.018
    context.shadowOffsetX = radius * 0.006
    context.shadowOffsetY = radius * 0.006

    context.beginPath()
    context.moveTo(sx(0.5), sy(0.15))
    context.bezierCurveTo(sx(0.53), sy(0.33), sx(0.556), sy(0.44), sx(0.556), sy(0.5))
    context.bezierCurveTo(sx(0.535), sy(0.5), sx(0.5), sy(0.5), sx(0.5), sy(0.5))
    context.bezierCurveTo(sx(0.5), sy(0.5), sx(0.466), sy(0.5), sx(0.444), sy(0.5))
    context.bezierCurveTo(sx(0.444), sy(0.44), sx(0.47), sy(0.33), sx(0.5), sy(0.15))
    closePathSafe(context)

    const northGradient = createLinearGradientSafe(
      context,
      sx(0.472),
      sy(0.5),
      sx(0.528),
      sy(0.5),
      pointerColor
    )
    if (typeof northGradient !== 'string') {
      northGradient.addColorStop(0, '#f8f8f8')
      northGradient.addColorStop(0.5, pointerColor)
      northGradient.addColorStop(1, '#9a9a9a')
    }
    context.fillStyle = northGradient
    context.fill()

    context.beginPath()
    context.moveTo(sx(0.5), sy(0.5))
    context.bezierCurveTo(sx(0.52), sy(0.64), sx(0.525), sy(0.74), sx(0.5), sy(0.86))
    context.bezierCurveTo(sx(0.475), sy(0.74), sx(0.48), sy(0.64), sx(0.5), sy(0.5))
    closePathSafe(context)

    const southGradient = createLinearGradientSafe(
      context,
      sx(0.472),
      sy(0.5),
      sx(0.528),
      sy(0.5),
      '#8a8a8a'
    )
    if (typeof southGradient !== 'string') {
      southGradient.addColorStop(0, '#f5f5f5')
      southGradient.addColorStop(0.5, '#c5c5c5')
      southGradient.addColorStop(1, '#8a8a8a')
    }
    context.fillStyle = southGradient
    context.fill()

    context.beginPath()
    context.moveTo(sx(0.5), sy(0.15))
    context.bezierCurveTo(sx(0.53), sy(0.33), sx(0.556), sy(0.44), sx(0.556), sy(0.5))
    context.bezierCurveTo(sx(0.54), sy(0.62), sx(0.53), sy(0.73), sx(0.5), sy(0.86))
    context.bezierCurveTo(sx(0.47), sy(0.73), sx(0.46), sy(0.62), sx(0.444), sy(0.5))
    context.bezierCurveTo(sx(0.444), sy(0.44), sx(0.47), sy(0.33), sx(0.5), sy(0.15))
    closePathSafe(context)
    context.strokeStyle = 'rgba(0,0,0,0.35)'
    context.lineWidth = Math.max(1, radius * 0.004)
    context.stroke()
    context.restore()
  } else {
    const line = createTickLine(centerX, centerY, 0, radius * 0.66, angle)
    context.beginPath()
    context.strokeStyle = pointerColor
    context.lineWidth = Math.max(2, radius * 0.016)
    context.moveTo(line.start.x, line.start.y)
    context.lineTo(line.end.x, line.end.y)
    context.stroke()
  }

  drawLegacyCenterKnob(context, centerX, centerY, radius)
}

const drawLabels = (
  context: CompassDrawContext,
  config: CompassGaugeConfig,
  paint: ThemePaint,
  heading: number,
  _activeAlerts: CompassAlert[],
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

  context.font = `700 ${Math.max(15, Math.round(radius * 0.16))}px ${paint.fontFamily}`
  context.fillText(`${Math.round(heading)}°`, centerX, centerY + radius * 0.3)

  if (config.text.unit) {
    context.font = `500 ${Math.max(9, Math.round(radius * 0.075))}px ${paint.fontFamily}`
    context.fillText(config.text.unit, centerX, centerY + radius * 0.4)
  }
}

const drawForeground = (
  context: CompassDrawContext,
  config: CompassGaugeConfig,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  if (!config.visibility.showForeground) {
    return
  }

  drawLegacyRadialForeground(context, centerX, centerY, radius)
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
  drawForeground(context, config, centerX, centerY, radius)

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
