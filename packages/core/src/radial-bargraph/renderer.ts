import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { clamp } from '../math/range.js'
import {
  drawGaugeRadialBackgroundByStyle,
  drawGaugeRadialForegroundByType,
  drawGaugeRadialFrameByDesign
} from '../render/gauge-materials.js'
import {
  getGaugeBackgroundTextColor,
  resolveGaugePointerPalette,
  rgbTupleToCss
} from '../render/gauge-color-palettes.js'
import {
  createLinearGradientSafe,
  createRadialGradientSafe
} from '../render/gauge-canvas-primitives.js'
import { HALF_PI, RAD_FACTOR, drawRadialTextLabel } from '../render/gauge-ticks.js'
import {
  buildGaugeFont,
  configureGaugeTextLayout,
  drawGaugeText
} from '../render/gauge-text-primitives.js'
import { resolveGaugeToneFromAlerts, resolveGaugeValueAlerts } from '../render/gauge-alerts.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type {
  RadialBargraphAlert,
  RadialBargraphGaugeConfig,
  RadialBargraphLcdColorName,
  RadialBargraphSection,
  RadialBargraphValueGradientStop
} from './schema.js'

export type RadialBargraphDrawContext = CanvasRenderingContext2D

export type RadialBargraphRenderResult = {
  value: number
  tone: 'accent' | 'warning' | 'danger'
  activeAlerts: RadialBargraphAlert[]
}

export type RadialBargraphRenderOptions = {
  value?: number
  paint?: Partial<ThemePaint>
}

export type RadialBargraphAnimationOptions = {
  context: RadialBargraphDrawContext
  config: RadialBargraphGaugeConfig
  from: number
  to: number
  paint?: Partial<ThemePaint>
  onFrame?: (result: RadialBargraphRenderResult) => void
  onComplete?: (result: RadialBargraphRenderResult) => void
}

type PointerColor = {
  light: string
  medium: string
  dark: string
  veryDark: string
}

type GaugeGeometry = {
  rotationOffset: number
  bargraphOffset: number
  angleRange: number
  degAngleRange: number
  angleStep: number
}

type SectionAngle = {
  startDeg: number
  stopDeg: number
  color: string
}

const PI = Math.PI
const TWO_PI = PI * 2
const DEG_FACTOR = 180 / PI

const LCD_COLORS: Record<
  RadialBargraphLcdColorName,
  {
    gradientStart: string
    gradientFraction1: string
    gradientFraction2: string
    gradientFraction3: string
    gradientStop: string
    text: string
  }
> = {
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

const STD_FONT_NAME = 'Arial,Verdana,sans-serif'

const mergePaint = (paint?: Partial<ThemePaint>): ThemePaint => {
  return {
    ...resolveThemePaint(),
    ...paint
  }
}

const parseRgbColor = (color: string): { r: number; g: number; b: number } | undefined => {
  if (typeof document === 'undefined') {
    return undefined
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d')
  if (!context) {
    return undefined
  }

  context.clearRect(0, 0, 1, 1)
  context.fillStyle = color
  context.fillRect(0, 0, 1, 1)
  const pixel = context.getImageData(0, 0, 1, 1).data
  return {
    r: pixel[0] ?? 0,
    g: pixel[1] ?? 0,
    b: pixel[2] ?? 0
  }
}

const clampChannel = (value: number): number => Math.round(clamp(value, 0, 255))

const colorToString = (rgb: { r: number; g: number; b: number }): string => {
  return `rgb(${clampChannel(rgb.r)}, ${clampChannel(rgb.g)}, ${clampChannel(rgb.b)})`
}

const resolveLegacyPointerColor = (
  colorName: RadialBargraphGaugeConfig['style']['valueColor']
): PointerColor => {
  const palette = resolveGaugePointerPalette(colorName)
  return {
    light: rgbTupleToCss(palette.light),
    medium: rgbTupleToCss(palette.medium),
    dark: rgbTupleToCss(palette.dark),
    veryDark: rgbTupleToCss(palette.veryDark)
  }
}

const derivePointerColor = (color: string): PointerColor => {
  const parsed = parseRgbColor(color)
  if (!parsed) {
    return {
      light: color,
      medium: color,
      dark: color,
      veryDark: color
    }
  }

  return {
    veryDark: colorToString({ r: parsed.r * 0.25, g: parsed.g * 0.25, b: parsed.b * 0.25 }),
    dark: colorToString({ r: parsed.r * 0.55, g: parsed.g * 0.55, b: parsed.b * 0.55 }),
    medium: colorToString({ r: parsed.r * 0.85, g: parsed.g * 0.85, b: parsed.b * 0.85 }),
    light: colorToString({
      r: parsed.r + (255 - parsed.r) * 0.35,
      g: parsed.g + (255 - parsed.g) * 0.35,
      b: parsed.b + (255 - parsed.b) * 0.35
    })
  }
}

const calcNiceNumber = (range: number, round: boolean): number => {
  const exponent = Math.floor(Math.log10(range))
  const fraction = range / 10 ** exponent
  let niceFraction: number

  if (round) {
    if (fraction < 1.5) {
      niceFraction = 1
    } else if (fraction < 3) {
      niceFraction = 2
    } else if (fraction < 7) {
      niceFraction = 5
    } else {
      niceFraction = 10
    }
  } else if (fraction <= 1) {
    niceFraction = 1
  } else if (fraction <= 2) {
    niceFraction = 2
  } else if (fraction <= 5) {
    niceFraction = 5
  } else {
    niceFraction = 10
  }

  return niceFraction * 10 ** exponent
}

const resolveScale = (
  config: RadialBargraphGaugeConfig
): {
  minValue: number
  maxValue: number
  range: number
  majorTickSpacing: number
  minorTickSpacing: number
} => {
  const min = config.value.min
  const max = config.value.max
  const rawRange = Math.max(1e-9, max - min)
  const maxNoOfMajorTicks = config.scale.maxNoOfMajorTicks
  const maxNoOfMinorTicks = config.scale.maxNoOfMinorTicks

  if (config.scale.niceScale) {
    const niceRange = calcNiceNumber(rawRange, false)
    const majorTickSpacing = calcNiceNumber(niceRange / (maxNoOfMajorTicks - 1), true)
    const niceMin = Math.floor(min / majorTickSpacing) * majorTickSpacing
    const niceMax = Math.ceil(max / majorTickSpacing) * majorTickSpacing
    const minorTickSpacing = calcNiceNumber(majorTickSpacing / (maxNoOfMinorTicks - 1), true)

    return {
      minValue: niceMin,
      maxValue: niceMax,
      range: niceMax - niceMin,
      majorTickSpacing,
      minorTickSpacing
    }
  }

  const majorTickSpacing = calcNiceNumber(rawRange / (maxNoOfMajorTicks - 1), true)
  const minorTickSpacing = calcNiceNumber(majorTickSpacing / (maxNoOfMinorTicks - 1), true)
  return {
    minValue: min,
    maxValue: max,
    range: rawRange,
    majorTickSpacing,
    minorTickSpacing
  }
}

const resolveGeometry = (
  gaugeType: RadialBargraphGaugeConfig['style']['gaugeType'],
  range: number
): GaugeGeometry => {
  const freeAreaAngle = (60 * PI) / 180
  let rotationOffset = HALF_PI + freeAreaAngle * 0.5
  let angleRange = TWO_PI - freeAreaAngle
  let bargraphOffset = -TWO_PI / 6

  if (gaugeType === 'type1') {
    rotationOffset = PI
    angleRange = HALF_PI
    bargraphOffset = 0
  } else if (gaugeType === 'type2') {
    rotationOffset = PI
    angleRange = PI
    bargraphOffset = 0
  } else if (gaugeType === 'type3') {
    rotationOffset = HALF_PI
    angleRange = PI * 1.5
    bargraphOffset = -HALF_PI
  }

  return {
    rotationOffset,
    bargraphOffset,
    angleRange,
    degAngleRange: angleRange * DEG_FACTOR,
    angleStep: angleRange / Math.max(range, 1e-9)
  }
}

const createGradientSampler = (
  stops: RadialBargraphValueGradientStop[]
): ((fraction: number) => string) | undefined => {
  if (stops.length === 0) {
    return undefined
  }

  const orderedStops = [...stops].sort((left, right) => left.fraction - right.fraction)
  if (typeof document === 'undefined') {
    return (fraction: number): string => {
      const clampedFraction = clamp(fraction, 0, 1)
      const match =
        [...orderedStops].reverse().find((stop) => clampedFraction >= stop.fraction)?.color ??
        orderedStops.at(0)?.color ??
        '#000000'
      return match
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 1
  const context = canvas.getContext('2d')
  if (!context) {
    return undefined
  }

  const gradient = context.createLinearGradient(0, 0, 256, 0)
  for (const stop of orderedStops) {
    gradient.addColorStop(stop.fraction, stop.color)
  }
  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 1)

  return (fraction: number): string => {
    const clampedFraction = clamp(fraction, 0, 1)
    const x = Math.round(clampedFraction * 255)
    const pixel = context.getImageData(x, 0, 1, 1).data
    return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
  }
}

const resolveSectionAngles = (
  sections: RadialBargraphSection[],
  minValue: number,
  range: number,
  degAngleRange: number
): SectionAngle[] => {
  return sections.map((section) => {
    const from = clamp(section.from, minValue, minValue + range)
    const to = clamp(section.to, minValue, minValue + range)
    return {
      startDeg: ((from - minValue) / Math.max(range, 1e-9)) * degAngleRange,
      stopDeg: ((to - minValue) / Math.max(range, 1e-9)) * degAngleRange,
      color: section.color
    }
  })
}

const drawFrameBackground = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  size: number,
  centerX: number,
  centerY: number,
  radius: number,
  paint: ThemePaint
): void => {
  if (config.visibility.showFrame) {
    drawGaugeRadialFrameByDesign(context, config.style.frameDesign, centerX, centerY, radius)
  }

  if (!config.visibility.showBackground) {
    return
  }

  drawGaugeRadialBackgroundByStyle(
    context,
    config.style.backgroundColor,
    size,
    centerX,
    centerY,
    radius,
    paint,
    getGaugeBackgroundTextColor(config.style.backgroundColor)
  )
}

const drawTrackAndInactiveLeds = (
  context: RadialBargraphDrawContext,
  size: number,
  geometry: GaugeGeometry,
  centerX: number,
  centerY: number
): void => {
  const radius = 0.35514 * size
  const frameLineWidth = 0.085 * size
  const mainLineWidth = 0.075 * size

  context.save()
  context.translate(centerX, centerY)
  context.rotate(geometry.rotationOffset - 4 * RAD_FACTOR)
  context.translate(-centerX, -centerY)

  const frameGradient = createLinearGradientSafe(
    context,
    0,
    0.107476 * size,
    0,
    0.897195 * size,
    '#666666'
  )
  if (typeof frameGradient !== 'string') {
    frameGradient.addColorStop(0, '#000000')
    frameGradient.addColorStop(0.22, '#333333')
    frameGradient.addColorStop(0.76, '#333333')
    frameGradient.addColorStop(1, '#cccccc')
  }

  context.beginPath()
  context.lineWidth = frameLineWidth
  context.strokeStyle = frameGradient
  context.arc(centerX, centerY, radius, 0, geometry.angleRange + 8 * RAD_FACTOR)
  context.stroke()

  const mainGradient = createLinearGradientSafe(
    context,
    0,
    0.112149 * size,
    0,
    0.892523 * size,
    '#333333'
  )
  if (typeof mainGradient !== 'string') {
    mainGradient.addColorStop(0, '#111111')
    mainGradient.addColorStop(1, '#333333')
  }

  context.beginPath()
  context.lineWidth = mainLineWidth
  context.strokeStyle = mainGradient
  context.arc(centerX, centerY, radius, 0, geometry.angleRange + 8 * RAD_FACTOR)
  context.stroke()
  context.restore()

  const ledX = 0.116822 * size
  const ledY = 0.485981 * size
  const ledW = 0.060747 * size
  const ledH = 0.023364 * size
  const ledCenterX = (ledX + ledW) * 0.5
  const ledCenterY = (ledY + ledH) * 0.5

  for (let angle = 0; angle <= geometry.degAngleRange + 0.001; angle += 5) {
    context.save()
    context.translate(centerX, centerY)
    context.rotate(angle * RAD_FACTOR + geometry.bargraphOffset)
    context.translate(-centerX, -centerY)
    const ledGradient = createRadialGradientSafe(
      context,
      ledCenterX,
      ledCenterY,
      0,
      ledCenterX,
      ledCenterY,
      0.030373 * size,
      '#323232'
    )
    if (typeof ledGradient !== 'string') {
      ledGradient.addColorStop(0, '#3c3c3c')
      ledGradient.addColorStop(1, '#323232')
    }
    context.beginPath()
    context.fillStyle = ledGradient
    context.fillRect(ledX, ledY, ledW, ledH)
    context.restore()
  }
}

const drawTickMarks = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  geometry: GaugeGeometry,
  scale: { minValue: number; maxValue: number; majorTickSpacing: number; minorTickSpacing: number },
  size: number,
  centerX: number,
  centerY: number
): void => {
  const maxMinorTicks = config.scale.maxNoOfMinorTicks
  const textColor = getGaugeBackgroundTextColor(config.style.backgroundColor)
  const fontSize = Math.ceil(0.04 * size)
  const textTranslateX = 0.28 * size
  const maxValueRounded = Number.parseFloat(scale.maxValue.toFixed(2))
  const rotationStep = geometry.angleStep * scale.minorTickSpacing
  let alpha = geometry.rotationOffset
  let majorTickCounter = maxMinorTicks - 1
  let valueCounter = scale.minValue
  let textWidth = 0.1 * size

  if (config.style.gaugeType === 'type1' || config.style.gaugeType === 'type2') {
    textWidth = 0.0375 * size
  }

  context.save()
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = `${fontSize}px ${STD_FONT_NAME}`
  context.strokeStyle = textColor
  context.fillStyle = textColor
  context.translate(centerX, centerY)
  context.rotate(geometry.rotationOffset)

  for (
    let i = scale.minValue;
    Number.parseFloat(i.toFixed(2)) <= maxValueRounded;
    i += scale.minorTickSpacing
  ) {
    majorTickCounter += 1
    if (majorTickCounter === maxMinorTicks) {
      let textRotationAngle = HALF_PI
      if (config.style.tickLabelOrientation === 'horizontal') {
        textRotationAngle = -alpha
      } else if (config.style.tickLabelOrientation === 'tangent') {
        textRotationAngle = alpha <= HALF_PI + PI ? PI : 0
      }
      context.rotate(textRotationAngle)

      let text = valueCounter.toFixed(0)
      if (config.style.labelNumberFormat === 'fractional') {
        text = valueCounter.toFixed(config.scale.fractionalScaleDecimals)
      } else if (config.style.labelNumberFormat === 'scientific') {
        text = valueCounter.toPrecision(2)
      }

      drawRadialTextLabel(context, textTranslateX, textRotationAngle, text, textWidth)

      valueCounter += scale.majorTickSpacing
      majorTickCounter = 0
    }

    context.rotate(rotationStep)
    alpha += rotationStep
  }

  context.restore()
}

const drawTitleAndUnit = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  size: number,
  centerX: number
): void => {
  const textColor = getGaugeBackgroundTextColor(config.style.backgroundColor)
  configureGaugeTextLayout(context, {
    color: textColor,
    align: 'center',
    baseline: 'middle'
  })

  if (config.text.title) {
    configureGaugeTextLayout(context, {
      font: buildGaugeFont(Math.max(12, Math.round(size * 0.046)), STD_FONT_NAME)
    })
    drawGaugeText(context, config.text.title, centerX, size * 0.3)
  }

  if (config.text.unit) {
    configureGaugeTextLayout(context, {
      font: buildGaugeFont(Math.max(10, Math.round(size * 0.035)), STD_FONT_NAME)
    })
    drawGaugeText(context, config.text.unit, centerX, size * 0.38)
  }
}

const drawLcd = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  value: number,
  size: number,
  paint: ThemePaint
): void => {
  if (!config.visibility.showLcd) {
    return
  }

  const lcdWidth = 0.4 * size
  const lcdHeight = 0.13 * size
  const lcdX = (size - lcdWidth) * 0.5
  const lcdY = size * 0.5 - lcdHeight * 0.5
  const lcdPalette = LCD_COLORS[config.style.lcdColor]

  const outerFrameGradient = createLinearGradientSafe(
    context,
    0,
    lcdY,
    0,
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
  if (config.style.lcdColor === 'STANDARD' || config.style.lcdColor === 'STANDARD_GREEN') {
    context.shadowColor = 'gray'
    context.shadowOffsetX = size * 0.007
    context.shadowOffsetY = size * 0.007
    context.shadowBlur = size * 0.007
  }
  configureGaugeTextLayout(context, {
    font: buildGaugeFont(
      Math.max(15, Math.round(size * 0.075)),
      config.style.digitalFont ? paint.fontFamilyLcd : paint.fontFamily
    )
  })
  drawGaugeText(
    context,
    value.toFixed(config.lcdDecimals),
    lcdX + lcdWidth * 0.95,
    lcdY + lcdHeight * 0.5 + Math.floor(size / 10) * 0.38,
    lcdWidth * 0.9
  )
  context.shadowColor = 'transparent'
  context.shadowBlur = 0
}

const drawTrendIndicator = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  size: number
): void => {
  if (!config.indicators.trendVisible || config.indicators.trendState === 'off') {
    return
  }

  const trendSize = 0.06 * size
  const x = 0.38 * size
  const ledSize = Math.ceil(size * 0.093457)
  const ledCenterY = 0.61 * size + ledSize * 0.5
  const y = ledCenterY - trendSize * 0.5
  if (config.indicators.trendState === 'up') {
    context.fillStyle = '#d11f1f'
    context.beginPath()
    context.moveTo(x + trendSize * 0.5, y)
    context.lineTo(x + trendSize, y + trendSize)
    context.lineTo(x, y + trendSize)
    context.closePath()
    context.fill()
    return
  }

  if (config.indicators.trendState === 'steady') {
    context.fillStyle = '#1fa62f'
    context.fillRect(x, y + trendSize * 0.25, trendSize, trendSize * 0.22)
    context.fillRect(x, y + trendSize * 0.6, trendSize, trendSize * 0.22)
    return
  }

  context.fillStyle = '#1f7de0'
  context.beginPath()
  context.moveTo(x + trendSize * 0.5, y + trendSize)
  context.lineTo(x + trendSize, y)
  context.lineTo(x, y)
  context.closePath()
  context.fill()
}

const drawSimpleLed = (
  context: RadialBargraphDrawContext,
  x: number,
  y: number,
  size: number,
  onColor: string,
  visible: boolean
): void => {
  if (!visible) {
    return
  }

  const radius = size * 0.5
  const gradient = createRadialGradientSafe(context, x, y, 0, x, y, radius, onColor)
  if (typeof gradient !== 'string') {
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.25, onColor)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)')
  }
  context.fillStyle = gradient
  context.beginPath()
  context.arc(x, y, radius, 0, TWO_PI)
  context.fill()
}

const drawForeground = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  if (!config.visibility.showForeground) {
    return
  }

  drawGaugeRadialForegroundByType(context, config.style.foregroundType, centerX, centerY, radius)
}

const drawActiveLeds = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  value: number,
  size: number,
  geometry: GaugeGeometry,
  scale: { minValue: number; maxValue: number; range: number },
  sectionAngles: SectionAngle[],
  gradientSampler: ((fraction: number) => string) | undefined
): void => {
  const activeLedAngle =
    ((value - scale.minValue) / Math.max(scale.range, 1e-9)) * geometry.degAngleRange
  const center = size * 0.5
  const ledX = 0.116822 * size
  const ledY = 0.485981 * size
  const ledW = 0.060747 * size
  const ledH = 0.023364 * size
  const activeLedBuffer =
    typeof document !== 'undefined' ? document.createElement('canvas') : undefined
  if (activeLedBuffer) {
    activeLedBuffer.width = Math.ceil(ledW)
    activeLedBuffer.height = Math.ceil(ledH)
  }
  const activeLedContext = activeLedBuffer?.getContext('2d')
  let activeColor = resolveLegacyPointerColor(config.style.valueColor)
  let activeColorKey = `${activeColor.light}|${activeColor.medium}|${activeColor.dark}`

  const drawActiveLedRect = (color: PointerColor): void => {
    if (!activeLedContext || !activeLedBuffer) {
      return
    }
    activeLedContext.clearRect(0, 0, activeLedBuffer.width, activeLedBuffer.height)
    const ledGradient = createRadialGradientSafe(
      activeLedContext,
      activeLedBuffer.width * 0.5,
      activeLedBuffer.height * 0.5,
      0,
      activeLedBuffer.width * 0.5,
      activeLedBuffer.height * 0.5,
      activeLedBuffer.width * 0.5,
      color.light
    )
    if (typeof ledGradient !== 'string') {
      ledGradient.addColorStop(0, color.light)
      ledGradient.addColorStop(1, color.dark)
    }
    activeLedContext.fillStyle = ledGradient
    activeLedContext.fillRect(0, 0, activeLedBuffer.width, activeLedBuffer.height)
  }

  drawActiveLedRect(activeColor)

  for (let angle = 0; angle <= activeLedAngle + 0.001; angle += 5) {
    let currentColor = resolveLegacyPointerColor(config.style.valueColor)

    if (config.style.useValueGradient && gradientSampler) {
      const fraction = angle / Math.max(geometry.degAngleRange, 1e-9)
      const color = gradientSampler(fraction)
      currentColor = derivePointerColor(color)
    } else if (config.style.useSectionColors && sectionAngles.length > 0) {
      const match = sectionAngles.find(
        (section) => angle >= section.startDeg && angle < section.stopDeg
      )
      if (match) {
        currentColor = derivePointerColor(match.color)
      }
    }

    const key = `${currentColor.light}|${currentColor.medium}|${currentColor.dark}`
    context.save()
    context.translate(center, center)
    context.rotate(angle * RAD_FACTOR + geometry.bargraphOffset)
    context.translate(-center, -center)
    if (key !== activeColorKey) {
      activeColorKey = key
      activeColor = currentColor
      drawActiveLedRect(activeColor)
    }
    if (activeLedBuffer) {
      context.drawImage(activeLedBuffer, ledX, ledY)
    }
    context.restore()
  }
}

export const renderRadialBargraphGauge = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  options: RadialBargraphRenderOptions = {}
): RadialBargraphRenderResult => {
  const paint = mergePaint(options.paint)
  const resolvedScale = resolveScale(config)
  const clampedValue = clamp(
    options.value ?? config.value.current,
    resolvedScale.minValue,
    resolvedScale.maxValue
  )
  const geometry = resolveGeometry(config.style.gaugeType, resolvedScale.range)
  const sectionAngles = resolveSectionAngles(
    config.sections,
    resolvedScale.minValue,
    resolvedScale.range,
    geometry.degAngleRange
  )
  const gradientSampler = createGradientSampler(config.valueGradientStops)
  const activeAlerts = resolveGaugeValueAlerts(clampedValue, config.indicators.alerts)
  const threshold = config.indicators.threshold
  const thresholdBreached =
    threshold !== undefined && threshold.show && clampedValue >= threshold.value
  const tone = resolveGaugeToneFromAlerts(activeAlerts, thresholdBreached)

  const size = Math.min(config.size.width, config.size.height)
  const centerX = size * 0.5
  const centerY = size * 0.5
  const radius = size * 0.48

  context.clearRect(0, 0, config.size.width, config.size.height)

  drawFrameBackground(context, config, size, centerX, centerY, radius, paint)
  drawTrackAndInactiveLeds(context, size, geometry, centerX, centerY)
  drawTickMarks(context, config, geometry, resolvedScale, size, centerX, centerY)
  drawTitleAndUnit(context, config, size, centerX)
  drawActiveLeds(
    context,
    config,
    clampedValue,
    size,
    geometry,
    resolvedScale,
    sectionAngles,
    gradientSampler
  )
  drawLcd(context, config, clampedValue, size, paint)

  const ledSize = Math.ceil(size * 0.093457)
  const ledRadius = ledSize * 0.5
  drawSimpleLed(
    context,
    0.53 * size + ledRadius,
    0.61 * size + ledRadius,
    ledSize,
    '#ff2a2a',
    config.indicators.ledVisible
  )

  const userLedX = config.style.gaugeType === 'type3' ? 0.7 * size : size * 0.5
  const userLedY = config.style.gaugeType === 'type3' ? 0.61 * size : 0.75 * size
  drawSimpleLed(
    context,
    userLedX + ledRadius,
    userLedY + ledRadius,
    ledSize,
    '#00c74a',
    config.indicators.userLedVisible
  )

  drawTrendIndicator(context, config, size)
  drawForeground(context, config, centerX, centerY, radius)

  return {
    value: clampedValue,
    tone,
    activeAlerts
  }
}

export const animateRadialBargraphGauge = (
  options: RadialBargraphAnimationOptions
): AnimationRunHandle => {
  const scheduler = createAnimationScheduler()

  const renderWithValue = (value: number): RadialBargraphRenderResult => {
    return renderRadialBargraphGauge(
      options.context,
      options.config,
      options.paint ? { value, paint: options.paint } : { value }
    )
  }

  return scheduler.run({
    from: options.from,
    to: options.to,
    durationMs: options.config.animation.enabled ? options.config.animation.durationMs : 0,
    easing: options.config.animation.easing,
    onUpdate: (sample) => {
      const result = renderWithValue(sample.value)
      options.onFrame?.(result)
    },
    onComplete: () => {
      const result = renderWithValue(options.to)
      options.onComplete?.(result)
    }
  })
}
