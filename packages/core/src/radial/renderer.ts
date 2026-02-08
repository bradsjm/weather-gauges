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
  RadialGaugeType,
  RadialGaugeConfig,
  RadialFrameDesign,
  RadialPointerType,
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
  veryDark: string
}

const LEGACY_POINTER_COLORS: Record<RadialPointerColorName, PointerColor> = {
  RED: {
    dark: 'rgb(82, 0, 0)',
    medium: 'rgb(213, 0, 25)',
    light: 'rgb(255, 171, 173)',
    veryDark: 'rgb(82, 0, 0)'
  },
  GREEN: {
    dark: 'rgb(8, 54, 4)',
    medium: 'rgb(15, 148, 0)',
    light: 'rgb(190, 231, 141)',
    veryDark: 'rgb(8, 54, 4)'
  },
  BLUE: {
    dark: 'rgb(0, 11, 68)',
    medium: 'rgb(0, 108, 201)',
    light: 'rgb(122, 200, 255)',
    veryDark: 'rgb(0, 11, 68)'
  },
  ORANGE: {
    dark: 'rgb(118, 83, 30)',
    medium: 'rgb(240, 117, 0)',
    light: 'rgb(255, 255, 128)',
    veryDark: 'rgb(118, 83, 30)'
  },
  YELLOW: {
    dark: 'rgb(41, 41, 0)',
    medium: 'rgb(177, 165, 0)',
    light: 'rgb(255, 250, 153)',
    veryDark: 'rgb(41, 41, 0)'
  },
  CYAN: {
    dark: 'rgb(15, 109, 109)',
    medium: 'rgb(0, 144, 191)',
    light: 'rgb(153, 223, 249)',
    veryDark: 'rgb(15, 109, 109)'
  },
  MAGENTA: {
    dark: 'rgb(98, 0, 114)',
    medium: 'rgb(191, 36, 107)',
    light: 'rgb(255, 172, 210)',
    veryDark: 'rgb(98, 0, 114)'
  },
  WHITE: {
    dark: 'rgb(210, 210, 210)',
    medium: 'rgb(235, 235, 235)',
    light: 'rgb(255, 255, 255)',
    veryDark: 'rgb(180, 180, 180)'
  },
  GRAY: {
    dark: 'rgb(25, 25, 25)',
    medium: 'rgb(76, 76, 76)',
    light: 'rgb(204, 204, 204)',
    veryDark: 'rgb(10, 10, 10)'
  },
  BLACK: {
    dark: 'rgb(0, 0, 0)',
    medium: 'rgb(10, 10, 10)',
    light: 'rgb(20, 20, 20)',
    veryDark: 'rgb(0, 0, 0)'
  },
  RAITH: {
    dark: 'rgb(0, 32, 65)',
    medium: 'rgb(0, 106, 172)',
    light: 'rgb(148, 203, 242)',
    veryDark: 'rgb(0, 16, 32)'
  },
  GREEN_LCD: {
    dark: 'rgb(0, 55, 45)',
    medium: 'rgb(0, 185, 165)',
    light: 'rgb(153, 255, 227)',
    veryDark: 'rgb(0, 32, 24)'
  },
  JUG_GREEN: {
    dark: 'rgb(0, 56, 0)',
    medium: 'rgb(50, 161, 0)',
    light: 'rgb(190, 231, 141)',
    veryDark: 'rgb(0, 34, 0)'
  }
}

const PI = Math.PI
const HALF_PI = PI * 0.5
const TWO_PI = PI * 2

const resolveGaugeAngles = (
  gaugeType: RadialGaugeType,
  valueMin: number,
  valueMax: number
): { rotationOffset: number; angleRange: number; angleStep: number } => {
  const range = valueMax - valueMin
  if (range <= 0) {
    return {
      rotationOffset: HALF_PI,
      angleRange: TWO_PI - (60 * PI) / 180,
      angleStep: 0
    }
  }

  let rotationOffset = HALF_PI
  let angleRange = TWO_PI - (60 * PI) / 180

  if (gaugeType === 'type1') {
    rotationOffset = PI
    angleRange = HALF_PI
  } else if (gaugeType === 'type2') {
    rotationOffset = PI
    angleRange = PI
  } else if (gaugeType === 'type3') {
    rotationOffset = HALF_PI
    angleRange = 1.5 * PI
  }

  return {
    rotationOffset,
    angleRange,
    angleStep: angleRange / range
  }
}

const toLegacyGaugeAngle = (
  value: number,
  config: RadialGaugeConfig,
  angles: { rotationOffset: number; angleStep: number }
): number => {
  return angles.rotationOffset + HALF_PI + (value - config.value.min) * angles.angleStep
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
  angles: { rotationOffset: number; angleStep: number },
  centerX: number,
  centerY: number,
  radius: number,
  imageWidth: number
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
    const angle = toLegacyGaugeAngle(tick.value, config, angles)
    const isMajor = tick.kind === 'major'
    const line = createTickLine(
      centerX,
      centerY,
      imageWidth * (isMajor ? 0.35 : 0.36),
      imageWidth * 0.38,
      angle
    )

    context.beginPath()
    context.lineWidth = isMajor ? 1.5 : 1
    context.moveTo(line.start.x, line.start.y)
    context.lineTo(line.end.x, line.end.y)
    context.stroke()

    if (isMajor) {
      const labelValue = Math.round(tick.value)
      const labelLine = createTickLine(centerX, centerY, imageWidth * 0.3, imageWidth * 0.3, angle)
      context.fillStyle = textColor
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.font = `${Math.max(8, Math.round(imageWidth * 0.04))}px serif`
      context.fillText(`${labelValue}`, labelLine.start.x, labelLine.start.y)
    }
  }
}

const drawThreshold = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  angles: { rotationOffset: number; angleStep: number },
  centerX: number,
  centerY: number,
  radius: number,
  imageWidth: number
): void => {
  const threshold = config.indicators.threshold
  if (!threshold || !threshold.show) {
    return
  }

  const angle = toLegacyGaugeAngle(
    clamp(threshold.value, config.value.min, config.value.max),
    config,
    angles
  )
  const tip = createTickLine(centerX, centerY, imageWidth * 0.43, imageWidth * 0.43, angle).start
  const left = createTickLine(
    centerX,
    centerY,
    imageWidth * 0.39,
    imageWidth * 0.41,
    angle - 0.02 * Math.PI
  ).end
  const right = createTickLine(
    centerX,
    centerY,
    imageWidth * 0.39,
    imageWidth * 0.41,
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
  context.lineWidth = Math.max(1, imageWidth * 0.004)
  context.stroke()
}

const drawLegacyPointerShape = (
  context: RadialDrawContext,
  pointerType: RadialPointerType,
  size: number,
  ptrColor: PointerColor,
  labelColor: string,
  centerX: number,
  centerY: number
): void => {
  const x = (value: number): number => size * value - centerX
  const y = (value: number): number => size * value - centerY
  let grad: CanvasGradient | string
  let radius = 0

  switch (pointerType) {
    case 'type2':
      grad = createLinearGradientSafe(context, 0, y(0.471962), 0, y(0.130841), ptrColor.light)
      if (typeof grad !== 'string') {
        grad.addColorStop(0, labelColor)
        grad.addColorStop(0.36, labelColor)
        grad.addColorStop(0.361, ptrColor.light)
        grad.addColorStop(1, ptrColor.light)
      }
      context.fillStyle = grad
      context.beginPath()
      context.moveTo(x(0.518691), y(0.471962))
      context.lineTo(x(0.509345), y(0.462616))
      context.lineTo(x(0.509345), y(0.341121))
      context.lineTo(x(0.504672), y(0.130841))
      context.lineTo(x(0.495327), y(0.130841))
      context.lineTo(x(0.490654), y(0.341121))
      context.lineTo(x(0.490654), y(0.462616))
      context.lineTo(x(0.481308), y(0.471962))
      closePathSafe(context)
      context.fill()
      break
    case 'type3':
      context.beginPath()
      context.rect(x(0.495327), y(0.130841), size * 0.009345, size * 0.373831)
      closePathSafe(context)
      context.fillStyle = ptrColor.light
      context.fill()
      break
    case 'type4':
      grad = createLinearGradientSafe(context, x(0.467289), 0, x(0.528036), 0, ptrColor.light)
      if (typeof grad !== 'string') {
        grad.addColorStop(0, ptrColor.dark)
        grad.addColorStop(0.51, ptrColor.dark)
        grad.addColorStop(0.52, ptrColor.light)
        grad.addColorStop(1, ptrColor.light)
      }
      context.fillStyle = grad
      context.beginPath()
      context.moveTo(x(0.5), y(0.126168))
      context.lineTo(x(0.514018), y(0.135514))
      context.lineTo(x(0.53271), y(0.5))
      context.lineTo(x(0.523364), y(0.602803))
      context.lineTo(x(0.476635), y(0.602803))
      context.lineTo(x(0.467289), y(0.5))
      context.lineTo(x(0.485981), y(0.135514))
      context.lineTo(x(0.5), y(0.126168))
      closePathSafe(context)
      context.fill()
      break
    case 'type5':
      grad = createLinearGradientSafe(context, x(0.471962), 0, x(0.528036), 0, ptrColor.medium)
      if (typeof grad !== 'string') {
        grad.addColorStop(0, ptrColor.light)
        grad.addColorStop(0.5, ptrColor.light)
        grad.addColorStop(0.5, ptrColor.medium)
        grad.addColorStop(1, ptrColor.medium)
      }
      context.fillStyle = grad
      context.beginPath()
      context.moveTo(x(0.5), y(0.495327))
      context.lineTo(x(0.528037), y(0.495327))
      context.lineTo(x(0.5), y(0.149532))
      context.lineTo(x(0.471962), y(0.495327))
      context.lineTo(x(0.5), y(0.495327))
      closePathSafe(context)
      context.fill()
      context.strokeStyle = ptrColor.dark
      context.lineWidth = 1
      context.stroke()
      break
    case 'type6':
      context.fillStyle = ptrColor.medium
      context.beginPath()
      context.moveTo(x(0.481308), y(0.485981))
      context.lineTo(x(0.481308), y(0.392523))
      context.lineTo(x(0.485981), y(0.317757))
      context.lineTo(x(0.495327), y(0.130841))
      context.lineTo(x(0.504672), y(0.130841))
      context.lineTo(x(0.514018), y(0.317757))
      context.lineTo(x(0.518691), y(0.38785))
      context.lineTo(x(0.518691), y(0.485981))
      context.lineTo(x(0.504672), y(0.485981))
      context.lineTo(x(0.504672), y(0.38785))
      context.lineTo(x(0.5), y(0.317757))
      context.lineTo(x(0.495327), y(0.392523))
      context.lineTo(x(0.495327), y(0.485981))
      context.lineTo(x(0.481308), y(0.485981))
      closePathSafe(context)
      context.fill()
      break
    case 'type7':
      grad = createLinearGradientSafe(context, x(0.481308), 0, x(0.518691), 0, ptrColor.medium)
      if (typeof grad !== 'string') {
        grad.addColorStop(0, ptrColor.dark)
        grad.addColorStop(1, ptrColor.medium)
      }
      context.fillStyle = grad
      context.beginPath()
      context.moveTo(x(0.490654), y(0.130841))
      context.lineTo(x(0.481308), y(0.5))
      context.lineTo(x(0.518691), y(0.5))
      context.lineTo(x(0.504672), y(0.130841))
      context.lineTo(x(0.490654), y(0.130841))
      closePathSafe(context)
      context.fill()
      break
    case 'type8':
      grad = createLinearGradientSafe(context, x(0.471962), 0, x(0.528036), 0, ptrColor.medium)
      if (typeof grad !== 'string') {
        grad.addColorStop(0, ptrColor.light)
        grad.addColorStop(0.5, ptrColor.light)
        grad.addColorStop(0.5, ptrColor.medium)
        grad.addColorStop(1, ptrColor.medium)
      }
      context.fillStyle = grad
      context.strokeStyle = ptrColor.dark
      context.beginPath()
      context.moveTo(x(0.5), y(0.53271))
      context.lineTo(x(0.53271), y(0.5))
      context.bezierCurveTo(x(0.53271), y(0.5), x(0.509345), y(0.457943), x(0.5), y(0.149532))
      context.bezierCurveTo(x(0.490654), y(0.457943), x(0.467289), y(0.5), x(0.467289), y(0.5))
      context.lineTo(x(0.5), y(0.53271))
      closePathSafe(context)
      context.fill()
      context.stroke()
      break
    case 'type9':
      grad = createLinearGradientSafe(context, x(0.471962), 0, x(0.528036), 0, 'rgb(50, 50, 50)')
      if (typeof grad !== 'string') {
        grad.addColorStop(0, 'rgb(50, 50, 50)')
        grad.addColorStop(0.5, '#666666')
        grad.addColorStop(1, 'rgb(50, 50, 50)')
      }
      context.fillStyle = grad
      context.strokeStyle = '#2E2E2E'
      context.beginPath()
      context.moveTo(x(0.495327), y(0.233644))
      context.lineTo(x(0.504672), y(0.233644))
      context.lineTo(x(0.514018), y(0.439252))
      context.lineTo(x(0.485981), y(0.439252))
      closePathSafe(context)
      context.moveTo(x(0.490654), y(0.130841))
      context.lineTo(x(0.471962), y(0.471962))
      context.lineTo(x(0.471962), y(0.528037))
      context.bezierCurveTo(
        x(0.471962),
        y(0.528037),
        x(0.476635),
        y(0.602803),
        x(0.476635),
        y(0.602803)
      )
      context.bezierCurveTo(x(0.476635), y(0.607476), x(0.481308), y(0.607476), x(0.5), y(0.607476))
      context.bezierCurveTo(
        x(0.518691),
        y(0.607476),
        x(0.523364),
        y(0.607476),
        x(0.523364),
        y(0.602803)
      )
      context.bezierCurveTo(
        x(0.523364),
        y(0.602803),
        x(0.528037),
        y(0.528037),
        x(0.528037),
        y(0.528037)
      )
      context.lineTo(x(0.528037), y(0.471962))
      context.lineTo(x(0.509345), y(0.130841))
      closePathSafe(context)
      context.fill()
      context.beginPath()
      context.moveTo(x(0.495327), y(0.219626))
      context.lineTo(x(0.504672), y(0.219626))
      context.lineTo(x(0.504672), y(0.135514))
      context.lineTo(x(0.495327), y(0.135514))
      closePathSafe(context)
      context.fillStyle = ptrColor.medium
      context.fill()
      break
    case 'type10':
      context.beginPath()
      context.moveTo(x(0.5), y(0.149532))
      context.bezierCurveTo(x(0.5), y(0.149532), x(0.443925), y(0.490654), x(0.443925), y(0.5))
      context.bezierCurveTo(x(0.443925), y(0.53271), x(0.467289), y(0.556074), x(0.5), y(0.556074))
      context.bezierCurveTo(x(0.53271), y(0.556074), x(0.556074), y(0.53271), x(0.556074), y(0.5))
      context.bezierCurveTo(x(0.556074), y(0.490654), x(0.5), y(0.149532), x(0.5), y(0.149532))
      closePathSafe(context)
      grad = createLinearGradientSafe(context, x(0.471962), 0, x(0.528036), 0, ptrColor.medium)
      if (typeof grad !== 'string') {
        grad.addColorStop(0, ptrColor.light)
        grad.addColorStop(0.5, ptrColor.light)
        grad.addColorStop(0.5, ptrColor.medium)
        grad.addColorStop(1, ptrColor.medium)
      }
      context.fillStyle = grad
      context.strokeStyle = ptrColor.medium
      context.lineWidth = 1
      context.fill()
      context.stroke()
      break
    case 'type11':
      context.beginPath()
      context.moveTo(x(0.5), y(0.168224))
      context.lineTo(x(0.485981), y(0.5))
      context.bezierCurveTo(x(0.485981), y(0.5), x(0.481308), y(0.584112), x(0.5), y(0.584112))
      context.bezierCurveTo(x(0.514018), y(0.584112), x(0.509345), y(0.5), x(0.509345), y(0.5))
      context.lineTo(x(0.5), y(0.168224))
      closePathSafe(context)
      grad = createLinearGradientSafe(context, 0, y(0.168224), 0, y(0.584112), ptrColor.dark)
      if (typeof grad !== 'string') {
        grad.addColorStop(0, ptrColor.medium)
        grad.addColorStop(1, ptrColor.dark)
      }
      context.fillStyle = grad
      context.strokeStyle = ptrColor.dark
      context.fill()
      context.stroke()
      break
    case 'type12':
      context.beginPath()
      context.moveTo(x(0.5), y(0.168224))
      context.lineTo(x(0.485981), y(0.5))
      context.lineTo(x(0.5), y(0.504672))
      context.lineTo(x(0.509345), y(0.5))
      context.lineTo(x(0.5), y(0.168224))
      closePathSafe(context)
      grad = createLinearGradientSafe(context, 0, y(0.168224), 0, y(0.504672), ptrColor.dark)
      if (typeof grad !== 'string') {
        grad.addColorStop(0, ptrColor.medium)
        grad.addColorStop(1, ptrColor.dark)
      }
      context.fillStyle = grad
      context.strokeStyle = ptrColor.dark
      context.fill()
      context.stroke()
      break
    case 'type13':
    case 'type14':
      context.beginPath()
      context.moveTo(x(0.485981), y(0.168224))
      context.lineTo(x(0.5), y(0.130841))
      context.lineTo(x(0.509345), y(0.168224))
      context.lineTo(x(0.509345), y(0.509345))
      context.lineTo(x(0.485981), y(0.509345))
      closePathSafe(context)
      if (pointerType === 'type13') {
        grad = createLinearGradientSafe(context, 0, y(0.5), 0, y(0.130841), ptrColor.medium)
        if (typeof grad !== 'string') {
          grad.addColorStop(0, labelColor)
          grad.addColorStop(0.85, labelColor)
          grad.addColorStop(0.85, ptrColor.medium)
          grad.addColorStop(1, ptrColor.medium)
        }
      } else {
        grad = createLinearGradientSafe(context, x(0.485981), 0, x(0.509345), 0, ptrColor.veryDark)
        if (typeof grad !== 'string') {
          grad.addColorStop(0, ptrColor.veryDark)
          grad.addColorStop(0.5, ptrColor.light)
          grad.addColorStop(1, ptrColor.veryDark)
        }
      }
      context.fillStyle = grad
      context.fill()
      break
    case 'type15':
    case 'type16':
      context.beginPath()
      context.moveTo(x(0.509345), y(0.457943))
      context.lineTo(x(0.5015), y(0.13))
      context.lineTo(x(0.4985), y(0.13))
      context.lineTo(x(0.490654), y(0.457943))
      context.bezierCurveTo(
        x(0.490654),
        y(0.457943),
        x(0.490654),
        y(0.457943),
        x(0.490654),
        y(0.457943)
      )
      context.bezierCurveTo(x(0.471962), y(0.462616), x(0.457943), y(0.481308), x(0.457943), y(0.5))
      context.bezierCurveTo(
        x(0.457943),
        y(0.518691),
        x(0.471962),
        y(0.537383),
        x(0.490654),
        y(0.542056)
      )
      if (pointerType === 'type15') {
        context.lineTo(x(0.490654), y(0.57))
        context.bezierCurveTo(x(0.46), y(0.58), x(0.46), y(0.62), x(0.490654), y(0.63))
        context.bezierCurveTo(x(0.47), y(0.62), x(0.48), y(0.59), x(0.5), y(0.59))
        context.bezierCurveTo(x(0.53), y(0.59), x(0.52), y(0.62), x(0.509345), y(0.63))
        context.bezierCurveTo(x(0.54), y(0.62), x(0.54), y(0.58), x(0.509345), y(0.57))
        context.lineTo(x(0.509345), y(0.57))
      } else {
        context.lineTo(x(0.490654), y(0.621495))
        context.lineTo(x(0.509345), y(0.621495))
      }
      context.lineTo(x(0.509345), y(0.542056))
      context.bezierCurveTo(
        x(0.509345),
        y(0.542056),
        x(0.509345),
        y(0.542056),
        x(0.509345),
        y(0.542056)
      )
      context.bezierCurveTo(x(0.528037), y(0.537383), x(0.542056), y(0.518691), x(0.542056), y(0.5))
      context.bezierCurveTo(
        x(0.542056),
        y(0.481308),
        x(0.528037),
        y(0.462616),
        x(0.509345),
        y(0.457943)
      )
      closePathSafe(context)
      grad = createLinearGradientSafe(
        context,
        0,
        0,
        0,
        y(pointerType === 'type15' ? 0.63 : 0.621495),
        ptrColor.medium
      )
      if (typeof grad !== 'string') {
        grad.addColorStop(0, ptrColor.medium)
        grad.addColorStop(0.388888, ptrColor.medium)
        grad.addColorStop(0.5, ptrColor.light)
        grad.addColorStop(0.611111, ptrColor.medium)
        grad.addColorStop(1, ptrColor.medium)
      }
      context.fillStyle = grad
      context.strokeStyle = ptrColor.dark
      context.fill()
      context.stroke()
      context.beginPath()
      radius = (size * 0.06542) / 2
      context.arc(x(0.5), y(0.5), radius, 0, TWO_PI)
      grad = createLinearGradientSafe(
        context,
        x(0.5) - radius,
        y(0.5) + radius,
        0,
        y(0.5) + radius,
        '#c48200'
      )
      if (typeof grad !== 'string') {
        grad.addColorStop(0, '#e6b35c')
        grad.addColorStop(0.01, '#e6b35c')
        grad.addColorStop(0.99, '#c48200')
        grad.addColorStop(1, '#c48200')
      }
      context.fillStyle = grad
      context.fill()
      context.beginPath()
      radius = (size * 0.046728) / 2
      context.arc(x(0.5), y(0.5), radius, 0, TWO_PI)
      const ring = context.createRadialGradient(x(0.5), y(0.5), 0, x(0.5), y(0.5), radius)
      ring.addColorStop(0, '#c5c5c5')
      ring.addColorStop(0.19, '#c5c5c5')
      ring.addColorStop(0.22, '#000000')
      ring.addColorStop(0.8, '#000000')
      ring.addColorStop(0.99, '#707070')
      ring.addColorStop(1, '#707070')
      context.fillStyle = ring
      context.fill()
      break
    case 'type1':
    default:
      grad = createLinearGradientSafe(context, 0, y(0.471962), 0, y(0.130841), ptrColor.veryDark)
      if (typeof grad !== 'string') {
        grad.addColorStop(0, ptrColor.veryDark)
        grad.addColorStop(0.3, ptrColor.medium)
        grad.addColorStop(0.59, ptrColor.medium)
        grad.addColorStop(1, ptrColor.veryDark)
      }
      context.fillStyle = grad
      context.beginPath()
      context.moveTo(x(0.518691), y(0.471962))
      context.bezierCurveTo(
        x(0.514018),
        y(0.457943),
        x(0.509345),
        y(0.415887),
        x(0.509345),
        y(0.401869)
      )
      context.bezierCurveTo(x(0.504672), y(0.383177), x(0.5), y(0.130841), x(0.5), y(0.130841))
      context.bezierCurveTo(x(0.5), y(0.130841), x(0.490654), y(0.383177), x(0.490654), y(0.397196))
      context.bezierCurveTo(
        x(0.490654),
        y(0.415887),
        x(0.485981),
        y(0.457943),
        x(0.481308),
        y(0.471962)
      )
      context.bezierCurveTo(x(0.471962), y(0.481308), x(0.467289), y(0.490654), x(0.467289), y(0.5))
      context.bezierCurveTo(x(0.467289), y(0.518691), x(0.481308), y(0.53271), x(0.5), y(0.53271))
      context.bezierCurveTo(x(0.518691), y(0.53271), x(0.53271), y(0.518691), x(0.53271), y(0.5))
      context.bezierCurveTo(
        x(0.53271),
        y(0.490654),
        x(0.528037),
        y(0.481308),
        x(0.518691),
        y(0.471962)
      )
      closePathSafe(context)
      context.fill()
      break
  }
}

const drawNeedle = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  angles: { rotationOffset: number; angleStep: number },
  value: number,
  centerX: number,
  centerY: number,
  radius: number,
  imageWidth: number
): void => {
  const angle = toLegacyGaugeAngle(value, config, angles)
  const pointerColor = LEGACY_POINTER_COLORS[config.style.pointerColor]

  if (typeof context.translate === 'function' && typeof context.rotate === 'function') {
    context.save()
    context.translate(centerX, centerY)
    context.rotate(angle)
    context.shadowColor = 'rgba(0, 0, 0, 0.8)'
    context.shadowBlur = radius * 0.012
    context.shadowOffsetX = radius * 0.006
    context.shadowOffsetY = radius * 0.006
    drawLegacyPointerShape(
      context,
      config.style.pointerType,
      imageWidth,
      pointerColor,
      LEGACY_BACKGROUND_TEXT[config.style.backgroundColor],
      centerX,
      centerY
    )

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

  if (config.style.pointerType !== 'type15' && config.style.pointerType !== 'type16') {
    drawLegacyCenterKnob(context, centerX, centerY, radius)
  }
}

const drawRadialStatusLayers = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  angles: { rotationOffset: number; angleStep: number },
  centerX: number,
  centerY: number,
  imageWidth: number
): void => {
  if (config.indicators.ledVisible) {
    const ledRadius = imageWidth * 0.046728
    const ledX = imageWidth * 0.6
    const ledY = imageWidth * 0.4
    const led = createLinearGradientSafe(
      context,
      ledX,
      ledY - ledRadius,
      ledX,
      ledY + ledRadius,
      '#cc0000'
    )
    if (typeof led !== 'string') {
      led.addColorStop(0, '#ff9f9f')
      led.addColorStop(0.2, '#ff3a3a')
      led.addColorStop(1, '#700000')
    }
    context.beginPath()
    context.fillStyle = led
    context.arc(ledX, ledY, ledRadius, 0, TWO_PI)
    context.fill()
  }

  if (config.indicators.userLedVisible) {
    const ledRadius = imageWidth * 0.046728
    const ledX = config.style.gaugeType === 'type3' ? imageWidth * 0.6 : centerX
    const ledY = config.style.gaugeType === 'type3' ? imageWidth * 0.72 : imageWidth * 0.75
    const led = createLinearGradientSafe(
      context,
      ledX,
      ledY - ledRadius,
      ledX,
      ledY + ledRadius,
      '#00aa00'
    )
    if (typeof led !== 'string') {
      led.addColorStop(0, '#b7ffb7')
      led.addColorStop(0.2, '#3adb3a')
      led.addColorStop(1, '#055805')
    }
    context.beginPath()
    context.fillStyle = led
    context.arc(ledX, ledY, ledRadius, 0, TWO_PI)
    context.fill()
  }

  if (config.indicators.trendVisible) {
    const trendSize = imageWidth * 0.06
    const x = imageWidth * 0.29
    const y = imageWidth * 0.36
    context.fillStyle = 'rgba(80, 80, 80, 0.7)'
    if (config.indicators.trendState === 'up') {
      context.fillStyle = '#ff2a2a'
      context.beginPath()
      context.moveTo(x + trendSize * 0.5, y)
      context.lineTo(x + trendSize, y + trendSize * 0.4)
      context.lineTo(x, y + trendSize * 0.4)
      closePathSafe(context)
      context.fill()
    } else if (config.indicators.trendState === 'steady') {
      context.fillStyle = '#00d07d'
      context.fillRect(x, y + trendSize * 0.3, trendSize, trendSize * 0.12)
      context.fillRect(x, y + trendSize * 0.55, trendSize, trendSize * 0.12)
    } else {
      context.fillStyle = '#00a7ff'
      context.beginPath()
      context.moveTo(x + trendSize * 0.5, y + trendSize)
      context.lineTo(x + trendSize, y + trendSize * 0.6)
      context.lineTo(x, y + trendSize * 0.6)
      closePathSafe(context)
      context.fill()
    }
  }

  const drawMeasuredMarker = (value: number, color: string): void => {
    const angle = toLegacyGaugeAngle(value, config, angles)
    context.save()
    context.translate(centerX, centerY)
    context.rotate(angle)
    context.translate(-centerX, -centerY)
    const marker = imageWidth * 0.028037
    context.fillStyle = color
    context.beginPath()
    context.moveTo(centerX, imageWidth * 0.14)
    context.lineTo(centerX - marker, imageWidth * 0.14 - marker)
    context.lineTo(centerX + marker, imageWidth * 0.14 - marker)
    closePathSafe(context)
    context.fill()
    context.restore()
  }

  if (config.indicators.minMeasuredValueVisible) {
    drawMeasuredMarker(config.indicators.minMeasuredValue ?? config.value.min, '#0044ff')
  }
  if (config.indicators.maxMeasuredValueVisible) {
    drawMeasuredMarker(config.indicators.maxMeasuredValue ?? config.value.max, '#ff6600')
  }
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
  const imageWidth = Math.min(config.size.width, config.size.height)
  const radius = Math.min(config.size.width, config.size.height) * 0.48
  const angles = resolveGaugeAngles(config.style.gaugeType, config.value.min, config.value.max)
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
  drawTicks(context, config, angles, centerX, centerY, radius, imageWidth)
  drawThreshold(context, config, angles, centerX, centerY, radius, imageWidth)
  drawLabels(context, config, value, centerX, centerY, radius)
  drawRadialStatusLayers(context, config, angles, centerX, centerY, imageWidth)
  drawNeedle(context, config, angles, value, centerX, centerY, radius, imageWidth)
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
