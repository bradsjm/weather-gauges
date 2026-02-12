import { clamp } from '../math/range.js'
import { closePathSafe } from './gauge-canvas-primitives.js'

const DEG_TO_RAD = Math.PI / 180

export type GaugeSectionArc = {
  startDeg: number
  stopDeg: number
  color: string
}

export type GaugeValueSection = {
  from: number
  to: number
  color: string
}

export type DrawGaugeSectionArcsOptions = {
  centerX: number
  centerY: number
  innerRadius: number
  outerRadius: number
  filled?: boolean
  fillAlpha?: number
  lineWidth?: number
  angleOffsetDeg?: number
}

export const resolveGaugeValueSectionArcs = (
  sections: GaugeValueSection[],
  minValue: number,
  maxValue: number,
  degAngleRange: number
): GaugeSectionArc[] => {
  const range = Math.max(maxValue - minValue, 1e-9)

  return sections.map((section) => {
    const from = clamp(section.from, minValue, maxValue)
    const to = clamp(section.to, minValue, maxValue)
    return {
      startDeg: ((from - minValue) / range) * degAngleRange,
      stopDeg: ((to - minValue) / range) * degAngleRange,
      color: section.color
    }
  })
}

export const drawGaugeSectionArcs = (
  context: CanvasRenderingContext2D,
  sections: GaugeSectionArc[],
  options: DrawGaugeSectionArcsOptions
): void => {
  if (sections.length === 0) {
    return
  }

  const {
    centerX,
    centerY,
    innerRadius,
    outerRadius,
    filled = false,
    fillAlpha = 0.3,
    lineWidth = 2,
    angleOffsetDeg = -90
  } = options

  context.save()

  for (const section of sections) {
    const startAngle = (section.startDeg + angleOffsetDeg) * DEG_TO_RAD
    const stopAngle = (section.stopDeg + angleOffsetDeg) * DEG_TO_RAD

    context.beginPath()
    context.arc(centerX, centerY, outerRadius, startAngle, stopAngle)
    context.arc(centerX, centerY, innerRadius, stopAngle, startAngle, true)
    closePathSafe(context)

    if (filled) {
      context.fillStyle = section.color
      context.globalAlpha = fillAlpha
      context.fill()
      context.globalAlpha = 1
    }

    context.strokeStyle = section.color
    context.lineWidth = lineWidth
    context.stroke()
  }

  context.restore()
}
