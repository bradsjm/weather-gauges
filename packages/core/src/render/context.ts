type Canvas2DContextLike = Pick<CanvasRenderingContext2D, 'clearRect'>

export type CanvasLike = {
  width: number
  height: number
  getContext: (contextId: '2d') => Canvas2DContextLike | null
}

export type CanvasFactory = (width: number, height: number) => CanvasLike

export type RenderSurface = {
  canvas: CanvasLike
  context: Canvas2DContextLike
  clear: () => void
}

export type RenderContext = {
  getMainSurface: () => RenderSurface
  getBufferSurface: (key: string) => RenderSurface
  listBufferKeys: () => string[]
  resize: (width: number, height: number) => void
  clearAll: () => void
  destroy: () => void
}

export type RenderContextOptions = {
  width: number
  height: number
  mainFactory: CanvasFactory
  offscreenFactory?: CanvasFactory
}

const assertDimension = (value: number, label: string): void => {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
}

const assertBufferKey = (key: string): void => {
  if (key.trim().length === 0) {
    throw new Error('buffer key must not be empty')
  }
}

const createRenderSurface = (canvas: CanvasLike): RenderSurface => {
  const context = canvas.getContext('2d')
  if (context === null) {
    throw new Error('2d rendering context is required')
  }

  return {
    canvas,
    context,
    clear: () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  }
}

const resizeSurface = (surface: RenderSurface, width: number, height: number): void => {
  surface.canvas.width = width
  surface.canvas.height = height
  surface.clear()
}

export const createRenderContext = (options: RenderContextOptions): RenderContext => {
  assertDimension(options.width, 'width')
  assertDimension(options.height, 'height')

  const offscreenFactory = options.offscreenFactory ?? options.mainFactory
  const mainSurface = createRenderSurface(options.mainFactory(options.width, options.height))
  const buffers = new Map<string, RenderSurface>()

  let width = options.width
  let height = options.height

  const ensureBuffer = (key: string): RenderSurface => {
    assertBufferKey(key)
    const existing = buffers.get(key)

    if (existing !== undefined) {
      return existing
    }

    const created = createRenderSurface(offscreenFactory(width, height))
    buffers.set(key, created)
    return created
  }

  return {
    getMainSurface: () => mainSurface,
    getBufferSurface: (key) => ensureBuffer(key),
    listBufferKeys: () => [...buffers.keys()],
    resize: (nextWidth, nextHeight) => {
      assertDimension(nextWidth, 'width')
      assertDimension(nextHeight, 'height')

      width = nextWidth
      height = nextHeight

      resizeSurface(mainSurface, width, height)
      for (const surface of buffers.values()) {
        resizeSurface(surface, width, height)
      }
    },
    clearAll: () => {
      mainSurface.clear()
      for (const surface of buffers.values()) {
        surface.clear()
      }
    },
    destroy: () => {
      buffers.clear()
    }
  }
}

const createDomCanvas = (width: number, height: number): CanvasLike => {
  if (typeof document === 'undefined') {
    throw new Error('document is not available in this environment')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const createOffscreenCanvas = (width: number, height: number): CanvasLike => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }

  return createDomCanvas(width, height)
}

export const createBrowserRenderContext = (width: number, height: number): RenderContext => {
  return createRenderContext({
    width,
    height,
    mainFactory: createDomCanvas,
    offscreenFactory: createOffscreenCanvas
  })
}
