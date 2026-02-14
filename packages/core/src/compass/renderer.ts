import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { clamp } from '../math/range.js'
import {
  drawCompassBackground,
  drawCompassFrame,
  getCompassBackgroundPalette
} from '../render/gauge-materials.js'
import { drawCompassForeground } from '../render/compass-foreground.js'
import { drawCompassLabels } from '../render/compass-labels.js'
import { drawCompassPointer, resolveCompassPointerColor } from '../render/compass-pointer.js'
import { normalizeAngleInRange } from '../render/gauge-angles.js'
import { drawCompassRose, drawCompassTickmarks } from '../render/compass-scales.js'
import { resolveGaugeHeadingAlerts, resolveGaugeToneFromAlerts } from '../render/gauge-alerts.js'
import {
  createStaticLayerCache,
  resizeStaticLayerCache,
  type StaticLayerCache
} from '../render/static-layer-cache.js'
import { drawOverlayLayer, resolveOverlayLayerSignature } from '../render/overlay-layer.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type { CompassAlert, CompassGaugeConfig } from './schema.js'
import {
  compassFallbackPointerMinLineWidth,
  compassGeometryRatios,
  compassShadowRatios
} from './constants.js'

export type CompassDrawContext = CanvasRenderingContext2D

export type CompassRenderResult = {
  reading: number
  heading: number
  tone: 'accent' | 'warning' | 'danger'
  activeAlerts: CompassAlert[]
}

export type CompassRenderOptions = {
  heading?: number
  paint?: Partial<ThemePaint>
  showHeadingReadout?: boolean
}

export type CompassAnimationOptions = {
  context: CompassDrawContext
  config: CompassGaugeConfig
  from: number
  to: number
  paint?: Partial<ThemePaint>
  showHeadingReadout?: boolean
  onFrame?: (result: CompassRenderResult) => void
  onComplete?: (result: CompassRenderResult) => void
}

const PI = Math.PI
const RAD_FACTOR = PI / 180

const mergePaint = (paint?: Partial<ThemePaint>): ThemePaint => ({
  ...resolveThemePaint(),
  ...paint
})

const rgb = (value: readonly [number, number, number]): string =>
  `rgb(${value[0]}, ${value[1]}, ${value[2]})`

const compassStaticLayerCaches = new WeakMap<CompassDrawContext, StaticLayerCache>()
const compassStaticLayerUnavailable = new WeakSet<CompassDrawContext>()

const getCompassStaticLayerCache = (
  context: CompassDrawContext,
  width: number,
  height: number
): StaticLayerCache | null => {
  if (compassStaticLayerUnavailable.has(context)) {
    return null
  }

  const existing = compassStaticLayerCaches.get(context)
  if (existing !== undefined) {
    resizeStaticLayerCache(existing, width, height)
    return existing
  }

  const created = createStaticLayerCache(width, height)
  if (created === null) {
    compassStaticLayerUnavailable.add(context)
    return null
  }

  compassStaticLayerCaches.set(context, created)
  return created
}

const resolveCompassStaticLayerSignature = (
  config: CompassGaugeConfig,
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
      rotateFace: config.style.rotateFace,
      roseVisible: config.style.roseVisible,
      showTickmarks: config.style.showTickmarks,
      customLayer: resolveOverlayLayerSignature(config.style.customLayer)
    },
    scale: config.scale,
    visibility: config.visibility,
    text: config.text,
    paint
  })
}

const drawCompassStaticLayer = (
  context: CompassDrawContext,
  config: CompassGaugeConfig,
  imageWidth: number,
  centerX: number,
  centerY: number,
  backgroundPalette: ReturnType<typeof getCompassBackgroundPalette>
): void => {
  context.clearRect(0, 0, config.size.width, config.size.height)

  if (config.visibility.showFrame) {
    drawCompassFrame(context, config.style.frameDesign, centerX, centerY, imageWidth, imageWidth)
  }

  if (config.visibility.showBackground) {
    drawCompassBackground(context, config.style.backgroundColor, centerX, centerY, imageWidth)
  }

  drawOverlayLayer(context, config.style.customLayer, {
    canvasWidth: imageWidth,
    canvasHeight: imageWidth,
    clipCircle: {
      centerX,
      centerY,
      radius: (0.831775 * imageWidth) / 2
    }
  })

  if (!config.style.rotateFace) {
    if (config.style.roseVisible && config.visibility.showBackground) {
      drawCompassRose(
        context,
        centerX,
        centerY,
        imageWidth,
        imageWidth,
        backgroundPalette.symbolColor
      )
    }

    drawCompassTickmarks(
      context,
      config,
      imageWidth,
      config.style.pointSymbols,
      backgroundPalette.labelColor,
      backgroundPalette.symbolColor,
      {
        degreeScaleHalf: config.scale.degreeScaleHalf,
        showTickmarks: config.style.showTickmarks
      }
    )
  }

  if (config.visibility.showForeground) {
    drawCompassForeground(
      context,
      config.style.foregroundType,
      imageWidth,
      imageWidth,
      config.style.knobType,
      config.style.knobStyle
    )
  }
}

const drawCompassDynamicLayer = (
  context: CompassDrawContext,
  config: CompassGaugeConfig,
  paint: ThemePaint,
  heading: number,
  showHeadingReadout: boolean,
  imageWidth: number,
  centerX: number,
  centerY: number,
  radius: number,
  pointerColorName: CompassGaugeConfig['style']['pointerColor'],
  backgroundPalette: ReturnType<typeof getCompassBackgroundPalette>,
  canTransform: boolean
): void => {
  if (canTransform) {
    if (config.style.rotateFace) {
      context.save()
      context.translate(centerX, centerY)
      context.rotate(-(heading * RAD_FACTOR))
      context.translate(-centerX, -centerY)

      if (config.style.roseVisible && config.visibility.showBackground) {
        drawCompassRose(
          context,
          centerX,
          centerY,
          imageWidth,
          imageWidth,
          backgroundPalette.symbolColor
        )
      }

      drawCompassTickmarks(
        context,
        config,
        imageWidth,
        config.style.pointSymbols,
        backgroundPalette.labelColor,
        backgroundPalette.symbolColor,
        {
          degreeScaleHalf: config.scale.degreeScaleHalf,
          showTickmarks: config.style.showTickmarks
        }
      )

      context.restore()
    }
  }

  if (canTransform) {
    context.save()
    context.translate(centerX, centerY)
    if (!config.style.rotateFace) {
      context.rotate(heading * RAD_FACTOR)
    }

    context.translate(-centerX, -centerY)
    context.shadowColor = 'rgba(0, 0, 0, 0.8)'
    context.shadowOffsetX = imageWidth * compassShadowRatios.pointerOffset
    context.shadowOffsetY = imageWidth * compassShadowRatios.pointerOffset
    context.shadowBlur = imageWidth * compassShadowRatios.pointerBlur
    drawCompassPointer(
      context,
      config.style.pointerType,
      resolveCompassPointerColor(pointerColorName),
      imageWidth
    )
    context.restore()
  } else {
    context.beginPath()
    context.moveTo(centerX, centerY)
    context.lineTo(centerX, centerY - radius * compassGeometryRatios.fallbackPointerLength)
    context.strokeStyle = rgb(resolveCompassPointerColor(pointerColorName).medium)
    context.lineWidth = Math.max(
      compassFallbackPointerMinLineWidth,
      radius * compassGeometryRatios.fallbackPointerLineWidth
    )
    context.stroke()
  }

  drawCompassLabels(context, config, paint, heading, showHeadingReadout, centerX, centerY, radius)
}

export const renderCompassGauge = (
  context: CompassDrawContext,
  config: CompassGaugeConfig,
  options: CompassRenderOptions = {}
): CompassRenderResult => {
  const paint = mergePaint(options.paint)
  const showHeadingReadout = options.showHeadingReadout ?? false
  const heading = normalizeAngleInRange(
    clamp(options.heading ?? config.heading.current, config.heading.min, config.heading.max),
    config.heading.min,
    config.heading.max
  )

  const imageWidth = Math.min(config.size.width, config.size.height)
  const centerX = imageWidth / 2
  const centerY = imageWidth / 2
  const radius = Math.min(config.size.width, config.size.height) * compassGeometryRatios.radius

  const activeAlerts = resolveGaugeHeadingAlerts(heading, config.indicators.alerts)
  const tone = resolveGaugeToneFromAlerts(activeAlerts)
  const pointerColorName =
    tone === 'danger' ? 'red' : tone === 'warning' ? 'orange' : config.style.pointerColor

  const backgroundPalette = getCompassBackgroundPalette(config.style.backgroundColor)
  const canTransform =
    typeof context.translate === 'function' && typeof context.rotate === 'function'
  const staticLayerSignature = resolveCompassStaticLayerSignature(config, paint)

  context.clearRect(0, 0, config.size.width, config.size.height)

  const staticLayerCache = getCompassStaticLayerCache(
    context,
    config.size.width,
    config.size.height
  )
  if (staticLayerCache !== null) {
    if (staticLayerCache.signature !== staticLayerSignature) {
      drawCompassStaticLayer(
        staticLayerCache.context,
        config,
        imageWidth,
        centerX,
        centerY,
        backgroundPalette
      )
      staticLayerCache.signature = staticLayerSignature
    }

    context.drawImage(staticLayerCache.canvas, 0, 0)
  } else {
    drawCompassStaticLayer(context, config, imageWidth, centerX, centerY, backgroundPalette)
  }

  drawCompassDynamicLayer(
    context,
    config,
    paint,
    heading,
    showHeadingReadout,
    imageWidth,
    centerX,
    centerY,
    radius,
    pointerColorName,
    backgroundPalette,
    canTransform
  )

  return {
    reading: heading,
    heading,
    tone,
    activeAlerts
  }
}

export const animateCompassGauge = (options: CompassAnimationOptions): AnimationRunHandle => {
  const scheduler = createAnimationScheduler()

  const renderWithHeading = (heading: number): CompassRenderResult => {
    return renderCompassGauge(options.context, options.config, {
      heading,
      ...(options.paint ? { paint: options.paint } : {}),
      ...(options.showHeadingReadout !== undefined
        ? { showHeadingReadout: options.showHeadingReadout }
        : {})
    })
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
