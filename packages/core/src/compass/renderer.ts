import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { clamp } from '../math/range.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type {
  CompassAlert,
  CompassBackgroundColorName,
  CompassForegroundType,
  CompassFrameDesign,
  CompassGaugeConfig,
  CompassKnobStyle,
  CompassKnobType,
  CompassPointerColorName,
  CompassPointerType
} from './schema.js'

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

type Rgb = readonly [number, number, number]

type BackgroundPalette = {
  gradientStart: Rgb
  gradientFraction: Rgb
  gradientStop: Rgb
  labelColor: Rgb
  symbolColor: Rgb
}

type PointerColor = {
  light: Rgb
  medium: Rgb
  dark: Rgb
}

const PI = Math.PI
const HALF_PI = PI * 0.5
const TWO_PI = PI * 2
const RAD_FACTOR = PI / 180

const mergePaint = (paint?: Partial<ThemePaint>): ThemePaint => ({
  ...resolveThemePaint(),
  ...paint
})

const rgb = (value: Rgb): string => `rgb(${value[0]}, ${value[1]}, ${value[2]})`

const rgba = (value: Rgb, alpha: number): string =>
  `rgba(${value[0]}, ${value[1]}, ${value[2]}, ${alpha})`

const closePathSafe = (context: CompassDrawContext): void => {
  if (typeof context.closePath === 'function') {
    context.closePath()
  }
}

const createLinearGradientSafe = (
  context: CompassDrawContext,
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

const createRadialGradientSafe = (
  context: CompassDrawContext,
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number,
  fallback: string
): CanvasGradient | string => {
  if (typeof context.createRadialGradient !== 'function') {
    return fallback
  }

  return context.createRadialGradient(x0, y0, r0, x1, y1, r1)
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

const normalizeHeading = (heading: number, min: number, max: number): number => {
  const span = max - min
  if (span <= 0) {
    return heading
  }

  const normalized = (((heading - min) % span) + span) % span
  return min + normalized
}

const resolveActiveAlerts = (heading: number, alerts: CompassAlert[]): CompassAlert[] => {
  const tolerance = 8
  return alerts.filter((alert) => Math.abs(alert.heading - heading) <= tolerance)
}

const resolveTone = (activeAlerts: CompassAlert[]): 'accent' | 'warning' | 'danger' => {
  if (activeAlerts.some((alert) => alert.severity === 'critical')) {
    return 'danger'
  }

  if (activeAlerts.some((alert) => alert.severity === 'warning')) {
    return 'warning'
  }

  return 'accent'
}

const BACKGROUND_COLORS: Record<CompassBackgroundColorName, BackgroundPalette> = {
  DARK_GRAY: {
    gradientStart: [0, 0, 0],
    gradientFraction: [51, 51, 51],
    gradientStop: [153, 153, 153],
    labelColor: [255, 255, 255],
    symbolColor: [180, 180, 180]
  },
  SATIN_GRAY: {
    gradientStart: [45, 57, 57],
    gradientFraction: [45, 57, 57],
    gradientStop: [45, 57, 57],
    labelColor: [167, 184, 180],
    symbolColor: [137, 154, 150]
  },
  LIGHT_GRAY: {
    gradientStart: [130, 130, 130],
    gradientFraction: [181, 181, 181],
    gradientStop: [253, 253, 253],
    labelColor: [0, 0, 0],
    symbolColor: [80, 80, 80]
  },
  WHITE: {
    gradientStart: [255, 255, 255],
    gradientFraction: [255, 255, 255],
    gradientStop: [255, 255, 255],
    labelColor: [0, 0, 0],
    symbolColor: [80, 80, 80]
  },
  BLACK: {
    gradientStart: [0, 0, 0],
    gradientFraction: [0, 0, 0],
    gradientStop: [0, 0, 0],
    labelColor: [255, 255, 255],
    symbolColor: [150, 150, 150]
  },
  BEIGE: {
    gradientStart: [178, 172, 150],
    gradientFraction: [204, 205, 184],
    gradientStop: [231, 231, 214],
    labelColor: [0, 0, 0],
    symbolColor: [80, 80, 80]
  },
  BROWN: {
    gradientStart: [245, 225, 193],
    gradientFraction: [245, 225, 193],
    gradientStop: [255, 250, 240],
    labelColor: [109, 73, 47],
    symbolColor: [89, 53, 27]
  },
  RED: {
    gradientStart: [198, 93, 95],
    gradientFraction: [212, 132, 134],
    gradientStop: [242, 218, 218],
    labelColor: [0, 0, 0],
    symbolColor: [90, 0, 0]
  },
  GREEN: {
    gradientStart: [65, 120, 40],
    gradientFraction: [129, 171, 95],
    gradientStop: [218, 237, 202],
    labelColor: [0, 0, 0],
    symbolColor: [0, 90, 0]
  },
  BLUE: {
    gradientStart: [45, 83, 122],
    gradientFraction: [115, 144, 170],
    gradientStop: [227, 234, 238],
    labelColor: [0, 0, 0],
    symbolColor: [0, 0, 90]
  },
  ANTHRACITE: {
    gradientStart: [50, 50, 54],
    gradientFraction: [47, 47, 51],
    gradientStop: [69, 69, 74],
    labelColor: [250, 250, 250],
    symbolColor: [180, 180, 180]
  },
  MUD: {
    gradientStart: [80, 86, 82],
    gradientFraction: [70, 76, 72],
    gradientStop: [57, 62, 58],
    labelColor: [255, 255, 240],
    symbolColor: [225, 225, 210]
  },
  PUNCHED_SHEET: {
    gradientStart: [50, 50, 54],
    gradientFraction: [47, 47, 51],
    gradientStop: [69, 69, 74],
    labelColor: [255, 255, 255],
    symbolColor: [180, 180, 180]
  },
  CARBON: {
    gradientStart: [50, 50, 54],
    gradientFraction: [47, 47, 51],
    gradientStop: [69, 69, 74],
    labelColor: [255, 255, 255],
    symbolColor: [180, 180, 180]
  },
  STAINLESS: {
    gradientStart: [130, 130, 130],
    gradientFraction: [181, 181, 181],
    gradientStop: [253, 253, 253],
    labelColor: [0, 0, 0],
    symbolColor: [80, 80, 80]
  },
  BRUSHED_METAL: {
    gradientStart: [50, 50, 54],
    gradientFraction: [47, 47, 51],
    gradientStop: [69, 69, 74],
    labelColor: [0, 0, 0],
    symbolColor: [80, 80, 80]
  },
  BRUSHED_STAINLESS: {
    gradientStart: [50, 50, 54],
    gradientFraction: [47, 47, 51],
    gradientStop: [110, 110, 112],
    labelColor: [0, 0, 0],
    symbolColor: [80, 80, 80]
  },
  TURNED: {
    gradientStart: [130, 130, 130],
    gradientFraction: [181, 181, 181],
    gradientStop: [253, 253, 253],
    labelColor: [0, 0, 0],
    symbolColor: [80, 80, 80]
  }
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

const getBackgroundPalette = (name: CompassBackgroundColorName): BackgroundPalette => {
  return BACKGROUND_COLORS[name]
}

const getPointerColor = (name: CompassPointerColorName): PointerColor => {
  return POINTER_COLORS[name]
}

const drawFrame = (
  context: CompassDrawContext,
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

const drawRadialCustomImage = (
  context: CompassDrawContext,
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
  context: CompassDrawContext,
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

const drawCarbonPattern = (context: CompassDrawContext): CanvasPattern | null => {
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
    closePathSafe(brush as CompassDrawContext)
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

const drawPunchedSheetPattern = (context: CompassDrawContext): CanvasPattern | null => {
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
  closePathSafe(brush as CompassDrawContext)
  brush.fill()

  brush.fillStyle = '#050506'
  brush.beginPath()
  brush.moveTo(0, 2)
  brush.bezierCurveTo(0, 0.9, 0.9, 0, 2, 0)
  brush.bezierCurveTo(3.1, 0, 4, 0.9, 4, 2)
  brush.bezierCurveTo(4, 3.1, 3.1, 4, 2, 4)
  brush.bezierCurveTo(0.9, 4, 0, 3.1, 0, 2)
  closePathSafe(brush as CompassDrawContext)
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
  closePathSafe(brush as CompassDrawContext)
  brush.fill()

  brush.fillStyle = '#050506'
  brush.beginPath()
  brush.moveTo(7, 9)
  brush.bezierCurveTo(7, 7.9, 7.9, 7, 9, 7)
  brush.bezierCurveTo(10.1, 7, 11, 7.9, 11, 9)
  brush.bezierCurveTo(11, 10.1, 10.1, 11, 9, 11)
  brush.bezierCurveTo(7.9, 11, 7, 10.1, 7, 9)
  closePathSafe(brush as CompassDrawContext)
  brush.fill()

  return context.createPattern(canvas as CanvasImageSource, 'repeat')
}

const drawBrushedMetalPattern = (
  context: CompassDrawContext,
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

const drawBackground = (
  context: CompassDrawContext,
  backgroundColorName: CompassBackgroundColorName,
  centerX: number,
  centerY: number,
  imageWidth: number
): void => {
  const color = getBackgroundPalette(backgroundColorName)
  const backgroundOffsetX = (0.831775 * imageWidth) / 2

  context.save()
  context.beginPath()
  context.arc(centerX, centerY, backgroundOffsetX, 0, TWO_PI)
  closePathSafe(context)

  if (backgroundColorName === 'CARBON') {
    const pattern = drawCarbonPattern(context)
    context.fillStyle = pattern ?? rgb(color.gradientStop)
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
    context.fillStyle = pattern ?? rgb(color.gradientStop)
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
    context.fillStyle = pattern ?? rgb(color.gradientStop)
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
      context.fillStyle = rgb(color.gradientStop)
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
        rgb(color.gradientStop)
      ),
      [
        [0, rgb(color.gradientStart)],
        [0.4, rgb(color.gradientFraction)],
        [1, rgb(color.gradientStop)]
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

const drawRoseImage = (
  context: CompassDrawContext,
  centerX: number,
  centerY: number,
  imageWidth: number,
  imageHeight: number,
  symbolColor: Rgb
): void => {
  context.save()
  context.lineWidth = 1
  context.strokeStyle = rgb(symbolColor)
  context.fillStyle = rgb(symbolColor)
  context.translate(centerX, centerY)

  let fill = true
  for (let i = 0; i < 360; i += 15) {
    context.beginPath()
    context.moveTo(
      0.26 * imageWidth * Math.cos(i * RAD_FACTOR),
      0.26 * imageWidth * Math.sin(i * RAD_FACTOR)
    )
    context.lineTo(
      0.23 * imageWidth * Math.cos(i * RAD_FACTOR),
      0.23 * imageWidth * Math.sin(i * RAD_FACTOR)
    )
    context.arc(0, 0, 0.23 * imageWidth, i * RAD_FACTOR, (i + 15) * RAD_FACTOR, false)
    context.lineTo(
      0.26 * imageWidth * Math.cos((i + 15) * RAD_FACTOR),
      0.26 * imageWidth * Math.sin((i + 15) * RAD_FACTOR)
    )
    context.arc(0, 0, 0.26 * imageWidth, (i + 15) * RAD_FACTOR, i * RAD_FACTOR, true)
    closePathSafe(context)
    if (fill) {
      context.fill()
    }
    context.stroke()
    fill = !fill
  }

  context.translate(-centerX, -centerY)

  for (let i = 0; i <= 360; i += 90) {
    context.beginPath()
    context.moveTo(0.560747 * imageWidth, 0.584112 * imageHeight)
    context.lineTo(0.640186 * imageWidth, 0.644859 * imageHeight)
    context.lineTo(0.584112 * imageWidth, 0.560747 * imageHeight)
    closePathSafe(context)
    context.fillStyle = rgb(symbolColor)
    context.fill()
    context.stroke()

    context.beginPath()
    context.moveTo(0.523364 * imageWidth, 0.397196 * imageHeight)
    context.lineTo(0.5 * imageWidth, 0.196261 * imageHeight)
    context.lineTo(0.471962 * imageWidth, 0.397196 * imageHeight)
    closePathSafe(context)
    context.fillStyle = addColorStops(
      createLinearGradientSafe(
        context,
        0.476635 * imageWidth,
        0,
        0.518691 * imageWidth,
        0,
        rgb(symbolColor)
      ),
      [
        [0, 'rgb(222, 223, 218)'],
        [0.48, 'rgb(222, 223, 218)'],
        [0.49, rgb(symbolColor)],
        [1, rgb(symbolColor)]
      ]
    )
    context.fill()
    context.stroke()

    context.translate(centerX, centerY)
    context.rotate(i * RAD_FACTOR)
    context.translate(-centerX, -centerY)
  }

  context.translate(centerX, centerY)
  context.beginPath()
  context.arc(0, 0, 0.1 * imageWidth, 0, TWO_PI)
  context.closePath()
  context.lineWidth = 0.022 * imageWidth
  context.strokeStyle = rgb(symbolColor)
  context.stroke()
  context.restore()
}

const drawTickmarksImage = (
  context: CompassDrawContext,
  config: CompassGaugeConfig,
  imageWidth: number,
  pointSymbols: readonly [string, string, string, string, string, string, string, string],
  labelColor: Rgb,
  symbolColor: Rgb
): void => {
  const degreeScale = config.style.degreeScale || config.rose.showDegreeLabels
  const pointSymbolsVisible = config.style.pointSymbolsVisible && config.rose.showOrdinalMarkers

  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.strokeStyle = rgb(labelColor)
  context.fillStyle = rgb(labelColor)
  context.save()
  context.translate(imageWidth / 2, imageWidth / 2)

  if (!degreeScale) {
    const stdFont = `${Math.floor(0.12 * imageWidth)}px serif`
    const smlFont = `${Math.floor(0.06 * imageWidth)}px serif`

    for (let i = 0; i < 360; i += 2.5) {
      if (i % 5 === 0) {
        context.beginPath()
        context.moveTo(0.38 * imageWidth, 0)
        context.lineTo(0.36 * imageWidth, 0)
        closePathSafe(context)
        context.lineWidth = 1
        context.strokeStyle = rgb(labelColor)
        context.stroke()
      }

      if (pointSymbolsVisible) {
        context.save()
        switch (i) {
          case 0:
            context.font = stdFont
            context.translate(0.35 * imageWidth, 0)
            context.rotate(HALF_PI)
            context.fillText(pointSymbols[2], 0, 0)
            break
          case 45:
            context.font = smlFont
            context.translate(0.29 * imageWidth, 0)
            context.rotate(HALF_PI)
            context.fillText(pointSymbols[3], 0, 0)
            break
          case 90:
            context.font = stdFont
            context.translate(0.35 * imageWidth, 0)
            context.rotate(HALF_PI)
            context.fillText(pointSymbols[4], 0, 0)
            break
          case 135:
            context.font = smlFont
            context.translate(0.29 * imageWidth, 0)
            context.rotate(HALF_PI)
            context.fillText(pointSymbols[5], 0, 0)
            break
          case 180:
            context.font = stdFont
            context.translate(0.35 * imageWidth, 0)
            context.rotate(HALF_PI)
            context.fillText(pointSymbols[6], 0, 0)
            break
          case 225:
            context.font = smlFont
            context.translate(0.29 * imageWidth, 0)
            context.rotate(HALF_PI)
            context.fillText(pointSymbols[7], 0, 0)
            break
          case 270:
            context.font = stdFont
            context.translate(0.35 * imageWidth, 0)
            context.rotate(HALF_PI)
            context.fillText(pointSymbols[0], 0, 0)
            break
          case 315:
            context.font = smlFont
            context.translate(0.29 * imageWidth, 0)
            context.rotate(HALF_PI)
            context.fillText(pointSymbols[1], 0, 0)
            break
        }
        context.restore()
      }

      if (config.style.roseVisible && (i === 360 || i % 22.5 === 0)) {
        context.beginPath()
        context.moveTo(i % 45 === 0 ? 0.38 * imageWidth : 0.29 * imageWidth, 0)
        context.lineTo(0.1 * imageWidth, 0)
        context.closePath()
        context.lineWidth = 1
        context.strokeStyle = rgb(symbolColor)
        context.stroke()
      }

      context.rotate(RAD_FACTOR * 2.5)
    }
  } else {
    const stdFont = `${Math.floor(0.08 * imageWidth)}px serif`
    const smlFont = `${Math.floor(0.033 * imageWidth)}px serif`
    context.rotate(10 * RAD_FACTOR)

    for (let i = 10; i <= 360; i += 10) {
      context.save()

      if (pointSymbolsVisible) {
        switch (i) {
          case 360:
            context.font = stdFont
            context.translate(0.35 * imageWidth, 0)
            context.rotate(HALF_PI)
            context.fillText(pointSymbols[2], 0, 0)
            break
          case 90:
            context.font = stdFont
            context.translate(0.35 * imageWidth, 0)
            context.rotate(HALF_PI)
            context.fillText(pointSymbols[4], 0, 0)
            break
          case 180:
            context.font = stdFont
            context.translate(0.35 * imageWidth, 0)
            context.rotate(HALF_PI)
            context.fillText(pointSymbols[6], 0, 0)
            break
          case 270:
            context.font = stdFont
            context.translate(0.35 * imageWidth, 0)
            context.rotate(HALF_PI)
            context.fillText(pointSymbols[0], 0, 0)
            break
          default: {
            const val = (i + 90) % 360
            context.font = smlFont
            context.translate(0.37 * imageWidth, 0)
            context.rotate(HALF_PI)
            context.fillText(`${val >= 100 ? '' : '0'}${val}`, 0, 0)
            break
          }
        }
      } else {
        const val = (i + 90) % 360
        context.font = smlFont
        context.translate(0.37 * imageWidth, 0)
        context.rotate(HALF_PI)
        context.fillText(`${val >= 100 ? '' : '0'}${val}`, 0, 0)
      }

      context.restore()
      context.rotate(10 * RAD_FACTOR)
    }
  }

  context.restore()
}

const drawPointerImage = (
  context: CompassDrawContext,
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

const drawCenterKnob = (
  context: CompassDrawContext,
  imageWidth: number,
  knobType: CompassKnobType,
  knobStyle: CompassKnobStyle
): void => {
  const knobSize = Math.ceil(0.084112 * imageWidth)
  const centerX = imageWidth * 0.5
  const centerY = imageWidth * 0.5
  const radius = knobSize / 2

  context.save()
  context.shadowColor = 'rgba(0, 0, 0, 0.8)'
  context.shadowOffsetX = imageWidth * 0.008
  context.shadowOffsetY = imageWidth * 0.008
  context.shadowBlur = imageWidth * 0.016

  if (knobType === 'metalKnob') {
    context.beginPath()
    context.arc(centerX, centerY, radius, 0, TWO_PI)
    closePathSafe(context)
    context.fillStyle = addColorStops(
      createLinearGradientSafe(
        context,
        centerX - radius,
        centerY - radius,
        centerX - radius,
        centerY + radius,
        '#2e3135'
      ),
      [
        [0, 'rgb(92, 95, 101)'],
        [0.47, 'rgb(46, 49, 53)'],
        [1, 'rgb(22, 23, 26)']
      ]
    )
    context.fill()

    context.beginPath()
    context.arc(centerX, centerY, radius * 0.78, 0, TWO_PI)
    closePathSafe(context)
    const innerStops: Array<readonly [number, string]> =
      knobStyle === 'black'
        ? [
            [0, 'rgb(43, 42, 47)'],
            [1, 'rgb(26, 27, 32)']
          ]
        : knobStyle === 'brass'
          ? [
              [0, 'rgb(150, 110, 54)'],
              [1, 'rgb(124, 95, 61)']
            ]
          : [
              [0, 'rgb(204, 204, 204)'],
              [1, 'rgb(87, 92, 98)']
            ]
    context.fillStyle = addColorStops(
      createLinearGradientSafe(
        context,
        centerX,
        centerY - radius,
        centerX,
        centerY + radius,
        innerStops[1]?.[1] ?? '#888'
      ),
      innerStops
    )
    context.fill()
  } else {
    context.beginPath()
    context.arc(centerX, centerY, radius, 0, TWO_PI)
    closePathSafe(context)
    context.fillStyle = addColorStops(
      createLinearGradientSafe(
        context,
        centerX,
        centerY - radius,
        centerX,
        centerY + radius,
        '#282828'
      ),
      [
        [0, 'rgb(180, 180, 180)'],
        [0.46, 'rgb(63, 63, 63)'],
        [1, 'rgb(40, 40, 40)']
      ]
    )
    context.fill()

    context.beginPath()
    context.arc(centerX, centerY, (0.77 * knobSize) / 2, 0, TWO_PI)
    closePathSafe(context)
    const styleStops: Array<readonly [number, string]> =
      knobStyle === 'black'
        ? [
            [0, 'rgb(191, 191, 191)'],
            [0.5, 'rgb(45, 44, 49)'],
            [1, 'rgb(125, 126, 128)']
          ]
        : knobStyle === 'brass'
          ? [
              [0, 'rgb(223, 208, 174)'],
              [0.5, 'rgb(123, 95, 63)'],
              [1, 'rgb(207, 190, 157)']
            ]
          : [
              [0, 'rgb(215, 215, 215)'],
              [0.5, 'rgb(116, 116, 116)'],
              [1, 'rgb(215, 215, 215)']
            ]
    context.fillStyle = addColorStops(
      createLinearGradientSafe(
        context,
        centerX,
        centerY - radius,
        centerX,
        centerY + radius,
        styleStops[1]?.[1] ?? '#777'
      ),
      styleStops
    )
    context.fill()
  }

  context.restore()
}

const drawForeground = (
  context: CompassDrawContext,
  foregroundType: CompassForegroundType,
  imageWidth: number,
  imageHeight: number,
  knobType: CompassKnobType,
  knobStyle: CompassKnobStyle
): void => {
  context.save()
  context.beginPath()

  switch (foregroundType) {
    case 'type2':
      context.moveTo(0.135514 * imageWidth, 0.696261 * imageHeight)
      context.bezierCurveTo(
        0.214953 * imageWidth,
        0.588785 * imageHeight,
        0.102803 * imageWidth,
        0.471962 * imageHeight,
        0.102803 * imageWidth,
        0.313084 * imageHeight
      )
      context.bezierCurveTo(
        0.102803 * imageWidth,
        0.200934 * imageHeight,
        0.168224 * imageWidth,
        0.084112 * imageHeight,
        0.5 * imageWidth,
        0.084112 * imageHeight
      )
      context.bezierCurveTo(
        0.831775 * imageWidth,
        0.084112 * imageHeight,
        0.897196 * imageWidth,
        0.200934 * imageHeight,
        0.897196 * imageWidth,
        0.313084 * imageHeight
      )
      context.bezierCurveTo(
        0.897196 * imageWidth,
        0.471962 * imageHeight,
        0.785046 * imageWidth,
        0.588785 * imageHeight,
        0.864485 * imageWidth,
        0.696261 * imageHeight
      )
      context.bezierCurveTo(
        0.682242 * imageWidth,
        0.784112 * imageHeight,
        0.317757 * imageWidth,
        0.784112 * imageHeight,
        0.135514 * imageWidth,
        0.696261 * imageHeight
      )
      closePathSafe(context)
      context.fillStyle = addColorStops(
        createLinearGradientSafe(
          context,
          0.313084 * imageWidth,
          0.135514 * imageHeight,
          0.495528 * imageWidth,
          0.493582 * imageHeight,
          'rgba(255, 255, 255, 0.015)'
        ),
        [
          [0, 'rgba(255, 255, 255, 0.275)'],
          [1, 'rgba(255, 255, 255, 0.015)']
        ]
      )
      context.fill()
      break
    case 'type3':
      context.moveTo(0.084112 * imageWidth, 0.5 * imageHeight)
      context.bezierCurveTo(
        0.084112 * imageWidth,
        0.084112 * imageHeight,
        0.915887 * imageWidth,
        0.084112 * imageHeight,
        0.915887 * imageWidth,
        0.5 * imageHeight
      )
      context.bezierCurveTo(
        0.915887 * imageWidth,
        0.556073 * imageHeight,
        0.878504 * imageWidth,
        0.556073 * imageHeight,
        0.836448 * imageWidth,
        0.556073 * imageHeight
      )
      context.bezierCurveTo(
        0.822429 * imageWidth,
        0.509345 * imageHeight,
        0.761682 * imageWidth,
        0.439252 * imageHeight,
        0.5 * imageWidth,
        0.439252 * imageHeight
      )
      context.bezierCurveTo(
        0.238317 * imageWidth,
        0.439252 * imageHeight,
        0.17757 * imageWidth,
        0.509345 * imageHeight,
        0.163551 * imageWidth,
        0.556073 * imageHeight
      )
      context.bezierCurveTo(
        0.121495 * imageWidth,
        0.556073 * imageHeight,
        0.084112 * imageWidth,
        0.556073 * imageHeight,
        0.084112 * imageWidth,
        0.5 * imageHeight
      )
      closePathSafe(context)
      context.fillStyle = addColorStops(
        createLinearGradientSafe(
          context,
          0,
          0.093457 * imageHeight,
          0,
          0.556073 * imageHeight,
          'rgba(255, 255, 255, 0.015)'
        ),
        [
          [0, 'rgba(255, 255, 255, 0.275)'],
          [1, 'rgba(255, 255, 255, 0.015)']
        ]
      )
      context.fill()
      break
    case 'type4': {
      context.moveTo(0.67757 * imageWidth, 0.24299 * imageHeight)
      context.bezierCurveTo(
        0.570093 * imageWidth,
        0.149532 * imageHeight,
        0.429906 * imageWidth,
        0.149532 * imageHeight,
        0.322429 * imageWidth,
        0.24299 * imageHeight
      )
      context.bezierCurveTo(
        0.228971 * imageWidth,
        0.331775 * imageHeight,
        0.182242 * imageWidth,
        0.415887 * imageHeight,
        0.182242 * imageWidth,
        0.5 * imageHeight
      )
      context.bezierCurveTo(
        0.182242 * imageWidth,
        0.626168 * imageHeight,
        0.322429 * imageWidth,
        0.626168 * imageHeight,
        0.5 * imageWidth,
        0.626168 * imageHeight
      )
      context.bezierCurveTo(
        0.649532 * imageWidth,
        0.626168 * imageHeight,
        0.794392 * imageWidth,
        0.626168 * imageHeight,
        0.812149 * imageWidth,
        0.504672 * imageHeight
      )
      context.bezierCurveTo(
        0.816822 * imageWidth,
        0.415887 * imageHeight,
        0.780373 * imageWidth,
        0.331775 * imageHeight,
        0.67757 * imageWidth,
        0.24299 * imageHeight
      )
      closePathSafe(context)
      context.fillStyle = addColorStops(
        createRadialGradientSafe(
          context,
          0.5 * imageWidth,
          0.5 * imageHeight,
          0,
          0.5 * imageWidth,
          0.5 * imageHeight,
          0.38785 * imageWidth,
          'rgba(255, 255, 255, 0.15)'
        ),
        [
          [0, 'rgba(255, 255, 255, 0)'],
          [0.82, 'rgba(255, 255, 255, 0)'],
          [0.83, 'rgba(255, 255, 255, 0)'],
          [1, 'rgba(255, 255, 255, 0.15)']
        ]
      )
      context.fill()

      context.beginPath()
      context.moveTo(0.168224 * imageWidth, 0.457943 * imageHeight)
      context.bezierCurveTo(
        0.168224 * imageWidth,
        0.401869 * imageHeight,
        0.205607 * imageWidth,
        0.345794 * imageHeight,
        0.252336 * imageWidth,
        0.345794 * imageHeight
      )
      context.bezierCurveTo(
        0.303738 * imageWidth,
        0.345794 * imageHeight,
        0.350467 * imageWidth,
        0.401869 * imageHeight,
        0.350467 * imageWidth,
        0.457943 * imageHeight
      )
      context.bezierCurveTo(
        0.350467 * imageWidth,
        0.509345 * imageHeight,
        0.303738 * imageWidth,
        0.560747 * imageHeight,
        0.252336 * imageWidth,
        0.560747 * imageHeight
      )
      context.bezierCurveTo(
        0.205607 * imageWidth,
        0.560747 * imageHeight,
        0.168224 * imageWidth,
        0.509345 * imageHeight,
        0.168224 * imageWidth,
        0.457943 * imageHeight
      )
      closePathSafe(context)
      context.fillStyle = addColorStops(
        createLinearGradientSafe(
          context,
          0.130841 * imageWidth,
          0.369158 * imageHeight,
          0.273839 * imageWidth,
          0.412877 * imageHeight,
          'rgba(255, 255, 255, 0.015)'
        ),
        [
          [0, 'rgba(255, 255, 255, 0.275)'],
          [1, 'rgba(255, 255, 255, 0.015)']
        ]
      )
      context.fill()
      break
    }
    case 'type5':
      context.moveTo(0.084112 * imageWidth, 0.5 * imageHeight)
      context.bezierCurveTo(
        0.084112 * imageWidth,
        0.224299 * imageHeight,
        0.224299 * imageWidth,
        0.084112 * imageHeight,
        0.5 * imageWidth,
        0.084112 * imageHeight
      )
      context.bezierCurveTo(
        0.7757 * imageWidth,
        0.084112 * imageHeight,
        0.915887 * imageWidth,
        0.224299 * imageHeight,
        0.915887 * imageWidth,
        0.5 * imageHeight
      )
      context.bezierCurveTo(
        0.915887 * imageWidth,
        0.560747 * imageHeight,
        0.878504 * imageWidth,
        0.640186 * imageHeight,
        0.845794 * imageWidth,
        0.644859 * imageHeight
      )
      context.bezierCurveTo(
        0.845794 * imageWidth,
        0.570093 * imageHeight,
        0.789719 * imageWidth,
        0.504672 * imageHeight,
        0.5 * imageWidth,
        0.504672 * imageHeight
      )
      context.bezierCurveTo(
        0.21028 * imageWidth,
        0.504672 * imageHeight,
        0.154205 * imageWidth,
        0.570093 * imageHeight,
        0.154205 * imageWidth,
        0.644859 * imageHeight
      )
      context.bezierCurveTo(
        0.121495 * imageWidth,
        0.640186 * imageHeight,
        0.084112 * imageWidth,
        0.560747 * imageHeight,
        0.084112 * imageWidth,
        0.5 * imageHeight
      )
      closePathSafe(context)
      context.fillStyle = addColorStops(
        createLinearGradientSafe(
          context,
          0,
          0.084112 * imageHeight,
          0,
          0.644859 * imageHeight,
          'rgba(255, 255, 255, 0.015)'
        ),
        [
          [0, 'rgba(255, 255, 255, 0.275)'],
          [1, 'rgba(255, 255, 255, 0.015)']
        ]
      )
      context.fill()
      break
    case 'type1':
    default:
      context.moveTo(0.084112 * imageWidth, 0.5 * imageHeight)
      context.bezierCurveTo(
        0.084112 * imageWidth,
        0.084112 * imageHeight,
        0.915887 * imageWidth,
        0.084112 * imageHeight,
        0.915887 * imageWidth,
        0.5 * imageHeight
      )
      context.bezierCurveTo(
        0.915887 * imageWidth,
        0.556073 * imageHeight,
        0.878504 * imageWidth,
        0.556073 * imageHeight,
        0.836448 * imageWidth,
        0.556073 * imageHeight
      )
      context.bezierCurveTo(
        0.822429 * imageWidth,
        0.509345 * imageHeight,
        0.761682 * imageWidth,
        0.439252 * imageHeight,
        0.5 * imageWidth,
        0.439252 * imageHeight
      )
      context.bezierCurveTo(
        0.238317 * imageWidth,
        0.439252 * imageHeight,
        0.17757 * imageWidth,
        0.509345 * imageHeight,
        0.163551 * imageWidth,
        0.556073 * imageHeight
      )
      context.bezierCurveTo(
        0.121495 * imageWidth,
        0.556073 * imageHeight,
        0.084112 * imageWidth,
        0.556073 * imageHeight,
        0.084112 * imageWidth,
        0.5 * imageHeight
      )
      closePathSafe(context)
      context.fillStyle = addColorStops(
        createLinearGradientSafe(
          context,
          0,
          0.088785 * imageHeight,
          0,
          0.490654 * imageHeight,
          'rgba(255, 255, 255, 0.015)'
        ),
        [
          [0, 'rgba(255, 255, 255, 0.275)'],
          [1, 'rgba(255, 255, 255, 0.015)']
        ]
      )
      context.fill()
      break
  }

  drawCenterKnob(context, imageWidth, knobType, knobStyle)
  context.restore()
}

const drawLabels = (
  context: CompassDrawContext,
  config: CompassGaugeConfig,
  paint: ThemePaint,
  heading: number,
  showHeadingReadout: boolean,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  if (!showHeadingReadout) {
    return
  }

  context.fillStyle = paint.textColor
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  if (config.text.title) {
    context.font = `600 ${Math.max(12, Math.round(radius * 0.12))}px ${paint.fontFamily}`
    context.fillText(config.text.title, centerX, centerY + radius * 0.44)
  }

  context.font = `700 ${Math.max(15, Math.round(radius * 0.16))}px ${paint.fontFamily}`
  context.fillText(`${Math.round(heading)}°`, centerX, centerY + radius * 0.3)

  if (config.text.unit) {
    context.font = `500 ${Math.max(9, Math.round(radius * 0.075))}px ${paint.fontFamily}`
    context.fillText(config.text.unit, centerX, centerY + radius * 0.4)
  }
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

  const activeAlerts = resolveActiveAlerts(heading, config.indicators.alerts)
  const tone = resolveTone(activeAlerts)
  const pointerColorName =
    tone === 'danger' ? 'RED' : tone === 'warning' ? 'ORANGE' : config.style.pointerColor

  const backgroundPalette = getBackgroundPalette(config.style.backgroundColor)
  const canTransform =
    typeof context.translate === 'function' && typeof context.rotate === 'function'

  context.clearRect(0, 0, config.size.width, config.size.height)

  if (config.visibility.showFrame) {
    drawFrame(context, config.style.frameDesign, centerX, centerY, imageWidth, imageWidth)
  }

  if (config.visibility.showBackground) {
    drawBackground(context, config.style.backgroundColor, centerX, centerY, imageWidth)
  }

  const customLayer = config.style.customLayer as CanvasImageSource | null | undefined
  drawRadialCustomImage(context, customLayer ?? null, centerX, centerY, imageWidth, imageWidth)

  if (
    canTransform &&
    config.style.roseVisible &&
    config.visibility.showBackground &&
    !config.style.rotateFace
  ) {
    drawRoseImage(context, centerX, centerY, imageWidth, imageWidth, backgroundPalette.symbolColor)
  }

  if (canTransform) {
    drawTickmarksImage(
      context,
      config,
      imageWidth,
      config.style.pointSymbols,
      backgroundPalette.labelColor,
      backgroundPalette.symbolColor
    )
  }

  if (canTransform) {
    context.save()
    context.translate(centerX, centerY)

    if (config.style.rotateFace) {
      context.rotate(-(heading * RAD_FACTOR))
      if (config.style.roseVisible && config.visibility.showBackground) {
        drawRoseImage(context, 0, 0, imageWidth, imageWidth, backgroundPalette.symbolColor)
      }
      context.rotate(heading * RAD_FACTOR)
    } else {
      context.rotate(heading * RAD_FACTOR)
    }

    context.translate(-centerX, -centerY)
    context.shadowColor = 'rgba(0, 0, 0, 0.8)'
    context.shadowOffsetX = imageWidth * 0.006
    context.shadowOffsetY = imageWidth * 0.006
    context.shadowBlur = imageWidth * 0.012
    drawPointerImage(
      context,
      config.style.pointerType,
      getPointerColor(pointerColorName),
      imageWidth
    )
    context.restore()
  } else {
    context.beginPath()
    context.moveTo(centerX, centerY)
    context.lineTo(centerX, centerY - radius * 0.65)
    context.strokeStyle = rgb(getPointerColor(pointerColorName).medium)
    context.lineWidth = Math.max(2, radius * 0.015)
    context.stroke()
  }

  if (config.visibility.showForeground) {
    drawForeground(
      context,
      config.style.foregroundType,
      imageWidth,
      imageWidth,
      config.style.knobType,
      config.style.knobStyle
    )
  }

  drawLabels(context, config, paint, heading, showHeadingReadout, centerX, centerY, radius)

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
