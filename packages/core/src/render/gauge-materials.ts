import { clamp } from '../math/range.js'
import type { GaugeBackgroundPalette, Rgb } from './gauge-color-palettes.js'
import { getGaugeBackgroundPalette, rgbTupleToCss } from './gauge-color-palettes.js'
import {
  addColorStops,
  closePathSafe,
  createLinearGradientSafe,
  createRadialGradientSafe
} from './gauge-canvas-primitives.js'
import type {
  RadialBackgroundColorName,
  RadialForegroundType,
  RadialFrameDesign
} from '../radial/schema.js'
import type { ThemePaint } from '../theme/tokens.js'
import type { CompassBackgroundColorName, CompassFrameDesign } from '../compass/schema.js'

type Canvas2DContext = CanvasRenderingContext2D

const PI = Math.PI
const HALF_PI = PI * 0.5
const TWO_PI = PI * 2
const RAD_FACTOR = PI / 180

export const getCompassBackgroundPalette = (
  name: CompassBackgroundColorName
): GaugeBackgroundPalette => {
  return getGaugeBackgroundPalette(name)
}

export const drawCompassFrame = (
  context: Canvas2DContext,
  frameDesign: CompassFrameDesign,
  centerX: number,
  centerY: number,
  imageWidth: number,
  imageHeight: number
): void => {
  context.save()

  context.beginPath()
  context.arc(centerX, centerY, imageWidth / 2, 0, TWO_PI)
  closePathSafe(context)
  context.fillStyle = '#848484'
  context.fill()
  context.lineWidth = 1
  context.strokeStyle = 'rgba(132, 132, 132, 0.5)'
  context.stroke()

  context.beginPath()
  context.arc(centerX, centerY, (0.990654 * imageWidth) / 2, 0, TWO_PI)
  closePathSafe(context)

  const fillFrameWithLinearGradient = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    stops: Array<readonly [number, string]>
  ): void => {
    context.fillStyle = addColorStops(
      createLinearGradientSafe(context, x0, y0, x1, y1, stops[stops.length - 1]?.[1] ?? '#888'),
      stops
    )
    context.fill()
  }

  switch (frameDesign) {
    case 'metal':
      fillFrameWithLinearGradient(0, imageHeight * 0.004672, 0, imageHeight * 0.990654, [
        [0, '#fefefe'],
        [0.07, 'rgb(210, 210, 210)'],
        [0.12, 'rgb(179, 179, 179)'],
        [1, 'rgb(213, 213, 213)']
      ])
      break
    case 'brass':
      fillFrameWithLinearGradient(0, imageHeight * 0.004672, 0, imageHeight * 0.990654, [
        [0, 'rgb(249, 243, 155)'],
        [0.05, 'rgb(246, 226, 101)'],
        [0.1, 'rgb(240, 225, 132)'],
        [0.5, 'rgb(90, 57, 22)'],
        [0.9, 'rgb(249, 237, 139)'],
        [0.95, 'rgb(243, 226, 108)'],
        [1, 'rgb(202, 182, 113)']
      ])
      break
    case 'steel':
      fillFrameWithLinearGradient(0, imageHeight * 0.004672, 0, imageHeight * 0.990654, [
        [0, 'rgb(231, 237, 237)'],
        [0.05, 'rgb(189, 199, 198)'],
        [0.1, 'rgb(192, 201, 200)'],
        [0.5, 'rgb(23, 31, 33)'],
        [0.9, 'rgb(196, 205, 204)'],
        [0.95, 'rgb(194, 204, 203)'],
        [1, 'rgb(189, 201, 199)']
      ])
      break
    case 'gold':
      fillFrameWithLinearGradient(0, imageHeight * 0.004672, 0, imageHeight * 0.990654, [
        [0, 'rgb(255, 255, 207)'],
        [0.15, 'rgb(255, 237, 96)'],
        [0.22, 'rgb(254, 199, 57)'],
        [0.3, 'rgb(255, 249, 203)'],
        [0.38, 'rgb(255, 199, 64)'],
        [0.44, 'rgb(252, 194, 60)'],
        [0.51, 'rgb(255, 204, 59)'],
        [0.6, 'rgb(213, 134, 29)'],
        [0.68, 'rgb(255, 201, 56)'],
        [0.75, 'rgb(212, 135, 29)'],
        [1, 'rgb(247, 238, 101)']
      ])
      break
    case 'anthracite':
      fillFrameWithLinearGradient(0, imageHeight * 0.004672, 0, imageHeight * 0.990654, [
        [0, 'rgb(118, 117, 135)'],
        [0.06, 'rgb(74, 74, 82)'],
        [0.12, 'rgb(50, 50, 54)'],
        [1, 'rgb(79, 79, 87)']
      ])
      break
    case 'tiltedGray':
      fillFrameWithLinearGradient(
        0.233644 * imageWidth,
        0.084112 * imageHeight,
        0.81258 * imageWidth,
        0.910919 * imageHeight,
        [
          [0, '#ffffff'],
          [0.07, 'rgb(210, 210, 210)'],
          [0.16, 'rgb(179, 179, 179)'],
          [0.33, '#ffffff'],
          [0.55, '#c5c5c5'],
          [0.79, '#ffffff'],
          [1, '#666666']
        ]
      )
      break
    case 'tiltedBlack':
      fillFrameWithLinearGradient(
        0.228971 * imageWidth,
        0.079439 * imageHeight,
        0.802547 * imageWidth,
        0.943925 * imageHeight,
        [
          [0, '#666666'],
          [0.21, '#000000'],
          [0.47, '#666666'],
          [0.99, '#000000'],
          [1, '#000000']
        ]
      )
      break
    case 'glossyMetal': {
      const radial = addColorStops(
        createRadialGradientSafe(
          context,
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          imageWidth / 2,
          '#cfcfcf'
        ),
        [
          [0, 'rgb(207, 207, 207)'],
          [0.96, 'rgb(205, 204, 205)'],
          [1, 'rgb(244, 244, 244)']
        ]
      )
      context.fillStyle = radial
      context.fill()

      context.beginPath()
      context.arc(centerX, centerY, (0.973962 * imageWidth) / 2, 0, TWO_PI)
      closePathSafe(context)
      context.fillStyle = addColorStops(
        createLinearGradientSafe(
          context,
          0,
          0.018691 * imageHeight,
          0,
          0.981308 * imageHeight,
          '#d1d1d1'
        ),
        [
          [0, 'rgb(249, 249, 249)'],
          [0.23, 'rgb(200, 195, 191)'],
          [0.36, '#ffffff'],
          [0.59, 'rgb(29, 29, 29)'],
          [0.76, 'rgb(200, 194, 192)'],
          [1, 'rgb(209, 209, 209)']
        ]
      )
      context.fill()

      context.beginPath()
      context.arc(centerX, centerY, (0.869158 * imageWidth) / 2, 0, TWO_PI)
      closePathSafe(context)
      context.fillStyle = '#f6f6f6'
      context.fill()

      context.beginPath()
      context.arc(centerX, centerY, (0.85 * imageWidth) / 2, 0, TWO_PI)
      closePathSafe(context)
      context.fillStyle = '#333333'
      context.fill()
      break
    }
    case 'blackMetal':
    case 'shinyMetal':
    case 'chrome': {
      const conic =
        typeof context.createConicGradient === 'function'
          ? context.createConicGradient(-HALF_PI, centerX, centerY)
          : undefined

      const stops: Array<readonly [number, string]> =
        frameDesign === 'blackMetal'
          ? [
              [0, 'rgb(254, 254, 254)'],
              [0.125, 'rgb(0, 0, 0)'],
              [0.347222, 'rgb(153, 153, 153)'],
              [0.5, 'rgb(0, 0, 0)'],
              [0.680555, 'rgb(153, 153, 153)'],
              [0.875, 'rgb(0, 0, 0)'],
              [1, 'rgb(254, 254, 254)']
            ]
          : frameDesign === 'shinyMetal'
            ? [
                [0, 'rgb(254, 254, 254)'],
                [0.125, 'rgb(210, 210, 210)'],
                [0.25, 'rgb(179, 179, 179)'],
                [0.347222, 'rgb(238, 238, 238)'],
                [0.5, 'rgb(160, 160, 160)'],
                [0.652777, 'rgb(238, 238, 238)'],
                [0.75, 'rgb(179, 179, 179)'],
                [0.875, 'rgb(210, 210, 210)'],
                [1, 'rgb(254, 254, 254)']
              ]
            : [
                [0, 'rgb(255, 255, 255)'],
                [0.09, 'rgb(255, 255, 255)'],
                [0.12, 'rgb(136, 136, 138)'],
                [0.16, 'rgb(164, 185, 190)'],
                [0.25, 'rgb(158, 179, 182)'],
                [0.29, 'rgb(112, 112, 112)'],
                [0.33, 'rgb(221, 227, 227)'],
                [0.38, 'rgb(155, 176, 179)'],
                [0.48, 'rgb(156, 176, 177)'],
                [0.52, 'rgb(254, 255, 255)'],
                [0.63, 'rgb(255, 255, 255)'],
                [0.68, 'rgb(156, 180, 180)'],
                [0.8, 'rgb(198, 209, 211)'],
                [0.83, 'rgb(246, 248, 247)'],
                [0.87, 'rgb(204, 216, 216)'],
                [0.97, 'rgb(164, 188, 190)'],
                [1, 'rgb(255, 255, 255)']
              ]

      if (conic) {
        for (const [offset, color] of stops) {
          conic.addColorStop(offset, color)
        }
        context.fillStyle = conic
      } else {
        context.fillStyle = stops[0]?.[1] ?? '#fefefe'
      }

      context.beginPath()
      context.arc(centerX, centerY, 0.495327 * imageWidth, 0, TWO_PI)
      context.arc(centerX, centerY, 0.42056 * imageWidth, 0, TWO_PI, true)
      closePathSafe(context)
      context.fill()

      context.beginPath()
      context.arc(centerX, centerY, 0.495327 * imageWidth, 0, TWO_PI)
      closePathSafe(context)
      context.lineWidth = imageWidth / 90
      context.strokeStyle = 'rgba(132, 132, 132, 0.8)'
      context.stroke()
      break
    }
  }

  context.beginPath()
  context.arc(centerX, centerY, (0.841121 * imageWidth) / 2, 0, TWO_PI)
  closePathSafe(context)
  context.fillStyle = 'rgb(191, 191, 191)'
  context.fill()

  context.globalCompositeOperation = 'destination-out'
  context.beginPath()
  context.arc(centerX, centerY, (0.83 * imageWidth) / 2, 0, TWO_PI)
  closePathSafe(context)
  context.fill()
  context.globalCompositeOperation = 'source-over'
  context.restore()
}

export const drawCompassCustomImage = (
  context: Canvas2DContext,
  image: CanvasImageSource | null,
  centerX: number,
  centerY: number,
  imageWidth: number,
  imageHeight: number
): void => {
  if (!image) {
    return
  }

  context.save()
  context.beginPath()
  context.arc(centerX, centerY, (0.831775 * imageWidth) / 2, 0, TWO_PI, true)
  closePathSafe(context)
  context.clip()
  context.drawImage(
    image,
    centerX - 0.415887 * imageWidth,
    centerY - 0.415887 * imageHeight,
    0.831775 * imageWidth,
    0.831775 * imageHeight
  )
  context.restore()
}

const createPatternCanvas = (
  context: Canvas2DContext,
  width: number,
  height: number
): HTMLCanvasElement | OffscreenCanvas | null => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }

  const ownerDocument = context.canvas?.ownerDocument
  if (!ownerDocument) {
    return null
  }

  const canvas = ownerDocument.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const getPatternContext = (
  canvas: HTMLCanvasElement | OffscreenCanvas
): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null => {
  return canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null
}

const drawCarbonPattern = (context: Canvas2DContext): CanvasPattern | null => {
  const canvas = createPatternCanvas(context, 12, 12)
  if (!canvas) {
    return null
  }
  const brush = getPatternContext(canvas)
  if (!brush) {
    return null
  }

  const drawGradientRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    top: string,
    bottom: string
  ): void => {
    brush.beginPath()
    brush.rect(x, y, width, height)
    closePathSafe(brush as unknown as Canvas2DContext)
    const gradient = brush.createLinearGradient(0, y, 0, y + height)
    gradient.addColorStop(0, top)
    gradient.addColorStop(1, bottom)
    brush.fillStyle = gradient
    brush.fill()
  }

  drawGradientRect(0, 0, 6, 6, 'rgb(35, 35, 35)', 'rgb(23, 23, 23)')
  drawGradientRect(0.5, 0.5, 4, 4, 'rgb(38, 38, 38)', 'rgb(30, 30, 30)')
  drawGradientRect(6, 6, 6, 6, 'rgb(35, 35, 35)', 'rgb(23, 23, 23)')
  drawGradientRect(6.5, 6.5, 4, 4, 'rgb(38, 38, 38)', 'rgb(30, 30, 30)')
  drawGradientRect(6, 0, 6, 6, 'rgb(48, 48, 48)', 'rgb(40, 40, 40)')
  drawGradientRect(6.5, 0.5, 4, 4, 'rgb(53, 53, 53)', 'rgb(45, 45, 45)')
  drawGradientRect(0, 6, 6, 6, 'rgb(48, 48, 48)', 'rgb(40, 40, 40)')
  drawGradientRect(0.5, 6.5, 4, 4, 'rgb(53, 53, 53)', 'rgb(45, 45, 45)')

  return context.createPattern(canvas as CanvasImageSource, 'repeat')
}

const drawPunchedSheetPattern = (context: Canvas2DContext): CanvasPattern | null => {
  const canvas = createPatternCanvas(context, 15, 15)
  if (!canvas) {
    return null
  }
  const brush = getPatternContext(canvas)
  if (!brush) {
    return null
  }

  brush.fillStyle = '#1D2123'
  brush.fillRect(0, 0, 15, 15)

  const upperBack = brush.createLinearGradient(0, 0.99999, 0, 5)
  upperBack.addColorStop(0, '#000000')
  upperBack.addColorStop(1, '#444444')
  brush.fillStyle = upperBack
  brush.beginPath()
  brush.moveTo(0, 3)
  brush.bezierCurveTo(0, 1.9, 0.9, 1, 2, 1)
  brush.bezierCurveTo(3.1, 1, 4, 1.9, 4, 3)
  brush.bezierCurveTo(4, 4.1, 3.1, 5, 2, 5)
  brush.bezierCurveTo(0.9, 5, 0, 4.1, 0, 3)
  closePathSafe(brush as unknown as Canvas2DContext)
  brush.fill()

  brush.fillStyle = '#050506'
  brush.beginPath()
  brush.moveTo(0, 2)
  brush.bezierCurveTo(0, 0.9, 0.9, 0, 2, 0)
  brush.bezierCurveTo(3.1, 0, 4, 0.9, 4, 2)
  brush.bezierCurveTo(4, 3.1, 3.1, 4, 2, 4)
  brush.bezierCurveTo(0.9, 4, 0, 3.1, 0, 2)
  closePathSafe(brush as unknown as Canvas2DContext)
  brush.fill()

  const lowerBack = brush.createLinearGradient(0, 8, 0, 13)
  lowerBack.addColorStop(0, '#000000')
  lowerBack.addColorStop(1, '#444444')
  brush.fillStyle = lowerBack
  brush.beginPath()
  brush.moveTo(7, 10)
  brush.bezierCurveTo(7, 8.9, 7.9, 8, 9, 8)
  brush.bezierCurveTo(10.1, 8, 11, 8.9, 11, 10)
  brush.bezierCurveTo(11, 11.1, 10.1, 12, 9, 12)
  brush.bezierCurveTo(7.9, 12, 7, 11.1, 7, 10)
  closePathSafe(brush as unknown as Canvas2DContext)
  brush.fill()

  brush.fillStyle = '#050506'
  brush.beginPath()
  brush.moveTo(7, 9)
  brush.bezierCurveTo(7, 7.9, 7.9, 7, 9, 7)
  brush.bezierCurveTo(10.1, 7, 11, 7.9, 11, 9)
  brush.bezierCurveTo(11, 10.1, 10.1, 11, 9, 11)
  brush.bezierCurveTo(7.9, 11, 7, 10.1, 7, 9)
  closePathSafe(brush as unknown as Canvas2DContext)
  brush.fill()

  return context.createPattern(canvas as CanvasImageSource, 'repeat')
}

const drawBrushedMetalPattern = (
  context: Canvas2DContext,
  color: Rgb,
  monochrome: boolean
): CanvasPattern | null => {
  const width = 128
  const height = 128
  const canvas = createPatternCanvas(context, width, height)
  if (!canvas) {
    return null
  }
  const brush = getPatternContext(canvas)
  if (!brush) {
    return null
  }

  const imageData = brush.createImageData(width, height)
  const variation = 255 * 0.1
  const shine = 0.5

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4
      const f = shine > 0 ? Math.sin((x / width) * PI) * 255 * shine : 0

      const vr = monochrome ? (Math.random() - 0.5) * variation : (Math.random() - 0.5) * variation
      const vg = monochrome ? vr : (Math.random() - 0.5) * variation
      const vb = monochrome ? vr : (Math.random() - 0.5) * variation

      imageData.data[idx] = clamp(Math.round(color[0] + f + vr), 0, 255)
      imageData.data[idx + 1] = clamp(Math.round(color[1] + f + vg), 0, 255)
      imageData.data[idx + 2] = clamp(Math.round(color[2] + f + vb), 0, 255)
      imageData.data[idx + 3] = 255
    }
  }

  brush.putImageData(imageData, 0, 0)
  return context.createPattern(canvas as CanvasImageSource, 'repeat')
}

export const drawCompassBackground = (
  context: Canvas2DContext,
  backgroundColorName: CompassBackgroundColorName,
  centerX: number,
  centerY: number,
  imageWidth: number
): void => {
  const color = getCompassBackgroundPalette(backgroundColorName)
  const backgroundOffsetX = (0.831775 * imageWidth) / 2

  context.save()
  context.beginPath()
  context.arc(centerX, centerY, backgroundOffsetX, 0, TWO_PI)
  closePathSafe(context)

  if (backgroundColorName === 'CARBON') {
    const pattern = drawCarbonPattern(context)
    context.fillStyle = pattern ?? rgbTupleToCss(color.gradientStop)
    context.fill()

    context.beginPath()
    context.arc(centerX, centerY, backgroundOffsetX, 0, TWO_PI)
    closePathSafe(context)
    context.fillStyle = addColorStops(
      createLinearGradientSafe(
        context,
        centerX - backgroundOffsetX,
        centerY,
        centerX + backgroundOffsetX,
        centerY,
        'rgba(0, 0, 0, 0.25)'
      ),
      [
        [0, 'rgba(0, 0, 0, 0.25)'],
        [0.5, 'rgba(0, 0, 0, 0)'],
        [1, 'rgba(0, 0, 0, 0.25)']
      ]
    )
    context.fill()
  } else if (backgroundColorName === 'PUNCHED_SHEET') {
    const pattern = drawPunchedSheetPattern(context)
    context.fillStyle = pattern ?? rgbTupleToCss(color.gradientStop)
    context.fill()

    context.beginPath()
    context.arc(centerX, centerY, backgroundOffsetX, 0, TWO_PI)
    closePathSafe(context)
    context.fillStyle = addColorStops(
      createLinearGradientSafe(
        context,
        centerX - backgroundOffsetX,
        centerY,
        centerX + backgroundOffsetX,
        centerY,
        'rgba(0, 0, 0, 0.25)'
      ),
      [
        [0, 'rgba(0, 0, 0, 0.25)'],
        [0.5, 'rgba(0, 0, 0, 0)'],
        [1, 'rgba(0, 0, 0, 0.25)']
      ]
    )
    context.fill()
  } else if (
    backgroundColorName === 'BRUSHED_METAL' ||
    backgroundColorName === 'BRUSHED_STAINLESS'
  ) {
    const pattern = drawBrushedMetalPattern(
      context,
      color.gradientStop,
      backgroundColorName === 'BRUSHED_METAL'
    )
    context.fillStyle = pattern ?? rgbTupleToCss(color.gradientStop)
    context.fill()
  } else if (backgroundColorName === 'STAINLESS' || backgroundColorName === 'TURNED') {
    if (typeof context.createConicGradient === 'function') {
      const gradient = context.createConicGradient(-HALF_PI, centerX, centerY)
      const fractions = [
        0, 0.03, 0.1, 0.14, 0.24, 0.33, 0.38, 0.5, 0.62, 0.67, 0.76, 0.81, 0.85, 0.97, 1
      ]
      const colors = [
        '#FDFDFD',
        '#FDFDFD',
        '#B2B2B4',
        '#ACACAE',
        '#FDFDFD',
        '#8E8E8E',
        '#8E8E8E',
        '#FDFDFD',
        '#8E8E8E',
        '#8E8E8E',
        '#FDFDFD',
        '#ACACAE',
        '#B2B2B4',
        '#FDFDFD',
        '#FDFDFD'
      ]
      for (let i = 0; i < fractions.length; i += 1) {
        gradient.addColorStop(fractions[i] ?? 1, colors[i] ?? '#FDFDFD')
      }
      context.fillStyle = gradient
    } else {
      context.fillStyle = rgbTupleToCss(color.gradientStop)
    }
    context.fill()

    if (backgroundColorName === 'TURNED') {
      const radius = backgroundOffsetX
      const turnRadius = radius * 0.55
      const stepSize = RAD_FACTOR * (500 / radius)
      const end = TWO_PI - stepSize * 0.3

      context.save()
      context.beginPath()
      context.arc(centerX, centerY, radius, 0, TWO_PI)
      closePathSafe(context)
      context.clip()
      context.lineWidth = 0.5

      for (let angle = 0; angle < end; angle += stepSize) {
        context.strokeStyle = 'rgba(240, 240, 255, 0.25)'
        context.beginPath()
        context.arc(centerX + turnRadius, centerY, turnRadius, 0, TWO_PI)
        context.stroke()

        context.translate(centerX, centerY)
        context.rotate(stepSize * 0.3)
        context.translate(-centerX, -centerY)

        context.strokeStyle = 'rgba(25, 10, 10, 0.1)'
        context.beginPath()
        context.arc(centerX + turnRadius, centerY, turnRadius, 0, TWO_PI)
        context.stroke()

        context.translate(centerX, centerY)
        context.rotate(stepSize - stepSize * 0.3)
        context.translate(-centerX, -centerY)
      }

      context.restore()
    }
  } else {
    const gradient = addColorStops(
      createLinearGradientSafe(
        context,
        0,
        0.084112 * imageWidth,
        0,
        backgroundOffsetX * 2,
        rgbTupleToCss(color.gradientStop)
      ),
      [
        [0, rgbTupleToCss(color.gradientStart)],
        [0.4, rgbTupleToCss(color.gradientFraction)],
        [1, rgbTupleToCss(color.gradientStop)]
      ]
    )
    context.fillStyle = gradient
    context.fill()
  }

  const radial = addColorStops(
    createRadialGradientSafe(
      context,
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      backgroundOffsetX,
      'rgba(0, 0, 0, 0.3)'
    ),
    [
      [0, 'rgba(0, 0, 0, 0)'],
      [0.7, 'rgba(0, 0, 0, 0)'],
      [0.71, 'rgba(0, 0, 0, 0)'],
      [0.86, 'rgba(0, 0, 0, 0.03)'],
      [0.92, 'rgba(0, 0, 0, 0.07)'],
      [0.97, 'rgba(0, 0, 0, 0.15)'],
      [1, 'rgba(0, 0, 0, 0.3)']
    ]
  )

  context.beginPath()
  context.arc(centerX, centerY, backgroundOffsetX, 0, TWO_PI)
  closePathSafe(context)
  context.fillStyle = radial
  context.fill()
  context.restore()
}

const LEGACY_CHROME_FRACTIONS = [
  0, 0.09, 0.12, 0.16, 0.25, 0.29, 0.33, 0.38, 0.48, 0.52, 0.63, 0.68, 0.8, 0.83, 0.87, 0.97, 1
]

const LEGACY_CHROME_COLORS = [
  '#ffffff',
  '#ffffff',
  '#707070',
  '#ffffff',
  '#9f9f9f',
  '#ffffff',
  '#5e5e5e',
  '#d2d2d2',
  '#747474',
  '#a8a8a8',
  '#7a7a7a',
  '#d0d0d0',
  '#8f8f8f',
  '#bdbdbd',
  '#7a7a7a',
  '#e0e0e0',
  '#ffffff'
]

const createGradientFromStops = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  fractions: number[],
  colors: string[],
  fallbackColor: string
): CanvasGradient | string => {
  if (typeof context.createConicGradient === 'function') {
    const gradient = context.createConicGradient(-Math.PI / 2, centerX, centerY)
    for (let index = 0; index < fractions.length; index += 1) {
      const fraction = fractions[index]
      const color = colors[index]
      if (fraction !== undefined && color !== undefined) {
        gradient.addColorStop(fraction, color)
      }
    }

    return gradient
  }

  const fallback = createLinearGradientSafe(
    context,
    centerX,
    0,
    centerX,
    centerY * 2,
    fallbackColor
  )
  for (let index = 0; index < fractions.length; index += 1) {
    const fraction = fractions[index]
    const color = colors[index]
    if (fraction !== undefined && color !== undefined && typeof fallback !== 'string') {
      fallback.addColorStop(fraction, color)
    }
  }
  return fallback
}

const drawCircle = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  context.beginPath()
  context.arc(centerX, centerY, radius, 0, Math.PI * 2)
  closePathSafe(context)
}

const drawLegacyRadialFrame = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const frameGradient = createGradientFromStops(
    context,
    centerX,
    centerY,
    LEGACY_CHROME_FRACTIONS,
    LEGACY_CHROME_COLORS,
    '#b5b5b5'
  )

  drawCircle(context, centerX, centerY, radius)
  context.fillStyle = frameGradient
  context.fill()

  context.save()
  context.globalCompositeOperation = 'destination-out'
  drawCircle(context, centerX, centerY, radius * 0.83)
  context.fillStyle = '#000'
  context.fill()
  context.restore()

  drawCircle(context, centerX, centerY, radius * 0.995)
  context.lineWidth = Math.max(1, (radius * 2) / 90)
  context.strokeStyle = 'rgba(132,132,132,0.8)'
  context.stroke()
}

const drawLegacyRadialFrameMetal = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const frameGradient = addColorStops(
    createLinearGradientSafe(
      context,
      centerX,
      centerY - radius,
      centerX,
      centerY + radius,
      '#bdbdbd'
    ),
    [
      [0, '#fefefe'],
      [0.07, '#d2d2d2'],
      [0.12, '#b3b3b3'],
      [1, '#d5d5d5']
    ]
  )

  drawCircle(context, centerX, centerY, radius)
  context.fillStyle = frameGradient
  context.fill()

  context.save()
  context.globalCompositeOperation = 'destination-out'
  drawCircle(context, centerX, centerY, radius * 0.83)
  context.fillStyle = '#000'
  context.fill()
  context.restore()

  drawCircle(context, centerX, centerY, radius * 0.995)
  context.lineWidth = Math.max(1, (radius * 2) / 90)
  context.strokeStyle = 'rgba(132,132,132,0.8)'
  context.stroke()
}

const drawRadialInnerShadow = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const shadow = addColorStops(
    createRadialGradientSafe(
      context,
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius,
      'rgba(0, 0, 0, 0.3)'
    ),
    [
      [0, 'rgba(0, 0, 0, 0)'],
      [0.7, 'rgba(0, 0, 0, 0)'],
      [0.71, 'rgba(0, 0, 0, 0)'],
      [0.86, 'rgba(0, 0, 0, 0.03)'],
      [0.92, 'rgba(0, 0, 0, 0.07)'],
      [0.97, 'rgba(0, 0, 0, 0.15)'],
      [1, 'rgba(0, 0, 0, 0.3)']
    ]
  )

  context.beginPath()
  context.arc(centerX, centerY, radius, 0, TWO_PI)
  closePathSafe(context)
  context.fillStyle = shadow
  context.fill()
}

const drawRadialColorBackground = (
  context: CanvasRenderingContext2D,
  palette: GaugeBackgroundPalette,
  size: number,
  centerX: number,
  centerY: number,
  radius: number,
  fallbackColor: string
): void => {
  const gradient = addColorStops(
    createLinearGradientSafe(context, 0, 0.084112 * size, 0, radius * 2, fallbackColor),
    [
      [0, rgbTupleToCss(palette.gradientStart)],
      [0.4, rgbTupleToCss(palette.gradientFraction)],
      [1, rgbTupleToCss(palette.gradientStop)]
    ]
  )

  context.fillStyle = gradient
  context.beginPath()
  context.arc(centerX, centerY, radius, 0, TWO_PI)
  closePathSafe(context)
  context.fill()
}

const drawRadialTextureBackground = (
  context: CanvasRenderingContext2D,
  backgroundColor: RadialBackgroundColorName,
  palette: GaugeBackgroundPalette,
  centerX: number,
  centerY: number,
  radius: number
): boolean => {
  if (backgroundColor === 'CARBON') {
    const pattern = drawCarbonPattern(context)
    context.fillStyle = pattern ?? rgbTupleToCss(palette.gradientStop)
    context.beginPath()
    context.arc(centerX, centerY, radius, 0, TWO_PI)
    closePathSafe(context)
    context.fill()

    context.beginPath()
    context.arc(centerX, centerY, radius, 0, TWO_PI)
    closePathSafe(context)
    context.fillStyle = addColorStops(
      createLinearGradientSafe(
        context,
        centerX - radius,
        centerY,
        centerX + radius,
        centerY,
        'rgba(0, 0, 0, 0.25)'
      ),
      [
        [0, 'rgba(0, 0, 0, 0.25)'],
        [0.5, 'rgba(0, 0, 0, 0)'],
        [1, 'rgba(0, 0, 0, 0.25)']
      ]
    )
    context.fill()
    return true
  }

  if (backgroundColor === 'PUNCHED_SHEET') {
    const pattern = drawPunchedSheetPattern(context)
    context.fillStyle = pattern ?? rgbTupleToCss(palette.gradientStop)
    context.beginPath()
    context.arc(centerX, centerY, radius, 0, TWO_PI)
    closePathSafe(context)
    context.fill()

    context.beginPath()
    context.arc(centerX, centerY, radius, 0, TWO_PI)
    closePathSafe(context)
    context.fillStyle = addColorStops(
      createLinearGradientSafe(
        context,
        centerX - radius,
        centerY,
        centerX + radius,
        centerY,
        'rgba(0, 0, 0, 0.25)'
      ),
      [
        [0, 'rgba(0, 0, 0, 0.25)'],
        [0.5, 'rgba(0, 0, 0, 0)'],
        [1, 'rgba(0, 0, 0, 0.25)']
      ]
    )
    context.fill()
    return true
  }

  if (backgroundColor === 'BRUSHED_METAL' || backgroundColor === 'BRUSHED_STAINLESS') {
    const pattern = drawBrushedMetalPattern(
      context,
      palette.gradientStop,
      backgroundColor === 'BRUSHED_METAL'
    )
    context.fillStyle = pattern ?? rgbTupleToCss(palette.gradientStop)
    context.beginPath()
    context.arc(centerX, centerY, radius, 0, TWO_PI)
    closePathSafe(context)
    context.fill()
    return true
  }

  if (backgroundColor === 'STAINLESS' || backgroundColor === 'TURNED') {
    if (typeof context.createConicGradient === 'function') {
      const gradient = context.createConicGradient(-HALF_PI, centerX, centerY)
      const fractions = [
        0, 0.03, 0.1, 0.14, 0.24, 0.33, 0.38, 0.5, 0.62, 0.67, 0.76, 0.81, 0.85, 0.97, 1
      ]
      const colors = [
        '#FDFDFD',
        '#FDFDFD',
        '#B2B2B4',
        '#ACACAE',
        '#FDFDFD',
        '#8E8E8E',
        '#8E8E8E',
        '#FDFDFD',
        '#8E8E8E',
        '#8E8E8E',
        '#FDFDFD',
        '#ACACAE',
        '#B2B2B4',
        '#FDFDFD',
        '#FDFDFD'
      ]
      for (let i = 0; i < fractions.length; i += 1) {
        gradient.addColorStop(fractions[i] ?? 1, colors[i] ?? '#FDFDFD')
      }
      context.fillStyle = gradient
    } else {
      context.fillStyle = rgbTupleToCss(palette.gradientStop)
    }

    context.beginPath()
    context.arc(centerX, centerY, radius, 0, TWO_PI)
    closePathSafe(context)
    context.fill()

    if (backgroundColor === 'TURNED') {
      const turnRadius = radius * 0.55
      const stepSize = RAD_FACTOR * (500 / radius)
      const end = TWO_PI - stepSize * 0.3

      context.save()
      context.beginPath()
      context.arc(centerX, centerY, radius, 0, TWO_PI)
      closePathSafe(context)
      context.clip()
      context.lineWidth = 0.5

      for (let angle = 0; angle < end; angle += stepSize) {
        context.strokeStyle = 'rgba(240, 240, 255, 0.25)'
        context.beginPath()
        context.arc(centerX + turnRadius, centerY, turnRadius, 0, TWO_PI)
        context.stroke()

        context.translate(centerX, centerY)
        context.rotate(stepSize * 0.3)
        context.translate(-centerX, -centerY)

        context.strokeStyle = 'rgba(25, 10, 10, 0.1)'
        context.beginPath()
        context.arc(centerX + turnRadius, centerY, turnRadius, 0, TWO_PI)
        context.stroke()

        context.translate(centerX, centerY)
        context.rotate(stepSize - stepSize * 0.3)
        context.translate(-centerX, -centerY)
      }

      context.restore()
    }

    return true
  }

  return false
}

const drawLegacyRadialForegroundTyped = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  foregroundType: RadialForegroundType = 'type1'
): void => {
  const glassRadius = radius * 0.84

  context.save()
  drawCircle(context, centerX, centerY, glassRadius)
  if (typeof context.clip === 'function') {
    context.clip()
  }

  switch (foregroundType) {
    case 'type1': {
      const highlight = addColorStops(
        createLinearGradientSafe(
          context,
          centerX,
          centerY - glassRadius,
          centerX,
          centerY + glassRadius * 0.4,
          'rgba(255,255,255,0.08)'
        ),
        [
          [0, 'rgba(255,255,255,0.275)'],
          [1, 'rgba(255,255,255,0.015)']
        ]
      )

      context.beginPath()
      context.moveTo(centerX - glassRadius * 0.78, centerY - glassRadius * 0.32)
      if (typeof context.bezierCurveTo === 'function') {
        context.bezierCurveTo(
          centerX - glassRadius * 0.48,
          centerY - glassRadius * 0.72,
          centerX + glassRadius * 0.52,
          centerY - glassRadius * 0.72,
          centerX + glassRadius * 0.76,
          centerY - glassRadius * 0.3
        )
        context.bezierCurveTo(
          centerX + glassRadius * 0.41,
          centerY - glassRadius * 0.12,
          centerX - glassRadius * 0.44,
          centerY - glassRadius * 0.1,
          centerX - glassRadius * 0.78,
          centerY - glassRadius * 0.32
        )
      } else {
        context.lineTo(centerX + glassRadius * 0.76, centerY - glassRadius * 0.3)
        context.lineTo(centerX + glassRadius * 0.45, centerY - glassRadius * 0.08)
        context.lineTo(centerX - glassRadius * 0.42, centerY - glassRadius * 0.1)
      }
      closePathSafe(context)
      context.fillStyle = highlight
      context.fill()
      break
    }

    case 'type2': {
      const highlight = addColorStops(
        createLinearGradientSafe(
          context,
          centerX,
          centerY - glassRadius,
          centerX,
          centerY + glassRadius * 0.4,
          'rgba(255,255,255,0.08)'
        ),
        [
          [0, 'rgba(255,255,255,0.275)'],
          [1, 'rgba(255,255,255,0.015)']
        ]
      )

      context.beginPath()
      context.moveTo(centerX - glassRadius * 0.865, centerY + glassRadius * 0.392)
      if (typeof context.bezierCurveTo === 'function') {
        context.bezierCurveTo(
          centerX - glassRadius * 0.786,
          centerY + glassRadius * 0.284,
          centerX - glassRadius * 0.683,
          centerY + glassRadius * 0.196,
          centerX - glassRadius * 0.538,
          centerY + glassRadius * 0.121
        )
        context.bezierCurveTo(
          centerX - glassRadius * 0.388,
          centerY + glassRadius * 0.041,
          centerX - glassRadius * 0.267,
          centerY + glassRadius * 0.013,
          centerX - glassRadius * 0.127,
          centerY + glassRadius * 0.018
        )
        context.bezierCurveTo(
          centerX - glassRadius * 0.234,
          centerY - glassRadius * 0.192,
          centerX - glassRadius * 0.472,
          centerY - glassRadius * 0.281,
          centerX - glassRadius * 0.687,
          centerY - glassRadius * 0.174
        )
        context.bezierCurveTo(
          centerX - glassRadius * 0.902,
          centerY - glassRadius * 0.067,
          centerX - glassRadius * 0.972,
          centerY + glassRadius * 0.18,
          centerX - glassRadius * 0.865,
          centerY + glassRadius * 0.392
        )
      } else {
        context.lineTo(centerX - glassRadius * 0.538, centerY + glassRadius * 0.121)
        context.lineTo(centerX - glassRadius * 0.127, centerY + glassRadius * 0.018)
        context.lineTo(centerX - glassRadius * 0.472, centerY - glassRadius * 0.281)
        context.lineTo(centerX - glassRadius * 0.865, centerY + glassRadius * 0.392)
      }
      closePathSafe(context)
      context.fillStyle = highlight
      context.fill()
      break
    }

    case 'type3': {
      const highlight = addColorStops(
        createLinearGradientSafe(
          context,
          centerX,
          centerY - glassRadius * 0.907,
          centerX,
          centerY - glassRadius * 0.444,
          'rgba(255,255,255,0.08)'
        ),
        [
          [0, 'rgba(255,255,255,0.275)'],
          [1, 'rgba(255,255,255,0.015)']
        ]
      )

      context.beginPath()
      context.moveTo(centerX - glassRadius * 0.916, centerY + glassRadius * 0.009)
      if (typeof context.bezierCurveTo === 'function') {
        context.bezierCurveTo(
          centerX - glassRadius * 0.673,
          centerY + glassRadius * 0.128,
          centerX - glassRadius * 0.327,
          centerY + glassRadius * 0.128,
          centerX - glassRadius * 0.084,
          centerY + glassRadius * 0.009
        )
        context.bezierCurveTo(
          centerX - glassRadius * 0.043,
          centerY - glassRadius * 0.25,
          centerX - glassRadius * 0.327,
          centerY - glassRadius * 0.575,
          centerX,
          centerY - glassRadius * 0.916
        )
        context.bezierCurveTo(
          centerX + glassRadius * 0.327,
          centerY - glassRadius * 0.575,
          centerX + glassRadius * 0.043,
          centerY - glassRadius * 0.25,
          centerX + glassRadius * 0.916,
          centerY + glassRadius * 0.009
        )
        context.bezierCurveTo(
          centerX + glassRadius * 0.673,
          centerY + glassRadius * 0.128,
          centerX + glassRadius * 0.327,
          centerY + glassRadius * 0.128,
          centerX + glassRadius * 0.916,
          centerY + glassRadius * 0.009
        )
      } else {
        context.lineTo(centerX - glassRadius * 0.084, centerY + glassRadius * 0.009)
        context.lineTo(centerX, centerY - glassRadius * 0.916)
        context.lineTo(centerX + glassRadius * 0.916, centerY + glassRadius * 0.009)
      }
      closePathSafe(context)
      context.fillStyle = highlight
      context.fill()
      break
    }

    case 'type4': {
      const highlight = addColorStops(
        createLinearGradientSafe(
          context,
          centerX - glassRadius * 0.87,
          centerY - glassRadius * 0.631,
          centerX - glassRadius * 0.727,
          centerY - glassRadius * 0.588,
          'rgba(255,255,255,0)'
        ),
        [
          [0, 'rgba(255,255,255,0.275)'],
          [1, 'rgba(255,255,255,0.015)']
        ]
      )

      const radialGradient = addColorStops(
        createRadialGradientSafe(
          context,
          centerX,
          centerY,
          glassRadius * 0.18,
          centerX,
          centerY,
          glassRadius * 0.387,
          'rgba(255,255,255,0)'
        ),
        [
          [0, 'rgba(255,255,255,0)'],
          [0.82, 'rgba(255,255,255,0)'],
          [0.83, 'rgba(255,255,255,0.15)'],
          [1, 'rgba(255,255,255,0.15)']
        ]
      )

      context.beginPath()
      if (typeof context.bezierCurveTo === 'function') {
        context.moveTo(centerX + glassRadius * 0.135, centerY + glassRadius * 0.696)
        context.bezierCurveTo(
          centerX + glassRadius * 0.214,
          centerY + glassRadius * 0.588,
          centerX + glassRadius * 0.317,
          centerY + glassRadius * 0.5,
          centerX + glassRadius * 0.462,
          centerY + glassRadius * 0.425
        )
        context.bezierCurveTo(
          centerX + glassRadius * 0.612,
          centerY + glassRadius * 0.345,
          centerX + glassRadius * 0.733,
          centerY + glassRadius * 0.317,
          centerX + glassRadius * 0.873,
          centerY + glassRadius * 0.322
        )
        context.bezierCurveTo(
          centerX + glassRadius * 0.766,
          centerY + glassRadius * 0.112,
          centerX + glassRadius * 0.528,
          centerY + glassRadius * 0.023,
          centerX + glassRadius * 0.313,
          centerY + glassRadius * 0.13
        )
        context.bezierCurveTo(
          centerX + glassRadius * 0.098,
          centerY + glassRadius * 0.238,
          centerX + glassRadius * 0.028,
          centerY + glassRadius * 0.485,
          centerX + glassRadius * 0.135,
          centerY + glassRadius * 0.696
        )
        context.closePath()
        context.fillStyle = highlight
        context.fill()
      }

      drawCircle(context, centerX, centerY, glassRadius * 0.387)
      context.fillStyle = radialGradient
      context.fill()
      break
    }

    case 'type5': {
      const highlight = addColorStops(
        createLinearGradientSafe(
          context,
          centerX,
          centerY - glassRadius * 0.916,
          centerX,
          centerY - glassRadius * 0.356,
          'rgba(255,255,255,0.08)'
        ),
        [
          [0, 'rgba(255,255,255,0.275)'],
          [1, 'rgba(255,255,255,0.015)']
        ]
      )

      context.beginPath()
      context.moveTo(centerX - glassRadius * 0.916, centerY)
      if (typeof context.bezierCurveTo === 'function') {
        context.bezierCurveTo(
          centerX - glassRadius * 0.916,
          centerY + glassRadius * 0.009,
          centerX - glassRadius * 0.753,
          centerY + glassRadius * 0.031,
          centerX - glassRadius * 0.392,
          centerY - glassRadius * 0.043
        )
        context.bezierCurveTo(
          centerX - glassRadius * 0.094,
          centerY + glassRadius * 0.093,
          centerX + glassRadius * 0.155,
          centerY - glassRadius * 0.009,
          centerX + glassRadius * 0.5,
          centerY - glassRadius * 0.916
        )
        context.bezierCurveTo(
          centerX + glassRadius * 0.406,
          centerY - glassRadius * 0.331,
          centerX + glassRadius * 0.906,
          centerY + glassRadius * 0.411,
          centerX + glassRadius * 0.916,
          centerY + glassRadius * 0.537
        )
        context.bezierCurveTo(
          centerX + glassRadius * 0.703,
          centerY + glassRadius * 0.128,
          centerX + glassRadius * 0.327,
          centerY + glassRadius * 0.457,
          centerX - glassRadius * 0.916,
          centerY + glassRadius * 0.593
        )
        context.bezierCurveTo(
          centerX - glassRadius * 0.916,
          centerY + glassRadius * 0.243,
          centerX - glassRadius * 0.916,
          centerY + glassRadius * 0.366,
          centerX - glassRadius * 0.916,
          centerY
        )
      } else {
        context.lineTo(centerX + glassRadius * 0.5, centerY - glassRadius * 0.916)
        context.lineTo(centerX + glassRadius * 0.916, centerY + glassRadius * 0.537)
        context.lineTo(centerX - glassRadius * 0.392, centerY - glassRadius * 0.043)
        context.lineTo(centerX - glassRadius * 0.916, centerY)
      }
      closePathSafe(context)
      context.fillStyle = highlight
      context.fill()
      break
    }
  }

  context.restore()
}

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

export const drawRadialBackground = (
  context: CanvasRenderingContext2D,
  backgroundColor: RadialBackgroundColorName,
  size: number,
  centerX: number,
  centerY: number,
  radius: number,
  paint: ThemePaint,
  textColor: string
): void => {
  void textColor
  void radius

  const backgroundRadius = (0.831775 * size) / 2
  const palette = getGaugeBackgroundPalette(backgroundColor)
  const fallbackColor = paint.backgroundColor || rgbTupleToCss(palette.gradientStop)

  context.save()

  if (
    !drawRadialTextureBackground(
      context,
      backgroundColor,
      palette,
      centerX,
      centerY,
      backgroundRadius
    )
  ) {
    drawRadialColorBackground(
      context,
      palette,
      size,
      centerX,
      centerY,
      backgroundRadius,
      fallbackColor
    )
  }

  drawRadialInnerShadow(context, centerX, centerY, backgroundRadius)
  context.restore()
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
