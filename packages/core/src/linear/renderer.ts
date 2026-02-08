import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { clamp, mapRange } from '../math/range.js'
import { generateTicks } from '../math/ticks.js'
import { drawLegacyLinearBackground, drawLegacyLinearFrame } from '../render/legacy-materials.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type { LinearAlert, LinearGaugeConfig } from './schema.js'

import type { RadialDrawContext } from '../radial/renderer.js'

export type LinearDrawContext = RadialDrawContext

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

const createLinearGradientSafe = (
  context: LinearDrawContext,
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
): { innerX: number; innerY: number; innerWidth: number; innerHeight: number } => {
  const fallbackFrameWidth = Math.ceil(
    Math.min(
      0.04 * Math.sqrt(width * width + height * height),
      0.1 * (config.scale.vertical ? width : height)
    )
  )

  if (!config.visibility.showFrame) {
    if (config.visibility.showBackground && typeof context.fillRect === 'function') {
      context.fillStyle = paint.backgroundColor
      context.fillRect(0, 0, width, height)
    }

    return {
      innerX: fallbackFrameWidth,
      innerY: fallbackFrameWidth,
      innerWidth: width - fallbackFrameWidth * 2,
      innerHeight: height - fallbackFrameWidth * 2
    }
  }

  const frame = drawLegacyLinearFrame(context, width, height, config.scale.vertical)
  if (config.visibility.showBackground) {
    drawLegacyLinearBackground(context, paint, frame)
  }

  return {
    innerX: frame.innerX,
    innerY: frame.innerY,
    innerWidth: frame.innerWidth,
    innerHeight: frame.innerHeight
  }
}

const drawSegments = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  area: { innerX: number; innerY: number; innerWidth: number; innerHeight: number }
): void => {
  const channelX = area.innerX + area.innerWidth * 0.24
  const channelY = area.innerY + area.innerHeight * 0.12
  const channelWidth = area.innerWidth * 0.52
  const channelHeight = area.innerHeight * 0.76

  const channelGradient = config.scale.vertical
    ? createLinearGradientSafe(
        context,
        channelX,
        channelY + channelHeight,
        channelX,
        channelY,
        'rgba(0,0,0,0.2)'
      )
    : createLinearGradientSafe(
        context,
        channelX,
        channelY,
        channelX + channelWidth,
        channelY,
        'rgba(0,0,0,0.2)'
      )
  if (typeof channelGradient !== 'string') {
    channelGradient.addColorStop(0, 'rgba(0,0,0,0.16)')
    channelGradient.addColorStop(0.14, 'rgba(255,255,255,0.24)')
    channelGradient.addColorStop(1, 'rgba(0,0,0,0.26)')
  }
  context.fillStyle = channelGradient
  context.fillRect(channelX, channelY, channelWidth, channelHeight)

  context.fillStyle = 'rgba(255,255,255,0.06)'
  context.fillRect(channelX, channelY, channelWidth, channelHeight)

  for (const segment of config.segments) {
    const startUnit = mapRange(segment.from, config.value, { min: 0, max: 1 }, { clampInput: true })
    const endUnit = mapRange(segment.to, config.value, { min: 0, max: 1 }, { clampInput: true })

    context.fillStyle = segment.color
    if (config.scale.vertical) {
      const segmentTop = channelY + channelHeight * (1 - endUnit)
      const segmentHeight = channelHeight * (endUnit - startUnit)
      context.fillRect(channelX, segmentTop, channelWidth, segmentHeight)
    } else {
      const segmentLeft = channelX + channelWidth * startUnit
      const segmentWidth = channelWidth * (endUnit - startUnit)
      context.fillRect(segmentLeft, channelY, segmentWidth, channelHeight)
    }
  }
}

const drawTicks = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  paint: ThemePaint,
  area: { innerX: number; innerY: number; innerWidth: number; innerHeight: number }
): void => {
  const ticks = generateTicks(config.value, {
    majorTickCount: config.scale.majorTickCount,
    minorTicksPerMajor: config.scale.minorTicksPerMajor
  })

  const tickGradient = config.scale.vertical
    ? createLinearGradientSafe(
        context,
        0,
        area.innerY + area.innerHeight,
        0,
        area.innerY,
        paint.textColor
      )
    : createLinearGradientSafe(
        context,
        area.innerX,
        0,
        area.innerX + area.innerWidth,
        0,
        paint.textColor
      )
  if (typeof tickGradient !== 'string') {
    tickGradient.addColorStop(0, 'rgba(0,0,0,0.7)')
    tickGradient.addColorStop(0.5, paint.textColor)
    tickGradient.addColorStop(1, 'rgba(255,255,255,0.8)')
  }
  context.strokeStyle = tickGradient

  for (const tick of ticks) {
    const isMajor = tick.kind === 'major'
    context.beginPath()
    context.lineWidth = isMajor ? 2 : 1

    if (config.scale.vertical) {
      const y = area.innerY + area.innerHeight * (0.88 - tick.position * 0.76)
      const startX = area.innerX + area.innerWidth * 0.8
      const endX = area.innerX + area.innerWidth * (isMajor ? 0.95 : 0.9)
      context.moveTo(startX, y)
      context.lineTo(endX, y)
    } else {
      const x = area.innerX + area.innerWidth * (0.12 + tick.position * 0.76)
      const startY = area.innerY + area.innerHeight * 0.8
      const endY = area.innerY + area.innerHeight * (isMajor ? 0.95 : 0.9)
      context.moveTo(x, startY)
      context.lineTo(x, endY)
    }

    context.stroke()
  }
}

const drawThreshold = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  paint: ThemePaint,
  area: { innerX: number; innerY: number; innerWidth: number; innerHeight: number }
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
    const y = area.innerY + area.innerHeight * (0.88 - thresholdUnit * 0.76)
    context.moveTo(area.innerX + area.innerWidth * 0.08, y)
    context.lineTo(area.innerX + area.innerWidth * 0.92, y)
  } else {
    const x = area.innerX + area.innerWidth * (0.12 + thresholdUnit * 0.76)
    context.moveTo(x, area.innerY + area.innerHeight * 0.08)
    context.lineTo(x, area.innerY + area.innerHeight * 0.92)
  }

  context.stroke()
}

const drawPointer = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  paint: ThemePaint,
  value: number,
  tone: 'accent' | 'warning' | 'danger',
  area: { innerX: number; innerY: number; innerWidth: number; innerHeight: number }
): void => {
  const pointerUnit = mapRange(value, config.value, { min: 0, max: 1 }, { clampInput: true })
  const pointerColor =
    tone === 'danger'
      ? paint.dangerColor
      : tone === 'warning'
        ? paint.warningColor
        : paint.accentColor
  context.fillStyle = pointerColor

  if (config.scale.vertical) {
    const y = area.innerY + area.innerHeight * (0.88 - pointerUnit * 0.76)
    const x = area.innerX + area.innerWidth * 0.24
    const markerWidth = area.innerWidth * 0.52
    const markerHeight = Math.max(8, area.innerHeight * 0.03)
    const gradient = createLinearGradientSafe(
      context,
      x,
      y - markerHeight / 2,
      x,
      y + markerHeight / 2,
      pointerColor
    )
    if (typeof gradient !== 'string') {
      gradient.addColorStop(0, '#f2f2f2')
      gradient.addColorStop(0.55, pointerColor)
      gradient.addColorStop(1, '#3f3f3f')
    }
    context.fillStyle = gradient
    context.fillRect(x, y - markerHeight / 2, markerWidth, markerHeight)
  } else {
    const x = area.innerX + area.innerWidth * (0.12 + pointerUnit * 0.76)
    const y = area.innerY + area.innerHeight * 0.24
    const markerWidth = Math.max(8, area.innerWidth * 0.03)
    const markerHeight = area.innerHeight * 0.52
    const gradient = createLinearGradientSafe(
      context,
      x - markerWidth / 2,
      y,
      x + markerWidth / 2,
      y,
      pointerColor
    )
    if (typeof gradient !== 'string') {
      gradient.addColorStop(0, '#f2f2f2')
      gradient.addColorStop(0.55, pointerColor)
      gradient.addColorStop(1, '#3f3f3f')
    }
    context.fillStyle = gradient
    context.fillRect(x - markerWidth / 2, y, markerWidth, markerHeight)
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
  const area = drawFrame(context, config, paint, width, height)
  drawSegments(context, config, area)
  drawTicks(context, config, paint, area)
  drawThreshold(context, config, paint, area)
  drawPointer(context, config, paint, value, tone, area)
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
