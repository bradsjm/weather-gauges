import type { CompassGaugeConfig } from '../compass/schema.js'
import type { RadialDrawContext } from '../radial/renderer.js'
import type { Rgb } from './gauge-color-palettes.js'
import { rgbTupleToCss } from './gauge-color-palettes.js'
import { drawRadialTextLabel } from './gauge-ticks.js'
import {
  addColorStops,
  closePathSafe,
  createLinearGradientSafe
} from './gauge-canvas-primitives.js'

const PI = Math.PI
const HALF_PI = PI * 0.5
const TWO_PI = PI * 2
const RAD_FACTOR = PI / 180

export const normalizeCompassHeadingForScale = (
  heading: number,
  degreeScaleHalf: boolean
): number => {
  const normalized = ((heading % 360) + 360) % 360
  if (!degreeScaleHalf) {
    return normalized
  }

  return normalized > 180 ? normalized - 360 : normalized
}

const formatCompassDegreeLabel = (heading: number, degreeScaleHalf: boolean): string => {
  const normalized = normalizeCompassHeadingForScale(heading, degreeScaleHalf)
  if (degreeScaleHalf) {
    return String(normalized)
  }

  return `${normalized >= 100 ? '' : '0'}${normalized}`
}

type CompassTickmarkOptions = {
  degreeScaleHalf?: boolean
}

export const drawCompassRose = (
  context: RadialDrawContext,
  centerX: number,
  centerY: number,
  imageWidth: number,
  imageHeight: number,
  symbolColor: Rgb
): void => {
  context.save()
  context.lineWidth = 1
  context.strokeStyle = rgbTupleToCss(symbolColor)
  context.fillStyle = rgbTupleToCss(symbolColor)
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
    context.fillStyle = rgbTupleToCss(symbolColor)
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
        rgbTupleToCss(symbolColor)
      ),
      [
        [0, 'rgb(222, 223, 218)'],
        [0.48, 'rgb(222, 223, 218)'],
        [0.49, rgbTupleToCss(symbolColor)],
        [1, rgbTupleToCss(symbolColor)]
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
  closePathSafe(context)
  context.lineWidth = 0.022 * imageWidth
  context.strokeStyle = rgbTupleToCss(symbolColor)
  context.stroke()
  context.restore()
}

export const drawCompassTickmarks = (
  context: RadialDrawContext,
  config: CompassGaugeConfig,
  imageWidth: number,
  pointSymbols: readonly [string, string, string, string, string, string, string, string],
  labelColor: Rgb,
  symbolColor: Rgb,
  options: CompassTickmarkOptions = {}
): void => {
  const degreeScale = config.style.degreeScale || config.rose.showDegreeLabels
  const pointSymbolsVisible = config.style.pointSymbolsVisible && config.rose.showOrdinalMarkers
  const degreeScaleHalf = options.degreeScaleHalf ?? false

  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.strokeStyle = rgbTupleToCss(labelColor)
  context.fillStyle = rgbTupleToCss(labelColor)
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
        context.strokeStyle = rgbTupleToCss(labelColor)
        context.stroke()
      }

      if (pointSymbolsVisible) {
        switch (i) {
          case 0:
            context.font = stdFont
            drawRadialTextLabel(context, 0.35 * imageWidth, HALF_PI, pointSymbols[2])
            break
          case 45:
            context.font = smlFont
            drawRadialTextLabel(context, 0.29 * imageWidth, HALF_PI, pointSymbols[3])
            break
          case 90:
            context.font = stdFont
            drawRadialTextLabel(context, 0.35 * imageWidth, HALF_PI, pointSymbols[4])
            break
          case 135:
            context.font = smlFont
            drawRadialTextLabel(context, 0.29 * imageWidth, HALF_PI, pointSymbols[5])
            break
          case 180:
            context.font = stdFont
            drawRadialTextLabel(context, 0.35 * imageWidth, HALF_PI, pointSymbols[6])
            break
          case 225:
            context.font = smlFont
            drawRadialTextLabel(context, 0.29 * imageWidth, HALF_PI, pointSymbols[7])
            break
          case 270:
            context.font = stdFont
            drawRadialTextLabel(context, 0.35 * imageWidth, HALF_PI, pointSymbols[0])
            break
          case 315:
            context.font = smlFont
            drawRadialTextLabel(context, 0.29 * imageWidth, HALF_PI, pointSymbols[1])
            break
        }
      }

      if (config.style.roseVisible && (i === 360 || i % 22.5 === 0)) {
        context.beginPath()
        context.moveTo(i % 45 === 0 ? 0.38 * imageWidth : 0.29 * imageWidth, 0)
        context.lineTo(0.1 * imageWidth, 0)
        closePathSafe(context)
        context.lineWidth = 1
        context.strokeStyle = rgbTupleToCss(symbolColor)
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
            drawRadialTextLabel(context, 0.35 * imageWidth, HALF_PI, pointSymbols[2])
            break
          case 90:
            context.font = stdFont
            drawRadialTextLabel(context, 0.35 * imageWidth, HALF_PI, pointSymbols[4])
            break
          case 180:
            context.font = stdFont
            drawRadialTextLabel(context, 0.35 * imageWidth, HALF_PI, pointSymbols[6])
            break
          case 270:
            context.font = stdFont
            drawRadialTextLabel(context, 0.35 * imageWidth, HALF_PI, pointSymbols[0])
            break
          default: {
            const val = (i + 90) % 360
            context.font = smlFont
            drawRadialTextLabel(
              context,
              0.37 * imageWidth,
              HALF_PI,
              formatCompassDegreeLabel(val, degreeScaleHalf)
            )
            break
          }
        }
      } else {
        const val = (i + 90) % 360
        context.font = smlFont
        drawRadialTextLabel(
          context,
          0.37 * imageWidth,
          HALF_PI,
          formatCompassDegreeLabel(val, degreeScaleHalf)
        )
      }

      context.restore()
      context.rotate(10 * RAD_FACTOR)
    }
  }

  context.restore()
}
