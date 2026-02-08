import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { clamp, mapRange } from '../math/range.js'
import { generateTicks } from '../math/ticks.js'
import {
  drawLegacyLinearBackground,
  drawLegacyLinearForeground,
  drawLegacyLinearFrame,
  type LinearMaterialFrame
} from '../render/legacy-materials.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type {
  LinearAlert,
  LinearBackgroundColorName,
  LinearFrameDesign,
  LinearGaugeConfig
} from './schema.js'

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

const closePathSafe = (context: LinearDrawContext): void => {
  if (typeof context.closePath === 'function') {
    context.closePath()
  }
}

const createRadialGradientSafe = (
  context: LinearDrawContext,
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number,
  fallback: string
): CanvasGradient | string => {
  if (typeof context.createRadialGradient !== 'function') {
    return fallback
  }

  return context.createRadialGradient(x0, y0, r0, x1, y1, r1)
}

const LEGACY_BACKGROUND_TEXT: Record<LinearBackgroundColorName, string> = {
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

const LEGACY_BACKGROUND_FILL: Record<LinearBackgroundColorName, string> = {
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

const isChromeLikeFrame = (design: LinearFrameDesign): boolean => {
  return design === 'chrome' || design === 'blackMetal' || design === 'shinyMetal'
}

const resolveLegacyPaint = (config: LinearGaugeConfig, paint: ThemePaint): ThemePaint => ({
  ...paint,
  textColor: LEGACY_BACKGROUND_TEXT[config.style.backgroundColor],
  backgroundColor: LEGACY_BACKGROUND_FILL[config.style.backgroundColor],
  frameColor: isChromeLikeFrame(config.style.frameDesign) ? '#d0d0d0' : '#c8c8c8'
})

const resolveLinearScaleConstants = (
  config: LinearGaugeConfig
): {
  start: number
  end: number
  yOffset: number
  yRange: number
} => {
  const type2 = config.style.gaugeType === 'type2'
  if (config.scale.vertical) {
    const yOffset = type2 ? 0.7475 : 0.856796
    const start = 0.12864
    return {
      start,
      end: yOffset,
      yOffset,
      yRange: yOffset - start
    }
  }

  const start = type2 ? 0.19857 : 0.142857
  const end = type2 ? 0.82 : 0.871012
  return {
    start,
    end,
    yOffset: end,
    yRange: end - start
  }
}

type ValueColor = {
  light: string
  medium: string
  dark: string
}

const LEGACY_VALUE_COLORS: Record<LinearGaugeConfig['style']['valueColor'], ValueColor> = {
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

type LinearRenderArea = {
  innerX: number
  innerY: number
  innerWidth: number
  innerHeight: number
  frame: LinearMaterialFrame
}

const drawFrame = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  paint: ThemePaint,
  width: number,
  height: number
): LinearRenderArea => {
  const legacyPaint = resolveLegacyPaint(config, paint)
  const fallbackFrameWidth = Math.ceil(
    Math.min(
      0.04 * Math.sqrt(width * width + height * height),
      0.1 * (config.scale.vertical ? width : height)
    )
  )

  if (!config.visibility.showFrame) {
    if (config.visibility.showBackground && typeof context.fillRect === 'function') {
      context.fillStyle = legacyPaint.backgroundColor
      context.fillRect(0, 0, width, height)
    }

    return {
      innerX: fallbackFrameWidth,
      innerY: fallbackFrameWidth,
      innerWidth: width - fallbackFrameWidth * 2,
      innerHeight: height - fallbackFrameWidth * 2,
      frame: {
        frameWidth: fallbackFrameWidth,
        innerX: fallbackFrameWidth,
        innerY: fallbackFrameWidth,
        innerWidth: width - fallbackFrameWidth * 2,
        innerHeight: height - fallbackFrameWidth * 2,
        cornerRadius: Math.max(1, Math.ceil(0.05 * (config.scale.vertical ? width : height)))
      }
    }
  }

  const frame = drawLegacyLinearFrame(context, width, height, config.scale.vertical)
  if (config.visibility.showBackground) {
    drawLegacyLinearBackground(context, legacyPaint, frame)
  }

  return {
    innerX: frame.innerX,
    innerY: frame.innerY,
    innerWidth: frame.innerWidth,
    innerHeight: frame.innerHeight,
    frame
  }
}

const drawSegments = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  area: LinearRenderArea
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
    channelGradient.addColorStop(0, 'rgba(0,0,0,0.22)')
    channelGradient.addColorStop(0.18, 'rgba(255,255,255,0.12)')
    channelGradient.addColorStop(1, 'rgba(0,0,0,0.34)')
  }
  context.fillStyle = channelGradient
  context.fillRect(channelX, channelY, channelWidth, channelHeight)

  context.fillStyle = 'rgba(255,255,255,0.03)'
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
  area: LinearRenderArea
): void => {
  const scaleConstants = resolveLinearScaleConstants(config)
  const textColor = LEGACY_BACKGROUND_TEXT[config.style.backgroundColor]
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
        textColor
      )
    : createLinearGradientSafe(context, area.innerX, 0, area.innerX + area.innerWidth, 0, textColor)
  if (typeof tickGradient !== 'string') {
    tickGradient.addColorStop(0, 'rgba(0,0,0,0.7)')
    tickGradient.addColorStop(0.5, textColor)
    tickGradient.addColorStop(1, 'rgba(255,255,255,0.8)')
  }
  context.strokeStyle = tickGradient

  for (const tick of ticks) {
    const isMajor = tick.kind === 'major'
    context.beginPath()
    context.lineWidth = isMajor ? 1.5 : 0.5

    if (config.scale.vertical) {
      const y =
        area.innerY +
        area.innerHeight * (scaleConstants.end - tick.position * scaleConstants.yRange)
      const startX = area.innerX + area.innerWidth * (isMajor ? 0.32 : 0.34)
      const endX = area.innerX + area.innerWidth * 0.36
      context.moveTo(startX, y)
      context.lineTo(endX, y)
    } else {
      const x =
        area.innerX +
        area.innerWidth *
          (scaleConstants.start + tick.position * (scaleConstants.end - scaleConstants.start))
      const startY = area.innerY + area.innerHeight * (isMajor ? 0.67 : 0.65)
      const endY = area.innerY + area.innerHeight * 0.63
      context.moveTo(x, startY)
      context.lineTo(x, endY)
    }

    context.stroke()

    if (isMajor) {
      const labelValue = Math.round(tick.value)
      context.fillStyle = textColor
      context.textAlign = config.scale.vertical ? 'right' : 'center'
      context.textBaseline = 'middle'
      context.font = `${Math.max(8, Math.round(area.innerWidth * 0.09))}px serif`

      if (config.scale.vertical) {
        const y =
          area.innerY +
          area.innerHeight * (scaleConstants.end - tick.position * scaleConstants.yRange)
        context.fillText(`${labelValue}`, area.innerX + area.innerWidth * 0.28, y)
      } else {
        const x =
          area.innerX +
          area.innerWidth *
            (scaleConstants.start + tick.position * (scaleConstants.end - scaleConstants.start))
        context.fillText(`${labelValue}`, x, area.innerY + area.innerHeight * 0.73)
      }
    }
  }
}

const drawThreshold = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  area: LinearRenderArea
): void => {
  const scaleConstants = resolveLinearScaleConstants(config)
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

  context.fillStyle = '#e60000'
  context.strokeStyle = '#600000'
  context.lineWidth = 1
  context.beginPath()

  if (config.scale.vertical) {
    const y =
      area.innerY +
      area.innerHeight * (scaleConstants.yOffset - thresholdUnit * scaleConstants.yRange)
    context.moveTo(area.innerX + area.innerWidth * 0.365, y)
    context.lineTo(area.innerX + area.innerWidth * 0.39, y - area.innerHeight * 0.02)
    context.lineTo(area.innerX + area.innerWidth * 0.39, y + area.innerHeight * 0.02)
  } else {
    const x =
      area.innerX + area.innerWidth * (scaleConstants.start + thresholdUnit * scaleConstants.yRange)
    context.moveTo(x, area.innerY + area.innerHeight * 0.58)
    context.lineTo(x - area.innerWidth * 0.02, area.innerY + area.innerHeight * 0.64)
    context.lineTo(x + area.innerWidth * 0.02, area.innerY + area.innerHeight * 0.64)
  }

  closePathSafe(context)
  context.fill()
  context.stroke()
}

const drawPointer = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  value: number,
  area: LinearRenderArea
): void => {
  const scaleConstants = resolveLinearScaleConstants(config)
  const pointerUnit = mapRange(value, config.value, { min: 0, max: 1 }, { clampInput: true })
  const pointerColor = LEGACY_VALUE_COLORS[config.style.valueColor]
  const innerDark = 'rgba(0, 0, 0, 0.2)'
  const innerLight = 'rgba(255, 255, 255, 0.25)'

  if (config.scale.vertical) {
    const top = area.innerY + area.innerHeight * scaleConstants.start
    const bottom = area.innerY + area.innerHeight * scaleConstants.end
    const level =
      area.innerY +
      area.innerHeight * (scaleConstants.yOffset - pointerUnit * scaleConstants.yRange)

    if (config.style.gaugeType === 'type1') {
      const x = area.innerX + area.innerWidth * 0.435714
      const width = area.innerWidth * 0.15

      context.fillStyle = 'rgba(255, 255, 255, 0.08)'
      context.fillRect(x, top, width, bottom - top)

      const border = createLinearGradientSafe(context, x, top, x + width, top, innerDark)
      if (typeof border !== 'string') {
        border.addColorStop(0, 'rgba(255, 255, 255, 0.15)')
        border.addColorStop(0.5, innerDark)
        border.addColorStop(1, 'rgba(255, 255, 255, 0.15)')
      }
      context.strokeStyle = border
      context.lineWidth = 1
      if (typeof context.strokeRect === 'function') {
        context.strokeRect(x, top, width, bottom - top)
      }

      const valueGradient = createLinearGradientSafe(
        context,
        x,
        bottom,
        x + width,
        bottom,
        pointerColor.medium
      )
      if (typeof valueGradient !== 'string') {
        valueGradient.addColorStop(0, pointerColor.medium)
        valueGradient.addColorStop(0.5, pointerColor.light)
        valueGradient.addColorStop(1, pointerColor.medium)
      }
      context.fillStyle = valueGradient
      context.fillRect(x, level, width, bottom - level)

      const valueHighlight = createLinearGradientSafe(
        context,
        x,
        level,
        x + width,
        level,
        innerLight
      )
      if (typeof valueHighlight !== 'string') {
        valueHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.35)')
        valueHighlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)')
        valueHighlight.addColorStop(1, 'rgba(255, 255, 255, 0.35)')
      }
      context.fillStyle = valueHighlight
      context.fillRect(x + width * 0.15, level, width * 0.7, bottom - level)
    } else {
      const tubeX = area.innerX + area.innerWidth * 0.5
      const tubeWidth = area.innerWidth * 0.0486
      const tubeHalf = tubeWidth * 0.5
      const bulbRadius = area.innerWidth * 0.12

      const tube = createLinearGradientSafe(
        context,
        tubeX - tubeHalf,
        top,
        tubeX + tubeHalf,
        top,
        pointerColor.medium
      )
      if (typeof tube !== 'string') {
        tube.addColorStop(0, pointerColor.dark)
        tube.addColorStop(0.5, pointerColor.light)
        tube.addColorStop(1, pointerColor.dark)
      }
      context.fillStyle = tube
      context.fillRect(tubeX - tubeHalf, level, tubeWidth, bottom - level)

      context.beginPath()
      context.arc(tubeX, bottom, bulbRadius, 0, Math.PI * 2)
      const bulb = createRadialGradientSafe(
        context,
        tubeX - bulbRadius * 0.2,
        bottom - bulbRadius * 0.2,
        0,
        tubeX,
        bottom,
        bulbRadius,
        pointerColor.medium
      )
      if (typeof bulb !== 'string') {
        bulb.addColorStop(0, pointerColor.light)
        bulb.addColorStop(0.5, pointerColor.medium)
        bulb.addColorStop(1, pointerColor.dark)
      }
      context.fillStyle = bulb
      context.fill()
    }
  } else {
    const left = area.innerX + area.innerWidth * scaleConstants.start
    const right = area.innerX + area.innerWidth * scaleConstants.end
    const level =
      area.innerX + area.innerWidth * (scaleConstants.start + pointerUnit * scaleConstants.yRange)

    if (config.style.gaugeType === 'type1') {
      const y = area.innerY + area.innerHeight * 0.435714
      const height = area.innerHeight * 0.15

      context.fillStyle = 'rgba(255, 255, 255, 0.08)'
      context.fillRect(left, y, right - left, height)

      const border = createLinearGradientSafe(context, left, y, left, y + height, innerDark)
      if (typeof border !== 'string') {
        border.addColorStop(0, 'rgba(255, 255, 255, 0.15)')
        border.addColorStop(0.5, innerDark)
        border.addColorStop(1, 'rgba(255, 255, 255, 0.15)')
      }
      context.strokeStyle = border
      context.lineWidth = 1
      if (typeof context.strokeRect === 'function') {
        context.strokeRect(left, y, right - left, height)
      }

      const valueGradient = createLinearGradientSafe(
        context,
        left,
        y,
        left,
        y + height,
        pointerColor.medium
      )
      if (typeof valueGradient !== 'string') {
        valueGradient.addColorStop(0, pointerColor.medium)
        valueGradient.addColorStop(0.5, pointerColor.light)
        valueGradient.addColorStop(1, pointerColor.medium)
      }
      context.fillStyle = valueGradient
      context.fillRect(left, y, level - left, height)

      const valueHighlight = createLinearGradientSafe(
        context,
        left,
        y,
        left,
        y + height,
        innerLight
      )
      if (typeof valueHighlight !== 'string') {
        valueHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.35)')
        valueHighlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)')
        valueHighlight.addColorStop(1, 'rgba(255, 255, 255, 0.35)')
      }
      context.fillStyle = valueHighlight
      context.fillRect(left, y + height * 0.15, level - left, height * 0.7)
    } else {
      const tubeY = area.innerY + area.innerHeight * 0.5
      const tubeHeight = area.innerHeight * 0.053
      const tubeHalf = tubeHeight * 0.5
      const bulbRadius = area.innerHeight * 0.12

      const tube = createLinearGradientSafe(
        context,
        left,
        tubeY - tubeHalf,
        left,
        tubeY + tubeHalf,
        pointerColor.medium
      )
      if (typeof tube !== 'string') {
        tube.addColorStop(0, pointerColor.dark)
        tube.addColorStop(0.5, pointerColor.light)
        tube.addColorStop(1, pointerColor.dark)
      }
      context.fillStyle = tube
      context.fillRect(left, tubeY - tubeHalf, level - left, tubeHeight)

      const bulbX = left
      const bulbY = tubeY
      context.beginPath()
      context.arc(bulbX, bulbY, bulbRadius, 0, Math.PI * 2)
      const bulb = createRadialGradientSafe(
        context,
        bulbX - bulbRadius * 0.2,
        bulbY - bulbRadius * 0.2,
        0,
        bulbX,
        bulbY,
        bulbRadius,
        pointerColor.medium
      )
      if (typeof bulb !== 'string') {
        bulb.addColorStop(0, pointerColor.light)
        bulb.addColorStop(0.5, pointerColor.medium)
        bulb.addColorStop(1, pointerColor.dark)
      }
      context.fillStyle = bulb
      context.fill()
    }
  }
}

const drawStatusLayers = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  area: LinearRenderArea
): void => {
  const scaleConstants = resolveLinearScaleConstants(config)

  if (config.indicators.ledVisible) {
    const ledX = config.scale.vertical
      ? area.innerX + area.innerWidth * 0.5
      : area.innerX + area.innerWidth * 0.89
    const ledY = config.scale.vertical
      ? area.innerY + area.innerHeight * (config.style.gaugeType === 'type2' ? 0.038 : 0.053)
      : area.innerY + area.innerHeight * 0.5
    const ledRadius = Math.min(area.innerWidth, area.innerHeight) * 0.045
    const led = createLinearGradientSafe(
      context,
      ledX,
      ledY - ledRadius,
      ledX,
      ledY + ledRadius,
      '#c00000'
    )
    if (typeof led !== 'string') {
      led.addColorStop(0, '#ff9f9f')
      led.addColorStop(0.2, '#ff3535')
      led.addColorStop(1, '#650000')
    }
    context.fillStyle = led
    context.beginPath()
    context.arc(ledX, ledY, ledRadius, 0, Math.PI * 2)
    context.fill()
  }

  const drawMeasuredMarker = (value: number, color: string): void => {
    const position = mapRange(
      clamp(value, config.value.min, config.value.max),
      config.value,
      { min: 0, max: 1 },
      { clampInput: true }
    )

    context.fillStyle = color
    context.beginPath()
    if (config.scale.vertical) {
      const y =
        area.innerY + area.innerHeight * (scaleConstants.yOffset - position * scaleConstants.yRange)
      const x = area.innerX + area.innerWidth * 0.31
      context.moveTo(x, y)
      context.lineTo(x + area.innerWidth * 0.03, y - area.innerHeight * 0.014)
      context.lineTo(x + area.innerWidth * 0.03, y + area.innerHeight * 0.014)
    } else {
      const x =
        area.innerX + area.innerWidth * (scaleConstants.start + position * scaleConstants.yRange)
      const y = area.innerY + area.innerHeight * 0.65
      context.moveTo(x, y)
      context.lineTo(x - area.innerWidth * 0.015, y + area.innerHeight * 0.03)
      context.lineTo(x + area.innerWidth * 0.015, y + area.innerHeight * 0.03)
    }
    closePathSafe(context)
    context.fill()
  }

  if (config.indicators.minMeasuredValueVisible) {
    drawMeasuredMarker(config.indicators.minMeasuredValue ?? config.value.min, '#003dff')
  }

  if (config.indicators.maxMeasuredValueVisible) {
    drawMeasuredMarker(config.indicators.maxMeasuredValue ?? config.value.max, '#ff7a00')
  }
}

const drawLabels = (
  context: LinearDrawContext,
  config: LinearGaugeConfig,
  value: number,
  width: number,
  height: number,
  area: LinearRenderArea
): void => {
  context.fillStyle = LEGACY_BACKGROUND_TEXT[config.style.backgroundColor]
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  if (config.text.title) {
    context.font = `${Math.max(11, Math.round(width * 0.09))}px serif`
    context.fillText(config.text.title, width / 2, height * 0.08)
  }

  if (config.visibility.showLcd && typeof context.fillRect === 'function') {
    const lcdWidth = config.scale.vertical ? area.innerWidth * 0.571428 : area.innerWidth * 0.18
    const lcdHeight = config.scale.vertical ? area.innerHeight * 0.055 : area.innerHeight * 0.15
    const lcdX = config.scale.vertical
      ? area.innerX + (area.innerWidth - lcdWidth) / 2
      : area.innerX + area.innerWidth * 0.695
    const lcdY = config.scale.vertical
      ? area.innerY + area.innerHeight * 0.88
      : area.innerY + area.innerHeight * 0.22
    context.fillStyle = '#b4c0ae'
    context.fillRect(lcdX, lcdY, lcdWidth, lcdHeight)
    if (typeof context.strokeRect === 'function') {
      context.strokeStyle = 'rgba(20,20,20,0.45)'
      context.lineWidth = 1
      context.strokeRect(lcdX, lcdY, lcdWidth, lcdHeight)
    }
    context.fillStyle = '#1f2933'
    context.font = `${Math.max(11, Math.round(width * 0.11))}px serif`
    context.fillText(`${value.toFixed(2)}`, width / 2, lcdY + lcdHeight * 0.58)
    if (config.text.unit) {
      context.fillStyle = LEGACY_BACKGROUND_TEXT[config.style.backgroundColor]
      context.font = `${Math.max(9, Math.round(width * 0.075))}px serif`
      context.fillText(config.text.unit, width / 2, lcdY + lcdHeight + height * 0.03)
    }
  } else {
    context.font = `${Math.max(12, Math.round(width * 0.11))}px serif`
    const unitSuffix = config.text.unit ? ` ${config.text.unit}` : ''
    context.fillText(`${value.toFixed(2)}${unitSuffix}`, width / 2, height * 0.94)
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
  drawTicks(context, config, area)
  drawThreshold(context, config, area)
  drawLabels(context, config, value, width, height, area)
  drawStatusLayers(context, config, area)
  drawPointer(context, config, value, area)
  if (config.visibility.showForeground) {
    drawLegacyLinearForeground(context, area.frame)
  }

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
