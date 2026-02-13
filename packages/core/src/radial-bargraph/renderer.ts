import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { clamp } from '../math/range.js'
import {
  drawRadialBackground,
  drawGaugeRadialForegroundByType,
  drawGaugeRadialFrameByDesign
} from '../render/gauge-materials.js'
import {
  getGaugeBackgroundTextColor,
  resolveGaugePointerPalette,
  rgbTupleToCss
} from '../render/gauge-color-palettes.js'
import {
  createLinearGradientSafe,
  createRadialGradientSafe
} from '../render/gauge-canvas-primitives.js'
import {
  buildGaugeFont,
  configureGaugeTextLayout,
  drawGaugeText
} from '../render/gauge-text-primitives.js'
import { drawRadialTextLabel } from '../render/gauge-ticks.js'
import { drawRadialLcd } from '../render/radial-lcd.js'
import { drawRadialSimpleLed } from '../render/radial-led.js'
import { drawRadialTrendIndicator } from '../render/radial-trend.js'
import { resolveRadialTrendPalette } from '../render/trend-palette.js'
import { resolveGaugeToneFromAlerts, resolveGaugeValueAlerts } from '../render/gauge-alerts.js'
import { drawGaugeRadialThreshold } from '../render/gauge-threshold.js'
import { resolveGaugeValueSectionArcs, type GaugeSectionArc } from '../render/gauge-sections.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type {
  RadialBargraphAlert,
  RadialBargraphGaugeConfig,
  RadialBargraphValueGradientStop
} from './schema.js'

export type RadialBargraphDrawContext = CanvasRenderingContext2D

export type RadialBargraphRenderResult = {
  value: number
  tone: 'accent' | 'warning' | 'danger'
  activeAlerts: RadialBargraphAlert[]
}

export type RadialBargraphRenderOptions = {
  value?: number
  paint?: Partial<ThemePaint>
}

export type RadialBargraphAnimationOptions = {
  context: RadialBargraphDrawContext
  config: RadialBargraphGaugeConfig
  from: number
  to: number
  paint?: Partial<ThemePaint>
  onFrame?: (result: RadialBargraphRenderResult) => void
  onComplete?: (result: RadialBargraphRenderResult) => void
}

type PointerColor = {
  light: string
  medium: string
  dark: string
  veryDark: string
}

type GaugeGeometry = {
  rotationOffset: number
  bargraphOffset: number
  angleRange: number
  degAngleRange: number
  angleStep: number
}

const PI = Math.PI
const HALF_PI = PI * 0.5
const TWO_PI = PI * 2
const DEG_FACTOR = 180 / PI
const RAD_FACTOR = PI / 180

const STD_FONT_NAME = 'Arial,Verdana,sans-serif'

const mergePaint = (paint?: Partial<ThemePaint>): ThemePaint => {
  return {
    ...resolveThemePaint(),
    ...paint
  }
}

const parseRgbColor = (color: string): { r: number; g: number; b: number } | undefined => {
  if (typeof document === 'undefined') {
    return undefined
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d')
  if (!context) {
    return undefined
  }

  context.clearRect(0, 0, 1, 1)
  context.fillStyle = color
  context.fillRect(0, 0, 1, 1)
  const pixel = context.getImageData(0, 0, 1, 1).data
  return {
    r: pixel[0] ?? 0,
    g: pixel[1] ?? 0,
    b: pixel[2] ?? 0
  }
}

const clampChannel = (value: number): number => Math.round(clamp(value, 0, 255))

const colorToString = (rgb: { r: number; g: number; b: number }): string => {
  return `rgb(${clampChannel(rgb.r)}, ${clampChannel(rgb.g)}, ${clampChannel(rgb.b)})`
}

const resolvePointerColorFromName = (
  colorName: RadialBargraphGaugeConfig['style']['valueColor']
): PointerColor => {
  const palette = resolveGaugePointerPalette(colorName)
  return {
    light: rgbTupleToCss(palette.light),
    medium: rgbTupleToCss(palette.medium),
    dark: rgbTupleToCss(palette.dark),
    veryDark: rgbTupleToCss(palette.veryDark)
  }
}

const derivePointerColor = (color: string): PointerColor => {
  const parsed = parseRgbColor(color)
  if (!parsed) {
    return {
      light: color,
      medium: color,
      dark: color,
      veryDark: color
    }
  }

  return {
    veryDark: colorToString({ r: parsed.r * 0.25, g: parsed.g * 0.25, b: parsed.b * 0.25 }),
    dark: colorToString({ r: parsed.r * 0.55, g: parsed.g * 0.55, b: parsed.b * 0.55 }),
    medium: colorToString({ r: parsed.r * 0.85, g: parsed.g * 0.85, b: parsed.b * 0.85 }),
    light: colorToString({
      r: parsed.r + (255 - parsed.r) * 0.35,
      g: parsed.g + (255 - parsed.g) * 0.35,
      b: parsed.b + (255 - parsed.b) * 0.35
    })
  }
}

const calcNiceNumber = (range: number, round: boolean): number => {
  const exponent = Math.floor(Math.log10(range))
  const fraction = range / 10 ** exponent
  let niceFraction: number

  if (round) {
    if (fraction < 1.5) {
      niceFraction = 1
    } else if (fraction < 3) {
      niceFraction = 2
    } else if (fraction < 7) {
      niceFraction = 5
    } else {
      niceFraction = 10
    }
  } else if (fraction <= 1) {
    niceFraction = 1
  } else if (fraction <= 2) {
    niceFraction = 2
  } else if (fraction <= 5) {
    niceFraction = 5
  } else {
    niceFraction = 10
  }

  return niceFraction * 10 ** exponent
}

const resolveScale = (
  config: RadialBargraphGaugeConfig
): {
  minValue: number
  maxValue: number
  range: number
  majorTickSpacing: number
  minorTickSpacing: number
} => {
  const min = config.value.min
  const max = config.value.max
  const rawRange = Math.max(1e-9, max - min)
  const maxNoOfMajorTicks = config.scale.maxNoOfMajorTicks
  const maxNoOfMinorTicks = config.scale.maxNoOfMinorTicks

  if (config.scale.niceScale) {
    const niceRange = calcNiceNumber(rawRange, false)
    const majorTickSpacing = calcNiceNumber(niceRange / (maxNoOfMajorTicks - 1), true)
    const niceMin = Math.floor(min / majorTickSpacing) * majorTickSpacing
    const niceMax = Math.ceil(max / majorTickSpacing) * majorTickSpacing
    const minorTickSpacing = calcNiceNumber(majorTickSpacing / (maxNoOfMinorTicks - 1), true)

    return {
      minValue: niceMin,
      maxValue: niceMax,
      range: niceMax - niceMin,
      majorTickSpacing,
      minorTickSpacing
    }
  }

  const majorTickSpacing = calcNiceNumber(rawRange / (maxNoOfMajorTicks - 1), true)
  const minorTickSpacing = calcNiceNumber(majorTickSpacing / (maxNoOfMinorTicks - 1), true)
  return {
    minValue: min,
    maxValue: max,
    range: rawRange,
    majorTickSpacing,
    minorTickSpacing
  }
}

const resolveGeometry = (
  gaugeType: RadialBargraphGaugeConfig['style']['gaugeType'],
  range: number
): GaugeGeometry => {
  const freeAreaAngle = (60 * PI) / 180
  let rotationOffset = HALF_PI + freeAreaAngle * 0.5
  let angleRange = TWO_PI - freeAreaAngle
  let bargraphOffset = -TWO_PI / 6

  if (gaugeType === 'type1') {
    rotationOffset = PI
    angleRange = HALF_PI
    bargraphOffset = 0
  } else if (gaugeType === 'type2') {
    rotationOffset = PI
    angleRange = PI
    bargraphOffset = 0
  } else if (gaugeType === 'type3') {
    rotationOffset = HALF_PI
    angleRange = PI * 1.5
    bargraphOffset = -HALF_PI
  }

  return {
    rotationOffset,
    bargraphOffset,
    angleRange,
    degAngleRange: angleRange * DEG_FACTOR,
    angleStep: angleRange / Math.max(range, 1e-9)
  }
}

const createGradientSampler = (
  stops: RadialBargraphValueGradientStop[]
): ((fraction: number) => string) | undefined => {
  if (stops.length === 0) {
    return undefined
  }

  const orderedStops = [...stops].sort((left, right) => left.fraction - right.fraction)
  if (typeof document === 'undefined') {
    return (fraction: number): string => {
      const clampedFraction = clamp(fraction, 0, 1)
      const match =
        [...orderedStops].reverse().find((stop) => clampedFraction >= stop.fraction)?.color ??
        orderedStops.at(0)?.color ??
        '#000000'
      return match
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 1
  const context = canvas.getContext('2d')
  if (!context) {
    return undefined
  }

  const gradient = context.createLinearGradient(0, 0, 256, 0)
  for (const stop of orderedStops) {
    gradient.addColorStop(stop.fraction, stop.color)
  }
  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 1)

  return (fraction: number): string => {
    const clampedFraction = clamp(fraction, 0, 1)
    const x = Math.round(clampedFraction * 255)
    const pixel = context.getImageData(x, 0, 1, 1).data
    return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
  }
}

const drawFrameBackground = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  size: number,
  centerX: number,
  centerY: number,
  radius: number,
  paint: ThemePaint
): void => {
  if (config.visibility.showFrame) {
    drawGaugeRadialFrameByDesign(context, config.style.frameDesign, centerX, centerY, radius)
  }

  if (!config.visibility.showBackground) {
    return
  }

  drawRadialBackground(
    context,
    config.style.backgroundColor,
    size,
    centerX,
    centerY,
    radius,
    paint,
    getGaugeBackgroundTextColor(config.style.backgroundColor)
  )
}

const drawTrackAndInactiveLeds = (
  context: RadialBargraphDrawContext,
  size: number,
  geometry: GaugeGeometry,
  centerX: number,
  centerY: number
): void => {
  const radius = 0.35514 * size
  const frameLineWidth = 0.085 * size
  const mainLineWidth = 0.075 * size

  context.save()
  context.translate(centerX, centerY)
  context.rotate(geometry.rotationOffset - 4 * RAD_FACTOR)
  context.translate(-centerX, -centerY)

  const frameGradient = createLinearGradientSafe(
    context,
    0,
    0.107476 * size,
    0,
    0.897195 * size,
    '#666666'
  )
  if (typeof frameGradient !== 'string') {
    frameGradient.addColorStop(0, '#000000')
    frameGradient.addColorStop(0.22, '#333333')
    frameGradient.addColorStop(0.76, '#333333')
    frameGradient.addColorStop(1, '#cccccc')
  }

  context.beginPath()
  context.lineWidth = frameLineWidth
  context.strokeStyle = frameGradient
  context.arc(centerX, centerY, radius, 0, geometry.angleRange + 8 * RAD_FACTOR)
  context.stroke()

  const mainGradient = createLinearGradientSafe(
    context,
    0,
    0.112149 * size,
    0,
    0.892523 * size,
    '#333333'
  )
  if (typeof mainGradient !== 'string') {
    mainGradient.addColorStop(0, '#111111')
    mainGradient.addColorStop(1, '#333333')
  }

  context.beginPath()
  context.lineWidth = mainLineWidth
  context.strokeStyle = mainGradient
  context.arc(centerX, centerY, radius, 0, geometry.angleRange + 8 * RAD_FACTOR)
  context.stroke()
  context.restore()

  const ledX = 0.116822 * size
  const ledY = 0.485981 * size
  const ledW = 0.060747 * size
  const ledH = 0.023364 * size
  const ledCenterX = (ledX + ledW) * 0.5
  const ledCenterY = (ledY + ledH) * 0.5

  for (let angle = 0; angle <= geometry.degAngleRange + 0.001; angle += 5) {
    context.save()
    context.translate(centerX, centerY)
    context.rotate(angle * RAD_FACTOR + geometry.bargraphOffset)
    context.translate(-centerX, -centerY)
    const ledGradient = createRadialGradientSafe(
      context,
      ledCenterX,
      ledCenterY,
      0,
      ledCenterX,
      ledCenterY,
      0.030373 * size,
      '#323232'
    )
    if (typeof ledGradient !== 'string') {
      ledGradient.addColorStop(0, '#3c3c3c')
      ledGradient.addColorStop(1, '#323232')
    }
    context.beginPath()
    context.fillStyle = ledGradient
    context.fillRect(ledX, ledY, ledW, ledH)
    context.restore()
  }
}

const drawTickMarks = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  geometry: GaugeGeometry,
  scale: { minValue: number; maxValue: number; majorTickSpacing: number; minorTickSpacing: number },
  size: number,
  centerX: number,
  centerY: number
): void => {
  const maxMinorTicks = config.scale.maxNoOfMinorTicks
  const textColor = getGaugeBackgroundTextColor(config.style.backgroundColor)
  const fontSize = Math.ceil(0.04 * size)
  const textTranslateX = 0.28 * size
  const maxValueRounded = Number.parseFloat(scale.maxValue.toFixed(2))
  const rotationStep = geometry.angleStep * scale.minorTickSpacing
  let alpha = geometry.rotationOffset
  let majorTickCounter = maxMinorTicks - 1
  let valueCounter = scale.minValue
  let textWidth = 0.1 * size

  if (config.style.gaugeType === 'type1' || config.style.gaugeType === 'type2') {
    textWidth = 0.0375 * size
  }

  context.save()
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = `${fontSize}px ${STD_FONT_NAME}`
  context.strokeStyle = textColor
  context.fillStyle = textColor
  context.translate(centerX, centerY)
  context.rotate(geometry.rotationOffset)

  for (
    let i = scale.minValue;
    Number.parseFloat(i.toFixed(2)) <= maxValueRounded;
    i += scale.minorTickSpacing
  ) {
    majorTickCounter += 1
    if (majorTickCounter === maxMinorTicks) {
      let textRotationAngle = HALF_PI
      if (config.style.tickLabelOrientation === 'horizontal') {
        textRotationAngle = -alpha
      } else if (config.style.tickLabelOrientation === 'tangent') {
        textRotationAngle = alpha <= HALF_PI + PI ? PI : 0
      }

      let text = valueCounter.toFixed(0)
      if (config.style.labelNumberFormat === 'fractional') {
        text = valueCounter.toFixed(config.scale.fractionalScaleDecimals)
      } else if (config.style.labelNumberFormat === 'scientific') {
        text = valueCounter.toPrecision(2)
      }

      drawRadialTextLabel(context, textTranslateX, textRotationAngle, text, textWidth)

      valueCounter += scale.majorTickSpacing
      majorTickCounter = 0
    }

    context.rotate(rotationStep)
    alpha += rotationStep
  }

  context.restore()
}

const drawTitleAndUnit = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  size: number,
  centerX: number
): void => {
  const textColor = getGaugeBackgroundTextColor(config.style.backgroundColor)
  configureGaugeTextLayout(context, {
    color: textColor,
    align: 'center',
    baseline: 'middle'
  })

  if (config.text.title) {
    configureGaugeTextLayout(context, {
      font: buildGaugeFont(Math.max(12, Math.round(size * 0.046)), STD_FONT_NAME)
    })
    drawGaugeText(context, config.text.title, centerX, size * 0.3)
  }

  if (config.text.unit) {
    configureGaugeTextLayout(context, {
      font: buildGaugeFont(Math.max(10, Math.round(size * 0.035)), STD_FONT_NAME)
    })
    drawGaugeText(context, config.text.unit, centerX, size * 0.38)
  }
}

const drawThresholdIndicator = (
  context: RadialBargraphDrawContext,
  threshold: RadialBargraphGaugeConfig['indicators']['threshold'],
  geometry: GaugeGeometry,
  scale: { minValue: number; maxValue: number; range: number },
  size: number,
  centerX: number,
  centerY: number
): void => {
  if (!threshold?.show) {
    return
  }

  const thresholdValue = clamp(threshold.value, scale.minValue, scale.maxValue)
  const thresholdAngleDeg =
    ((thresholdValue - scale.minValue) / Math.max(scale.range, 1e-9)) * geometry.degAngleRange
  const thresholdAngleRadians = thresholdAngleDeg * RAD_FACTOR + geometry.bargraphOffset

  drawGaugeRadialThreshold(context, {
    centerX,
    centerY,
    angleRadians: thresholdAngleRadians,
    innerRadius: 0.355 * size,
    outerRadius: 0.425 * size,
    color: '#ff3b30',
    lineWidth: Math.max(1.5, size * 0.006),
    direction: 'inward'
  })
}

const drawForeground = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  if (!config.visibility.showForeground) {
    return
  }

  drawGaugeRadialForegroundByType(context, config.style.foregroundType, centerX, centerY, radius)
}

const drawActiveLeds = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  value: number,
  size: number,
  geometry: GaugeGeometry,
  scale: { minValue: number; maxValue: number; range: number },
  sectionAngles: GaugeSectionArc[],
  gradientSampler: ((fraction: number) => string) | undefined
): void => {
  const activeLedAngle =
    ((value - scale.minValue) / Math.max(scale.range, 1e-9)) * geometry.degAngleRange
  const center = size * 0.5
  const ledX = 0.116822 * size
  const ledY = 0.485981 * size
  const ledW = 0.060747 * size
  const ledH = 0.023364 * size
  const activeLedBuffer =
    typeof document !== 'undefined' ? document.createElement('canvas') : undefined
  if (activeLedBuffer) {
    activeLedBuffer.width = Math.ceil(ledW)
    activeLedBuffer.height = Math.ceil(ledH)
  }
  const activeLedContext = activeLedBuffer?.getContext('2d')
  let activeColor = resolvePointerColorFromName(config.style.valueColor)
  let activeColorKey = `${activeColor.light}|${activeColor.medium}|${activeColor.dark}`

  const drawActiveLedRect = (color: PointerColor): void => {
    if (!activeLedContext || !activeLedBuffer) {
      return
    }
    activeLedContext.clearRect(0, 0, activeLedBuffer.width, activeLedBuffer.height)
    const ledGradient = createRadialGradientSafe(
      activeLedContext,
      activeLedBuffer.width * 0.5,
      activeLedBuffer.height * 0.5,
      0,
      activeLedBuffer.width * 0.5,
      activeLedBuffer.height * 0.5,
      activeLedBuffer.width * 0.5,
      color.light
    )
    if (typeof ledGradient !== 'string') {
      ledGradient.addColorStop(0, color.light)
      ledGradient.addColorStop(1, color.dark)
    }
    activeLedContext.fillStyle = ledGradient
    activeLedContext.fillRect(0, 0, activeLedBuffer.width, activeLedBuffer.height)
  }

  drawActiveLedRect(activeColor)

  for (let angle = 0; angle <= activeLedAngle + 0.001; angle += 5) {
    let currentColor = resolvePointerColorFromName(config.style.valueColor)

    if (config.style.useValueGradient && gradientSampler) {
      const fraction = angle / Math.max(geometry.degAngleRange, 1e-9)
      const color = gradientSampler(fraction)
      currentColor = derivePointerColor(color)
    } else if (config.style.useSectionColors && sectionAngles.length > 0) {
      const match = sectionAngles.find(
        (section) => angle >= section.startDeg && angle < section.stopDeg
      )
      if (match) {
        currentColor = derivePointerColor(match.color)
      }
    }

    const key = `${currentColor.light}|${currentColor.medium}|${currentColor.dark}`
    context.save()
    context.translate(center, center)
    context.rotate(angle * RAD_FACTOR + geometry.bargraphOffset)
    context.translate(-center, -center)
    if (key !== activeColorKey) {
      activeColorKey = key
      activeColor = currentColor
      drawActiveLedRect(activeColor)
    }
    if (activeLedBuffer) {
      context.drawImage(activeLedBuffer, ledX, ledY)
    }
    context.restore()
  }
}

export const renderRadialBargraphGauge = (
  context: RadialBargraphDrawContext,
  config: RadialBargraphGaugeConfig,
  options: RadialBargraphRenderOptions = {}
): RadialBargraphRenderResult => {
  const paint = mergePaint(options.paint)
  const trendPalette = resolveRadialTrendPalette(paint)
  const resolvedScale = resolveScale(config)
  const clampedValue = clamp(
    options.value ?? config.value.current,
    resolvedScale.minValue,
    resolvedScale.maxValue
  )
  const geometry = resolveGeometry(config.style.gaugeType, resolvedScale.range)
  const sectionAngles = resolveGaugeValueSectionArcs(
    config.sections,
    resolvedScale.minValue,
    resolvedScale.maxValue,
    geometry.degAngleRange
  )
  const gradientSampler = createGradientSampler(config.valueGradientStops)
  const activeAlerts = resolveGaugeValueAlerts(clampedValue, config.indicators.alerts)
  const threshold = config.indicators.threshold
  const thresholdBreached =
    threshold !== undefined && threshold.show && clampedValue >= threshold.value
  const tone = resolveGaugeToneFromAlerts(activeAlerts, thresholdBreached)

  const size = Math.min(config.size.width, config.size.height)
  const centerX = size * 0.5
  const centerY = size * 0.5
  const radius = size * 0.48

  context.clearRect(0, 0, config.size.width, config.size.height)

  drawFrameBackground(context, config, size, centerX, centerY, radius, paint)
  drawTrackAndInactiveLeds(context, size, geometry, centerX, centerY)
  drawTickMarks(context, config, geometry, resolvedScale, size, centerX, centerY)
  drawTitleAndUnit(context, config, size, centerX)
  drawActiveLeds(
    context,
    config,
    clampedValue,
    size,
    geometry,
    resolvedScale,
    sectionAngles,
    gradientSampler
  )
  drawThresholdIndicator(
    context,
    config.indicators.threshold,
    geometry,
    resolvedScale,
    size,
    centerX,
    centerY
  )
  if (config.visibility.showLcd) {
    drawRadialLcd(
      context,
      config.style.lcdColor,
      config.style.digitalFont,
      config.lcdDecimals,
      clampedValue,
      size,
      paint
    )
  }

  const ledSize = Math.ceil(size * 0.093457)
  const ledRadius = ledSize * 0.5
  drawRadialSimpleLed(
    context,
    0.53 * size + ledRadius,
    0.61 * size + ledRadius,
    ledSize,
    '#ff2a2a',
    config.indicators.ledVisible
  )

  const userLedX = config.style.gaugeType === 'type3' ? 0.7 * size : size * 0.5
  const userLedY = config.style.gaugeType === 'type3' ? 0.61 * size : 0.75 * size
  drawRadialSimpleLed(
    context,
    userLedX + ledRadius,
    userLedY + ledRadius,
    ledSize,
    '#00c74a',
    config.indicators.userLedVisible
  )

  drawRadialTrendIndicator(
    context,
    config.indicators.trendVisible,
    config.indicators.trendState,
    size,
    0.38 * size,
    0.57 * size,
    trendPalette
  )
  drawForeground(context, config, centerX, centerY, radius)

  return {
    value: clampedValue,
    tone,
    activeAlerts
  }
}

export const animateRadialBargraphGauge = (
  options: RadialBargraphAnimationOptions
): AnimationRunHandle => {
  const scheduler = createAnimationScheduler()

  const renderWithValue = (value: number): RadialBargraphRenderResult => {
    return renderRadialBargraphGauge(
      options.context,
      options.config,
      options.paint ? { value, paint: options.paint } : { value }
    )
  }

  return scheduler.run({
    from: options.from,
    to: options.to,
    durationMs: options.config.animation.enabled ? options.config.animation.durationMs : 0,
    easing: options.config.animation.easing,
    onUpdate: (sample) => {
      const result = renderWithValue(sample.value)
      options.onFrame?.(result)
    },
    onComplete: () => {
      const result = renderWithValue(options.to)
      options.onComplete?.(result)
    }
  })
}
