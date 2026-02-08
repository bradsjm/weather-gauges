import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { createTickLine, valueToAngle } from '../math/geometry.js'
import { clamp } from '../math/range.js'
import { generateTicks } from '../math/ticks.js'
import {
  drawLegacyRadialBackground,
  drawLegacyCenterKnob,
  drawLegacyRadialBackgroundDark,
  drawLegacyRadialForeground,
  drawLegacyRadialFrame,
  drawLegacyRadialFrameMetal
} from '../render/legacy-materials.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type {
  RadialAlert,
  RadialBackgroundColorName,
  RadialGaugeConfig,
  RadialFrameDesign,
  RadialPointerColorName
} from './schema.js'

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

const LEGACY_BACKGROUND_TEXT: Record<RadialBackgroundColorName, string> = {
  DARK_GRAY: 'rgb(255, 255, 255)',
  SATIN_GRAY: 'rgb(167, 184, 180)',
  LIGHT_GRAY: 'rgb(0, 0, 0)',
  WHITE: 'rgb(0, 0, 0)',
  BLACK: 'rgb(255, 255, 255)',
  BEIGE: 'rgb(0, 0, 0)',
  BROWN: 'rgb(109, 73, 47)',
  RED: 'rgb(0, 0, 0)',
  GREEN: 'rgb(0, 0, 0)',
  BLUE: 'rgb(0, 0, 0)',
  ANTHRACITE: 'rgb(250, 250, 250)',
  MUD: 'rgb(255, 255, 240)',
  PUNCHED_SHEET: 'rgb(255, 255, 255)',
  CARBON: 'rgb(255, 255, 255)',
  STAINLESS: 'rgb(0, 0, 0)',
  BRUSHED_METAL: 'rgb(0, 0, 0)',
  BRUSHED_STAINLESS: 'rgb(0, 0, 0)',
  TURNED: 'rgb(0, 0, 0)'
}

const LEGACY_BACKGROUND_FILL: Record<RadialBackgroundColorName, string> = {
  DARK_GRAY: '#333333',
  SATIN_GRAY: '#3f4c4c',
  LIGHT_GRAY: '#d0d0d0',
  WHITE: '#ffffff',
  BLACK: '#000000',
  BEIGE: '#d7d2bf',
  BROWN: '#f5e1c1',
  RED: '#d48486',
  GREEN: '#89b070',
  BLUE: '#8ca9c2',
  ANTHRACITE: '#3e3e44',
  MUD: '#4e544f',
  PUNCHED_SHEET: '#3e3e44',
  CARBON: '#3e3e44',
  STAINLESS: '#d7d7d7',
  BRUSHED_METAL: '#3e3e44',
  BRUSHED_STAINLESS: '#5f5f60',
  TURNED: '#d7d7d7'
}

const isChromeLikeFrame = (design: RadialFrameDesign): boolean => {
  return design === 'chrome' || design === 'blackMetal' || design === 'shinyMetal'
}

const resolveLegacyPaint = (config: RadialGaugeConfig, paint: ThemePaint): ThemePaint => {
  const textColor = LEGACY_BACKGROUND_TEXT[config.style.backgroundColor]
  const backgroundColor = LEGACY_BACKGROUND_FILL[config.style.backgroundColor]

  return {
    ...paint,
    textColor,
    backgroundColor,
    frameColor: isChromeLikeFrame(config.style.frameDesign) ? '#d0d0d0' : '#c8c8c8'
  }
}

type PointerColor = {
  light: string
  medium: string
  dark: string
}

const LEGACY_POINTER_COLORS: Record<RadialPointerColorName, PointerColor> = {
  RED: { dark: 'rgb(82, 0, 0)', medium: 'rgb(213, 0, 25)', light: 'rgb(255, 171, 173)' },
  GREEN: { dark: 'rgb(8, 54, 4)', medium: 'rgb(15, 148, 0)', light: 'rgb(190, 231, 141)' },
  BLUE: { dark: 'rgb(0, 11, 68)', medium: 'rgb(0, 108, 201)', light: 'rgb(122, 200, 255)' },
  ORANGE: { dark: 'rgb(118, 83, 30)', medium: 'rgb(240, 117, 0)', light: 'rgb(255, 255, 128)' },
  YELLOW: { dark: 'rgb(41, 41, 0)', medium: 'rgb(177, 165, 0)', light: 'rgb(255, 250, 153)' },
  CYAN: { dark: 'rgb(15, 109, 109)', medium: 'rgb(0, 144, 191)', light: 'rgb(153, 223, 249)' },
  MAGENTA: { dark: 'rgb(98, 0, 114)', medium: 'rgb(191, 36, 107)', light: 'rgb(255, 172, 210)' },
  WHITE: { dark: 'rgb(210, 210, 210)', medium: 'rgb(235, 235, 235)', light: 'rgb(255, 255, 255)' },
  GRAY: { dark: 'rgb(25, 25, 25)', medium: 'rgb(76, 76, 76)', light: 'rgb(204, 204, 204)' },
  BLACK: { dark: 'rgb(0, 0, 0)', medium: 'rgb(10, 10, 10)', light: 'rgb(20, 20, 20)' },
  RAITH: { dark: 'rgb(0, 32, 65)', medium: 'rgb(0, 106, 172)', light: 'rgb(148, 203, 242)' },
  GREEN_LCD: { dark: 'rgb(0, 55, 45)', medium: 'rgb(0, 185, 165)', light: 'rgb(153, 255, 227)' },
  JUG_GREEN: { dark: 'rgb(0, 56, 0)', medium: 'rgb(50, 161, 0)', light: 'rgb(190, 231, 141)' }
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
  const legacyPaint = resolveLegacyPaint(config, paint)

  if (config.visibility.showFrame) {
    if (isChromeLikeFrame(config.style.frameDesign)) {
      drawLegacyRadialFrame(context, centerX, centerY, radius)
    } else {
      drawLegacyRadialFrameMetal(context, centerX, centerY, radius)
    }
  }

  if (config.visibility.showBackground) {
    if (config.style.backgroundColor === 'DARK_GRAY') {
      drawLegacyRadialBackgroundDark(context, centerX, centerY, radius)
    } else {
      drawLegacyRadialBackground(context, legacyPaint, centerX, centerY, radius)
    }
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
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const textColor = LEGACY_BACKGROUND_TEXT[config.style.backgroundColor]
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
    textColor
  )
  if (typeof tickGradient !== 'string') {
    tickGradient.addColorStop(0, 'rgba(255,255,255,0.95)')
    tickGradient.addColorStop(0.45, textColor)
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
      context.fillStyle = textColor
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.font = `${Math.max(8, Math.round(radius * 0.078))}px serif`
      context.fillText(`${labelValue}`, labelLine.start.x, labelLine.start.y)
    }
  }
}

const drawThreshold = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
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
  const tip = createTickLine(centerX, centerY, radius * 0.84, radius * 0.84, angle).start
  const left = createTickLine(
    centerX,
    centerY,
    radius * 0.76,
    radius * 0.82,
    angle - 0.02 * Math.PI
  ).end
  const right = createTickLine(
    centerX,
    centerY,
    radius * 0.76,
    radius * 0.82,
    angle + 0.02 * Math.PI
  ).end

  context.beginPath()
  context.moveTo(tip.x, tip.y)
  context.lineTo(left.x, left.y)
  context.lineTo(right.x, right.y)
  closePathSafe(context)
  context.fillStyle = '#e60000'
  context.fill()
  context.strokeStyle = '#600000'
  context.lineWidth = Math.max(1, radius * 0.004)
  context.stroke()
}

const drawNeedle = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  value: number,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const angle = valueToAngle(value, config.value, config.scale.startAngle, config.scale.endAngle)
  const pointerColor = LEGACY_POINTER_COLORS[config.style.pointerColor]

  if (typeof context.translate === 'function' && typeof context.rotate === 'function') {
    context.save()
    context.translate(centerX, centerY)
    context.rotate(angle + Math.PI / 2)
    context.shadowColor = 'rgba(0, 0, 0, 0.8)'
    context.shadowBlur = radius * 0.012
    context.shadowOffsetX = radius * 0.006
    context.shadowOffsetY = radius * 0.006

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
      pointerColor.medium
    )
    if (typeof needleGradient !== 'string') {
      needleGradient.addColorStop(0, pointerColor.light)
      needleGradient.addColorStop(0.47, pointerColor.medium)
      needleGradient.addColorStop(1, pointerColor.dark)
    }
    context.fillStyle = needleGradient
    context.fill()

    context.beginPath()
    context.moveTo(0, -radius * 0.56)
    context.lineTo(radius * 0.025, radius * 0.05)
    context.lineTo(0, radius * 0.11)
    context.lineTo(-radius * 0.025, radius * 0.05)
    closePathSafe(context)
    context.strokeStyle = pointerColor.dark
    context.lineWidth = Math.max(1, radius * 0.005)
    context.stroke()

    context.restore()
  } else {
    const line = createTickLine(centerX, centerY, 0, radius * 0.56, angle)
    context.beginPath()
    context.strokeStyle = pointerColor.medium
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
  value: number,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  context.fillStyle = LEGACY_BACKGROUND_TEXT[config.style.backgroundColor]
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  const titleSize = Math.max(10, Math.round(radius * 0.085))

  if (config.text.title) {
    context.font = `${titleSize}px serif`
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
    context.font = `${Math.max(12, Math.round(radius * 0.14))}px serif`
    context.fillText(`${value.toFixed(2)}`, lcdX + lcdWidth * 0.94, lcdY + lcdHeight * 0.58)
    context.textAlign = 'center'
  } else {
    context.font = `${Math.max(14, Math.round(radius * 0.16))}px serif`
    context.fillText(`${value.toFixed(2)}`, centerX, centerY + radius * 0.32)
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
  drawTicks(context, config, centerX, centerY, radius)
  drawThreshold(context, config, centerX, centerY, radius)
  drawNeedle(context, config, value, centerX, centerY, radius)
  drawLabels(context, config, value, centerX, centerY, radius)
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
