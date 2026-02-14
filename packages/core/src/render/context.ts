/**
 * @module
 *
 * Rendering context management for canvas-based gauge rendering.
 *
 * This module provides utilities for creating and managing render contexts
 * with main canvas and offscreen buffers for performance optimization.
 */

/**
 * Minimal Canvas 2D context type for rendering.
 *
 * @remarks
 * A subset of CanvasRenderingContext2D containing only the clearRect method.
 * Used for type-safe context handling when only clearing is needed.
 */
type Canvas2DContextLike = Pick<CanvasRenderingContext2D, 'clearRect'>

/**
 * Canvas element abstraction for rendering.
 *
 * @remarks
 * Minimal canvas interface with width, height, and context access.
 * Allows for both standard canvas and offscreen canvas implementations.
 *
 * @property width - The width of the canvas in pixels
 * @property height - The height of the canvas in pixels
 * @property getContext - Returns a 2D rendering context (or null if unavailable)
 */
export type CanvasLike = {
  width: number
  height: number
  getContext: (contextId: '2d') => Canvas2DContextLike | null
}

/**
 * Factory function for creating canvas instances.
 *
 * @remarks
 * Function that creates a CanvasLike with specified dimensions.
 * Used by render context for creating main and buffer canvases.
 *
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @returns A canvas-like object
 *
 * @example
 * ```typescript
 * import type { CanvasFactory } from '@bradsjm/weather-gauges-core'
 *
 * const factory: CanvasFactory = (width, height) => ({
 *   width,
 *   height,
 *   getContext: () => someContext
 * })
 * ```
 */
export type CanvasFactory = (width: number, height: number) => CanvasLike

/**
 * Represents a renderable surface with canvas and context.
 *
 * @remarks
 * Combines a canvas-like object with its 2D context and a clear method.
 * Provides a unified interface for rendering operations.
 *
 * @property canvas - The canvas-like surface
 * @property context - The 2D rendering context
 * @property clear - Clears the entire canvas
 */
export type RenderSurface = {
  canvas: CanvasLike
  context: Canvas2DContextLike
  clear: () => void
}

/**
 * Render context managing main canvas and offscreen buffers.
 *
 * @remarks
 * Provides methods for accessing main surface, creating/destroying buffers,
 * resizing all surfaces, and cleanup. Essential for efficient gauge rendering
 * with static layer caching.
 *
 * @property getMainSurface - Gets the main canvas surface
 * @property getBufferSurface - Gets or creates an offscreen buffer by key
 * @property listBufferKeys - Lists all buffer keys that have been created
 * @property resize - Resizes main surface and all buffers to new dimensions
 * @property clearAll - Clears all surfaces (main and all buffers)
 * @property destroy - Destroys all buffers and cleans up resources
 *
 * @example
 * ```typescript
 * import { createRenderContext } from '@bradsjm/weather-gauges-core'
 *
 * const context = createRenderContext({
 *   width: 300,
 *   height: 300,
 *   mainFactory: (w, h) => document.createElement('canvas')
 * })
 *
 * const main = context.getMainSurface()
 * const buffer = context.getBufferSurface('static-layer')
 * ```
 */
export type RenderContext = {
  getMainSurface: () => RenderSurface
  getBufferSurface: (key: string) => RenderSurface
  listBufferKeys: () => string[]
  resize: (width: number, height: number) => void
  clearAll: () => void
  destroy: () => void
}

/**
 * Options for creating a render context.
 *
 * @remarks
 * Defines canvas dimensions and factory functions for creating canvas instances.
 *
 * @property width - Width of the render context in pixels
 * @property height - Height of the render context in pixels
 * @property mainFactory - Factory for creating main canvas surface
 * @property offscreenFactory - Optional factory for offscreen buffer canvases (defaults to mainFactory)
 *
 * @example
 * ```typescript
 * import { createRenderContext, type RenderContextOptions } from '@bradsjm/weather-gauges-core'
 *
 * const options: RenderContextOptions = {
 *   width: 400,
 *   height: 400,
 *   mainFactory: (w, h) => document.createElement('canvas'),
 *   offscreenFactory: (w, h) => new OffscreenCanvas(w, h)
 * }
 *
 * const ctx = createRenderContext(options)
 * ```
 */
export type RenderContextOptions = {
  width: number
  height: number
  mainFactory: CanvasFactory
  offscreenFactory?: CanvasFactory
}

/**
 * Asserts that a value is a positive integer.
 *
 * @param value - The value to check
 * @param label - The label to use in error message
 * @throws Error if value is not finite, not an integer, or not positive
 */
const assertDimension = (value: number, label: string): void => {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
}

/**
 * Asserts that a buffer key is not empty.
 *
 * @param key - The buffer key to check
 * @throws Error if key is empty or only whitespace
 */
const assertBufferKey = (key: string): void => {
  if (key.trim().length === 0) {
    throw new Error('buffer key must not be empty')
  }
}

/**
 * Creates a render surface from a canvas-like object.
 *
 * @param canvas - The canvas-like object to wrap
 * @returns A render surface with canvas, context, and clear method
 * @throws Error if 2D context cannot be obtained
 *
 * @remarks
 * Internal utility for creating consistent render surfaces.
 */
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

/**
 * Resizes a render surface to new dimensions.
 *
 * @param surface - The surface to resize
 * @param width - New width in pixels
 * @param height - New height in pixels
 *
 * @remarks
 * Updates canvas dimensions and clears the surface.
 */
const resizeSurface = (surface: RenderSurface, width: number, height: number): void => {
  surface.canvas.width = width
  surface.canvas.height = height
  surface.clear()
}

/**
 * Creates a render context for canvas-based rendering.
 *
 * @param options - Configuration for the render context
 * @returns A render context with main surface and buffer management
 * @throws Error if width or height are not positive integers
 * @throws Error if 2D context cannot be obtained from canvas factory
 *
 * @remarks
 * Creates a render context with:
 * - Main canvas surface for final output
 * - Offscreen buffer surfaces for caching static layers
 * - Automatic buffer creation and management
 * - Resize operations that affect all surfaces
 * - Cleanup methods for proper resource management
 *
 * Use offscreen buffers for static content that doesn't change between frames,
 * significantly improving rendering performance.
 *
 * @example
 * ```typescript
 * import { createRenderContext } from '@bradsjm/weather-gauges-core'
 *
 * const ctx = createRenderContext({
 *   width: 400,
 *   height: 400,
 *   mainFactory: (w, h) => {
 *     const canvas = document.createElement('canvas')
 *     canvas.width = w
 *     canvas.height = h
 *     return canvas
 *   }
 * })
 *
 * // Get main surface for rendering
 * const main = ctx.getMainSurface()
 *
 * // Get or create a buffer for static content
 * const buffer = ctx.getBufferSurface('background')
 *
 * // Resize all surfaces
 * ctx.resize(600, 600)
 *
 * // Clear all surfaces
 * ctx.clearAll()
 *
 * // Clean up when done
 * ctx.destroy()
 * ```
 */
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

/**
 * Creates a DOM canvas element.
 *
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @returns A canvas-like object
 * @throws Error if document is not available (e.g., in Node.js)
 *
 * @remarks
 * Creates a standard HTMLCanvasElement. Used by createBrowserRenderContext.
 */
const createDomCanvas = (width: number, height: number): CanvasLike => {
  if (typeof document === 'undefined') {
    throw new Error('document is not available in this environment')
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

/**
 * Creates an offscreen canvas if available, otherwise falls back to DOM canvas.
 *
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @returns An offscreen or DOM canvas-like object
 *
 * @remarks
 * Uses OffscreenCanvas when available (modern browsers) for better performance.
 * Falls back to DOM canvas in environments without OffscreenCanvas support.
 */
const createOffscreenCanvas = (width: number, height: number): CanvasLike => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }

  return createDomCanvas(width, height)
}

/**
 * Creates a browser-based render context.
 *
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @returns A render context with DOM canvas factory
 * @throws Error if document is not available
 * @throws Error if width or height are not positive integers
 *
 * @remarks
 * Convenience function that creates a render context using DOM canvas elements
 * for the main surface and OffscreenCanvas (when available) for buffers.
 * Ideal for browser environments where document and OffscreenCanvas are available.
 *
 * @example
 * ```typescript
 * import { createBrowserRenderContext } from '@bradsjm/weather-gauges-core'
 *
 * const ctx = createBrowserRenderContext(400, 400)
 * const main = ctx.getMainSurface()
 * const buffer = ctx.getBufferSurface('static-layer')
 * ```
 */
export const createBrowserRenderContext = (width: number, height: number): RenderContext => {
  return createRenderContext({
    width,
    height,
    mainFactory: createDomCanvas,
    offscreenFactory: createOffscreenCanvas
  })
}
