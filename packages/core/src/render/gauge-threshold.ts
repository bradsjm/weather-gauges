export type DrawGaugeRadialThresholdOptions = {
  centerX: number
  centerY: number
  angleRadians: number
  innerRadius: number
  outerRadius: number
  color?: string
  lineWidth?: number
  direction?: 'outward' | 'inward'
}

export const drawGaugeRadialThreshold = (
  context: CanvasRenderingContext2D,
  options: DrawGaugeRadialThresholdOptions
): void => {
  const {
    centerX,
    centerY,
    angleRadians,
    innerRadius,
    outerRadius,
    color = '#ff3030',
    lineWidth = 2,
    direction = 'outward'
  } = options

  const innerX = centerX + innerRadius * Math.cos(angleRadians)
  const innerY = centerY + innerRadius * Math.sin(angleRadians)
  const outerX = centerX + outerRadius * Math.cos(angleRadians)
  const outerY = centerY + outerRadius * Math.sin(angleRadians)

  context.save()
  context.strokeStyle = color
  context.fillStyle = color
  context.lineWidth = lineWidth
  context.lineCap = 'round'

  context.beginPath()
  context.moveTo(innerX, innerY)
  context.lineTo(outerX, outerY)
  context.stroke()

  const markerLength = Math.max(outerRadius - innerRadius, lineWidth * 2)
  const markerHalfWidth = Math.max(lineWidth * 1.5, markerLength * 0.18)
  const directionFactor = direction === 'inward' ? -1 : 1
  const tipRadius = Math.max(0, outerRadius + directionFactor * markerLength * 0.7)
  const baseRadius = Math.max(0, outerRadius + directionFactor * lineWidth)
  const tipX = centerX + tipRadius * Math.cos(angleRadians)
  const tipY = centerY + tipRadius * Math.sin(angleRadians)
  const baseX = centerX + baseRadius * Math.cos(angleRadians)
  const baseY = centerY + baseRadius * Math.sin(angleRadians)
  const perpX = Math.cos(angleRadians + Math.PI * 0.5)
  const perpY = Math.sin(angleRadians + Math.PI * 0.5)

  context.beginPath()
  context.moveTo(baseX + perpX * markerHalfWidth, baseY + perpY * markerHalfWidth)
  context.lineTo(tipX, tipY)
  context.lineTo(baseX - perpX * markerHalfWidth, baseY - perpY * markerHalfWidth)
  context.closePath()
  context.fill()
  context.restore()
}
