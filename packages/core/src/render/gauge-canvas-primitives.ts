type Canvas2DContext = CanvasRenderingContext2D

export const closePathSafe = (context: Canvas2DContext): void => {
  if (typeof context.closePath === 'function') {
    context.closePath()
  }
}

export const createLinearGradientSafe = (
  context: Canvas2DContext,
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

export const createRadialGradientSafe = (
  context: Canvas2DContext,
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

export const addColorStops = (
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
