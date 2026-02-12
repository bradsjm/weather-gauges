export const PI = Math.PI
export const HALF_PI = PI * 0.5
export const RAD_FACTOR = PI / 180

export const drawRadialTextLabel = (
  context: CanvasRenderingContext2D,
  distance: number,
  rotation: number,
  text: string,
  maxWidth?: number
): void => {
  context.save()
  context.translate(distance, 0)
  context.rotate(rotation)
  if (maxWidth === undefined) {
    context.fillText(text, 0, 0)
  } else {
    context.fillText(text, 0, 0, maxWidth)
  }
  context.restore()
}
