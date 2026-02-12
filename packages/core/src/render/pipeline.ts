export type GaugeRenderContextContract = {
  context: CanvasRenderingContext2D
  width: number
  height: number
  centerX: number
  centerY: number
  radius: number
}

export type GaugeRenderPipelineStep<TContext extends GaugeRenderContextContract> = (
  renderContext: TContext
) => void

export type GaugeRenderPipeline<TContext extends GaugeRenderContextContract> = {
  drawFrame?: GaugeRenderPipelineStep<TContext>
  drawBackground?: GaugeRenderPipelineStep<TContext>
  drawContent?: GaugeRenderPipelineStep<TContext>
  drawForeground?: GaugeRenderPipelineStep<TContext>
}

export const runGaugeRenderPipeline = <TContext extends GaugeRenderContextContract>(
  renderContext: TContext,
  pipeline: GaugeRenderPipeline<TContext>
): void => {
  pipeline.drawFrame?.(renderContext)
  pipeline.drawBackground?.(renderContext)
  pipeline.drawContent?.(renderContext)
  pipeline.drawForeground?.(renderContext)
}
