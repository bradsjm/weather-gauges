import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { clamp } from '../math/range.js'
import {
  drawCompassBackground,
  drawCompassCustomImage,
  drawCompassFrame,
  getCompassBackgroundPalette
} from '../render/gauge-materials.js'
import { drawCompassForeground } from '../render/compass-foreground.js'
import { drawCompassLabels } from '../render/compass-labels.js'
import { drawCompassPointer, resolveCompassPointerColor } from '../render/compass-pointer.js'
import { drawCompassRose, drawCompassTickmarks } from '../render/compass-scales.js'
import { resolveGaugeHeadingAlerts, resolveGaugeToneFromAlerts } from '../render/gauge-alerts.js'
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

const normalizeHeading = (heading: number, min: number, max: number): number => {
  const span = max - min
  if (span <= 0) {
    return heading
  }

  const normalized = (((heading - min) % span) + span) % span
  return min + normalized
}

export const renderCompassGauge = (
  context: CompassDrawContext,
  config: CompassGaugeConfig,
  options: CompassRenderOptions = {}
): CompassRenderResult => {
  const paint = mergePaint(options.paint)
  const showHeadingReadout = options.showHeadingReadout ?? false
  const heading = normalizeHeading(
    clamp(options.heading ?? config.heading.current, config.heading.min, config.heading.max),
    config.heading.min,
    config.heading.max
  )

  const imageWidth = Math.min(config.size.width, config.size.height)
  const centerX = imageWidth / 2
  const centerY = imageWidth / 2
  const radius = Math.min(config.size.width, config.size.height) * 0.48

  const activeAlerts = resolveGaugeHeadingAlerts(heading, config.indicators.alerts)
  const tone = resolveGaugeToneFromAlerts(activeAlerts)
  const pointerColorName =
    tone === 'danger' ? 'RED' : tone === 'warning' ? 'ORANGE' : config.style.pointerColor

  const backgroundPalette = getCompassBackgroundPalette(config.style.backgroundColor)
  const canTransform =
    typeof context.translate === 'function' && typeof context.rotate === 'function'

  context.clearRect(0, 0, config.size.width, config.size.height)

  if (config.visibility.showFrame) {
    drawCompassFrame(context, config.style.frameDesign, centerX, centerY, imageWidth, imageWidth)
  }

  if (config.visibility.showBackground) {
    drawCompassBackground(context, config.style.backgroundColor, centerX, centerY, imageWidth)
  }

  const customLayer = config.style.customLayer as CanvasImageSource | null | undefined
  drawCompassCustomImage(context, customLayer ?? null, centerX, centerY, imageWidth, imageWidth)

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
        backgroundPalette.symbolColor
      )

      context.restore()
    } else {
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
        backgroundPalette.symbolColor
      )
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
    context.shadowOffsetX = imageWidth * 0.006
    context.shadowOffsetY = imageWidth * 0.006
    context.shadowBlur = imageWidth * 0.012
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
    context.lineTo(centerX, centerY - radius * 0.65)
    context.strokeStyle = rgb(resolveCompassPointerColor(pointerColorName).medium)
    context.lineWidth = Math.max(2, radius * 0.015)
    context.stroke()
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

  drawCompassLabels(context, config, paint, heading, showHeadingReadout, centerX, centerY, radius)

  return {
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
