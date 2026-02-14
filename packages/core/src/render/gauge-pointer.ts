import type { CompassPointerColorName } from '../compass/schema.js'
import type { PointerType } from '../pointers/types.js'
import type { GaugePointerPalette } from './gauge-color-palettes.js'
import { resolveGaugePointerPalette, rgbTupleToCss } from './gauge-color-palettes.js'
import {
  addColorStops,
  closePathSafe,
  createLinearGradientSafe,
  createRadialGradientSafe
} from './gauge-canvas-primitives.js'

type Canvas2DContext = CanvasRenderingContext2D

export const gaugePointerFamily = {
  compass: 'compass',
  wind: 'wind'
} as const

export type GaugePointerFamily = (typeof gaugePointerFamily)[keyof typeof gaugePointerFamily]

type DrawPointerOptions = {
  context: Canvas2DContext
  pointerType: PointerType
  pointerColor: GaugePointerPalette
  imageWidth: number
  family: GaugePointerFamily
}

export const resolveGaugePointerColor = (name: CompassPointerColorName): GaugePointerPalette => {
  return resolveGaugePointerPalette(name)
}

const drawType1 = (context: Canvas2DContext, size: number, color: GaugePointerPalette): void => {
  const grad = addColorStops(
    createLinearGradientSafe(
      context,
      0,
      size * 0.471962,
      0,
      size * 0.130841,
      rgbTupleToCss(color.dark)
    ),
    [
      [0, rgbTupleToCss(color.veryDark)],
      [0.3, rgbTupleToCss(color.medium)],
      [0.59, rgbTupleToCss(color.medium)],
      [1, rgbTupleToCss(color.veryDark)]
    ]
  )
  context.fillStyle = grad
  context.beginPath()
  context.moveTo(size * 0.518691, size * 0.471962)
  context.bezierCurveTo(
    size * 0.514018,
    size * 0.457943,
    size * 0.509345,
    size * 0.415887,
    size * 0.509345,
    size * 0.401869
  )
  context.bezierCurveTo(
    size * 0.504672,
    size * 0.383177,
    size * 0.5,
    size * 0.130841,
    size * 0.5,
    size * 0.130841
  )
  context.bezierCurveTo(
    size * 0.5,
    size * 0.130841,
    size * 0.490654,
    size * 0.383177,
    size * 0.490654,
    size * 0.397196
  )
  context.bezierCurveTo(
    size * 0.490654,
    size * 0.415887,
    size * 0.485981,
    size * 0.457943,
    size * 0.481308,
    size * 0.471962
  )
  context.bezierCurveTo(
    size * 0.471962,
    size * 0.481308,
    size * 0.467289,
    size * 0.490654,
    size * 0.467289,
    size * 0.5
  )
  context.bezierCurveTo(
    size * 0.467289,
    size * 0.518691,
    size * 0.481308,
    size * 0.53271,
    size * 0.5,
    size * 0.53271
  )
  context.bezierCurveTo(
    size * 0.518691,
    size * 0.53271,
    size * 0.53271,
    size * 0.518691,
    size * 0.53271,
    size * 0.5
  )
  context.bezierCurveTo(
    size * 0.53271,
    size * 0.490654,
    size * 0.528037,
    size * 0.481308,
    size * 0.518691,
    size * 0.471962
  )
  closePathSafe(context)
  context.fill()
}

const drawType2 = (
  context: Canvas2DContext,
  size: number,
  color: GaugePointerPalette,
  labelColor: string
): void => {
  const grad = addColorStops(
    createLinearGradientSafe(context, 0, size * 0.471962, 0, size * 0.130841, labelColor),
    [
      [0, labelColor],
      [0.36, labelColor],
      [0.361, rgbTupleToCss(color.light)],
      [1, rgbTupleToCss(color.light)]
    ]
  )
  context.fillStyle = grad
  context.beginPath()
  context.moveTo(size * 0.518691, size * 0.471962)
  context.lineTo(size * 0.509345, size * 0.462616)
  context.lineTo(size * 0.509345, size * 0.341121)
  context.lineTo(size * 0.504672, size * 0.130841)
  context.lineTo(size * 0.495327, size * 0.130841)
  context.lineTo(size * 0.490654, size * 0.341121)
  context.lineTo(size * 0.490654, size * 0.462616)
  context.lineTo(size * 0.481308, size * 0.471962)
  closePathSafe(context)
  context.fill()
}

const drawType3 = (context: Canvas2DContext, size: number, color: GaugePointerPalette): void => {
  context.beginPath()
  context.rect(size * 0.495327, size * 0.130841, size * 0.009345, size * 0.373831)
  closePathSafe(context)
  context.fillStyle = rgbTupleToCss(color.light)
  context.fill()
}

const drawType4 = (context: Canvas2DContext, size: number, color: GaugePointerPalette): void => {
  const grad = addColorStops(
    createLinearGradientSafe(
      context,
      0.467289 * size,
      0,
      0.528036 * size,
      0,
      rgbTupleToCss(color.dark)
    ),
    [
      [0, rgbTupleToCss(color.dark)],
      [0.51, rgbTupleToCss(color.dark)],
      [0.52, rgbTupleToCss(color.light)],
      [1, rgbTupleToCss(color.light)]
    ]
  )
  context.fillStyle = grad
  context.beginPath()
  context.moveTo(size * 0.5, size * 0.126168)
  context.lineTo(size * 0.514018, size * 0.135514)
  context.lineTo(size * 0.53271, size * 0.5)
  context.lineTo(size * 0.523364, size * 0.602803)
  context.lineTo(size * 0.476635, size * 0.602803)
  context.lineTo(size * 0.467289, size * 0.5)
  context.lineTo(size * 0.485981, size * 0.135514)
  context.lineTo(size * 0.5, size * 0.126168)
  closePathSafe(context)
  context.fill()
}

const drawType5 = (context: Canvas2DContext, size: number, color: GaugePointerPalette): void => {
  const grad = addColorStops(
    createLinearGradientSafe(
      context,
      0.471962 * size,
      0,
      0.528036 * size,
      0,
      rgbTupleToCss(color.light)
    ),
    [
      [0, rgbTupleToCss(color.light)],
      [0.5, rgbTupleToCss(color.light)],
      [0.5, rgbTupleToCss(color.medium)],
      [1, rgbTupleToCss(color.medium)]
    ]
  )
  context.fillStyle = grad
  context.beginPath()
  context.moveTo(size * 0.5, size * 0.495327)
  context.lineTo(size * 0.528037, size * 0.495327)
  context.lineTo(size * 0.5, size * 0.149532)
  context.lineTo(size * 0.471962, size * 0.495327)
  context.lineTo(size * 0.5, size * 0.495327)
  closePathSafe(context)
  context.fill()

  context.strokeStyle = rgbTupleToCss(color.dark)
  context.stroke()
}

const drawType6 = (context: Canvas2DContext, size: number, color: GaugePointerPalette): void => {
  context.fillStyle = rgbTupleToCss(color.medium)
  context.beginPath()
  context.moveTo(size * 0.481308, size * 0.485981)
  context.lineTo(size * 0.481308, size * 0.392523)
  context.lineTo(size * 0.485981, size * 0.317757)
  context.lineTo(size * 0.495327, size * 0.130841)
  context.lineTo(size * 0.504672, size * 0.130841)
  context.lineTo(size * 0.514018, size * 0.317757)
  context.lineTo(size * 0.518691, size * 0.38785)
  context.lineTo(size * 0.518691, size * 0.485981)
  context.lineTo(size * 0.504672, size * 0.485981)
  context.lineTo(size * 0.504672, size * 0.38785)
  context.lineTo(size * 0.5, size * 0.317757)
  context.lineTo(size * 0.495327, size * 0.392523)
  context.lineTo(size * 0.495327, size * 0.485981)
  context.lineTo(size * 0.481308, size * 0.485981)
  closePathSafe(context)
  context.fill()
}

const drawType7 = (context: Canvas2DContext, size: number, color: GaugePointerPalette): void => {
  const grad = addColorStops(
    createLinearGradientSafe(
      context,
      0.481308 * size,
      0,
      0.518691 * size,
      0,
      rgbTupleToCss(color.dark)
    ),
    [
      [0, rgbTupleToCss(color.dark)],
      [1, rgbTupleToCss(color.medium)]
    ]
  )
  context.fillStyle = grad
  context.beginPath()
  context.moveTo(size * 0.490654, size * 0.130841)
  context.lineTo(size * 0.481308, size * 0.5)
  context.lineTo(size * 0.518691, size * 0.5)
  context.lineTo(size * 0.504672, size * 0.130841)
  context.lineTo(size * 0.490654, size * 0.130841)
  closePathSafe(context)
  context.fill()
}

const drawType8 = (context: Canvas2DContext, size: number, color: GaugePointerPalette): void => {
  const grad = addColorStops(
    createLinearGradientSafe(
      context,
      0.471962 * size,
      0,
      0.528036 * size,
      0,
      rgbTupleToCss(color.light)
    ),
    [
      [0, rgbTupleToCss(color.light)],
      [0.5, rgbTupleToCss(color.light)],
      [0.5, rgbTupleToCss(color.medium)],
      [1, rgbTupleToCss(color.medium)]
    ]
  )
  context.fillStyle = grad
  context.strokeStyle = rgbTupleToCss(color.dark)
  context.beginPath()
  context.moveTo(size * 0.5, size * 0.53271)
  context.lineTo(size * 0.53271, size * 0.5)
  context.bezierCurveTo(
    size * 0.53271,
    size * 0.5,
    size * 0.509345,
    size * 0.457943,
    size * 0.5,
    size * 0.149532
  )
  context.bezierCurveTo(
    size * 0.490654,
    size * 0.457943,
    size * 0.467289,
    size * 0.5,
    size * 0.467289,
    size * 0.5
  )
  context.lineTo(size * 0.5, size * 0.53271)
  closePathSafe(context)
  context.fill()
  context.stroke()
}

const drawType9 = (context: Canvas2DContext, size: number, color: GaugePointerPalette): void => {
  const bodyGrad = addColorStops(
    createLinearGradientSafe(context, 0.471962 * size, 0, 0.528036 * size, 0, 'rgb(50, 50, 50)'),
    [
      [0, 'rgb(50, 50, 50)'],
      [0.5, '#666666'],
      [1, 'rgb(50, 50, 50)']
    ]
  )

  context.fillStyle = bodyGrad
  context.strokeStyle = '#2E2E2E'
  context.beginPath()
  context.moveTo(size * 0.495327, size * 0.233644)
  context.lineTo(size * 0.504672, size * 0.233644)
  context.lineTo(size * 0.514018, size * 0.439252)
  context.lineTo(size * 0.485981, size * 0.439252)
  context.lineTo(size * 0.495327, size * 0.233644)
  closePathSafe(context)
  context.moveTo(size * 0.490654, size * 0.130841)
  context.lineTo(size * 0.471962, size * 0.471962)
  context.lineTo(size * 0.471962, size * 0.528037)
  context.bezierCurveTo(
    size * 0.471962,
    size * 0.528037,
    size * 0.476635,
    size * 0.602803,
    size * 0.476635,
    size * 0.602803
  )
  context.bezierCurveTo(
    size * 0.476635,
    size * 0.607476,
    size * 0.481308,
    size * 0.607476,
    size * 0.5,
    size * 0.607476
  )
  context.bezierCurveTo(
    size * 0.518691,
    size * 0.607476,
    size * 0.523364,
    size * 0.607476,
    size * 0.523364,
    size * 0.602803
  )
  context.bezierCurveTo(
    size * 0.523364,
    size * 0.602803,
    size * 0.528037,
    size * 0.528037,
    size * 0.528037,
    size * 0.528037
  )
  context.lineTo(size * 0.528037, size * 0.471962)
  context.lineTo(size * 0.509345, size * 0.130841)
  context.lineTo(size * 0.490654, size * 0.130841)
  closePathSafe(context)
  context.fill()

  context.beginPath()
  context.moveTo(size * 0.495327, size * 0.219626)
  context.lineTo(size * 0.504672, size * 0.219626)
  context.lineTo(size * 0.504672, size * 0.135514)
  context.lineTo(size * 0.495327, size * 0.135514)
  context.lineTo(size * 0.495327, size * 0.219626)
  closePathSafe(context)
  context.fillStyle = rgbTupleToCss(color.medium)
  context.fill()
}

const drawType10 = (context: Canvas2DContext, size: number, color: GaugePointerPalette): void => {
  context.beginPath()
  context.moveTo(size * 0.5, size * 0.149532)
  context.bezierCurveTo(
    size * 0.5,
    size * 0.149532,
    size * 0.443925,
    size * 0.490654,
    size * 0.443925,
    size * 0.5
  )
  context.bezierCurveTo(
    size * 0.443925,
    size * 0.53271,
    size * 0.467289,
    size * 0.556074,
    size * 0.5,
    size * 0.556074
  )
  context.bezierCurveTo(
    size * 0.53271,
    size * 0.556074,
    size * 0.556074,
    size * 0.53271,
    size * 0.556074,
    size * 0.5
  )
  context.bezierCurveTo(
    size * 0.556074,
    size * 0.490654,
    size * 0.5,
    size * 0.149532,
    size * 0.5,
    size * 0.149532
  )
  closePathSafe(context)
  const grad = addColorStops(
    createLinearGradientSafe(
      context,
      0.471962 * size,
      0,
      0.528036 * size,
      0,
      rgbTupleToCss(color.light)
    ),
    [
      [0, rgbTupleToCss(color.light)],
      [0.5, rgbTupleToCss(color.light)],
      [0.5, rgbTupleToCss(color.medium)],
      [1, rgbTupleToCss(color.medium)]
    ]
  )
  context.fillStyle = grad
  context.strokeStyle = rgbTupleToCss(color.medium)
  context.fill()
  context.stroke()
}

const drawType11 = (context: Canvas2DContext, size: number, color: GaugePointerPalette): void => {
  context.beginPath()
  context.moveTo(0.5 * size, 0.168224 * size)
  context.lineTo(0.485981 * size, 0.5 * size)
  context.bezierCurveTo(
    0.485981 * size,
    0.5 * size,
    0.481308 * size,
    0.584112 * size,
    0.5 * size,
    0.584112 * size
  )
  context.bezierCurveTo(
    0.514018 * size,
    0.584112 * size,
    0.509345 * size,
    0.5 * size,
    0.509345 * size,
    0.5 * size
  )
  context.lineTo(0.5 * size, 0.168224 * size)
  closePathSafe(context)
  const grad = addColorStops(
    createLinearGradientSafe(
      context,
      0,
      0.168224 * size,
      0,
      0.584112 * size,
      rgbTupleToCss(color.medium)
    ),
    [
      [0, rgbTupleToCss(color.medium)],
      [1, rgbTupleToCss(color.dark)]
    ]
  )
  context.fillStyle = grad
  context.strokeStyle = rgbTupleToCss(color.dark)
  context.fill()
  context.stroke()
}

const drawType12 = (context: Canvas2DContext, size: number, color: GaugePointerPalette): void => {
  context.beginPath()
  context.moveTo(0.5 * size, 0.168224 * size)
  context.lineTo(0.485981 * size, 0.5 * size)
  context.lineTo(0.5 * size, 0.504672 * size)
  context.lineTo(0.509345 * size, 0.5 * size)
  context.lineTo(0.5 * size, 0.168224 * size)
  closePathSafe(context)
  const grad = addColorStops(
    createLinearGradientSafe(
      context,
      0,
      0.168224 * size,
      0,
      0.504672 * size,
      rgbTupleToCss(color.medium)
    ),
    [
      [0, rgbTupleToCss(color.medium)],
      [1, rgbTupleToCss(color.dark)]
    ]
  )
  context.fillStyle = grad
  context.strokeStyle = rgbTupleToCss(color.dark)
  context.fill()
  context.stroke()
}

const drawType13And14 = (
  context: Canvas2DContext,
  size: number,
  color: GaugePointerPalette,
  labelColor: string,
  pointerType: PointerType
): void => {
  context.beginPath()
  context.moveTo(0.485981 * size, 0.168224 * size)
  context.lineTo(0.5 * size, 0.130841 * size)
  context.lineTo(0.509345 * size, 0.168224 * size)
  context.lineTo(0.509345 * size, 0.509345 * size)
  context.lineTo(0.485981 * size, 0.509345 * size)
  context.lineTo(0.485981 * size, 0.168224 * size)
  closePathSafe(context)

  if (pointerType === 'label-tip-marker-needle') {
    const grad = addColorStops(
      createLinearGradientSafe(context, 0, 0.5 * size, 0, 0.130841 * size, labelColor),
      [
        [0, labelColor],
        [0.85, labelColor],
        [0.85, rgbTupleToCss(color.medium)],
        [1, rgbTupleToCss(color.medium)]
      ]
    )
    context.fillStyle = grad
  } else {
    const grad = addColorStops(
      createLinearGradientSafe(
        context,
        0.485981 * size,
        0,
        0.509345 * size,
        0,
        rgbTupleToCss(color.veryDark)
      ),
      [
        [0, rgbTupleToCss(color.veryDark)],
        [0.5, rgbTupleToCss(color.light)],
        [1, rgbTupleToCss(color.veryDark)]
      ]
    )
    context.fillStyle = grad
  }

  context.fill()
}

const drawType15And16 = (
  context: Canvas2DContext,
  size: number,
  color: GaugePointerPalette,
  pointerType: PointerType
): void => {
  context.beginPath()
  context.moveTo(size * 0.509345, size * 0.457943)
  context.lineTo(size * 0.5015, size * 0.13)
  context.lineTo(size * 0.4985, size * 0.13)
  context.lineTo(size * 0.490654, size * 0.457943)
  context.bezierCurveTo(
    size * 0.490654,
    size * 0.457943,
    size * 0.490654,
    size * 0.457943,
    size * 0.490654,
    size * 0.457943
  )
  context.bezierCurveTo(
    size * 0.471962,
    size * 0.462616,
    size * 0.457943,
    size * 0.481308,
    size * 0.457943,
    size * 0.5
  )
  context.bezierCurveTo(
    size * 0.457943,
    size * 0.518691,
    size * 0.471962,
    size * 0.537383,
    size * 0.490654,
    size * 0.542056
  )
  context.bezierCurveTo(
    size * 0.490654,
    size * 0.542056,
    size * 0.490654,
    size * 0.542056,
    size * 0.490654,
    size * 0.542056
  )
  if (pointerType === 'ornate-ring-base-needle') {
    context.lineTo(size * 0.490654, size * 0.57)
    context.bezierCurveTo(
      size * 0.46,
      size * 0.58,
      size * 0.46,
      size * 0.62,
      size * 0.490654,
      size * 0.63
    )
    context.bezierCurveTo(
      size * 0.47,
      size * 0.62,
      size * 0.48,
      size * 0.59,
      size * 0.5,
      size * 0.59
    )
    context.bezierCurveTo(
      size * 0.53,
      size * 0.59,
      size * 0.52,
      size * 0.62,
      size * 0.509345,
      size * 0.63
    )
    context.bezierCurveTo(
      size * 0.54,
      size * 0.62,
      size * 0.54,
      size * 0.58,
      size * 0.509345,
      size * 0.57
    )
    context.lineTo(size * 0.509345, size * 0.57)
  } else {
    context.lineTo(size * 0.490654, size * 0.621495)
    context.lineTo(size * 0.509345, size * 0.621495)
  }
  context.lineTo(size * 0.509345, size * 0.542056)
  context.bezierCurveTo(
    size * 0.509345,
    size * 0.542056,
    size * 0.509345,
    size * 0.542056,
    size * 0.509345,
    size * 0.542056
  )
  context.bezierCurveTo(
    size * 0.528037,
    size * 0.537383,
    size * 0.542056,
    size * 0.518691,
    size * 0.542056,
    size * 0.5
  )
  context.bezierCurveTo(
    size * 0.542056,
    size * 0.481308,
    size * 0.528037,
    size * 0.462616,
    size * 0.509345,
    size * 0.457943
  )
  context.bezierCurveTo(
    size * 0.509345,
    size * 0.457943,
    size * 0.509345,
    size * 0.457943,
    size * 0.509345,
    size * 0.457943
  )
  closePathSafe(context)

  const endY = pointerType === 'ornate-ring-base-needle' ? size * 0.63 : size * 0.621495
  const bodyGrad = addColorStops(
    createLinearGradientSafe(context, 0, 0, 0, endY, rgbTupleToCss(color.medium)),
    [
      [0, rgbTupleToCss(color.medium)],
      [0.388888, rgbTupleToCss(color.medium)],
      [0.5, rgbTupleToCss(color.light)],
      [0.611111, rgbTupleToCss(color.medium)],
      [1, rgbTupleToCss(color.medium)]
    ]
  )
  context.fillStyle = bodyGrad
  context.strokeStyle = rgbTupleToCss(color.dark)
  context.fill()
  context.stroke()

  context.beginPath()
  const outerRadius = (size * 0.06542) / 2
  context.arc(size * 0.5, size * 0.5, outerRadius, 0, Math.PI * 2)
  const ringGrad = addColorStops(
    createLinearGradientSafe(
      context,
      size * 0.5 - outerRadius,
      size * 0.5 + outerRadius,
      0,
      size * 0.5 + outerRadius,
      '#e6b35c'
    ),
    [
      [0, '#e6b35c'],
      [0.01, '#e6b35c'],
      [0.99, '#c48200'],
      [1, '#c48200']
    ]
  )
  context.fillStyle = ringGrad
  closePathSafe(context)
  context.fill()

  context.beginPath()
  const innerRadius = (size * 0.046728) / 2
  context.arc(size * 0.5, size * 0.5, innerRadius, 0, Math.PI * 2)
  const capGrad = addColorStops(
    createRadialGradientSafe(
      context,
      size * 0.5,
      size * 0.5,
      0,
      size * 0.5,
      size * 0.5,
      innerRadius,
      '#707070'
    ),
    [
      [0, '#c5c5c5'],
      [0.19, '#c5c5c5'],
      [0.22, '#000000'],
      [0.8, '#000000'],
      [0.99, '#707070'],
      [1, '#707070']
    ]
  )
  context.fillStyle = capGrad
  closePathSafe(context)
  context.fill()
}

export const drawGaugePointer = ({
  context,
  pointerType,
  pointerColor,
  imageWidth,
  family
}: DrawPointerOptions): void => {
  const labelColor = '#abb1b8'

  context.save()
  context.lineCap = 'square'
  context.lineJoin = 'miter'
  context.lineWidth = 1

  if (family === gaugePointerFamily.wind) {
    context.translate(-0.5 * imageWidth, -0.5 * imageWidth)
  }

  switch (pointerType) {
    case 'slim-angular-needle':
      drawType2(context, imageWidth, pointerColor, labelColor)
      break
    case 'thin-bar-needle':
      drawType3(context, imageWidth, pointerColor)
      break
    case 'diamond-spear-needle':
      drawType4(context, imageWidth, pointerColor)
      break
    case 'triangular-split-needle':
      drawType5(context, imageWidth, pointerColor)
      break
    case 'forked-center-needle':
      drawType6(context, imageWidth, pointerColor)
      break
    case 'simple-triangular-needle':
      drawType7(context, imageWidth, pointerColor)
      break
    case 'curved-classic-needle':
      drawType8(context, imageWidth, pointerColor)
      break
    case 'heavy-metallic-needle':
      drawType9(context, imageWidth, pointerColor)
      break
    case 'teardrop-bulb-needle':
      drawType10(context, imageWidth, pointerColor)
      break
    case 'curved-tail-needle':
      drawType11(context, imageWidth, pointerColor)
      break
    case 'narrow-spike-needle':
      drawType12(context, imageWidth, pointerColor)
      break
    case 'label-tip-marker-needle':
    case 'metallic-marker-needle':
      drawType13And14(context, imageWidth, pointerColor, labelColor, pointerType)
      break
    case 'ornate-ring-base-needle':
    case 'ring-base-bar-tail-needle':
      drawType15And16(context, imageWidth, pointerColor, pointerType)
      break
    case 'classic-compass-needle':
    default:
      drawType1(context, imageWidth, pointerColor)
      break
  }

  context.restore()
}
