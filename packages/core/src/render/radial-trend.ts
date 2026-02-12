export type RadialTrendState = 'up' | 'steady' | 'down' | 'off'

export const drawRadialTrendIndicator = (
  context: CanvasRenderingContext2D,
  trendVisible: boolean,
  trendState: RadialTrendState,
  size: number
): void => {
  if (!trendVisible || trendState === 'off') {
    return
  }

  const trendSize = 0.06 * size
  const x = 0.38 * size
  const ledSize = Math.ceil(size * 0.093457)
  const ledCenterY = 0.61 * size + ledSize * 0.5
  const y = ledCenterY - trendSize * 0.5

  if (trendState === 'up') {
    context.fillStyle = '#d11f1f'
    context.beginPath()
    context.moveTo(x + trendSize * 0.5, y)
    context.lineTo(x + trendSize, y + trendSize)
    context.lineTo(x, y + trendSize)
    context.closePath()
    context.fill()
    return
  }

  if (trendState === 'steady') {
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
