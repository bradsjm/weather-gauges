import type { CompassForegroundType, CompassKnobStyle, CompassKnobType } from '../compass/schema.js'
import type { RadialDrawContext } from '../radial/renderer.js'

const TWO_PI = Math.PI * 2

const closePathSafe = (context: RadialDrawContext): void => {
  if (typeof context.closePath === 'function') {
    context.closePath()
  }
}

const createLinearGradientSafe = (
  context: RadialDrawContext,
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
  context: RadialDrawContext,
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

const drawCompassCenterKnob = (
  context: RadialDrawContext,
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

export const drawCompassForeground = (
  context: RadialDrawContext,
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

  drawCompassCenterKnob(context, imageWidth, knobType, knobStyle)
  context.restore()
}
