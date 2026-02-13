export type StaticLayerCanvas = HTMLCanvasElement

export type StaticLayerCache = {
  canvas: StaticLayerCanvas
  context: CanvasRenderingContext2D
  signature: string
}

const createStaticLayerCanvas = (width: number, height: number): StaticLayerCanvas | null => {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }

  return null
}

export const createStaticLayerCache = (width: number, height: number): StaticLayerCache | null => {
  const canvas = createStaticLayerCanvas(width, height)
  if (canvas === null) {
    return null
  }

  const context = canvas.getContext('2d')
  if (context === null) {
    return null
  }

  return {
    canvas,
    context,
    signature: ''
  }
}

export const resizeStaticLayerCache = (
  cache: StaticLayerCache,
  width: number,
  height: number
): void => {
  if (cache.canvas.width === width && cache.canvas.height === height) {
    return
  }

  cache.canvas.width = width
  cache.canvas.height = height
  cache.signature = ''
}
