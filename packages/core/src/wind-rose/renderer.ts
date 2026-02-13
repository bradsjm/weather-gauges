import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { type CompassTickmarkConfig, drawCompassTickmarks } from '../render/compass-scales.js'
import {
  drawGaugeRadialForegroundByType,
  drawRadialBackground,
  drawGaugeRadialFrameByDesign
} from '../render/gauge-materials.js'
import {
  addColorStops,
  closePathSafe,
  createRadialGradientSafe
} from '../render/gauge-canvas-primitives.js'
import {
  getGaugeBackgroundPalette,
  rgbTupleToCss,
  type GaugeBackgroundPalette
} from '../render/gauge-color-palettes.js'
import { resolveGaugeToneFromAlerts } from '../render/gauge-alerts.js'
import {
  buildGaugeFont,
  configureGaugeTextLayout,
  drawGaugeText
} from '../render/gauge-text-primitives.js'
import {
  createStaticLayerCache,
  resizeStaticLayerCache,
  type StaticLayerCache
} from '../render/static-layer-cache.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type { WindRoseGaugeConfig, WindRosePetal, WindRoseValue } from './schema.js'

export type WindRoseDrawContext = CanvasRenderingContext2D

export type WindRoseRenderResult = {
  value: number
  tone: 'accent' | 'warning' | 'danger'
  activeAlerts: []
  valueData: WindRoseValue
  dominantDirection: number
}

export type WindRoseRenderOptions = {
  value?: WindRoseValue
  paint?: Partial<ThemePaint>
}

export type WindRoseAnimationOptions = {
  context: WindRoseDrawContext
  config: WindRoseGaugeConfig
  fromValue: WindRoseValue
  toValue: WindRoseValue
  paint?: Partial<ThemePaint>
  onFrame?: (result: WindRoseRenderResult) => void
  onComplete?: (result: WindRoseRenderResult) => void
}

type CompassPointSymbolsTuple = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
]

const PI = Math.PI
const TWO_PI = PI * 2
const RAD_FACTOR = PI / 180

const DEFAULT_POINT_SYMBOLS: CompassPointSymbolsTuple = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

const asCompassPointSymbols = (value: readonly string[]): CompassPointSymbolsTuple => {
  if (value.length === 8) {
    return value as CompassPointSymbolsTuple
  }

  return DEFAULT_POINT_SYMBOLS
}

const normalizeDirection = (direction: number): number => {
  return ((direction % 360) + 360) % 360
}

const toRadiansFromNorth = (direction: number): number => {
  return (normalizeDirection(direction) - 90) * RAD_FACTOR
}

const withAlpha = (color: string, alpha: number): string => {
  const boundedAlpha = Math.max(0, Math.min(1, alpha))
  const normalizedColor = color.trim()

  if (/^#[0-9a-fA-F]{6}$/.test(normalizedColor)) {
    const red = Number.parseInt(normalizedColor.slice(1, 3), 16)
    const green = Number.parseInt(normalizedColor.slice(3, 5), 16)
    const blue = Number.parseInt(normalizedColor.slice(5, 7), 16)
    return `rgba(${red}, ${green}, ${blue}, ${boundedAlpha})`
  }

  if (/^#[0-9a-fA-F]{3}$/.test(normalizedColor)) {
    const redHex = normalizedColor.slice(1, 2)
    const greenHex = normalizedColor.slice(2, 3)
    const blueHex = normalizedColor.slice(3, 4)
    const red = Number.parseInt(`${redHex}${redHex}`, 16)
    const green = Number.parseInt(`${greenHex}${greenHex}`, 16)
    const blue = Number.parseInt(`${blueHex}${blueHex}`, 16)
    return `rgba(${red}, ${green}, ${blue}, ${boundedAlpha})`
  }

  const rgbMatch = normalizedColor.match(/^rgb\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\s*\)$/i)
  if (rgbMatch) {
    const [, red = '0', green = '0', blue = '0'] = rgbMatch
    return `rgba(${red}, ${green}, ${blue}, ${boundedAlpha})`
  }

  const rgbaMatch = normalizedColor.match(
    /^rgba\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\s*\)$/i
  )
  if (rgbaMatch) {
    const [, red = '0', green = '0', blue = '0'] = rgbaMatch
    return `rgba(${red}, ${green}, ${blue}, ${boundedAlpha})`
  }

  return normalizedColor
}

const getWindBackgroundPalette = (
  backgroundColor: WindRoseGaugeConfig['style']['backgroundColor']
): GaugeBackgroundPalette => {
  return getGaugeBackgroundPalette(backgroundColor)
}

const windRoseStaticLayerCaches = new WeakMap<WindRoseDrawContext, StaticLayerCache>()
const windRoseStaticLayerUnavailable = new WeakSet<WindRoseDrawContext>()

const getWindRoseStaticLayerCache = (
  context: WindRoseDrawContext,
  width: number,
  height: number
): StaticLayerCache | null => {
  if (windRoseStaticLayerUnavailable.has(context)) {
    return null
  }

  const existing = windRoseStaticLayerCaches.get(context)
  if (existing !== undefined) {
    resizeStaticLayerCache(existing, width, height)
    return existing
  }

  const created = createStaticLayerCache(width, height)
  if (created === null) {
    windRoseStaticLayerUnavailable.add(context)
    return null
  }

  windRoseStaticLayerCaches.set(context, created)
  return created
}

const resolveCustomLayerSignature = (
  customLayer: WindRoseGaugeConfig['style']['customLayer']
): {
  visible: boolean
  hasImage: boolean
  imageWidth: number | null
  imageHeight: number | null
} => {
  const layer = customLayer as
    | { visible?: boolean; image?: CanvasImageSource | null }
    | null
    | undefined
  const image = layer?.image as { width?: number; height?: number } | null | undefined

  return {
    visible: layer?.visible ?? false,
    hasImage: image !== null && image !== undefined,
    imageWidth: image?.width ?? null,
    imageHeight: image?.height ?? null
  }
}

const resolveWindRoseStaticLayerSignature = (
  config: WindRoseGaugeConfig,
  paint: ThemePaint,
  petalCount: number
): string => {
  return JSON.stringify({
    size: config.size,
    style: {
      frameDesign: config.style.frameDesign,
      foregroundType: config.style.foregroundType,
      backgroundColor: config.style.backgroundColor,
      pointSymbols: config.style.pointSymbols,
      roseGradient: config.style.roseGradient,
      roseLineColor: config.style.roseLineColor,
      showOutline: config.style.showOutline,
      customLayer: resolveCustomLayerSignature(config.style.customLayer)
    },
    visibility: config.visibility,
    text: config.text,
    petalCount,
    paint
  })
}

const drawWindRoseStaticLayer = (
  context: WindRoseDrawContext,
  config: WindRoseGaugeConfig,
  paint: ThemePaint,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  palette: GaugeBackgroundPalette,
  petalCount: number
): void => {
  context.clearRect(0, 0, width, height)

  if (config.visibility.showFrame) {
    drawGaugeRadialFrameByDesign(
      context,
      config.style.frameDesign,
      centerX,
      centerY,
      Math.min(width, height) / 2
    )
  }

  if (config.visibility.showBackground) {
    drawRadialBackground(
      context,
      config.style.backgroundColor,
      width,
      centerX,
      centerY,
      Math.min(width, height) / 2,
      paint,
      rgbTupleToCss(palette.labelColor)
    )

    const customLayer = config.style.customLayer as
      | { visible?: boolean; image?: CanvasImageSource }
      | undefined
    if (customLayer?.image && customLayer.visible) {
      context.drawImage(customLayer.image, 0, 0, width, height)
    }

    drawRoseGrid(
      context,
      centerX,
      centerY,
      radius * 0.66,
      petalCount,
      rgbTupleToCss(palette.symbolColor)
    )
    drawAxisDividers(context, centerX, centerY, radius * 0.66, rgbTupleToCss(palette.symbolColor))

    if (config.visibility.showPointSymbols || config.visibility.showDegreeScale) {
      drawCompassTicks(context, config, width, palette)
    }
  }

  drawWindRoseLabels(context, config, centerX, centerY, width, rgbTupleToCss(palette.labelColor))

  if (config.visibility.showForeground) {
    drawGaugeRadialForegroundByType(
      context,
      config.style.foregroundType,
      centerX,
      centerY,
      width / 2
    )
  }
}

const toSortedPetals = (petals: readonly WindRosePetal[]): WindRosePetal[] => {
  return [...petals].sort(
    (left, right) => normalizeDirection(left.direction) - normalizeDirection(right.direction)
  )
}

const resolveDominantPetal = (petals: readonly WindRosePetal[]): WindRosePetal => {
  let dominant: WindRosePetal = petals[0] ?? { direction: 0, value: 0 }
  for (const petal of petals) {
    if (petal.value > dominant.value) {
      dominant = petal
    }
  }

  return dominant
}

const drawCompassTicks = (
  context: WindRoseDrawContext,
  config: WindRoseGaugeConfig,
  imageWidth: number,
  palette: GaugeBackgroundPalette
): void => {
  const tickConfig: CompassTickmarkConfig = {
    style: {
      degreeScale: config.visibility.showDegreeScale,
      pointSymbolsVisible: config.visibility.showPointSymbols,
      roseVisible: false
    },
    rose: {
      showDegreeLabels: config.visibility.showDegreeScale,
      showOrdinalMarkers: config.visibility.showPointSymbols
    }
  }

  drawCompassTickmarks(
    context,
    tickConfig,
    imageWidth,
    asCompassPointSymbols(config.style.pointSymbols),
    palette.labelColor,
    palette.symbolColor,
    { showTickmarks: config.visibility.showTickmarks }
  )
}

const drawAxisDividers = (
  context: WindRoseDrawContext,
  centerX: number,
  centerY: number,
  radius: number,
  color: string
): void => {
  const majorTickCountPerSide = 5

  context.save()
  context.strokeStyle = color
  context.globalAlpha = 0.72
  context.lineWidth = 1.9

  context.beginPath()
  context.moveTo(centerX - radius, centerY)
  context.lineTo(centerX + radius, centerY)
  context.moveTo(centerX, centerY - radius)
  context.lineTo(centerX, centerY + radius)
  context.stroke()

  context.globalAlpha = 0.62
  context.lineWidth = 1.35

  const tickLength = radius * 0.048
  for (let index = 1; index <= majorTickCountPerSide; index += 1) {
    const offset = (radius * index) / (majorTickCountPerSide + 1)

    context.beginPath()
    context.moveTo(centerX - offset, centerY - tickLength)
    context.lineTo(centerX - offset, centerY + tickLength)
    context.moveTo(centerX + offset, centerY - tickLength)
    context.lineTo(centerX + offset, centerY + tickLength)

    context.moveTo(centerX - tickLength, centerY - offset)
    context.lineTo(centerX + tickLength, centerY - offset)
    context.moveTo(centerX - tickLength, centerY + offset)
    context.lineTo(centerX + tickLength, centerY + offset)
    context.stroke()
  }

  context.restore()
}

const drawRoseGrid = (
  context: WindRoseDrawContext,
  centerX: number,
  centerY: number,
  radius: number,
  binCount: number,
  color: string
): void => {
  context.save()
  context.strokeStyle = color
  context.lineWidth = 1

  for (let ring = 1; ring <= 5; ring += 1) {
    context.globalAlpha = 0.1 + ring * 0.02
    context.beginPath()
    context.arc(centerX, centerY, (radius * ring) / 5, 0, TWO_PI)
    closePathSafe(context)
    context.stroke()
  }

  context.globalAlpha = 0.2
  for (let index = 0; index < binCount; index += 1) {
    const direction = index * (360 / binCount)
    const angle = toRadiansFromNorth(direction)
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    context.beginPath()
    context.moveTo(centerX, centerY)
    context.lineTo(x, y)
    context.stroke()
  }

  context.restore()
}

const drawWindRoseLabels = (
  context: WindRoseDrawContext,
  config: WindRoseGaugeConfig,
  centerX: number,
  centerY: number,
  imageWidth: number,
  labelColor: string
): void => {
  const labelFontSize = Math.max(12, Math.round(imageWidth * 0.046728))

  context.save()
  configureGaugeTextLayout(context, {
    color: labelColor,
    align: 'center',
    baseline: 'middle',
    font: buildGaugeFont(labelFontSize, 'Arial,Verdana,sans-serif', '600')
  })

  if (config.text.title) {
    drawGaugeText(context, config.text.title, centerX, centerY - imageWidth * 0.26)
  }

  if (config.text.unit) {
    configureGaugeTextLayout(context, {
      font: buildGaugeFont(labelFontSize, 'Arial,Verdana,sans-serif', '500')
    })
    drawGaugeText(context, config.text.unit, centerX, centerY + imageWidth * 0.28)
  }

  context.restore()
}

const drawWindRosePetals = (
  context: WindRoseDrawContext,
  config: WindRoseGaugeConfig,
  centerX: number,
  centerY: number,
  plotRadius: number,
  value: WindRoseValue
): void => {
  const sortedPetals = toSortedPetals(value.petals)
  const binStep = 360 / sortedPetals.length

  const sharedGradient = addColorStops(
    createRadialGradientSafe(
      context,
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      plotRadius,
      withAlpha(config.style.roseGradient.edgeColor, config.style.roseGradient.edgeAlpha)
    ),
    [
      [0, withAlpha(config.style.roseGradient.centerColor, config.style.roseGradient.centerAlpha)],
      [1, withAlpha(config.style.roseGradient.edgeColor, config.style.roseGradient.edgeAlpha)]
    ]
  )

  for (const petal of sortedPetals) {
    const clampedValue = Math.max(0, Math.min(petal.value, value.maxValue))
    const normalized = value.maxValue === 0 ? 0 : clampedValue / value.maxValue
    const radius = plotRadius * normalized

    const startAngle = toRadiansFromNorth(petal.direction - binStep * 0.5)
    const endAngle = toRadiansFromNorth(petal.direction + binStep * 0.5)

    context.beginPath()
    context.moveTo(centerX, centerY)
    context.arc(centerX, centerY, radius, startAngle, endAngle, false)
    closePathSafe(context)

    context.fillStyle =
      petal.color === undefined
        ? sharedGradient
        : withAlpha(petal.color, config.style.roseGradient.edgeAlpha)
    context.fill()
  }

  if (config.style.showOutline) {
    context.save()
    context.strokeStyle = config.style.roseLineColor
    context.lineWidth = Math.max(1, plotRadius * 0.012)
    context.globalAlpha = 0.85
    context.beginPath()

    sortedPetals.forEach((petal, index) => {
      const clampedValue = Math.max(0, Math.min(petal.value, value.maxValue))
      const normalized = value.maxValue === 0 ? 0 : clampedValue / value.maxValue
      const radius = plotRadius * normalized
      const angle = toRadiansFromNorth(petal.direction)
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      if (index === 0) {
        context.moveTo(x, y)
        return
      }

      context.lineTo(x, y)
    })

    closePathSafe(context)
    context.stroke()
    context.restore()
  }
}

const interpolateValue = (
  fromValue: WindRoseValue,
  toValue: WindRoseValue,
  progress: number
): WindRoseValue => {
  const fromByDirection = new Map<number, WindRosePetal>()
  for (const petal of fromValue.petals) {
    fromByDirection.set(normalizeDirection(petal.direction), petal)
  }

  const petals = toValue.petals.map((toPetal) => {
    const key = normalizeDirection(toPetal.direction)
    const fromPetal = fromByDirection.get(key)
    const startValue = fromPetal?.value ?? 0
    return {
      direction: toPetal.direction,
      value: startValue + (toPetal.value - startValue) * progress,
      ...(toPetal.color ? { color: toPetal.color } : {})
    }
  })

  return {
    petals,
    maxValue: fromValue.maxValue + (toValue.maxValue - fromValue.maxValue) * progress
  }
}

export const renderWindRoseGauge = (
  context: WindRoseDrawContext,
  config: WindRoseGaugeConfig,
  options: WindRoseRenderOptions = {}
): WindRoseRenderResult => {
  const { width, height } = config.size
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 2 - 4
  const paint = {
    ...resolveThemePaint(),
    ...options.paint
  }

  const value = options.value ?? config.value
  const sortedPetals = toSortedPetals(value.petals)
  const dominantPetal = resolveDominantPetal(sortedPetals)
  const palette = getWindBackgroundPalette(config.style.backgroundColor)
  const staticLayerSignature = resolveWindRoseStaticLayerSignature(
    config,
    paint,
    sortedPetals.length
  )

  context.clearRect(0, 0, width, height)

  const staticLayerCache = getWindRoseStaticLayerCache(context, width, height)
  if (staticLayerCache !== null) {
    if (staticLayerCache.signature !== staticLayerSignature) {
      drawWindRoseStaticLayer(
        staticLayerCache.context,
        config,
        paint,
        width,
        height,
        centerX,
        centerY,
        radius,
        palette,
        sortedPetals.length
      )
      staticLayerCache.signature = staticLayerSignature
    }

    context.drawImage(staticLayerCache.canvas, 0, 0)
  } else {
    drawWindRoseStaticLayer(
      context,
      config,
      paint,
      width,
      height,
      centerX,
      centerY,
      radius,
      palette,
      sortedPetals.length
    )
  }

  drawWindRosePetals(context, config, centerX, centerY, radius * 0.62, value)

  return {
    value: dominantPetal.value,
    dominantDirection: normalizeDirection(dominantPetal.direction),
    tone: resolveGaugeToneFromAlerts([]),
    activeAlerts: [],
    valueData: value
  }
}

export const animateWindRoseGauge = (options: WindRoseAnimationOptions): AnimationRunHandle => {
  const scheduler = createAnimationScheduler()

  const renderWithValue = (value: WindRoseValue): WindRoseRenderResult => {
    return renderWindRoseGauge(options.context, options.config, {
      value,
      paint: options.paint ?? {}
    })
  }

  const durationMs = options.config.animation.enabled ? options.config.animation.durationMs : 0

  return scheduler.run({
    from: 0,
    to: 1,
    durationMs,
    easing: options.config.animation.easing,
    onUpdate: (sample) => {
      const currentValue = interpolateValue(options.fromValue, options.toValue, sample.value)
      const result = renderWithValue(currentValue)
      options.onFrame?.(result)
    },
    onComplete: () => {
      const result = renderWithValue(options.toValue)
      options.onComplete?.(result)
    }
  })
}
