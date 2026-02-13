import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import {
  drawCompassRose as drawSharedCompassRose,
  type CompassTickmarkConfig,
  drawCompassTickmarks,
  normalizeCompassHeadingForScale
} from '../render/compass-scales.js'
import { normalizeAngle360 } from '../render/gauge-angles.js'
import {
  drawGaugePointer,
  gaugePointerFamily,
  resolveGaugePointerColor
} from '../render/gauge-pointer.js'
import {
  drawGaugeRadialForegroundByType,
  drawRadialBackground,
  drawGaugeRadialFrameByDesign
} from '../render/gauge-materials.js'
import { drawGaugeCenterKnob } from '../render/gauge-knob.js'
import { drawGaugeSectionArcs } from '../render/gauge-sections.js'
import {
  getGaugeBackgroundPalette,
  rgbTupleToCss,
  type GaugeBackgroundPalette
} from '../render/gauge-color-palettes.js'
import { resolveGaugeHeadingAlerts, resolveGaugeToneFromAlerts } from '../render/gauge-alerts.js'
import {
  drawRadialLcdBox,
  drawRadialLcdValueText,
  resolveRadialLcdPalette
} from '../render/radial-lcd.js'
import {
  buildGaugeFont,
  configureGaugeTextLayout,
  drawGaugeText
} from '../render/gauge-text-primitives.js'
import { runGaugeRenderPipeline, type GaugeRenderContextContract } from '../render/pipeline.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type { WindDirectionAlert, WindDirectionGaugeConfig } from './schema.js'

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

type WindDirectionPipelineContext = GaugeRenderContextContract & {
  config: WindDirectionGaugeConfig
  paint: ThemePaint
  latest: number
  average: number
  palette: GaugeBackgroundPalette
}

const PI = Math.PI
const RAD_FACTOR = PI / 180

type CompassPointSymbolsTuple = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
]

const DEFAULT_POINT_SYMBOLS: CompassPointSymbolsTuple = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

const asCompassPointSymbols = (value: readonly string[]): CompassPointSymbolsTuple => {
  if (value.length === 8) {
    return value as CompassPointSymbolsTuple
  }

  return DEFAULT_POINT_SYMBOLS
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
  const tickConfig: CompassTickmarkConfig = {
    style: {
      degreeScale: config.visibility.showDegreeScale,
      pointSymbolsVisible: config.visibility.showPointSymbols,
      roseVisible: config.visibility.showRose
    },
    rose: {
      showDegreeLabels: config.visibility.showDegreeScale,
      showOrdinalMarkers: config.visibility.showPointSymbols
    }
  }

  drawCompassTickmarks(
    context,
    tickConfig,
    imageWidth,
    asCompassPointSymbols(config.style.pointSymbols),
    palette.labelColor,
    palette.symbolColor,
    { degreeScaleHalf: config.scale.degreeScaleHalf }
  )
}

const formatWindHeadingText = (heading: number, degreeScaleHalf: boolean): string => {
  const normalized = normalizeCompassHeadingForScale(heading, degreeScaleHalf)
  if (degreeScaleHalf) {
    return String(normalized)
  }

  return String(normalized).padStart(3, '0')
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
  drawRadialLcdValueText({
    context,
    text: formatWindHeadingText(Math.round(latest), config.scale.degreeScaleHalf),
    x: lcdX,
    y: lcdY1,
    width: lcdWidth,
    height: lcdHeight,
    textColor: lcdPalette.text,
    fontSize: lcdWidth * 0.25,
    fontFamily: config.style.digitalFont ? 'monospace, sans-serif' : 'Arial, sans-serif',
    align: 'center',
    baseline: 'middle'
  })

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
  drawRadialLcdValueText({
    context,
    text: formatWindHeadingText(Math.round(average), config.scale.degreeScaleHalf),
    x: lcdX,
    y: lcdY2,
    width: lcdWidth,
    height: lcdHeight,
    textColor: lcdPalette.text,
    fontSize: lcdWidth * 0.25,
    fontFamily: config.style.digitalFont ? 'monospace, sans-serif' : 'Arial, sans-serif',
    align: 'center',
    baseline: 'middle'
  })
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
    family: gaugePointerFamily.wind
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
    family: gaugePointerFamily.wind
  })

  // Clear shadow after drawing
  context.shadowColor = 'transparent'
  context.shadowOffsetX = 0
  context.shadowOffsetY = 0
  context.shadowBlur = 0

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

  const latest = normalizeAngle360(options.latest ?? config.value.latest)
  const average = normalizeAngle360(options.average ?? config.value.average)
  const palette = getWindBackgroundPalette(config.style.backgroundColor)

  context.clearRect(0, 0, width, height)

  const pipelineContext: WindDirectionPipelineContext = {
    context,
    config,
    paint,
    latest,
    average,
    palette,
    width,
    height,
    centerX,
    centerY,
    radius
  }

  runGaugeRenderPipeline(pipelineContext, {
    drawFrame: () => {
      if (!config.visibility.showFrame) {
        return
      }

      drawGaugeRadialFrameByDesign(
        context,
        config.style.frameDesign,
        centerX,
        centerY,
        Math.min(width, height) / 2
      )
    },
    drawBackground: () => {
      if (!config.visibility.showBackground) {
        return
      }

      drawRadialBackground(
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
        drawGaugeSectionArcs(
          context,
          config.areas.map((section) => ({
            startDeg: section.start,
            stopDeg: section.stop,
            color: section.color
          })),
          {
            centerX,
            centerY,
            innerRadius: radius * 0.4,
            outerRadius: radius * 0.75,
            filled: true
          }
        )
      }

      if (config.sections.length > 0) {
        drawGaugeSectionArcs(
          context,
          config.sections.map((section) => ({
            startDeg: section.start,
            stopDeg: section.stop,
            color: section.color
          })),
          {
            centerX,
            centerY,
            innerRadius: radius * 0.4,
            outerRadius: radius * 0.75
          }
        )
      }

      if (config.visibility.showRose) {
        drawSharedCompassRose(context, centerX, centerY, width, height, palette.symbolColor)
      }

      if (config.visibility.showDegreeScale || config.visibility.showPointSymbols) {
        drawWindDirectionCompassTicks(context, config, width, palette)
      }
    },
    drawContent: () => {
      if (config.visibility.showLcd) {
        drawLcds(context, config, centerX, centerY, width, latest, average)
      }

      drawPointers(context, config, centerX, centerY, width, latest, average)
    },
    drawForeground: () => {
      if (!config.visibility.showForeground) {
        return
      }

      drawGaugeRadialForegroundByType(
        context,
        config.style.foregroundType,
        centerX,
        centerY,
        width / 2
      )

      const showKnob = !['type15', 'type16'].includes(config.style.pointerLatest.type)
      if (showKnob) {
        drawGaugeCenterKnob(context, width, config.style.knobType, config.style.knobStyle)
      }
    }
  })

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
