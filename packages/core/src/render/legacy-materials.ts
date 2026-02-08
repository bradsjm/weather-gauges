import type { ThemePaint } from '../theme/tokens.js'

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

const LEGACY_STAINLESS_FRACTIONS = [
  0, 0.03, 0.1, 0.14, 0.24, 0.33, 0.38, 0.5, 0.62, 0.67, 0.76, 0.81, 0.85, 0.97, 1
]

const LEGACY_STAINLESS_COLORS = [
  '#fdfdfd',
  '#f3f3f3',
  '#cbcbcb',
  '#f5f5f5',
  '#c5c5c5',
  '#f4f4f4',
  '#d0d0d0',
  '#f8f8f8',
  '#d0d0d0',
  '#f7f7f7',
  '#c3c3c3',
  '#f3f3f3',
  '#c8c8c8',
  '#f5f5f5',
  '#dcdcdc'
]

const safeClosePath = (context: CanvasRenderingContext2D): void => {
  if (typeof context.closePath === 'function') {
    context.closePath()
  }
}

const createLinearGradientSafe = (
  context: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fallbackColor: string
): CanvasGradient | string => {
  if (typeof context.createLinearGradient !== 'function') {
    return fallbackColor
  }

  return context.createLinearGradient(x0, y0, x1, y1)
}

const createRadialGradientSafe = (
  context: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number,
  fallbackColor: string
): CanvasGradient | string => {
  if (typeof context.createRadialGradient !== 'function') {
    return fallbackColor
  }

  return context.createRadialGradient(x0, y0, r0, x1, y1, r1)
}

const addStops = (gradient: CanvasGradient | string, stops: Array<[number, string]>): void => {
  if (typeof gradient === 'string') {
    return
  }

  for (const [offset, color] of stops) {
    gradient.addColorStop(offset, color)
  }
}

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
  safeClosePath(context)
}

const drawRoundRectPath = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void => {
  const clampedRadius = Math.max(0, Math.min(radius, width / 2, height / 2))
  context.beginPath()
  context.moveTo(x + clampedRadius, y)

  if (typeof context.arcTo === 'function') {
    context.lineTo(x + width - clampedRadius, y)
    context.arcTo(x + width, y, x + width, y + clampedRadius, clampedRadius)
    context.lineTo(x + width, y + height - clampedRadius)
    context.arcTo(x + width, y + height, x + width - clampedRadius, y + height, clampedRadius)
    context.lineTo(x + clampedRadius, y + height)
    context.arcTo(x, y + height, x, y + height - clampedRadius, clampedRadius)
    context.lineTo(x, y + clampedRadius)
    context.arcTo(x, y, x + clampedRadius, y, clampedRadius)
  } else {
    context.lineTo(x + width, y)
    context.lineTo(x + width, y + height)
    context.lineTo(x, y + height)
    context.lineTo(x, y)
  }

  safeClosePath(context)
}

export const drawLegacyRadialFrame = (
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
  drawCircle(context, centerX, centerY, radius * 0.84)
  context.fillStyle = '#000'
  context.fill()
  context.restore()

  drawCircle(context, centerX, centerY, radius * 0.995)
  context.lineWidth = Math.max(1, radius * 0.014)
  context.strokeStyle = 'rgba(132,132,132,0.55)'
  context.stroke()
}

export const drawLegacyRadialBackground = (
  context: CanvasRenderingContext2D,
  paint: ThemePaint,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const baseRadius = radius * 0.84
  const stainlessGradient = createGradientFromStops(
    context,
    centerX,
    centerY,
    LEGACY_STAINLESS_FRACTIONS,
    LEGACY_STAINLESS_COLORS,
    paint.backgroundColor
  )

  drawCircle(context, centerX, centerY, baseRadius)
  context.fillStyle = stainlessGradient
  context.fill()

  const toneOverlay = createRadialGradientSafe(
    context,
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    baseRadius,
    paint.backgroundColor
  )
  addStops(toneOverlay, [
    [0, paint.backgroundColor],
    [0.78, 'rgba(0, 0, 0, 0.08)'],
    [1, 'rgba(0, 0, 0, 0.22)']
  ])
  drawCircle(context, centerX, centerY, baseRadius)
  context.fillStyle = toneOverlay
  context.fill()

  const edgeVignette = createRadialGradientSafe(
    context,
    centerX,
    centerY,
    baseRadius * 0.35,
    centerX,
    centerY,
    baseRadius,
    'rgba(0,0,0,0.1)'
  )
  addStops(edgeVignette, [
    [0.7, 'rgba(0,0,0,0)'],
    [0.86, 'rgba(0,0,0,0.03)'],
    [0.92, 'rgba(0,0,0,0.07)'],
    [0.97, 'rgba(0,0,0,0.15)'],
    [1, 'rgba(0,0,0,0.3)']
  ])
  drawCircle(context, centerX, centerY, baseRadius)
  context.fillStyle = edgeVignette
  context.fill()
}

export const drawLegacyRadialForeground = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const glassRadius = radius * 0.84
  const highlight = createLinearGradientSafe(
    context,
    centerX,
    centerY - glassRadius,
    centerX,
    centerY + glassRadius * 0.4,
    'rgba(255,255,255,0.08)'
  )
  addStops(highlight, [
    [0, 'rgba(255,255,255,0.275)'],
    [1, 'rgba(255,255,255,0.015)']
  ])

  context.save()
  drawCircle(context, centerX, centerY, glassRadius)
  if (typeof context.clip === 'function') {
    context.clip()
  }
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
  safeClosePath(context)
  context.fillStyle = highlight
  context.fill()
  context.restore()
}

export const drawLegacyCenterKnob = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const knobRadius = Math.max(4, radius * 0.082)
  const knobGradient = createRadialGradientSafe(
    context,
    centerX - knobRadius * 0.25,
    centerY - knobRadius * 0.25,
    knobRadius * 0.2,
    centerX,
    centerY,
    knobRadius,
    '#7f7f7f'
  )
  addStops(knobGradient, [
    [0, '#f5f5f5'],
    [0.45, '#bcbcbc'],
    [1, '#3f3f3f']
  ])

  context.save()
  context.shadowColor = 'rgba(0,0,0,0.45)'
  context.shadowBlur = knobRadius * 0.45
  context.shadowOffsetX = knobRadius * 0.08
  context.shadowOffsetY = knobRadius * 0.08
  drawCircle(context, centerX, centerY, knobRadius)
  context.fillStyle = knobGradient
  context.fill()
  context.restore()

  drawCircle(context, centerX, centerY, knobRadius)
  context.strokeStyle = 'rgba(0,0,0,0.5)'
  context.lineWidth = Math.max(1, knobRadius * 0.12)
  context.stroke()
}

export type LinearMaterialFrame = {
  frameWidth: number
  innerX: number
  innerY: number
  innerWidth: number
  innerHeight: number
  cornerRadius: number
}

export const drawLegacyLinearFrame = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  vertical: boolean
): LinearMaterialFrame => {
  const frameWidth = Math.ceil(
    Math.min(0.04 * Math.sqrt(width * width + height * height), 0.1 * (vertical ? width : height))
  )
  const cornerRadius = Math.ceil(0.05 * (vertical ? width : height))

  drawRoundRectPath(context, 0, 0, width, height, cornerRadius)
  context.fillStyle = '#838383'
  context.fill()

  const frameGradient = createGradientFromStops(
    context,
    width / 2,
    height / 2,
    LEGACY_CHROME_FRACTIONS,
    LEGACY_CHROME_COLORS,
    '#b5b5b5'
  )
  drawRoundRectPath(
    context,
    frameWidth,
    frameWidth,
    width - frameWidth * 2,
    height - frameWidth * 2,
    Math.max(1, cornerRadius - frameWidth)
  )
  context.fillStyle = frameGradient
  context.fill()

  const innerX = frameWidth + 1
  const innerY = frameWidth + 1
  const innerWidth = width - (frameWidth + 1) * 2
  const innerHeight = height - (frameWidth + 1) * 2
  const innerCorner = Math.max(1, cornerRadius - frameWidth - 1)

  context.save()
  context.globalCompositeOperation = 'destination-out'
  drawRoundRectPath(context, innerX, innerY, innerWidth, innerHeight, innerCorner)
  context.fillStyle = '#000'
  context.fill()
  context.restore()

  return {
    frameWidth,
    innerX,
    innerY,
    innerWidth,
    innerHeight,
    cornerRadius: innerCorner
  }
}

export const drawLegacyLinearBackground = (
  context: CanvasRenderingContext2D,
  paint: ThemePaint,
  frame: LinearMaterialFrame
): void => {
  const { innerX, innerY, innerWidth, innerHeight, cornerRadius } = frame

  const baseGradient = createLinearGradientSafe(
    context,
    innerX,
    innerY,
    innerX,
    innerY + innerHeight,
    paint.backgroundColor
  )
  addStops(baseGradient, [
    [0, '#f5f5f5'],
    [0.5, paint.backgroundColor],
    [1, '#d6d6d6']
  ])

  drawRoundRectPath(context, innerX, innerY, innerWidth, innerHeight, cornerRadius)
  context.fillStyle = baseGradient
  context.fill()

  const innerShadowAlphas = [0.3, 0.2, 0.13, 0.09, 0.06, 0.04, 0.03]
  for (let index = 0; index < innerShadowAlphas.length; index += 1) {
    const alpha = innerShadowAlphas[index]
    if (alpha === undefined) {
      continue
    }

    drawRoundRectPath(
      context,
      innerX + index,
      innerY + index,
      innerWidth - index * 2,
      innerHeight - index * 2,
      Math.max(1, cornerRadius - index)
    )
    context.strokeStyle = `rgba(0,0,0,${alpha})`
    context.lineWidth = 1
    context.stroke()
  }
}

export const drawLegacyCompassRose = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  const outer = radius * 0.8
  const highRadius = radius * 0.52
  const lowRadius = radius * 0.46

  for (let degree = 0; degree < 360; degree += 15) {
    const angle = (degree * Math.PI) / 180
    const nextAngle = ((degree + 15) * Math.PI) / 180
    const ringRadius = degree % 30 === 0 ? highRadius : lowRadius

    context.beginPath()
    context.moveTo(centerX, centerY)
    context.lineTo(
      centerX + Math.cos(angle - Math.PI / 2) * ringRadius,
      centerY + Math.sin(angle - Math.PI / 2) * ringRadius
    )
    context.lineTo(
      centerX + Math.cos(nextAngle - Math.PI / 2) * ringRadius,
      centerY + Math.sin(nextAngle - Math.PI / 2) * ringRadius
    )
    safeClosePath(context)
    context.fillStyle = degree % 30 === 0 ? 'rgba(240,240,240,0.9)' : 'rgba(60,60,60,0.3)'
    context.fill()
  }

  context.beginPath()
  context.arc(centerX, centerY, outer, 0, Math.PI * 2)
  context.strokeStyle = 'rgba(255,255,255,0.45)'
  context.lineWidth = Math.max(1, radius * 0.015)
  context.stroke()

  context.beginPath()
  context.arc(centerX, centerY, radius * 0.2, 0, Math.PI * 2)
  context.strokeStyle = 'rgba(255,255,255,0.55)'
  context.lineWidth = Math.max(1, radius * 0.022)
  context.stroke()
}
