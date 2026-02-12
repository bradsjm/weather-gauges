import type { RadialBargraphLcdColorName } from '../radial-bargraph/schema.js'
import type { ThemePaint } from '../theme/tokens.js'
import { buildGaugeFont, configureGaugeTextLayout, drawGaugeText } from './gauge-text-primitives.js'
import { createLinearGradientSafe } from './gauge-canvas-primitives.js'

type LcdPalette = {
  gradientStart: string
  gradientFraction1: string
  gradientFraction2: string
  gradientFraction3: string
  gradientStop: string
  text: string
}

const LCD_COLORS: Record<RadialBargraphLcdColorName, LcdPalette> = {
  STANDARD: {
    gradientStart: 'rgb(131, 133, 119)',
    gradientFraction1: 'rgb(176, 183, 167)',
    gradientFraction2: 'rgb(165, 174, 153)',
    gradientFraction3: 'rgb(166, 175, 156)',
    gradientStop: 'rgb(175, 184, 165)',
    text: 'rgb(35, 42, 52)'
  },
  STANDARD_GREEN: {
    gradientStart: '#ffffff',
    gradientFraction1: 'rgb(219, 230, 220)',
    gradientFraction2: 'rgb(179, 194, 178)',
    gradientFraction3: 'rgb(153, 176, 151)',
    gradientStop: 'rgb(114, 138, 109)',
    text: '#080C06'
  },
  BLUE: {
    gradientStart: '#ffffff',
    gradientFraction1: 'rgb(231, 246, 255)',
    gradientFraction2: 'rgb(170, 224, 255)',
    gradientFraction3: 'rgb(136, 212, 255)',
    gradientStop: 'rgb(192, 232, 255)',
    text: '#124564'
  },
  ORANGE: {
    gradientStart: '#ffffff',
    gradientFraction1: 'rgb(255, 245, 225)',
    gradientFraction2: 'rgb(255, 217, 147)',
    gradientFraction3: 'rgb(255, 201, 104)',
    gradientStop: 'rgb(255, 227, 173)',
    text: '#503700'
  },
  RED: {
    gradientStart: '#ffffff',
    gradientFraction1: 'rgb(255, 225, 225)',
    gradientFraction2: 'rgb(253, 152, 152)',
    gradientFraction3: 'rgb(252, 114, 115)',
    gradientStop: 'rgb(254, 178, 178)',
    text: '#4f0c0e'
  },
  YELLOW: {
    gradientStart: '#ffffff',
    gradientFraction1: 'rgb(245, 255, 186)',
    gradientFraction2: 'rgb(210, 255, 0)',
    gradientFraction3: 'rgb(158, 205, 0)',
    gradientStop: 'rgb(210, 255, 0)',
    text: '#405300'
  },
  WHITE: {
    gradientStart: '#ffffff',
    gradientFraction1: '#ffffff',
    gradientFraction2: 'rgb(241, 246, 242)',
    gradientFraction3: 'rgb(229, 239, 244)',
    gradientStop: '#ffffff',
    text: '#000000'
  },
  GRAY: {
    gradientStart: '#414141',
    gradientFraction1: 'rgb(117, 117, 117)',
    gradientFraction2: 'rgb(87, 87, 87)',
    gradientFraction3: '#414141',
    gradientStop: 'rgb(81, 81, 81)',
    text: '#ffffff'
  },
  BLACK: {
    gradientStart: '#414141',
    gradientFraction1: '#666666',
    gradientFraction2: '#333333',
    gradientFraction3: '#000000',
    gradientStop: '#333333',
    text: '#cccccc'
  }
}

export const drawRadialLcd = (
  context: CanvasRenderingContext2D,
  lcdColor: RadialBargraphLcdColorName,
  digitalFont: boolean,
  lcdDecimals: number,
  value: number,
  size: number,
  paint: ThemePaint
): void => {
  const lcdPalette = LCD_COLORS[lcdColor]
  const lcdX = 0.4 * size
  const lcdY = 0.55 * size
  const lcdWidth = 0.4 * size
  const lcdHeight = 0.14 * size

  const outerFrameGradient = createLinearGradientSafe(
    context,
    lcdX,
    lcdY,
    lcdX,
    lcdY + lcdHeight,
    '#666666'
  )
  if (typeof outerFrameGradient !== 'string') {
    outerFrameGradient.addColorStop(0, '#4c4c4c')
    outerFrameGradient.addColorStop(0.08, '#666666')
    outerFrameGradient.addColorStop(0.92, '#666666')
    outerFrameGradient.addColorStop(1, '#e6e6e6')
  }

  const outerRadius = Math.min(lcdWidth, lcdHeight) * 0.095
  const innerRadius = Math.max(outerRadius - 1, 0)
  const innerX = lcdX + 1
  const innerY = lcdY + 1
  const innerWidth = Math.max(lcdWidth - 2, 0)
  const innerHeight = Math.max(lcdHeight - 2, 0)

  const roundedRect = (
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

  context.fillStyle = outerFrameGradient
  roundedRect(lcdX, lcdY, lcdWidth, lcdHeight, outerRadius)
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
  roundedRect(innerX, innerY, innerWidth, innerHeight, innerRadius)
  context.fill()

  configureGaugeTextLayout(context, {
    color: lcdPalette.text,
    align: 'right',
    baseline: 'alphabetic'
  })
  if (lcdColor === 'STANDARD' || lcdColor === 'STANDARD_GREEN') {
    context.shadowColor = 'gray'
    context.shadowOffsetX = size * 0.007
    context.shadowOffsetY = size * 0.007
    context.shadowBlur = size * 0.007
  }
  configureGaugeTextLayout(context, {
    font: buildGaugeFont(
      Math.max(15, Math.round(size * 0.075)),
      digitalFont ? paint.fontFamilyLcd : paint.fontFamily
    )
  })
  drawGaugeText(
    context,
    value.toFixed(lcdDecimals),
    lcdX + lcdWidth * 0.95,
    lcdY + lcdHeight * 0.5 + Math.floor(size / 10) * 0.38,
    lcdWidth * 0.9
  )
  context.shadowColor = 'transparent'
  context.shadowBlur = 0
}
