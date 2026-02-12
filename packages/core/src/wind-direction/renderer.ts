import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { drawCompassRose as drawSharedCompassRose } from '../render/compass-scales.js'
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
const HALF_PI = Math.PI / 2
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
  imageWidth: number
): void => {
  const palette = BACKGROUND_COLORS[backgroundColor]
  // Match compass: use imageWidth-based background radius
  const backgroundRadius = (0.831775 * imageWidth) / 2

  context.save()
  context.beginPath()
  context.arc(centerX, centerY, backgroundRadius, 0, TWO_PI)
  closePathSafe(context)

  // Match compass: vertical gradient with imageWidth-based calculations
  const gradient = addColorStops(
    createLinearGradientSafe(
      context,
      0,
      0.084112 * imageWidth,
      0,
      backgroundRadius * 2,
      rgb(palette.gradientFraction)
    ),
    [
      [0, rgb(palette.gradientStart)],
      [0.4, rgb(palette.gradientFraction)], // v2 uses 0.4, not 0.5
      [1, rgb(palette.gradientStop)]
    ]
  )
  context.fillStyle = gradient
  context.fill()

  // Add inner shadow (v2 feature)
  const innerShadow = addColorStops(
    createRadialGradientSafe(
      context,
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      backgroundRadius,
      'rgba(0,0,0,0)'
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
  context.fillStyle = innerShadow
  context.beginPath()
  context.arc(centerX, centerY, backgroundRadius, 0, TWO_PI)
  closePathSafe(context)
  context.fill()

  context.restore()
}

const drawPointSymbols = (
  context: WindDirectionDrawContext,
  pointSymbols: string[],
  centerX: number,
  centerY: number,
  imageWidth: number,
  palette: BackgroundPalette
): void => {
  context.save()
  context.translate(centerX, centerY)
  context.fillStyle = rgb(palette.symbolColor)
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  // Cardinal directions (N, S, E, W)
  const cardinalAngles = [270, 90, 0, 180] as const
  const cardinalSymbols = [pointSymbols[0], pointSymbols[4], pointSymbols[2], pointSymbols[6]]

  context.font = `${0.12 * imageWidth}px serif`

  for (let i = 0; i < 4; i++) {
    const angle = cardinalAngles[i]! * RAD_FACTOR
    const symbol = cardinalSymbols[i]

    if (symbol) {
      context.save()
      context.rotate(angle)
      context.translate(0, -0.35 * imageWidth)
      context.rotate(HALF_PI)
      context.fillText(symbol, 0, 0)
      context.restore()
    }
  }

  // Intercardinal directions (NE, SE, SW, NW)
  const intercardinalAngles = [315, 45, 135, 225] as const
  const intercardinalSymbols = [pointSymbols[1], pointSymbols[3], pointSymbols[5], pointSymbols[7]]

  context.font = `${0.06 * imageWidth}px serif`

  for (let i = 0; i < 4; i++) {
    const angle = intercardinalAngles[i]! * RAD_FACTOR
    const symbol = intercardinalSymbols[i]

    if (symbol) {
      context.save()
      context.rotate(angle)
      context.translate(0, -0.29 * imageWidth)
      context.rotate(HALF_PI)
      context.fillText(symbol, 0, 0)
      context.restore()
    }
  }

  context.restore()
}

const drawDegreeScale = (
  context: WindDirectionDrawContext,
  centerX: number,
  centerY: number,
  imageWidth: number,
  imageHeight: number,
  degreeScaleHalf: boolean,
  palette: BackgroundPalette
): void => {
  context.save()
  context.translate(centerX, centerY)
  context.strokeStyle = rgb(palette.symbolColor)
  context.fillStyle = rgb(palette.symbolColor)
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = `${0.06 * imageWidth}px serif`

  // Tick marks every 2.5 degrees (matching compass)
  for (let i = 0; i < 360; i += 2.5) {
    const angle = i * RAD_FACTOR
    const isMajor = i % 10 === 0
    const isMedium = i % 5 === 0

    context.save()
    context.rotate(angle)

    // Draw tick mark
    const innerR = isMajor ? 0.36 * imageWidth : isMedium ? 0.36 * imageWidth : 0.38 * imageWidth
    const outerR = 0.38 * imageWidth

    context.beginPath()
    context.moveTo(0, -innerR)
    context.lineTo(0, -outerR)
    context.lineWidth = isMajor ? 2 : isMedium ? 1.5 : 1
    context.stroke()

    // Draw degree label on major ticks (every 10°)
    if (isMajor) {
      // Handle degreeScaleHalf: wrap 180-360° to -180-0°
      let displayAngle = i
      if (degreeScaleHalf && i > 180) {
        displayAngle = i - 360
      }

      context.save()
      context.translate(0, -0.29 * imageWidth)
      context.rotate(HALF_PI)
      context.fillText(displayAngle.toString(), 0, 0)
      context.restore()
    }

    context.restore()
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
  color: Rgb
): void => {
  context.save()
  context.fillStyle = rgb(color)
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

  const valueStr = value.toFixed(0).padStart(3, '0')
  context.fillText(valueStr, x + width / 2, y + height / 2)

  context.restore()
}

const drawLcds = (
  context: WindDirectionDrawContext,
  config: WindDirectionGaugeConfig,
  centerX: number,
  centerY: number,
  imageWidth: number,
  latest: number,
  average: number
): void => {
  const lcdColors = LCD_COLORS[config.style.lcdColor]
  const lcdWidth = imageWidth * 0.25
  const lcdHeight = imageWidth * 0.09
  // Match v2 positioning: both LCDs centered horizontally, stacked vertically
  const lcdX = centerX - lcdWidth / 2
  const lcdY1 = centerY - imageWidth * 0.175 // Upper LCD (above center)
  const lcdY2 = centerY + imageWidth * 0.075 // Lower LCD (below center, avoiding knob overlap)

  // Determine title colors based on useColorLabels setting
  const latestTitleColor = config.style.useColorLabels
    ? POINTER_COLORS[config.style.pointerLatest.color].medium
    : lcdColors.text
  const averageTitleColor = config.style.useColorLabels
    ? POINTER_COLORS[config.style.pointerAverage.color].medium
    : lcdColors.text

  // Latest LCD (top)
  drawLcdBackground(context, lcdX, lcdY1, lcdWidth, lcdHeight, lcdColors)
  if (config.lcdTitles.latest) {
    drawLcdTitle(
      context,
      config.lcdTitles.latest,
      lcdX,
      lcdY1 - lcdHeight * 0.15,
      lcdWidth,
      latestTitleColor
    )
  }
  drawLcdValue(
    context,
    latest,
    lcdX,
    lcdY1,
    lcdWidth,
    lcdHeight,
    lcdColors,
    config.style.digitalFont
  )

  // Average LCD (bottom)
  drawLcdBackground(context, lcdX, lcdY2, lcdWidth, lcdHeight, lcdColors)
  if (config.lcdTitles.average) {
    drawLcdTitle(
      context,
      config.lcdTitles.average,
      lcdX,
      lcdY2 - lcdHeight * 0.15,
      lcdWidth,
      averageTitleColor
    )
  }
  drawLcdValue(
    context,
    average,
    lcdX,
    lcdY2,
    lcdWidth,
    lcdHeight,
    lcdColors,
    config.style.digitalFont
  )
}

const drawPointerShape = (
  context: WindDirectionDrawContext,
  pointer: WindDirectionPointer,
  imageWidth: number
): void => {
  const colors = POINTER_COLORS[pointer.color]
  const pointerLength = imageWidth * 0.35
  const pointerWidth = imageWidth * 0.05

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
}

const drawPointers = (
  context: WindDirectionDrawContext,
  config: WindDirectionGaugeConfig,
  centerX: number,
  centerY: number,
  imageWidth: number,
  latestAngle: number,
  averageAngle: number
): void => {
  context.save()
  context.translate(centerX, centerY)

  // Apply shadow effects before drawing pointers
  const shadowOffset = Math.max(2, imageWidth * 0.0075)
  context.shadowColor = 'rgba(0, 0, 0, 0.8)'
  context.shadowOffsetX = shadowOffset
  context.shadowOffsetY = shadowOffset
  context.shadowBlur = shadowOffset * 2

  // Step 1: Rotate to average position
  context.rotate(averageAngle * RAD_FACTOR)

  // Step 2: Draw average pointer
  drawPointerShape(context, config.style.pointerAverage, imageWidth)

  // Step 3: Calculate and apply RELATIVE rotation for latest
  // CRITICAL: Subtract current rotation to get relative angle
  const relativeAngle = (latestAngle - averageAngle) * RAD_FACTOR
  context.rotate(relativeAngle)

  // Step 4: Draw latest pointer
  drawPointerShape(context, config.style.pointerLatest, imageWidth)

  // Clear shadow after drawing
  context.shadowColor = 'transparent'
  context.shadowOffsetX = 0
  context.shadowOffsetY = 0
  context.shadowBlur = 0

  context.restore()
}

const drawForeground = (
  context: WindDirectionDrawContext,
  foregroundType: WindDirectionGaugeConfig['style']['foregroundType'],
  centerX: number,
  centerY: number,
  imageWidth: number
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
        imageWidth * 0.48,
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
    context.arc(centerX, centerY, imageWidth * 0.48, 0, TWO_PI)
    closePathSafe(context)
    context.fill()
  }

  if (foregroundType === 'type5') {
    context.beginPath()
    context.arc(centerX, centerY, imageWidth * 0.456, 0, TWO_PI)
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
  imageWidth: number
): void => {
  const knobRadius = imageWidth * 0.04

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
    drawBackground(context, config.style.backgroundColor, centerX, centerY, width)

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
      drawSharedCompassRose(context, centerX, centerY, width, height, palette.symbolColor)
    }

    if (config.visibility.showDegreeScale) {
      drawDegreeScale(
        context,
        centerX,
        centerY,
        width,
        height,
        config.scale.degreeScaleHalf,
        palette
      )
    }

    if (config.visibility.showPointSymbols) {
      drawPointSymbols(context, config.style.pointSymbols, centerX, centerY, width, palette)
    }
  }

  if (config.visibility.showLcd) {
    drawLcds(context, config, centerX, centerY, width, latest, average)
  }

  drawPointers(context, config, centerX, centerY, width, latest, average)

  if (config.visibility.showForeground) {
    drawForeground(context, config.style.foregroundType, centerX, centerY, width)

    const showKnob = !['type15', 'type16'].includes(config.style.pointerLatest.type)
    if (showKnob) {
      drawKnob(context, config.style.knobType, config.style.knobStyle, centerX, centerY, width)
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
