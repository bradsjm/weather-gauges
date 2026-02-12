import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import {
  drawCompassRose as drawSharedCompassRose,
  drawCompassTickmarks
} from '../render/compass-scales.js'
import { drawGaugePointer, resolveGaugePointerColor } from '../render/gauge-pointer.js'
import {
  drawGaugeRadialForegroundByType,
  drawGaugeRadialBackgroundByStyle,
  drawGaugeRadialFrameByDesign
} from '../render/gauge-materials.js'
import { drawCompassCenterKnob } from '../render/compass-foreground.js'
import {
  getGaugeBackgroundPalette,
  rgbTupleToCss,
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
import {
  buildGaugeFont,
  configureGaugeTextLayout,
  drawGaugeText
} from '../render/gauge-text-primitives.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type { CompassGaugeConfig } from '../compass/schema.js'
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

const PI = Math.PI
const TWO_PI = Math.PI * 2
const HALF_PI = Math.PI / 2
const RAD_FACTOR = PI / 180

const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360
}

const getWindBackgroundPalette = (
  backgroundColor: WindDirectionGaugeConfig['style']['backgroundColor']
): GaugeBackgroundPalette => {
  return getGaugeBackgroundPalette(backgroundColor)
}

const drawWindDirectionCompassTicks = (
  context: WindDirectionDrawContext,
  config: WindDirectionGaugeConfig,
  imageWidth: number,
  palette: GaugeBackgroundPalette
): void => {
  const tickConfig = {
    style: {
      degreeScale: config.visibility.showDegreeScale,
      pointSymbolsVisible: config.visibility.showPointSymbols,
      roseVisible: config.visibility.showRose
    },
    rose: {
      showDegreeLabels: config.visibility.showDegreeScale,
      showOrdinalMarkers: config.visibility.showPointSymbols
    }
  } as unknown as CompassGaugeConfig

  drawCompassTickmarks(
    context,
    tickConfig,
    imageWidth,
    config.style.pointSymbols as unknown as readonly [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string
    ],
    palette.labelColor,
    palette.symbolColor
  )
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
  configureGaugeTextLayout(context, {
    color,
    font: buildGaugeFont(width * 0.12, 'Arial, sans-serif', 'bold'),
    align: 'center',
    baseline: 'middle'
  })
  drawGaugeText(context, title, x + width / 2, y)
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
  configureGaugeTextLayout(context, {
    color: textColor,
    font: buildGaugeFont(width * 0.25, digitalFont ? 'monospace, sans-serif' : 'Arial, sans-serif'),
    align: 'center',
    baseline: 'middle'
  })

  const valueStr = value.toFixed(0).padStart(3, '0')
  drawGaugeText(context, valueStr, x + width / 2, y + height / 2)

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
    ? rgbTupleToCss(resolveGaugePointerColor(config.style.pointerLatest.color).medium)
    : lcdPalette.text
  const averageTitleColor = config.style.useColorLabels
    ? rgbTupleToCss(resolveGaugePointerColor(config.style.pointerAverage.color).medium)
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
  drawGaugePointer({
    context,
    pointerType: config.style.pointerAverage.type,
    pointerColor: resolveGaugePointerColor(config.style.pointerAverage.color),
    imageWidth,
    family: 'wind'
  })

  // Step 3: Calculate and apply RELATIVE rotation for latest
  // CRITICAL: Subtract current rotation to get relative angle
  const relativeAngle = (latestAngle - averageAngle) * RAD_FACTOR
  context.rotate(relativeAngle)

  // Step 4: Draw latest pointer
  drawGaugePointer({
    context,
    pointerType: config.style.pointerLatest.type,
    pointerColor: resolveGaugePointerColor(config.style.pointerLatest.color),
    imageWidth,
    family: 'wind'
  })

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
      rgbTupleToCss(palette.labelColor)
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

    if (config.visibility.showDegreeScale || config.visibility.showPointSymbols) {
      drawWindDirectionCompassTicks(context, config, width, palette)
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
