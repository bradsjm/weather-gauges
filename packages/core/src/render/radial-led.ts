import { createRadialGradientSafe } from './gauge-canvas-primitives.js'

const TWO_PI = Math.PI * 2

export const drawRadialSimpleLed = (
  context: CanvasRenderingContext2D,
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
