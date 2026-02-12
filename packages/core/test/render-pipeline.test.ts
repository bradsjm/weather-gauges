import { describe, expect, it } from 'vitest'

import { runGaugeRenderPipeline } from '../src/render/pipeline.js'

describe('render pipeline', () => {
  it('runs stages in frame/background/content/foreground order', () => {
    const calls: string[] = []
    const renderContext = {
      context: {} as CanvasRenderingContext2D,
      width: 200,
      height: 200,
      centerX: 100,
      centerY: 100,
      radius: 96
    }

    runGaugeRenderPipeline(renderContext, {
      drawFrame: () => calls.push('frame'),
      drawBackground: () => calls.push('background'),
      drawContent: () => calls.push('content'),
      drawForeground: () => calls.push('foreground')
    })

    expect(calls).toEqual(['frame', 'background', 'content', 'foreground'])
  })

  it('skips missing stages without failing', () => {
    const calls: string[] = []
    const renderContext = {
      context: {} as CanvasRenderingContext2D,
      width: 200,
      height: 200,
      centerX: 100,
      centerY: 100,
      radius: 96
    }

    runGaugeRenderPipeline(renderContext, {
      drawBackground: () => calls.push('background'),
      drawForeground: () => calls.push('foreground')
    })

    expect(calls).toEqual(['background', 'foreground'])
  })
})
