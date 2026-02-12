type TextLayoutOptions = {
  color?: string
  align?: CanvasTextAlign
  baseline?: CanvasTextBaseline
  font?: string
}

export const buildGaugeFont = (
  sizePx: number,
  family: string,
  weight: number | string = 400
): string => {
  return `${weight} ${sizePx}px ${family}`
}

export const configureGaugeTextLayout = (
  context: CanvasRenderingContext2D,
  options: TextLayoutOptions
): void => {
  if (options.color !== undefined) {
    context.fillStyle = options.color
  }
  if (options.align !== undefined) {
    context.textAlign = options.align
  }
  if (options.baseline !== undefined) {
    context.textBaseline = options.baseline
  }
  if (options.font !== undefined) {
    context.font = options.font
  }
}

export const drawGaugeText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth?: number
): void => {
  if (maxWidth === undefined) {
    context.fillText(text, x, y)
    return
  }

  context.fillText(text, x, y, maxWidth)
}
