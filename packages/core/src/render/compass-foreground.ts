import type { CompassForegroundType } from '../compass/schema.js'
import type { GaugeKnobStyle, GaugeKnobType } from '../schemas/knob.js'
import {
  addColorStops,
  closePathSafe,
  createLinearGradientSafe,
  createRadialGradientSafe
} from './gauge-canvas-primitives.js'
import { drawGaugeCenterKnob } from './gauge-knob.js'

export const drawCompassCenterKnob = drawGaugeCenterKnob

export const drawCompassForeground = (
  context: CanvasRenderingContext2D,
  foregroundType: CompassForegroundType,
  imageWidth: number,
  imageHeight: number,
  knobType: GaugeKnobType,
  knobStyle: GaugeKnobStyle
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
