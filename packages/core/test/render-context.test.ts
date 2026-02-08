import { describe, expect, it } from 'vitest'

import { createRenderContext, type CanvasFactory, type CanvasLike } from '../src/index.js'

type RecordedCanvas = CanvasLike & {
  clearCalls: Array<{ x: number; y: number; width: number; height: number }>
}

const createRecordingCanvasFactory = (target: RecordedCanvas[]): CanvasFactory => {
  return (width, height) => {
    const clearCalls: Array<{ x: number; y: number; width: number; height: number }> = []

    const canvas: RecordedCanvas = {
      width,
      height,
      clearCalls,
      getContext: () => ({
        clearRect: (x, y, clearWidth, clearHeight) => {
          clearCalls.push({ x, y, width: clearWidth, height: clearHeight })
        }
      })
    }

    target.push(canvas)
    return canvas
  }
}

describe('render context', () => {
  it('creates and reuses keyed offscreen buffers', () => {
    const mainCanvases: RecordedCanvas[] = []
    const offscreenCanvases: RecordedCanvas[] = []

    const context = createRenderContext({
      width: 240,
      height: 240,
      mainFactory: createRecordingCanvasFactory(mainCanvases),
      offscreenFactory: createRecordingCanvasFactory(offscreenCanvases)
    })

    const first = context.getBufferSurface('ticks')
    const second = context.getBufferSurface('ticks')
    const third = context.getBufferSurface('needle')

    expect(first).toBe(second)
    expect(third).not.toBe(first)
    expect(context.listBufferKeys()).toEqual(['ticks', 'needle'])
    expect(mainCanvases).toHaveLength(1)
    expect(offscreenCanvases).toHaveLength(2)
  })

  it('resizes and clears main and offscreen surfaces deterministically', () => {
    const mainCanvases: RecordedCanvas[] = []
    const offscreenCanvases: RecordedCanvas[] = []

    const context = createRenderContext({
      width: 200,
      height: 100,
      mainFactory: createRecordingCanvasFactory(mainCanvases),
      offscreenFactory: createRecordingCanvasFactory(offscreenCanvases)
    })

    context.getBufferSurface('background')
    context.resize(320, 180)

    const main = context.getMainSurface().canvas as RecordedCanvas
    const offscreen = context.getBufferSurface('background').canvas as RecordedCanvas

    expect(main.width).toBe(320)
    expect(main.height).toBe(180)
    expect(offscreen.width).toBe(320)
    expect(offscreen.height).toBe(180)
    expect(main.clearCalls[0]).toEqual({ x: 0, y: 0, width: 320, height: 180 })
    expect(offscreen.clearCalls[0]).toEqual({ x: 0, y: 0, width: 320, height: 180 })

    context.clearAll()
    expect(main.clearCalls[1]).toEqual({ x: 0, y: 0, width: 320, height: 180 })
    expect(offscreen.clearCalls[1]).toEqual({ x: 0, y: 0, width: 320, height: 180 })
  })

  it('validates dimensions and buffer keys', () => {
    const canvases: RecordedCanvas[] = []
    const factory = createRecordingCanvasFactory(canvases)

    expect(() =>
      createRenderContext({
        width: 0,
        height: 100,
        mainFactory: factory
      })
    ).toThrowError('width must be a positive integer')

    const context = createRenderContext({
      width: 100,
      height: 100,
      mainFactory: factory
    })

    expect(() => context.getBufferSurface(' ')).toThrowError('buffer key must not be empty')
    expect(() => context.resize(100, -1)).toThrowError('height must be a positive integer')
  })

  it('drops all buffers on destroy', () => {
    const canvases: RecordedCanvas[] = []
    const context = createRenderContext({
      width: 120,
      height: 120,
      mainFactory: createRecordingCanvasFactory(canvases)
    })

    context.getBufferSurface('a')
    context.getBufferSurface('b')
    expect(context.listBufferKeys()).toEqual(['a', 'b'])

    context.destroy()
    expect(context.listBufferKeys()).toEqual([])
  })
})
