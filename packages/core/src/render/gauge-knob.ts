import type { GaugeKnobStyle, GaugeKnobType } from '../schemas/knob.js'
import {
  addColorStops,
  closePathSafe,
  createLinearGradientSafe
} from './gauge-canvas-primitives.js'

const TWO_PI = Math.PI * 2

export const drawGaugeCenterKnob = (
  context: CanvasRenderingContext2D,
  imageWidth: number,
  knobType: GaugeKnobType,
  knobStyle: GaugeKnobStyle
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
