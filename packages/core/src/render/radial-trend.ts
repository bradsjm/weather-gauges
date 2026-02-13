import {
  addColorStops,
  closePathSafe,
  createLinearGradientSafe,
  createRadialGradientSafe
} from './gauge-canvas-primitives.js'
import type { RadialTrendPalette, TrendLedColor } from './trend-palette.js'
import { resolveRadialTrendPalette } from './trend-palette.js'

export type RadialTrendState = 'up' | 'steady' | 'down' | 'off'

const TWO_PI = Math.PI * 2

const hexToRgba = (hex: string, alpha: number): string | undefined => {
  const cleaned = hex.trim().replace('#', '')
  if (cleaned.length !== 3 && cleaned.length !== 6) {
    return undefined
  }

  const normalized =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : cleaned

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  if (Number.isNaN(red) || Number.isNaN(green) || Number.isNaN(blue)) {
    return undefined
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const rgbaToRgba = (value: string, alpha: number): string | undefined => {
  const match = value
    .trim()
    .match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i)

  if (!match) {
    return undefined
  }

  return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`
}

const setAlpha = (color: string, alpha: number): string => {
  return hexToRgba(color, alpha) ?? rgbaToRgba(color, alpha) ?? color
}

const drawHalo = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: string
): void => {
  const fill = addColorStops(
    createRadialGradientSafe(context, centerX, centerY, 0, centerX, centerY, radius, color),
    [
      [0, setAlpha(color, 0)],
      [0.5, setAlpha(color, 0.3)],
      [0.7, setAlpha(color, 0.2)],
      [0.8, setAlpha(color, 0.1)],
      [0.85, setAlpha(color, 0.05)],
      [1, setAlpha(color, 0)]
    ]
  )

  context.fillStyle = fill
  context.beginPath()
  context.arc(centerX, centerY, radius, 0, TWO_PI, true)
  closePathSafe(context)
  context.fill()
}

const drawUpArrow = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  active: boolean,
  color: TrendLedColor,
  palette: RadialTrendPalette
): void => {
  const fill = active
    ? addColorStops(
        createRadialGradientSafe(
          context,
          x + 0.5 * width,
          y + 0.2 * height,
          0,
          x + 0.5 * width,
          y + 0.2 * height,
          0.5 * width,
          color.outerColor
        ),
        [
          [0, color.innerColor1],
          [0.2, color.innerColor2],
          [1, color.outerColor]
        ]
      )
    : addColorStops(
        createLinearGradientSafe(context, x, y, x, y + 0.5 * height, palette.disabledTo),
        [
          [0, palette.disabledFrom],
          [1, palette.disabledTo]
        ]
      )

  context.fillStyle = fill
  context.beginPath()
  context.moveTo(x + 0.5 * width, y)
  context.lineTo(x + width, y + 0.2 * height)
  context.lineTo(x + 0.752 * width, y + 0.2 * height)
  context.lineTo(x + 0.752 * width, y + 0.37 * height)
  context.lineTo(x + 0.252 * width, y + 0.37 * height)
  context.lineTo(x + 0.252 * width, y + 0.2 * height)
  context.lineTo(x, y + 0.2 * height)
  closePathSafe(context)
  context.fill()

  if (!active) {
    context.strokeStyle = palette.shadow
    context.beginPath()
    context.moveTo(x, y + 0.2 * height)
    context.lineTo(x + 0.5 * width, y)
    context.lineTo(x + width, y + 0.2 * height)
    context.moveTo(x + 0.252 * width, y + 0.2 * height)
    context.lineTo(x + 0.252 * width, y + 0.37 * height)
    context.stroke()

    context.strokeStyle = palette.highlight
    context.beginPath()
    context.moveTo(x + 0.252 * width, y + 0.37 * height)
    context.lineTo(x + 0.752 * width, y + 0.37 * height)
    context.lineTo(x + 0.752 * width, y + 0.2 * height)
    context.lineTo(x + width, y + 0.2 * height)
    context.stroke()
    return
  }

  drawHalo(context, x + 0.5 * width, y + 0.2 * height, 0.7 * width, color.coronaColor)
}

const drawSteadyIndicator = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  active: boolean,
  color: TrendLedColor,
  palette: RadialTrendPalette
): void => {
  const barX = x + 0.128 * width
  const barWidth = 0.744 * width
  const barHeight = 0.074 * height
  const topBarY = y + 0.41 * height
  const bottomBarY = y + 0.516 * height

  if (active) {
    context.fillStyle = color.outerColor
    context.beginPath()
    context.rect(barX, topBarY, barWidth, barHeight)
    context.rect(barX, bottomBarY, barWidth, barHeight)
    closePathSafe(context)
    context.fill()
    drawHalo(context, x + 0.5 * width, y + 0.5 * height, 0.7 * width, color.coronaColor)
    return
  }

  const topFill = addColorStops(
    createLinearGradientSafe(context, barX, topBarY, barX, topBarY + barHeight, palette.disabledTo),
    [
      [0, palette.disabledFrom],
      [1, palette.disabledTo]
    ]
  )
  context.fillStyle = topFill
  context.beginPath()
  context.rect(barX, topBarY, barWidth, barHeight)
  closePathSafe(context)
  context.fill()

  const bottomFill = addColorStops(
    createLinearGradientSafe(
      context,
      barX,
      bottomBarY,
      barX,
      bottomBarY + barHeight,
      palette.disabledTo
    ),
    [
      [0, palette.disabledFrom],
      [1, palette.disabledTo]
    ]
  )
  context.fillStyle = bottomFill
  context.beginPath()
  context.rect(barX, bottomBarY, barWidth, barHeight)
  closePathSafe(context)
  context.fill()

  context.strokeStyle = palette.shadow
  context.beginPath()
  context.moveTo(barX, topBarY + barHeight)
  context.lineTo(barX, topBarY)
  context.lineTo(barX + barWidth, topBarY)
  context.stroke()
  context.beginPath()
  context.moveTo(barX, bottomBarY + barHeight)
  context.lineTo(barX, bottomBarY)
  context.lineTo(barX + barWidth, bottomBarY)
  context.stroke()

  context.strokeStyle = palette.highlight
  context.beginPath()
  context.moveTo(barX + barWidth, topBarY)
  context.lineTo(barX + barWidth, topBarY + barHeight)
  context.lineTo(barX, topBarY + barHeight)
  context.stroke()
  context.beginPath()
  context.moveTo(barX + barWidth, bottomBarY)
  context.lineTo(barX + barWidth, bottomBarY + barHeight)
  context.lineTo(barX, bottomBarY + barHeight)
  context.stroke()
}

const drawDownArrow = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  active: boolean,
  color: TrendLedColor,
  palette: RadialTrendPalette
): void => {
  const fill = active
    ? addColorStops(
        createRadialGradientSafe(
          context,
          x + 0.5 * width,
          y + 0.8 * height,
          0,
          x + 0.5 * width,
          y + 0.8 * height,
          0.5 * width,
          color.outerColor
        ),
        [
          [0, color.innerColor1],
          [0.2, color.innerColor2],
          [1, color.outerColor]
        ]
      )
    : addColorStops(
        createLinearGradientSafe(context, x, y + 0.63 * height, x, y + height, palette.disabledTo),
        [
          [0, palette.disabledFrom],
          [1, palette.disabledTo]
        ]
      )

  context.fillStyle = fill
  context.beginPath()
  context.moveTo(x + 0.5 * width, y + height)
  context.lineTo(x + width, y + 0.8 * height)
  context.lineTo(x + 0.725 * width, y + 0.8 * height)
  context.lineTo(x + 0.725 * width, y + 0.63 * height)
  context.lineTo(x + 0.252 * width, y + 0.63 * height)
  context.lineTo(x + 0.252 * width, y + 0.8 * height)
  context.lineTo(x, y + 0.8 * height)
  closePathSafe(context)
  context.fill()

  if (!active) {
    context.strokeStyle = palette.shadow
    context.beginPath()
    context.moveTo(x, y + 0.8 * height)
    context.lineTo(x + 0.252 * width, y + 0.8 * height)
    context.moveTo(x + 0.252 * width, y + 0.63 * height)
    context.lineTo(x + 0.752 * width, y + 0.63 * height)
    context.stroke()
    context.beginPath()
    context.moveTo(x + 0.752 * width, y + 0.8 * height)
    context.lineTo(x + width, y + 0.8 * height)
    context.stroke()

    context.strokeStyle = palette.highlight
    context.beginPath()
    context.moveTo(x + width, y + 0.8 * height)
    context.lineTo(x + 0.5 * width, y + height)
    context.lineTo(x, y + 0.8 * height)
    context.moveTo(x + 0.725 * width, y + 0.8 * height)
    context.lineTo(x + 0.725 * width, y + 0.63 * height)
    context.stroke()
    return
  }

  drawHalo(context, x + 0.5 * width, y + 0.8 * height, 0.7 * width, color.coronaColor)
}

export const drawRadialTrendIndicator = (
  context: CanvasRenderingContext2D,
  trendVisible: boolean,
  trendState: RadialTrendState,
  size: number,
  x: number,
  y: number,
  palette: RadialTrendPalette = resolveRadialTrendPalette()
): void => {
  if (!trendVisible) {
    return
  }

  const width = 0.06 * size
  const height = width * 2

  drawUpArrow(context, x, y, width, height, trendState === 'up', palette.up, palette)
  drawSteadyIndicator(
    context,
    x,
    y,
    width,
    height,
    trendState === 'steady',
    palette.steady,
    palette
  )
  drawDownArrow(context, x, y, width, height, trendState === 'down', palette.down, palette)
}
