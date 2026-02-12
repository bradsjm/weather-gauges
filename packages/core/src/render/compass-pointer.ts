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

export const resolveCompassPointerColor = (name: CompassPointerColorName): PointerColor => {
  const palette = resolveGaugePointerPalette(name)
  return {
    light: palette.light,
    medium: palette.medium,
    dark: palette.dark
  }
}

export const drawCompassPointer = (
  context: RadialDrawContext,
  pointerType: CompassPointerType,
  pointerColor: PointerColor,
  imageWidth: number
): void => {
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

  switch (pointerType) {
    case 'type2': {
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
      context.strokeStyle = rgbTupleToCss(pointerColor.dark)
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
      break
    }
    case 'type3': {
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
      context.strokeStyle = rgbTupleToCss(pointerColor.dark)
      context.stroke()
      break
    }
    case 'type1':
    default: {
      context.beginPath()
      context.moveTo(0.5 * imageWidth, 0.495327 * imageWidth)
      context.lineTo(0.528037 * imageWidth, 0.495327 * imageWidth)
      context.lineTo(0.5 * imageWidth, 0.149532 * imageWidth)
      context.lineTo(0.471962 * imageWidth, 0.495327 * imageWidth)
      closePathSafe(context)
      context.fillStyle = pointerGradient
      context.fill()
      context.strokeStyle = rgbTupleToCss(pointerColor.dark)
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
      break
    }
  }

  context.restore()
}
