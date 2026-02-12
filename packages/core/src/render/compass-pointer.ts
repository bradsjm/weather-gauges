import type { CompassPointerColorName, CompassPointerType } from '../compass/schema.js'
import type { RadialDrawContext } from '../radial/renderer.js'

type Rgb = readonly [number, number, number]

type PointerColor = {
  light: Rgb
  medium: Rgb
  dark: Rgb
}

const rgb = (value: Rgb): string => `rgb(${value[0]}, ${value[1]}, ${value[2]})`

const closePathSafe = (context: RadialDrawContext): void => {
  if (typeof context.closePath === 'function') {
    context.closePath()
  }
}

const createLinearGradientSafe = (
  context: RadialDrawContext,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fallback: string
): CanvasGradient | string => {
  if (typeof context.createLinearGradient !== 'function') {
    return fallback
  }

  return context.createLinearGradient(x0, y0, x1, y1)
}

const addColorStops = (
  gradient: CanvasGradient | string,
  stops: Array<readonly [number, string]>
): CanvasGradient | string => {
  if (typeof gradient === 'string') {
    return gradient
  }

  for (const [offset, color] of stops) {
    gradient.addColorStop(offset, color)
  }

  return gradient
}

const POINTER_COLORS: Record<CompassPointerColorName, PointerColor> = {
  RED: { dark: [82, 0, 0], medium: [213, 0, 25], light: [255, 171, 173] },
  GREEN: { dark: [8, 54, 4], medium: [15, 148, 0], light: [190, 231, 141] },
  BLUE: { dark: [0, 11, 68], medium: [0, 108, 201], light: [122, 200, 255] },
  ORANGE: { dark: [118, 83, 30], medium: [240, 117, 0], light: [255, 255, 128] },
  YELLOW: { dark: [41, 41, 0], medium: [177, 165, 0], light: [255, 250, 153] },
  CYAN: { dark: [15, 109, 109], medium: [0, 144, 191], light: [153, 223, 249] },
  MAGENTA: { dark: [98, 0, 114], medium: [191, 36, 107], light: [255, 172, 210] },
  WHITE: { dark: [210, 210, 210], medium: [235, 235, 235], light: [255, 255, 255] },
  GRAY: { dark: [25, 25, 25], medium: [76, 76, 76], light: [204, 204, 204] },
  BLACK: { dark: [0, 0, 0], medium: [10, 10, 10], light: [20, 20, 20] },
  RAITH: { dark: [0, 32, 65], medium: [0, 106, 172], light: [148, 203, 242] },
  GREEN_LCD: { dark: [0, 55, 45], medium: [0, 185, 165], light: [153, 255, 227] },
  JUG_GREEN: { dark: [0, 56, 0], medium: [50, 161, 0], light: [190, 231, 141] }
}

export const resolveCompassPointerColor = (name: CompassPointerColorName): PointerColor => {
  return POINTER_COLORS[name]
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
      rgb(pointerColor.medium)
    ),
    [
      [0, rgb(pointerColor.light)],
      [0.46, rgb(pointerColor.light)],
      [0.47, rgb(pointerColor.medium)],
      [1, rgb(pointerColor.medium)]
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
      context.strokeStyle = rgb(pointerColor.dark)
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
      context.strokeStyle = rgb(pointerColor.dark)
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
      context.strokeStyle = rgb(pointerColor.dark)
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
