import type { RadialBargraphLcdColorName } from '../radial-bargraph/schema.js'
import type { ThemePaint } from '../theme/tokens.js'
import { buildGaugeFont, configureGaugeTextLayout, drawGaugeText } from './gauge-text-primitives.js'
import { createLinearGradientSafe } from './gauge-canvas-primitives.js'

export type RadialLcdPalette = {
  gradientStart: string
  gradientFraction1: string
  gradientFraction2: string
  gradientFraction3: string
  gradientStop: string
  text: string
}

type RadialLcdLayoutOptions = {
  x?: number
  y?: number
}

type RadialLcdDrawOptions = RadialLcdLayoutOptions & {
  text?: string
  align?: CanvasTextAlign
}

const RADIAL_LCD_WIDTH_FACTOR = 0.32
const RADIAL_LCD_HEIGHT_FACTOR = 0.11
const RADIAL_LCD_FONT_FACTOR = 0.055
const RADIAL_LCD_MIN_FONT_SIZE = 7
const RADIAL_LCD_DEFAULT_Y_FACTOR = 0.57

const LCD_COLORS: Record<RadialBargraphLcdColorName, RadialLcdPalette> = {
  standard: {
    gradientStart: 'rgb(131, 133, 119)',
    gradientFraction1: 'rgb(176, 183, 167)',
    gradientFraction2: 'rgb(165, 174, 153)',
    gradientFraction3: 'rgb(166, 175, 156)',
    gradientStop: 'rgb(175, 184, 165)',
    text: 'rgb(35, 42, 52)'
  },
  'standard-green': {
    gradientStart: '#ffffff',
    gradientFraction1: 'rgb(219, 230, 220)',
    gradientFraction2: 'rgb(179, 194, 178)',
    gradientFraction3: 'rgb(153, 176, 151)',
    gradientStop: 'rgb(114, 138, 109)',
    text: '#080C06'
  },
  blue: {
    gradientStart: '#ffffff',
    gradientFraction1: 'rgb(231, 246, 255)',
    gradientFraction2: 'rgb(170, 224, 255)',
    gradientFraction3: 'rgb(136, 212, 255)',
    gradientStop: 'rgb(192, 232, 255)',
    text: '#124564'
  },
  orange: {
    gradientStart: '#ffffff',
    gradientFraction1: 'rgb(255, 245, 225)',
    gradientFraction2: 'rgb(255, 217, 147)',
    gradientFraction3: 'rgb(255, 201, 104)',
    gradientStop: 'rgb(255, 227, 173)',
    text: '#503700'
  },
  red: {
    gradientStart: '#ffffff',
    gradientFraction1: 'rgb(255, 225, 225)',
    gradientFraction2: 'rgb(253, 152, 152)',
    gradientFraction3: 'rgb(252, 114, 115)',
    gradientStop: 'rgb(254, 178, 178)',
    text: '#4f0c0e'
  },
  yellow: {
    gradientStart: '#ffffff',
    gradientFraction1: 'rgb(245, 255, 186)',
    gradientFraction2: 'rgb(210, 255, 0)',
    gradientFraction3: 'rgb(158, 205, 0)',
    gradientStop: 'rgb(210, 255, 0)',
    text: '#405300'
  },
  white: {
    gradientStart: '#ffffff',
    gradientFraction1: '#ffffff',
    gradientFraction2: 'rgb(241, 246, 242)',
    gradientFraction3: 'rgb(229, 239, 244)',
    gradientStop: '#ffffff',
    text: '#000000'
  },
  gray: {
    gradientStart: '#414141',
    gradientFraction1: 'rgb(117, 117, 117)',
    gradientFraction2: 'rgb(87, 87, 87)',
    gradientFraction3: '#414141',
    gradientStop: 'rgb(81, 81, 81)',
    text: '#ffffff'
  },
  black: {
    gradientStart: '#414141',
    gradientFraction1: '#666666',
    gradientFraction2: '#333333',
    gradientFraction3: '#000000',
    gradientStop: '#333333',
    text: '#cccccc'
  }
}

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void => {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

export const resolveRadialLcdPalette = (lcdColor: RadialBargraphLcdColorName): RadialLcdPalette => {
  return LCD_COLORS[lcdColor]
}

export const drawRadialLcdBox = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  lcdPalette: RadialLcdPalette
): void => {
  const outerFrameGradient = createLinearGradientSafe(context, 0, y, 0, y + height, '#666666')
  if (typeof outerFrameGradient !== 'string') {
    outerFrameGradient.addColorStop(0, '#4c4c4c')
    outerFrameGradient.addColorStop(0.08, '#666666')
    outerFrameGradient.addColorStop(0.92, '#666666')
    outerFrameGradient.addColorStop(1, '#e6e6e6')
  }

  const outerRadius = Math.min(width, height) * 0.095
  const innerRadius = Math.max(outerRadius - 1, 0)
  const innerX = x + 1
  const innerY = y + 1
  const innerWidth = Math.max(width - 2, 0)
  const innerHeight = Math.max(height - 2, 0)

  context.fillStyle = outerFrameGradient
  drawRoundedRect(context, x, y, width, height, outerRadius)
  context.fill()

  const backgroundGradient = createLinearGradientSafe(
    context,
    0,
    innerY,
    0,
    innerY + innerHeight,
    lcdPalette.gradientStop
  )
  if (typeof backgroundGradient !== 'string') {
    backgroundGradient.addColorStop(0, lcdPalette.gradientStart)
    backgroundGradient.addColorStop(0.03, lcdPalette.gradientFraction1)
    backgroundGradient.addColorStop(0.49, lcdPalette.gradientFraction2)
    backgroundGradient.addColorStop(0.5, lcdPalette.gradientFraction3)
    backgroundGradient.addColorStop(1, lcdPalette.gradientStop)
  }
  context.fillStyle = backgroundGradient
  drawRoundedRect(context, innerX, innerY, innerWidth, innerHeight, innerRadius)
  context.fill()
}

type RadialLcdValueTextOptions = {
  context: CanvasRenderingContext2D
  text: string
  x: number
  y: number
  width: number
  height: number
  textColor: string
  fontSize: number
  fontFamily: string
  align?: CanvasTextAlign
  baseline?: CanvasTextBaseline
  maxWidth?: number
  textX?: number
  textY?: number
  shadow?: {
    color: string
    offsetX: number
    offsetY: number
    blur: number
  }
}

export const drawRadialLcdValueText = ({
  context,
  text,
  x,
  y,
  width,
  height,
  textColor,
  fontSize,
  fontFamily,
  align = 'right',
  baseline = 'middle',
  maxWidth = width * 0.9,
  textX = align === 'right' ? x + width * 0.95 : x + width * 0.5,
  textY = y + height * 0.5,
  shadow
}: RadialLcdValueTextOptions): void => {
  configureGaugeTextLayout(context, {
    color: textColor,
    align,
    baseline,
    font: buildGaugeFont(fontSize, fontFamily)
  })

  if (shadow) {
    context.shadowColor = shadow.color
    context.shadowOffsetX = shadow.offsetX
    context.shadowOffsetY = shadow.offsetY
    context.shadowBlur = shadow.blur
  }

  drawGaugeText(context, text, textX, textY, maxWidth)

  context.shadowColor = 'transparent'
  context.shadowBlur = 0
}

export const drawRadialLcd = (
  context: CanvasRenderingContext2D,
  lcdColor: RadialBargraphLcdColorName,
  digitalFont: boolean,
  lcdDecimals: number,
  value: number,
  size: number,
  paint: ThemePaint,
  options: RadialLcdDrawOptions = {}
): void => {
  const lcdPalette = resolveRadialLcdPalette(lcdColor)
  const lcdWidth = RADIAL_LCD_WIDTH_FACTOR * size
  const lcdHeight = RADIAL_LCD_HEIGHT_FACTOR * size
  const lcdX = options.x ?? (size - lcdWidth) * 0.5
  const lcdY = options.y ?? size * RADIAL_LCD_DEFAULT_Y_FACTOR

  drawRadialLcdBox(context, lcdX, lcdY, lcdWidth, lcdHeight, lcdPalette)

  const valueShadow =
    lcdColor === 'standard' || lcdColor === 'standard-green'
      ? {
          color: 'gray',
          offsetX: size * 0.007,
          offsetY: size * 0.007,
          blur: size * 0.007
        }
      : null

  drawRadialLcdValueText({
    context,
    text: options.text ?? value.toFixed(lcdDecimals),
    x: lcdX,
    y: lcdY,
    width: lcdWidth,
    height: lcdHeight,
    textColor: lcdPalette.text,
    fontSize: Math.max(RADIAL_LCD_MIN_FONT_SIZE, Math.round(size * RADIAL_LCD_FONT_FACTOR)),
    fontFamily: digitalFont ? paint.fontFamilyLcd : paint.fontFamily,
    align: options.align ?? 'right',
    baseline: 'middle',
    ...(valueShadow ? { shadow: valueShadow } : {})
  })
}
