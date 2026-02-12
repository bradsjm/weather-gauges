import type { RadialBackgroundColorName, RadialFrameDesign } from '../radial/schema.js'
import type { ThemePaint } from '../theme/tokens.js'
import {
  drawLegacyRadialBackground,
  drawLegacyRadialForegroundTyped,
  drawLegacyRadialFrame,
  drawLegacyRadialFrameMetal,
  type RadialForegroundType
} from './legacy-materials.js'
import { createLinearGradientSafe, createRadialGradientSafe } from './gauge-canvas-primitives.js'

const TWO_PI = Math.PI * 2

const isChromeLikeFrame = (design: RadialFrameDesign): boolean => {
  return design === 'chrome' || design === 'blackMetal' || design === 'shinyMetal'
}

export const drawGaugeRadialFrameByDesign = (
  context: CanvasRenderingContext2D,
  frameDesign: RadialFrameDesign,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  if (isChromeLikeFrame(frameDesign)) {
    drawLegacyRadialFrame(context, centerX, centerY, radius)
    return
  }

  drawLegacyRadialFrameMetal(context, centerX, centerY, radius)
}

export const drawGaugeRadialBackgroundByStyle = (
  context: CanvasRenderingContext2D,
  backgroundColor: RadialBackgroundColorName,
  size: number,
  centerX: number,
  centerY: number,
  radius: number,
  paint: ThemePaint,
  textColor: string
): void => {
  const patchedPaint: ThemePaint = {
    ...paint,
    textColor,
    backgroundColor: paint.backgroundColor
  }

  if (backgroundColor === 'DARK_GRAY') {
    const dialRadius = radius * 0.866
    const dialGradient = createLinearGradientSafe(
      context,
      0,
      0.084112 * size,
      0,
      0.831775 * size,
      '#4b4b4b'
    )
    if (typeof dialGradient !== 'string') {
      dialGradient.addColorStop(0, 'rgb(0, 0, 0)')
      dialGradient.addColorStop(0.4, 'rgb(51, 51, 51)')
      dialGradient.addColorStop(1, 'rgb(153, 153, 153)')
    }
    context.fillStyle = dialGradient
    context.beginPath()
    context.arc(centerX, centerY, dialRadius, 0, TWO_PI)
    context.fill()

    const innerShadow = createRadialGradientSafe(
      context,
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      dialRadius,
      'rgba(0, 0, 0, 0)'
    )
    if (typeof innerShadow !== 'string') {
      innerShadow.addColorStop(0, 'rgba(0, 0, 0, 0)')
      innerShadow.addColorStop(0.7, 'rgba(0, 0, 0, 0)')
      innerShadow.addColorStop(0.71, 'rgba(0, 0, 0, 0)')
      innerShadow.addColorStop(0.86, 'rgba(0, 0, 0, 0.03)')
      innerShadow.addColorStop(0.92, 'rgba(0, 0, 0, 0.07)')
      innerShadow.addColorStop(0.97, 'rgba(0, 0, 0, 0.15)')
      innerShadow.addColorStop(1, 'rgba(0, 0, 0, 0.30)')
    }
    context.fillStyle = innerShadow
    context.beginPath()
    context.arc(centerX, centerY, dialRadius, 0, TWO_PI)
    context.fill()
    return
  }

  drawLegacyRadialBackground(context, patchedPaint, centerX, centerY, radius)
}

export const drawGaugeRadialForegroundByType = (
  context: CanvasRenderingContext2D,
  foregroundType: RadialForegroundType,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  drawLegacyRadialForegroundTyped(context, centerX, centerY, radius, foregroundType)
}
