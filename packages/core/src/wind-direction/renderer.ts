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
import { drawRadialLcd, resolveRadialLcdPalette } from '../render/radial-lcd.js'
import {
  buildGaugeFont,
  configureGaugeTextLayout,
  drawGaugeText
} from '../render/gauge-text-primitives.js'
import {
  createStaticLayerCache,
  resizeStaticLayerCache,
  type StaticLayerCache
} from '../render/static-layer-cache.js'
import { drawOverlayLayer, resolveOverlayLayerSignature } from '../render/overlay-layer.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type { WindDirectionAlert, WindDirectionGaugeConfig } from './schema.js'

export type WindDirectionDrawContext = CanvasRenderingContext2D

export type WindDirectionRenderResult = {
  reading: number
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

const windDirectionStaticLayerCaches = new WeakMap<WindDirectionDrawContext, StaticLayerCache>()
const windDirectionStaticLayerUnavailable = new WeakSet<WindDirectionDrawContext>()

const getWindDirectionStaticLayerCache = (
  context: WindDirectionDrawContext,
  width: number,
  height: number
): StaticLayerCache | null => {
  if (windDirectionStaticLayerUnavailable.has(context)) {
    return null
  }

  const existing = windDirectionStaticLayerCaches.get(context)
  if (existing !== undefined) {
    resizeStaticLayerCache(existing, width, height)
    return existing
  }

  const created = createStaticLayerCache(width, height)
  if (created === null) {
    windDirectionStaticLayerUnavailable.add(context)
    return null
  }

  windDirectionStaticLayerCaches.set(context, created)
  return created
}

const resolveWindDirectionStaticLayerSignature = (
  config: WindDirectionGaugeConfig,
  paint: ThemePaint
): string => {
  return JSON.stringify({
    size: config.size,
    style: {
      frameDesign: config.style.frameDesign,
      foregroundType: config.style.foregroundType,
      knobType: config.style.knobType,
      knobStyle: config.style.knobStyle,
      backgroundColor: config.style.backgroundColor,
      pointSymbols: config.style.pointSymbols,
      customLayer: resolveOverlayLayerSignature(config.style.customLayer),
      pointerLatest: config.style.pointerLatest
    },
    visibility: config.visibility,
    scale: config.scale,
    sections: config.sections,
    areas: config.areas,
    paint
  })
}

const drawWindDirectionStaticLayer = (
  context: WindDirectionDrawContext,
  config: WindDirectionGaugeConfig,
  paint: ThemePaint,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  palette: GaugeBackgroundPalette
): void => {
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

    drawOverlayLayer(context, config.style.customLayer, {
      canvasWidth: width,
      canvasHeight: height
    })

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
  }

  if (config.visibility.showForeground) {
    drawGaugeRadialForegroundByType(
      context,
      config.style.foregroundType,
      centerX,
      centerY,
      width / 2
    )

    const showKnob = !['ornate-ring-base-needle', 'ring-base-bar-tail-needle'].includes(
      config.style.pointerLatest.type
    )
    if (showKnob) {
      drawGaugeCenterKnob(context, width, config.style.knobType, config.style.knobStyle)
    }
  }
}

const drawWindDirectionDynamicLayer = (
  context: WindDirectionDrawContext,
  config: WindDirectionGaugeConfig,
  centerX: number,
  centerY: number,
  width: number,
  paint: ThemePaint,
  latest: number,
  average: number
): void => {
  if (config.visibility.showLcd) {
    drawLcds(context, config, centerX, centerY, width, paint, latest, average)
  }

  drawPointers(context, config, centerX, centerY, width, latest, average)
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
    {
      degreeScaleHalf: config.scale.degreeScaleHalf,
      showTickmarks: config.visibility.showTickmarks
    }
  )
}

const formatWindHeadingText = (heading: number, degreeScaleHalf: boolean): string => {
  const normalized = normalizeCompassHeadingForScale(heading, degreeScaleHalf)
  if (degreeScaleHalf) {
    return `${String(normalized)}°`
  }

  return `${String(normalized).padStart(3, '0')}°`
}

const drawLcdTitle = (
  context: WindDirectionDrawContext,
  title: string,
  x: number,
  y: number,
  width: number,
  size: number,
  color: string
): void => {
  context.save()
  configureGaugeTextLayout(context, {
    color,
    font: buildGaugeFont(Math.max(12, Math.round(size * 0.046728)), 'Arial, sans-serif', 'bold'),
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
  paint: ThemePaint,
  latest: number,
  average: number
): void => {
  const lcdPalette = resolveRadialLcdPalette(config.style.lcdColor)
  const lcdWidth = imageWidth * 0.32
  const lcdHeight = imageWidth * 0.11
  const lcdCenterOffset = imageWidth * 0.125
  // Symmetric vertical distribution: one LCD above center, one below center
  const lcdX = centerX - lcdWidth / 2
  const lcdY1 = centerY - lcdCenterOffset - lcdHeight / 2
  const lcdY2 = centerY + lcdCenterOffset - lcdHeight / 2

  // Determine title colors based on useColorLabels setting
  const latestTitleColor = config.style.useColorLabels
    ? rgbTupleToCss(resolveGaugePointerColor(config.style.pointerLatest.color).medium)
    : lcdPalette.text
  const averageTitleColor = config.style.useColorLabels
    ? rgbTupleToCss(resolveGaugePointerColor(config.style.pointerAverage.color).medium)
    : lcdPalette.text

  // Latest LCD (top)
  drawRadialLcd(
    context,
    config.style.lcdColor,
    config.style.digitalFont,
    0,
    latest,
    imageWidth,
    paint,
    {
      x: lcdX,
      y: lcdY1,
      text: formatWindHeadingText(Math.round(latest), config.scale.degreeScaleHalf),
      align: 'center'
    }
  )
  if (config.lcdTitles.latest) {
    drawLcdTitle(
      context,
      config.lcdTitles.latest,
      lcdX,
      lcdY1 - lcdHeight * 0.35,
      lcdWidth,
      imageWidth,
      latestTitleColor
    )
  }
  // Average LCD (bottom)
  drawRadialLcd(
    context,
    config.style.lcdColor,
    config.style.digitalFont,
    0,
    average,
    imageWidth,
    paint,
    {
      x: lcdX,
      y: lcdY2,
      text: formatWindHeadingText(Math.round(average), config.scale.degreeScaleHalf),
      align: 'center'
    }
  )
  if (config.lcdTitles.average) {
    drawLcdTitle(
      context,
      config.lcdTitles.average,
      lcdX,
      lcdY2 + lcdHeight * 1.35,
      lcdWidth,
      imageWidth,
      averageTitleColor
    )
  }
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
  const staticLayerSignature = resolveWindDirectionStaticLayerSignature(config, paint)

  context.clearRect(0, 0, width, height)

  const staticLayerCache = getWindDirectionStaticLayerCache(context, width, height)
  if (staticLayerCache !== null) {
    if (staticLayerCache.signature !== staticLayerSignature) {
      drawWindDirectionStaticLayer(
        staticLayerCache.context,
        config,
        paint,
        width,
        height,
        centerX,
        centerY,
        radius,
        palette
      )
      staticLayerCache.signature = staticLayerSignature
    }

    context.drawImage(staticLayerCache.canvas, 0, 0)
  } else {
    drawWindDirectionStaticLayer(
      context,
      config,
      paint,
      width,
      height,
      centerX,
      centerY,
      radius,
      palette
    )
  }

  drawWindDirectionDynamicLayer(context, config, centerX, centerY, width, paint, latest, average)

  const activeAlerts = resolveGaugeHeadingAlerts<WindDirectionAlert>(
    latest,
    config.indicators.alerts
  )
  const tone = resolveGaugeToneFromAlerts(activeAlerts)

  return {
    reading: average,
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
