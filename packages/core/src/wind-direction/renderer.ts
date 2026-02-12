import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { drawCompassRose as drawSharedCompassRose } from '../render/compass-scales.js'
import {
  drawGaugeRadialForegroundByType,
  drawGaugeRadialBackgroundByStyle,
  drawGaugeRadialFrameByDesign
} from '../render/gauge-materials.js'
import { drawCompassCenterKnob } from '../render/compass-foreground.js'
import {
  getGaugeBackgroundPalette,
  resolveGaugePointerPalette,
  type GaugeBackgroundPalette
} from '../render/gauge-color-palettes.js'
import {
  addColorStops,
  closePathSafe,
  createLinearGradientSafe,
  createRadialGradientSafe
} from '../render/gauge-canvas-primitives.js'
import { resolveGaugeHeadingAlerts, resolveGaugeToneFromAlerts } from '../render/gauge-alerts.js'
import { drawRadialLcdBox, resolveRadialLcdPalette } from '../render/radial-lcd.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type {
  WindDirectionAlert,
  WindDirectionGaugeConfig,
  WindDirectionPointer,
  WindDirectionSection
} from './schema.js'

export type WindDirectionDrawContext = CanvasRenderingContext2D

export type WindDirectionRenderResult = {
  latest: number
  average: number
  tone: 'accent' | 'warning' | 'danger'
  activeAlerts: WindDirectionAlert[]
}

export type WindDirectionRenderOptions = {
  latest?: number
  average?: number
  paint?: Partial<ThemePaint>
}

export type WindDirectionAnimationOptions = {
  context: WindDirectionDrawContext
  config: WindDirectionGaugeConfig
  fromLatest: number
  toLatest: number
  fromAverage: number
  toAverage: number
  paint?: Partial<ThemePaint>
  onFrame?: (result: WindDirectionRenderResult) => void
  onComplete?: (result: WindDirectionRenderResult) => void
}

type Rgb = readonly [number, number, number]

const PI = Math.PI
const TWO_PI = Math.PI * 2
const HALF_PI = Math.PI / 2
const RAD_FACTOR = PI / 180

const rgb = (value: Rgb): string => `rgb(${value[0]},${value[1]},${value[2]})`

const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360
}

const getWindBackgroundPalette = (
  backgroundColor: WindDirectionGaugeConfig['style']['backgroundColor']
): GaugeBackgroundPalette => {
  return getGaugeBackgroundPalette(backgroundColor)
}

const drawPointSymbols = (
  context: WindDirectionDrawContext,
  pointSymbols: string[],
  centerX: number,
  centerY: number,
  imageWidth: number,
  palette: GaugeBackgroundPalette
): void => {
  context.save()
  context.translate(centerX, centerY)
  context.fillStyle = rgb(palette.symbolColor)
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  // Cardinal directions (N, S, E, W)
  const cardinalAngles = [270, 90, 0, 180] as const
  const cardinalSymbols = [pointSymbols[0], pointSymbols[4], pointSymbols[2], pointSymbols[6]]

  context.font = `${0.12 * imageWidth}px serif`

  for (let i = 0; i < 4; i++) {
    const angle = cardinalAngles[i]! * RAD_FACTOR
    const symbol = cardinalSymbols[i]

    if (symbol) {
      context.save()
      context.rotate(angle)
      context.translate(0, -0.35 * imageWidth)
      context.rotate(HALF_PI)
      context.fillText(symbol, 0, 0)
      context.restore()
    }
  }

  // Intercardinal directions (NE, SE, SW, NW)
  const intercardinalAngles = [315, 45, 135, 225] as const
  const intercardinalSymbols = [pointSymbols[1], pointSymbols[3], pointSymbols[5], pointSymbols[7]]

  context.font = `${0.06 * imageWidth}px serif`

  for (let i = 0; i < 4; i++) {
    const angle = intercardinalAngles[i]! * RAD_FACTOR
    const symbol = intercardinalSymbols[i]

    if (symbol) {
      context.save()
      context.rotate(angle)
      context.translate(0, -0.29 * imageWidth)
      context.rotate(HALF_PI)
      context.fillText(symbol, 0, 0)
      context.restore()
    }
  }

  context.restore()
}

const drawDegreeScale = (
  context: WindDirectionDrawContext,
  centerX: number,
  centerY: number,
  imageWidth: number,
  imageHeight: number,
  degreeScaleHalf: boolean,
  palette: GaugeBackgroundPalette
): void => {
  context.save()
  context.translate(centerX, centerY)
  context.strokeStyle = rgb(palette.symbolColor)
  context.fillStyle = rgb(palette.symbolColor)
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = `${0.06 * imageWidth}px serif`

  // Tick marks every 2.5 degrees (matching compass)
  for (let i = 0; i < 360; i += 2.5) {
    const angle = i * RAD_FACTOR
    const isMajor = i % 10 === 0
    const isMedium = i % 5 === 0

    context.save()
    context.rotate(angle)

    // Draw tick mark
    const innerR = isMajor ? 0.36 * imageWidth : isMedium ? 0.36 * imageWidth : 0.38 * imageWidth
    const outerR = 0.38 * imageWidth

    context.beginPath()
    context.moveTo(0, -innerR)
    context.lineTo(0, -outerR)
    context.lineWidth = isMajor ? 2 : isMedium ? 1.5 : 1
    context.stroke()

    // Draw degree label on major ticks (every 10°)
    if (isMajor) {
      // Handle degreeScaleHalf: wrap 180-360° to -180-0°
      let displayAngle = i
      if (degreeScaleHalf && i > 180) {
        displayAngle = i - 360
      }

      context.save()
      context.translate(0, -0.29 * imageWidth)
      context.rotate(HALF_PI)
      context.fillText(displayAngle.toString(), 0, 0)
      context.restore()
    }

    context.restore()
  }

  context.restore()
}

const drawLcdTitle = (
  context: WindDirectionDrawContext,
  title: string,
  x: number,
  y: number,
  width: number,
  color: string
): void => {
  context.save()
  context.fillStyle = color
  context.font = `bold ${width * 0.12}px Arial, sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(title, x + width / 2, y)
  context.restore()
}

const drawLcdValue = (
  context: WindDirectionDrawContext,
  value: number,
  x: number,
  y: number,
  width: number,
  height: number,
  textColor: string,
  digitalFont: boolean
): void => {
  context.save()
  context.fillStyle = textColor
  context.font = `${width * 0.25}px ${digitalFont ? 'monospace' : 'Arial'}, sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  const valueStr = value.toFixed(0).padStart(3, '0')
  context.fillText(valueStr, x + width / 2, y + height / 2)

  context.restore()
}

const drawLcds = (
  context: WindDirectionDrawContext,
  config: WindDirectionGaugeConfig,
  centerX: number,
  centerY: number,
  imageWidth: number,
  latest: number,
  average: number
): void => {
  const lcdPalette = resolveRadialLcdPalette(config.style.lcdColor)
  const lcdWidth = imageWidth * 0.25
  const lcdHeight = imageWidth * 0.09
  // Match v2 positioning: both LCDs centered horizontally, stacked vertically
  const lcdX = centerX - lcdWidth / 2
  const lcdY1 = centerY - imageWidth * 0.175 // Upper LCD (above center)
  const lcdY2 = centerY + imageWidth * 0.075 // Lower LCD (below center, avoiding knob overlap)

  // Determine title colors based on useColorLabels setting
  const latestTitleColor = config.style.useColorLabels
    ? rgb(resolveGaugePointerPalette(config.style.pointerLatest.color).medium)
    : lcdPalette.text
  const averageTitleColor = config.style.useColorLabels
    ? rgb(resolveGaugePointerPalette(config.style.pointerAverage.color).medium)
    : lcdPalette.text

  // Latest LCD (top)
  drawRadialLcdBox(context, lcdX, lcdY1, lcdWidth, lcdHeight, lcdPalette)
  if (config.lcdTitles.latest) {
    drawLcdTitle(
      context,
      config.lcdTitles.latest,
      lcdX,
      lcdY1 - lcdHeight * 0.15,
      lcdWidth,
      latestTitleColor
    )
  }
  drawLcdValue(
    context,
    latest,
    lcdX,
    lcdY1,
    lcdWidth,
    lcdHeight,
    lcdPalette.text,
    config.style.digitalFont
  )

  // Average LCD (bottom)
  drawRadialLcdBox(context, lcdX, lcdY2, lcdWidth, lcdHeight, lcdPalette)
  if (config.lcdTitles.average) {
    drawLcdTitle(
      context,
      config.lcdTitles.average,
      lcdX,
      lcdY2 - lcdHeight * 0.15,
      lcdWidth,
      averageTitleColor
    )
  }
  drawLcdValue(
    context,
    average,
    lcdX,
    lcdY2,
    lcdWidth,
    lcdHeight,
    lcdPalette.text,
    config.style.digitalFont
  )
}

const drawPointerShape = (
  context: WindDirectionDrawContext,
  pointer: WindDirectionPointer,
  imageWidth: number
): void => {
  const colors = resolveGaugePointerPalette(pointer.color)
  const pointerLength = imageWidth * 0.35
  const pointerWidth = imageWidth * 0.05

  context.beginPath()
  context.moveTo(0, -pointerLength)
  context.lineTo(pointerWidth / 2, pointerLength * 0.1)
  context.lineTo(0, pointerLength * 0.2)
  context.lineTo(-pointerWidth / 2, pointerLength * 0.1)
  closePathSafe(context)

  const gradient = addColorStops(
    createLinearGradientSafe(context, -pointerWidth, 0, pointerWidth, 0, rgb(colors.medium)),
    [
      [0, rgb(colors.dark)],
      [0.5, rgb(colors.medium)],
      [1, rgb(colors.light)]
    ]
  )

  context.fillStyle = gradient
  context.fill()
  context.strokeStyle = rgb(colors.dark)
  context.lineWidth = 1
  context.stroke()
}

const drawPointers = (
  context: WindDirectionDrawContext,
  config: WindDirectionGaugeConfig,
  centerX: number,
  centerY: number,
  imageWidth: number,
  latestAngle: number,
  averageAngle: number
): void => {
  context.save()
  context.translate(centerX, centerY)

  // Apply shadow effects before drawing pointers
  const shadowOffset = Math.max(2, imageWidth * 0.0075)
  context.shadowColor = 'rgba(0, 0, 0, 0.8)'
  context.shadowOffsetX = shadowOffset
  context.shadowOffsetY = shadowOffset
  context.shadowBlur = shadowOffset * 2

  // Step 1: Rotate to average position
  context.rotate(averageAngle * RAD_FACTOR)

  // Step 2: Draw average pointer
  drawPointerShape(context, config.style.pointerAverage, imageWidth)

  // Step 3: Calculate and apply RELATIVE rotation for latest
  // CRITICAL: Subtract current rotation to get relative angle
  const relativeAngle = (latestAngle - averageAngle) * RAD_FACTOR
  context.rotate(relativeAngle)

  // Step 4: Draw latest pointer
  drawPointerShape(context, config.style.pointerLatest, imageWidth)

  // Clear shadow after drawing
  context.shadowColor = 'transparent'
  context.shadowOffsetX = 0
  context.shadowOffsetY = 0
  context.shadowBlur = 0

  context.restore()
}

const drawSectionsAndAreas = (
  context: WindDirectionDrawContext,
  sections: WindDirectionSection[],
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  filled: boolean
): void => {
  if (sections.length === 0) return

  context.save()

  for (const section of sections) {
    const startAngle = (section.start - 90) * RAD_FACTOR
    const stopAngle = (section.stop - 90) * RAD_FACTOR

    context.beginPath()
    context.arc(centerX, centerY, outerRadius, startAngle, stopAngle)
    context.arc(centerX, centerY, innerRadius, stopAngle, startAngle, true)
    closePathSafe(context)

    if (filled) {
      context.fillStyle = section.color
      context.globalAlpha = 0.3
      context.fill()
      context.globalAlpha = 1
    }

    context.strokeStyle = section.color
    context.lineWidth = 2
    context.stroke()
  }

  context.restore()
}

export const renderWindDirectionGauge = (
  context: WindDirectionDrawContext,
  config: WindDirectionGaugeConfig,
  options: WindDirectionRenderOptions = {}
): WindDirectionRenderResult => {
  const { width, height } = config.size
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 4
  const paint = {
    ...resolveThemePaint(),
    ...options.paint
  }

  const latest = normalizeAngle(options.latest ?? config.value.latest)
  const average = normalizeAngle(options.average ?? config.value.average)
  const palette = getWindBackgroundPalette(config.style.backgroundColor)

  context.clearRect(0, 0, width, height)

  if (config.visibility.showFrame) {
    drawGaugeRadialFrameByDesign(
      context,
      config.style.frameDesign,
      centerX,
      centerY,
      Math.min(width, height) / 2
    )
  }

  if (config.visibility.showBackground) {
    drawGaugeRadialBackgroundByStyle(
      context,
      config.style.backgroundColor,
      width,
      centerX,
      centerY,
      Math.min(width, height) / 2,
      paint,
      rgb(palette.labelColor)
    )

    if (config.style.customLayer?.image && config.style.customLayer.visible) {
      context.drawImage(config.style.customLayer.image, 0, 0, width, height)
    }

    if (config.areas.length > 0) {
      drawSectionsAndAreas(
        context,
        config.areas,
        centerX,
        centerY,
        radius * 0.4,
        radius * 0.75,
        true
      )
    }

    if (config.sections.length > 0) {
      drawSectionsAndAreas(
        context,
        config.sections,
        centerX,
        centerY,
        radius * 0.4,
        radius * 0.75,
        false
      )
    }

    if (config.visibility.showRose) {
      drawSharedCompassRose(context, centerX, centerY, width, height, palette.symbolColor)
    }

    if (config.visibility.showDegreeScale) {
      drawDegreeScale(
        context,
        centerX,
        centerY,
        width,
        height,
        config.scale.degreeScaleHalf,
        palette
      )
    }

    if (config.visibility.showPointSymbols) {
      drawPointSymbols(context, config.style.pointSymbols, centerX, centerY, width, palette)
    }
  }

  if (config.visibility.showLcd) {
    drawLcds(context, config, centerX, centerY, width, latest, average)
  }

  drawPointers(context, config, centerX, centerY, width, latest, average)

  if (config.visibility.showForeground) {
    drawGaugeRadialForegroundByType(
      context,
      config.style.foregroundType,
      centerX,
      centerY,
      width / 2
    )

    const showKnob = !['type15', 'type16'].includes(config.style.pointerLatest.type)
    if (showKnob) {
      drawCompassCenterKnob(context, width, config.style.knobType, config.style.knobStyle)
    }
  }

  const activeAlerts = resolveGaugeHeadingAlerts<WindDirectionAlert>(
    latest,
    config.indicators.alerts
  )
  const tone = resolveGaugeToneFromAlerts(activeAlerts)

  return {
    latest,
    average,
    tone,
    activeAlerts
  }
}

export const animateWindDirectionGauge = (
  options: WindDirectionAnimationOptions
): AnimationRunHandle => {
  const scheduler = createAnimationScheduler()

  const renderWithValues = (latest: number, average: number): WindDirectionRenderResult => {
    return renderWindDirectionGauge(options.context, options.config, {
      latest,
      average,
      paint: options.paint ?? {}
    })
  }

  const durationMs = options.config.animation.enabled ? options.config.animation.durationMs : 0

  return scheduler.run({
    from: 0,
    to: 1,
    durationMs,
    easing: options.config.animation.easing,
    onUpdate: (sample) => {
      const t = sample.value
      const currentLatest = options.fromLatest + (options.toLatest - options.fromLatest) * t
      const currentAverage = options.fromAverage + (options.toAverage - options.fromAverage) * t
      const result = renderWithValues(currentLatest, currentAverage)
      options.onFrame?.(result)
    },
    onComplete: () => {
      const result = renderWithValues(options.toLatest, options.toAverage)
      options.onComplete?.(result)
    }
  })
}
