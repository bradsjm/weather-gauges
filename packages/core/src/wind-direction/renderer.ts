import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import type { ThemePaint } from '../theme/tokens.js'
import type {
  WindDirectionGaugeConfig,
  WindDirectionPointer,
  WindDirectionSection
} from './schema.js'

export type WindDirectionDrawContext = CanvasRenderingContext2D

export type WindDirectionRenderResult = {
  latest: number
  average: number
  tone: 'accent' | 'warning' | 'danger'
  activeAlerts: { id: string; message: string; severity: 'info' | 'warning' | 'critical' }[]
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
type LcdColors = {
  gradientStart: Rgb
  gradientFraction1: Rgb
  gradientFraction2: Rgb
  gradientFraction3: Rgb
  gradientStop: Rgb
  text: Rgb
}

const PI = Math.PI
const TWO_PI = Math.PI * 2
const RAD_FACTOR = PI / 180

const rgb = (value: Rgb): string => `rgb(${value[0]},${value[1]},${value[2]})`

const closePathSafe = (context: WindDirectionDrawContext): void => {
  if (typeof context.closePath === 'function') {
    context.closePath()
  }
}

const createLinearGradientSafe = (
  context: WindDirectionDrawContext,
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
  context: WindDirectionDrawContext,
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

const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360
}

const BACKGROUND_COLORS: Record<
  WindDirectionGaugeConfig['style']['backgroundColor'],
  BackgroundPalette
> = {
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

const POINTER_COLORS: Record<WindDirectionPointer['color'], PointerColor> = {
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

const LCD_COLORS: Record<WindDirectionGaugeConfig['style']['lcdColor'], LcdColors> = {
  STANDARD: {
    gradientStart: [131, 133, 119],
    gradientFraction1: [176, 183, 167],
    gradientFraction2: [165, 174, 153],
    gradientFraction3: [166, 175, 156],
    gradientStop: [175, 184, 165],
    text: [35, 42, 52]
  },
  STANDARD_GREEN: {
    gradientStart: [255, 255, 255],
    gradientFraction1: [219, 230, 220],
    gradientFraction2: [179, 194, 178],
    gradientFraction3: [153, 176, 151],
    gradientStop: [114, 138, 109],
    text: [8, 12, 6]
  },
  BLUE: {
    gradientStart: [255, 255, 255],
    gradientFraction1: [231, 246, 255],
    gradientFraction2: [170, 224, 255],
    gradientFraction3: [136, 212, 255],
    gradientStop: [192, 232, 255],
    text: [18, 69, 100]
  },
  ORANGE: {
    gradientStart: [255, 255, 255],
    gradientFraction1: [255, 245, 225],
    gradientFraction2: [255, 217, 147],
    gradientFraction3: [255, 201, 104],
    gradientStop: [255, 227, 173],
    text: [80, 55, 0]
  },
  RED: {
    gradientStart: [255, 255, 255],
    gradientFraction1: [255, 225, 225],
    gradientFraction2: [253, 152, 152],
    gradientFraction3: [252, 114, 115],
    gradientStop: [254, 178, 178],
    text: [79, 12, 14]
  },
  YELLOW: {
    gradientStart: [255, 255, 255],
    gradientFraction1: [245, 255, 186],
    gradientFraction2: [210, 255, 0],
    gradientFraction3: [158, 205, 0],
    gradientStop: [210, 255, 0],
    text: [64, 83, 0]
  },
  WHITE: {
    gradientStart: [255, 255, 255],
    gradientFraction1: [255, 255, 255],
    gradientFraction2: [241, 246, 242],
    gradientFraction3: [229, 239, 244],
    gradientStop: [255, 255, 255],
    text: [0, 0, 0]
  },
  GRAY: {
    gradientStart: [65, 65, 65],
    gradientFraction1: [117, 117, 117],
    gradientFraction2: [87, 87, 87],
    gradientFraction3: [65, 65, 65],
    gradientStop: [81, 81, 81],
    text: [255, 255, 255]
  },
  BLACK: {
    gradientStart: [65, 65, 65],
    gradientFraction1: [102, 102, 102],
    gradientFraction2: [51, 51, 51],
    gradientFraction3: [0, 0, 0],
    gradientStop: [51, 51, 51],
    text: [204, 204, 204]
  }
}

const drawFrame = (
  context: WindDirectionDrawContext,
  frameDesign: WindDirectionGaugeConfig['style']['frameDesign'],
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
  context.strokeStyle = 'rgba(132,132,132,0.5)'
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
        [0.07, 'rgb(210,210,210)'],
        [0.12, 'rgb(179,179,179)'],
        [1, 'rgb(213,213,213)']
      ])
      break
    case 'brass':
      fillFrameWithLinearGradient(0, imageHeight * 0.004672, 0, imageHeight * 0.990654, [
        [0, 'rgb(249,243,155)'],
        [0.05, 'rgb(246,226,101)'],
        [0.1, 'rgb(240,225,132)'],
        [0.5, 'rgb(90,57,22)'],
        [0.9, 'rgb(249,237,139)'],
        [0.95, 'rgb(243,226,108)'],
        [1, 'rgb(202,182,113)']
      ])
      break
    case 'steel':
      fillFrameWithLinearGradient(0, imageHeight * 0.004672, 0, imageHeight * 0.990654, [
        [0, 'rgb(231,237,237)'],
        [0.05, 'rgb(189,199,198)'],
        [0.1, 'rgb(192,201,200)'],
        [0.5, 'rgb(23,31,33)'],
        [0.9, 'rgb(196,205,204)'],
        [0.95, 'rgb(194,204,203)'],
        [1, 'rgb(189,201,199)']
      ])
      break
    case 'chrome':
      fillFrameWithLinearGradient(0, imageHeight * 0.004672, 0, imageHeight * 0.990654, [
        [0, 'rgb(255,255,255)'],
        [0.05, 'rgb(219,219,219)'],
        [0.1, 'rgb(227,227,227)'],
        [0.5, 'rgb(63,63,63)'],
        [0.9, 'rgb(227,227,227)'],
        [0.95, 'rgb(219,219,219)'],
        [1, 'rgb(255,255,255)']
      ])
      break
    case 'gold':
      fillFrameWithLinearGradient(0, imageHeight * 0.004672, 0, imageHeight * 0.990654, [
        [0, 'rgb(255,255,207)'],
        [0.15, 'rgb(255,237,96)'],
        [0.22, 'rgb(254,199,57)'],
        [0.3, 'rgb(255,249,203)'],
        [0.38, 'rgb(255,199,64)'],
        [0.44, 'rgb(252,194,60)'],
        [0.51, 'rgb(255,204,59)'],
        [0.6, 'rgb(213,134,29)'],
        [0.68, 'rgb(255,201,56)'],
        [0.75, 'rgb(212,135,29)'],
        [1, 'rgb(247,238,101)']
      ])
      break
    case 'blackMetal':
      fillFrameWithLinearGradient(0, imageHeight * 0.004672, 0, imageHeight * 0.990654, [
        [0, 'rgb(102,102,102)'],
        [0.05, 'rgb(51,51,51)'],
        [0.1, 'rgb(76,76,76)'],
        [0.5, 'rgb(8,8,8)'],
        [0.9, 'rgb(89,89,89)'],
        [0.95, 'rgb(56,56,56)'],
        [1, 'rgb(51,51,51)']
      ])
      break
    case 'anthracite':
      fillFrameWithLinearGradient(0, imageHeight * 0.004672, 0, imageHeight * 0.990654, [
        [0, 'rgb(118,117,135)'],
        [0.06, 'rgb(74,74,82)'],
        [0.12, 'rgb(50,50,54)'],
        [1, 'rgb(79,79,87)']
      ])
      break
    case 'shinyMetal':
      fillFrameWithLinearGradient(0, imageHeight * 0.004672, 0, imageHeight * 0.990654, [
        [0, '#ffffff'],
        [0.05, 'rgb(219,219,219)'],
        [0.1, 'rgb(227,227,227)'],
        [0.5, 'rgb(63,63,63)'],
        [0.9, 'rgb(227,227,227)'],
        [0.95, 'rgb(219,219,219)'],
        [1, '#ffffff']
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
          [0.07, 'rgb(210,210,210)'],
          [0.16, 'rgb(179,179,179)'],
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
          [0, 'rgb(207,207,207)'],
          [0.96, 'rgb(205,204,205)'],
          [1, 'rgb(244,244,244)']
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
          [0, 'rgb(249,249,249)'],
          [0.23, 'rgb(200,195,191)'],
          [0.36, '#ffffff'],
          [0.59, 'rgb(219,219,219)'],
          [0.76, 'rgb(197,199,198)'],
          [0.99, 'rgb(249,249,249)']
        ]
      )
      context.fill()
      break
    }
  }

  context.restore()
}

const drawBackground = (
  context: WindDirectionDrawContext,
  backgroundColor: WindDirectionGaugeConfig['style']['backgroundColor'],
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const palette = BACKGROUND_COLORS[backgroundColor]
  context.save()
  context.beginPath()
  context.arc(centerX, centerY, radius, 0, TWO_PI)
  closePathSafe(context)

  const fillBackground = (gradient: CanvasGradient | string): void => {
    context.fillStyle = gradient
    context.fill()
  }

  fillBackground(
    addColorStops(
      createLinearGradientSafe(
        context,
        centerX - radius,
        centerY - radius,
        centerX + radius,
        centerY + radius,
        rgb(palette.gradientFraction)
      ),
      [
        [0, rgb(palette.gradientStart)],
        [0.5, rgb(palette.gradientFraction)],
        [1, rgb(palette.gradientStop)]
      ]
    )
  )

  context.restore()
}

const drawCompassRose = (
  context: WindDirectionDrawContext,
  centerX: number,
  centerY: number,
  radius: number,
  palette: BackgroundPalette
): void => {
  context.save()
  context.translate(centerX, centerY)

  const rIn = radius * 0.25
  const rOut = radius * 0.75
  const strokeWidth = radius * 0.02

  context.lineWidth = strokeWidth
  context.strokeStyle = rgb(palette.symbolColor)
  context.fillStyle = rgb(palette.symbolColor)

  for (let angle = 0; angle < 360; angle += 45) {
    context.save()
    context.rotate(angle * RAD_FACTOR)

    context.beginPath()
    context.moveTo(0, -rOut)
    context.lineTo(-radius * 0.05, -rIn)
    context.lineTo(radius * 0.05, -rIn)
    closePathSafe(context)

    if (angle % 90 === 0) {
      context.fill()
    } else {
      context.stroke()
    }

    context.restore()
  }

  context.restore()
}

const drawPointSymbols = (
  context: WindDirectionDrawContext,
  pointSymbols: string[],
  centerX: number,
  centerY: number,
  radius: number,
  palette: BackgroundPalette
): void => {
  context.save()
  context.fillStyle = rgb(palette.symbolColor)
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  const symbolRadius = radius * 0.92
  const angles = [0, 45, 90, 135, 180, 225, 270, 315] as const

  for (let i = 0; i < 8; i++) {
    const angleDeg = angles[i]!
    const angleRad = angleDeg * RAD_FACTOR
    const x = centerX + Math.cos(angleRad - Math.PI / 2) * symbolRadius
    const y = centerY + Math.sin(angleRad - Math.PI / 2) * symbolRadius

    context.font = `${radius * 0.08}px Arial, sans-serif`
    const symbol = pointSymbols[i]
    if (symbol) {
      context.fillText(symbol, x, y)
    }
  }

  context.restore()
}

const drawDegreeScale = (
  context: WindDirectionDrawContext,
  centerX: number,
  centerY: number,
  radius: number,
  degreeScaleHalf: boolean,
  palette: BackgroundPalette
): void => {
  context.save()
  context.strokeStyle = rgb(palette.symbolColor)
  context.fillStyle = rgb(palette.symbolColor)
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  const majorTickRadius = radius * 0.78
  const minorTickRadius = radius * 0.82
  const labelRadius = radius * 0.68

  context.font = `${radius * 0.04}px Arial, sans-serif`

  for (let angle = 0; angle < 360; angle += 10) {
    const angleRad = angle * RAD_FACTOR
    const isMajor = angle % 30 === 0

    const innerR = isMajor ? majorTickRadius : minorTickRadius
    const outerR = radius * 0.85

    context.beginPath()
    context.moveTo(
      centerX + Math.cos(angleRad - Math.PI / 2) * innerR,
      centerY + Math.sin(angleRad - Math.PI / 2) * innerR
    )
    context.lineTo(
      centerX + Math.cos(angleRad - Math.PI / 2) * outerR,
      centerY + Math.sin(angleRad - Math.PI / 2) * outerR
    )
    context.lineWidth = isMajor ? 2 : 1
    context.stroke()

    if (isMajor && !degreeScaleHalf) {
      const labelX = centerX + Math.cos(angleRad - Math.PI / 2) * labelRadius
      const labelY = centerY + Math.sin(angleRad - Math.PI / 2) * labelRadius
      context.fillText(angle.toString(), labelX, labelY)
    }
  }

  context.restore()
}

const drawLcdBackground = (
  context: WindDirectionDrawContext,
  x: number,
  y: number,
  width: number,
  height: number,
  lcdColors: LcdColors
): void => {
  context.save()

  const gradient = addColorStops(
    createLinearGradientSafe(context, x, y, x, y + height, rgb(lcdColors.gradientFraction2)),
    [
      [0, rgb(lcdColors.gradientStart)],
      [0.03, rgb(lcdColors.gradientFraction1)],
      [0.5, rgb(lcdColors.gradientFraction2)],
      [0.52, rgb(lcdColors.gradientFraction3)],
      [1, rgb(lcdColors.gradientStop)]
    ]
  )

  context.fillStyle = gradient
  context.beginPath()
  context.roundRect(x, y, width, height, height * 0.1)
  closePathSafe(context)
  context.fill()

  context.restore()
}

const drawLcdTitle = (
  context: WindDirectionDrawContext,
  title: string,
  x: number,
  y: number,
  width: number,
  lcdColors: LcdColors
): void => {
  context.save()
  context.fillStyle = rgb(lcdColors.text)
  context.font = `bold ${width * 0.12}px Arial, sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(title, x + width / 2, y)
  context.restore()
}

const drawLcdValue = (
  context: WindDirectionDrawContext,
  value: number,
  x: number,
  y: number,
  width: number,
  height: number,
  lcdColors: LcdColors,
  digitalFont: boolean
): void => {
  context.save()
  context.fillStyle = rgb(lcdColors.text)
  context.font = `${width * 0.25}px ${digitalFont ? 'monospace' : 'Arial'}, sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  const valueStr = value.toFixed(0).padStart(3, '0') + '\u00B0'
  context.fillText(valueStr, x + width / 2, y + height / 2)

  context.restore()
}

const drawLcds = (
  context: WindDirectionDrawContext,
  config: WindDirectionGaugeConfig,
  centerX: number,
  centerY: number,
  radius: number,
  latest: number,
  average: number
): void => {
  const lcdColors = LCD_COLORS[config.style.lcdColor]
  const lcdWidth = radius * 0.5
  const lcdHeight = radius * 0.18
  const lcdY = centerY - radius * 0.35
  const spacing = radius * 0.08

  const latestX = centerX - lcdWidth - spacing / 2
  const averageX = centerX + spacing / 2

  drawLcdBackground(context, latestX, lcdY, lcdWidth, lcdHeight, lcdColors)
  drawLcdTitle(
    context,
    config.lcdTitles.latest,
    latestX,
    lcdY - lcdHeight * 0.15,
    lcdWidth,
    lcdColors
  )
  drawLcdValue(
    context,
    latest,
    latestX,
    lcdY,
    lcdWidth,
    lcdHeight,
    lcdColors,
    config.style.digitalFont
  )

  drawLcdBackground(context, averageX, lcdY, lcdWidth, lcdHeight, lcdColors)
  drawLcdTitle(
    context,
    config.lcdTitles.average,
    averageX,
    lcdY - lcdHeight * 0.15,
    lcdWidth,
    lcdColors
  )
  drawLcdValue(
    context,
    average,
    averageX,
    lcdY,
    lcdWidth,
    lcdHeight,
    lcdColors,
    config.style.digitalFont
  )
}

const drawPointer = (
  context: WindDirectionDrawContext,
  pointer: WindDirectionPointer,
  angle: number,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const colors = POINTER_COLORS[pointer.color]
  const pointerLength = radius * 0.7
  const pointerWidth = radius * 0.1

  context.save()
  context.translate(centerX, centerY)
  context.rotate(angle * RAD_FACTOR)

  context.beginPath()
  context.moveTo(0, -pointerLength)
  context.lineTo(pointerWidth / 2, pointerLength * 0.1)
  context.lineTo(0, pointerLength * 0.2)
  context.lineTo(-pointerWidth / 2, pointerLength * 0.1)
  closePathSafe(context)

  const gradient = addColorStops(
    createLinearGradientSafe(context, -pointerWidth, 0, pointerWidth, 0, rgb(colors.medium)),
    [
      [0, rgb(colors.dark)],
      [0.5, rgb(colors.medium)],
      [1, rgb(colors.light)]
    ]
  )

  context.fillStyle = gradient
  context.fill()
  context.strokeStyle = rgb(colors.dark)
  context.lineWidth = 1
  context.stroke()

  context.restore()
}

const drawForeground = (
  context: WindDirectionDrawContext,
  foregroundType: WindDirectionGaugeConfig['style']['foregroundType'],
  centerX: number,
  centerY: number,
  radius: number
): void => {
  context.save()

  if (foregroundType !== 'type1') {
    const gradient = addColorStops(
      createRadialGradientSafe(
        context,
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius,
        'rgba(255,255,255,0)'
      ),
      [
        [0, 'rgba(255,255,255,0)'],
        [0.7, 'rgba(255,255,255,0.1)'],
        [0.95, 'rgba(255,255,255,0.3)'],
        [1, 'rgba(255,255,255,0)']
      ]
    )
    context.fillStyle = gradient
    context.beginPath()
    context.arc(centerX, centerY, radius, 0, TWO_PI)
    closePathSafe(context)
    context.fill()
  }

  if (foregroundType === 'type5') {
    context.beginPath()
    context.arc(centerX, centerY, radius * 0.95, 0, TWO_PI)
    closePathSafe(context)
    context.strokeStyle = 'rgba(0,0,0,0.1)'
    context.lineWidth = 2
    context.stroke()
  }

  context.restore()
}

const drawKnob = (
  context: WindDirectionDrawContext,
  knobType: WindDirectionGaugeConfig['style']['knobType'],
  knobStyle: WindDirectionGaugeConfig['style']['knobStyle'],
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const knobRadius = radius * 0.08

  context.save()

  if (knobType === 'standardKnob') {
    const gradient = addColorStops(
      createRadialGradientSafe(
        context,
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        knobRadius,
        '#888888'
      ),
      [
        [0, '#e0e0e0'],
        [0.7, '#808080'],
        [1, '#404040']
      ]
    )
    context.fillStyle = gradient
  } else {
    let centerColor: string, edgeColor: string

    switch (knobStyle) {
      case 'black':
        centerColor = '#333333'
        edgeColor = '#0a0a0a'
        break
      case 'brass':
        centerColor = '#c9b037'
        edgeColor = '#8b7355'
        break
      case 'silver':
      default:
        centerColor = '#c0c0c0'
        edgeColor = '#808080'
        break
    }

    const gradient = addColorStops(
      createRadialGradientSafe(
        context,
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        knobRadius,
        centerColor
      ),
      [
        [0, centerColor],
        [0.8, edgeColor],
        [1, edgeColor]
      ]
    )
    context.fillStyle = gradient
  }

  context.beginPath()
  context.arc(centerX, centerY, knobRadius, 0, TWO_PI)
  closePathSafe(context)
  context.fill()

  context.strokeStyle = 'rgba(0,0,0,0.3)'
  context.lineWidth = 1
  context.stroke()

  context.restore()
}

const drawSectionsAndAreas = (
  context: WindDirectionDrawContext,
  sections: WindDirectionSection[],
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  filled: boolean
): void => {
  if (sections.length === 0) return

  context.save()

  for (const section of sections) {
    const startAngle = (section.start - 90) * RAD_FACTOR
    const stopAngle = (section.stop - 90) * RAD_FACTOR

    context.beginPath()
    context.arc(centerX, centerY, outerRadius, startAngle, stopAngle)
    context.arc(centerX, centerY, innerRadius, stopAngle, startAngle, true)
    closePathSafe(context)

    if (filled) {
      context.fillStyle = section.color
      context.globalAlpha = 0.3
      context.fill()
      context.globalAlpha = 1
    }

    context.strokeStyle = section.color
    context.lineWidth = 2
    context.stroke()
  }

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

  const latest = normalizeAngle(options.latest ?? config.value.latest)
  const average = normalizeAngle(options.average ?? config.value.average)
  const palette = BACKGROUND_COLORS[config.style.backgroundColor]

  context.clearRect(0, 0, width, height)

  if (config.visibility.showFrame) {
    drawFrame(context, config.style.frameDesign, centerX, centerY, width, height)
  }

  if (config.visibility.showBackground) {
    drawBackground(context, config.style.backgroundColor, centerX, centerY, radius)

    if (config.style.customLayer?.image && config.style.customLayer.visible) {
      context.drawImage(config.style.customLayer.image, 0, 0, width, height)
    }

    if (config.areas.length > 0) {
      drawSectionsAndAreas(
        context,
        config.areas,
        centerX,
        centerY,
        radius * 0.4,
        radius * 0.75,
        true
      )
    }

    if (config.sections.length > 0) {
      drawSectionsAndAreas(
        context,
        config.sections,
        centerX,
        centerY,
        radius * 0.4,
        radius * 0.75,
        false
      )
    }

    if (config.visibility.showRose) {
      drawCompassRose(context, centerX, centerY, radius, palette)
    }

    if (config.visibility.showDegreeScale) {
      drawDegreeScale(context, centerX, centerY, radius, config.scale.degreeScaleHalf, palette)
    }

    if (config.visibility.showPointSymbols) {
      drawPointSymbols(context, config.style.pointSymbols, centerX, centerY, radius, palette)
    }
  }

  if (config.visibility.showLcd) {
    drawLcds(context, config, centerX, centerY, radius, latest, average)
  }

  drawPointer(context, config.style.pointerAverage, average, centerX, centerY, radius)
  drawPointer(context, config.style.pointerLatest, latest, centerX, centerY, radius)

  if (config.visibility.showForeground) {
    drawForeground(context, config.style.foregroundType, centerX, centerY, radius)

    const showKnob = !['type15', 'type16'].includes(config.style.pointerLatest.type)
    if (showKnob) {
      drawKnob(context, config.style.knobType, config.style.knobStyle, centerX, centerY, radius)
    }
  }

  return {
    latest,
    average,
    tone: 'accent',
    activeAlerts: []
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
