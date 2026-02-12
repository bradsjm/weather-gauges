import type { CompassPointerColorName, CompassPointerType } from '../compass/schema.js'
import type { RadialDrawContext } from '../radial/renderer.js'
import type { GaugePointerPalette } from './gauge-color-palettes.js'
import { resolveGaugePointerPalette, rgbTupleToCss } from './gauge-color-palettes.js'
import {
  addColorStops,
  closePathSafe,
  createLinearGradientSafe
} from './gauge-canvas-primitives.js'

type PointerColor = Pick<GaugePointerPalette, 'light' | 'medium' | 'dark'>

export type GaugePointerFamily = 'compass' | 'wind'

type DrawPointerOptions = {
  context: RadialDrawContext
  pointerType: CompassPointerType
  pointerColor: PointerColor
  imageWidth: number
  family: GaugePointerFamily
}

export const resolveGaugePointerColor = (name: CompassPointerColorName): PointerColor => {
  const palette = resolveGaugePointerPalette(name)
  return {
    light: palette.light,
    medium: palette.medium,
    dark: palette.dark
  }
}

const drawCompassType1 = (
  context: RadialDrawContext,
  imageWidth: number,
  pointerGradient: CanvasGradient | string,
  southGradient: CanvasGradient | string,
  strokeColor: string
): void => {
  context.beginPath()
  context.moveTo(0.5 * imageWidth, 0.495327 * imageWidth)
  context.lineTo(0.528037 * imageWidth, 0.495327 * imageWidth)
  context.lineTo(0.5 * imageWidth, 0.149532 * imageWidth)
  context.lineTo(0.471962 * imageWidth, 0.495327 * imageWidth)
  closePathSafe(context)
  context.fillStyle = pointerGradient
  context.fill()
  context.strokeStyle = strokeColor
  context.stroke()

  context.beginPath()
  context.moveTo(0.5 * imageWidth, 0.504672 * imageWidth)
  context.lineTo(0.528037 * imageWidth, 0.504672 * imageWidth)
  context.lineTo(0.5 * imageWidth, 0.850467 * imageWidth)
  context.lineTo(0.471962 * imageWidth, 0.504672 * imageWidth)
  closePathSafe(context)
  context.fillStyle = southGradient
  context.fill()
  context.strokeStyle = '#abb1b8'
  context.stroke()
}

const drawCompassType2 = (
  context: RadialDrawContext,
  imageWidth: number,
  pointerGradient: CanvasGradient | string,
  southGradient: CanvasGradient | string,
  strokeColor: string
): void => {
  context.beginPath()
  context.moveTo(0.518691 * imageWidth, 0.471962 * imageWidth)
  context.bezierCurveTo(
    0.514018 * imageWidth,
    0.317757 * imageWidth,
    0.528037 * imageWidth,
    0.200934 * imageWidth,
    0.5 * imageWidth,
    0.149532 * imageWidth
  )
  context.bezierCurveTo(
    0.471962 * imageWidth,
    0.200934 * imageWidth,
    0.485981 * imageWidth,
    0.317757 * imageWidth,
    0.481308 * imageWidth,
    0.471962 * imageWidth
  )
  context.bezierCurveTo(
    0.481308 * imageWidth,
    0.471962 * imageWidth,
    0.485981 * imageWidth,
    0.5 * imageWidth,
    0.5 * imageWidth,
    0.5 * imageWidth
  )
  context.bezierCurveTo(
    0.509345 * imageWidth,
    0.5 * imageWidth,
    0.518691 * imageWidth,
    0.471962 * imageWidth,
    0.518691 * imageWidth,
    0.471962 * imageWidth
  )
  closePathSafe(context)
  context.fillStyle = pointerGradient
  context.fill()
  context.strokeStyle = strokeColor
  context.stroke()

  context.beginPath()
  context.moveTo(0.518691 * imageWidth, 0.528037 * imageWidth)
  context.bezierCurveTo(
    0.523364 * imageWidth,
    0.682242 * imageWidth,
    0.509345 * imageWidth,
    0.799065 * imageWidth,
    0.5 * imageWidth,
    0.850467 * imageWidth
  )
  context.bezierCurveTo(
    0.490654 * imageWidth,
    0.799065 * imageWidth,
    0.476635 * imageWidth,
    0.682242 * imageWidth,
    0.481308 * imageWidth,
    0.528037 * imageWidth
  )
  context.bezierCurveTo(
    0.481308 * imageWidth,
    0.528037 * imageWidth,
    0.485981 * imageWidth,
    0.5 * imageWidth,
    0.5 * imageWidth,
    0.5 * imageWidth
  )
  context.bezierCurveTo(
    0.509345 * imageWidth,
    0.5 * imageWidth,
    0.518691 * imageWidth,
    0.528037 * imageWidth,
    0.518691 * imageWidth,
    0.528037 * imageWidth
  )
  closePathSafe(context)
  context.fillStyle = southGradient
  context.fill()
  context.strokeStyle = '#abb1b8'
  context.stroke()
}

const drawCompassType3 = (
  context: RadialDrawContext,
  imageWidth: number,
  pointerGradient: CanvasGradient | string,
  strokeColor: string
): void => {
  context.beginPath()
  context.moveTo(0.5 * imageWidth, 0.5 * imageWidth)
  context.bezierCurveTo(
    0.514018 * imageWidth,
    0.317757 * imageWidth,
    0.528037 * imageWidth,
    0.200934 * imageWidth,
    0.5 * imageWidth,
    0.149532 * imageWidth
  )
  context.bezierCurveTo(
    0.471962 * imageWidth,
    0.200934 * imageWidth,
    0.485981 * imageWidth,
    0.317757 * imageWidth,
    0.5 * imageWidth,
    0.5 * imageWidth
  )
  closePathSafe(context)
  context.fillStyle = pointerGradient
  context.fill()
  context.strokeStyle = strokeColor
  context.stroke()
}

const drawWindClassic = (
  context: RadialDrawContext,
  imageWidth: number,
  pointerGradient: CanvasGradient | string,
  strokeColor: string
): void => {
  const pointerLength = imageWidth * 0.35
  const pointerWidth = imageWidth * 0.05

  context.beginPath()
  context.moveTo(0, -pointerLength)
  context.lineTo(pointerWidth / 2, pointerLength * 0.1)
  context.lineTo(0, pointerLength * 0.2)
  context.lineTo(-pointerWidth / 2, pointerLength * 0.1)
  closePathSafe(context)

  context.fillStyle = pointerGradient
  context.fill()
  context.strokeStyle = strokeColor
  context.lineWidth = 1
  context.stroke()
}

const resolvePointerVariant = (
  pointerType: CompassPointerType,
  family: GaugePointerFamily
): 'compass1' | 'compass2' | 'compass3' | 'windClassic' => {
  if (family === 'wind') {
    if (pointerType === 'type2') {
      return 'compass2'
    }
    if (pointerType === 'type3') {
      return 'compass3'
    }

    // Preserve historical wind-direction behavior for default and
    // unimplemented pointer types: use wind classic geometry.
    return 'windClassic'
  }

  if (pointerType === 'type2') {
    return 'compass2'
  }
  if (pointerType === 'type3') {
    return 'compass3'
  }
  if (pointerType === 'type8') {
    return 'windClassic'
  }
  return 'compass1'
}

export const drawGaugePointer = ({
  context,
  pointerType,
  pointerColor,
  imageWidth,
  family
}: DrawPointerOptions): void => {
  context.save()
  context.lineCap = 'square'
  context.lineJoin = 'miter'
  context.lineWidth = 1

  const pointerGradient = addColorStops(
    createLinearGradientSafe(
      context,
      0.471962 * imageWidth,
      0,
      0.528036 * imageWidth,
      0,
      rgbTupleToCss(pointerColor.medium)
    ),
    [
      [0, rgbTupleToCss(pointerColor.light)],
      [0.46, rgbTupleToCss(pointerColor.light)],
      [0.47, rgbTupleToCss(pointerColor.medium)],
      [1, rgbTupleToCss(pointerColor.medium)]
    ]
  )

  const southGradient = addColorStops(
    createLinearGradientSafe(
      context,
      0.471962 * imageWidth,
      0,
      0.528036 * imageWidth,
      0,
      '#abb1b8'
    ),
    [
      [0, '#e3e5e8'],
      [0.48, '#e3e5e8'],
      [0.480099, '#abb1b8'],
      [1, '#abb1b8']
    ]
  )

  const strokeColor = rgbTupleToCss(pointerColor.dark)
  const variant = resolvePointerVariant(pointerType, family)

  // Wind-direction renderer draws pointers in a center-translated coordinate system.
  // Compass pointer geometries are authored in full-canvas coordinates.
  // Shift only compass-style variants so they stay centered in wind mode.
  if (family === 'wind' && variant !== 'windClassic') {
    context.translate(-0.5 * imageWidth, -0.5 * imageWidth)
  }

  if (variant === 'compass2') {
    drawCompassType2(context, imageWidth, pointerGradient, southGradient, strokeColor)
  } else if (variant === 'compass3') {
    drawCompassType3(context, imageWidth, pointerGradient, strokeColor)
  } else if (variant === 'windClassic') {
    drawWindClassic(context, imageWidth, pointerGradient, strokeColor)
  } else {
    drawCompassType1(context, imageWidth, pointerGradient, southGradient, strokeColor)
  }

  context.restore()
}
