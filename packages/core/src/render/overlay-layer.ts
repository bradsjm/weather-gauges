import type { GaugeOverlay } from '../schemas/shared.js'

type OverlayImageLike = CanvasImageSource & {
  width?: number
  height?: number
  videoWidth?: number
  videoHeight?: number
}

type OverlayPosition = NonNullable<GaugeOverlay>['position']

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value))
}

const asPositiveNumber = (value: number | undefined, fallback: number): number => {
  return Number.isFinite(value) && (value as number) > 0 ? (value as number) : fallback
}

const getImageDimensions = (
  image: OverlayImageLike,
  fallbackWidth: number,
  fallbackHeight: number
): { width: number; height: number } => {
  const width = asPositiveNumber(image.width ?? image.videoWidth, fallbackWidth)
  const height = asPositiveNumber(image.height ?? image.videoHeight, fallbackHeight)

  return { width, height }
}

const resolveOverlayRect = (
  image: OverlayImageLike,
  canvasWidth: number,
  canvasHeight: number,
  scale: number,
  position: OverlayPosition
): { x: number; y: number; width: number; height: number } => {
  const baseSize = Math.min(canvasWidth, canvasHeight) * scale
  const { width: sourceWidth, height: sourceHeight } = getImageDimensions(
    image,
    canvasWidth,
    canvasHeight
  )
  const fitScale = baseSize / Math.max(sourceWidth, sourceHeight)
  const width = sourceWidth * fitScale
  const height = sourceHeight * fitScale

  if (position === 'center') {
    return {
      x: (canvasWidth - width) / 2,
      y: (canvasHeight - height) / 2,
      width,
      height
    }
  }

  if (position === 'top-left') {
    return { x: 0, y: 0, width, height }
  }

  if (position === 'top-right') {
    return { x: canvasWidth - width, y: 0, width, height }
  }

  if (position === 'bottom-left') {
    return { x: 0, y: canvasHeight - height, width, height }
  }

  return {
    x: canvasWidth - width,
    y: canvasHeight - height,
    width,
    height
  }
}

export const resolveOverlayLayerSignature = (
  layer: GaugeOverlay | null | undefined
): {
  visible: boolean
  hasImage: boolean
  imageWidth: number | null
  imageHeight: number | null
  opacity: number
  position: OverlayPosition
  scale: number
} => {
  const image = (layer?.image ?? null) as OverlayImageLike | null

  return {
    visible: layer?.visible ?? true,
    hasImage: image !== null,
    imageWidth: image?.width ?? image?.videoWidth ?? null,
    imageHeight: image?.height ?? image?.videoHeight ?? null,
    opacity: clamp(layer?.opacity ?? 0.3, 0, 1),
    position: layer?.position ?? 'center',
    scale: Math.max(0.001, layer?.scale ?? 0.5)
  }
}

type DrawOverlayLayerOptions = {
  canvasWidth: number
  canvasHeight: number
  clipCircle?: {
    centerX: number
    centerY: number
    radius: number
  }
}

export const drawOverlayLayer = (
  context: CanvasRenderingContext2D,
  layer: GaugeOverlay | null | undefined,
  options: DrawOverlayLayerOptions
): void => {
  if (!layer?.image || layer.visible === false) {
    return
  }

  const opacity = clamp(layer.opacity ?? 0.3, 0, 1)
  const scale = Math.max(0.001, layer.scale ?? 0.5)
  const position = layer.position ?? 'center'
  const image = layer.image as OverlayImageLike
  const { canvasWidth, canvasHeight, clipCircle } = options
  const rect = resolveOverlayRect(image, canvasWidth, canvasHeight, scale, position)

  context.save()
  context.globalAlpha = context.globalAlpha * opacity

  if (clipCircle) {
    context.beginPath()
    context.arc(clipCircle.centerX, clipCircle.centerY, clipCircle.radius, 0, Math.PI * 2)
    context.clip()
  }

  context.drawImage(image, rect.x, rect.y, rect.width, rect.height)
  context.restore()
}
