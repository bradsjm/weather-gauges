import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { clamp } from '../math/range.js'
import {
  drawRadialBackground,
  drawGaugeRadialForegroundByType,
  drawGaugeRadialFrameByDesign
} from '../render/gauge-materials.js'
import { getGaugeBackgroundTextColor } from '../render/gauge-color-palettes.js'
import {
  buildGaugeFont,
  configureGaugeTextLayout,
  drawGaugeText
} from '../render/gauge-text-primitives.js'
import {
  drawGaugePointer,
  gaugePointerFamily,
  resolveGaugePointerColor
} from '../render/gauge-pointer.js'
import { drawGaugeCenterKnob } from '../render/gauge-knob.js'
import { drawGaugeSectionArcs, resolveGaugeValueSectionArcs } from '../render/gauge-sections.js'
import { drawGaugeRadialThreshold } from '../render/gauge-threshold.js'
import { drawRadialLcd } from '../render/radial-lcd.js'
import { drawRadialSimpleLed } from '../render/radial-led.js'
import { drawRadialTrendIndicator } from '../render/radial-trend.js'
import { resolveRadialTrendPalette } from '../render/trend-palette.js'
import { resolveGaugeToneFromAlerts, resolveGaugeValueAlerts } from '../render/gauge-alerts.js'
import {
  createStaticLayerCache,
  resizeStaticLayerCache,
  type StaticLayerCache
} from '../render/static-layer-cache.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type {
  RadialAlert,
  RadialGaugeConfig,
  RadialGaugeType,
  RadialOrientation
} from './schema.js'

export type RadialDrawContext = CanvasRenderingContext2D

export type RadialRenderResult = {
  reading: number
  value: number
  tone: 'accent' | 'warning' | 'danger'
  activeAlerts: RadialAlert[]
}

export type RadialRenderOptions = {
  value?: number
  paint?: Partial<ThemePaint>
}

export type RadialAnimationOptions = {
  context: RadialDrawContext
  config: RadialGaugeConfig
  from: number
  to: number
  paint?: Partial<ThemePaint>
  onFrame?: (result: RadialRenderResult) => void
  onComplete?: (result: RadialRenderResult) => void
}

type RadialGeometry = {
  startAngle: number
  endAngle: number
  angleRange: number
  degAngleRange: number
}

type RadialLayout = {
  frameCenterY: number
  gaugeCenterY: number
  radius: number
  areaInnerRadius: number
  areaOuterRadius: number
  segmentInnerRadius: number
  segmentOuterRadius: number
  majorTickInnerRadius: number
  majorTickOuterRadius: number
  minorTickInnerRadius: number
  minorTickOuterRadius: number
  labelRadius: number
  titleY: number
  unitY: number
  lcdY: number
  thresholdInnerRadius: number
  thresholdOuterRadius: number
  thresholdLineWidth: number
  measuredInnerRadius: number
  measuredOuterRadius: number
  measuredLineWidth: number
  ledX: number
  userLedX: number
  ledY: number
  userLedY: number
  trendX: number
  trendY: number
  knobCenterY: number
  pointerImageSize: number
  pointerShadow: boolean
}

const PI = Math.PI
const TWO_PI = PI * 2
const DEG_FACTOR = 180 / PI
const HALF_PI = PI * 0.5
const DEFAULT_START_ANGLE = (-3 * PI) / 4
const DEFAULT_END_ANGLE = (3 * PI) / 4
const DEFAULT_ANGLE_EPSILON = 1e-6
const STD_FONT_NAME = 'Arial,Verdana,sans-serif'
const V2_LED_SIZE_FACTOR = 0.093457 * 0.75
const TITLE_Y_NUDGE_PX = 3
const TREND_Y_NUDGE_PX = 4
const TYPE5_START_ANGLE = 1.25 * PI
const ORIENTATION_ROTATION: Record<RadialOrientation, number> = {
  north: 0,
  east: HALF_PI,
  west: -HALF_PI
}

const mergePaint = (paint?: Partial<ThemePaint>): ThemePaint => {
  return {
    ...resolveThemePaint(),
    ...paint
  }
}

const resolveLayout = (size: number, gaugeType: RadialGaugeType): RadialLayout => {
  if (gaugeType === 'quarter-offset') {
    return {
      frameCenterY: size * 0.5,
      gaugeCenterY: size * 0.733644,
      radius: size * 0.48,
      areaInnerRadius: 0,
      areaOuterRadius: size * 0.33,
      segmentInnerRadius: size * 0.34,
      segmentOuterRadius: size * 0.385,
      majorTickInnerRadius: size * 0.41,
      majorTickOuterRadius: size * 0.44,
      minorTickInnerRadius: size * 0.42,
      minorTickOuterRadius: size * 0.44,
      labelRadius: size * 0.48,
      titleY: size * 0.4,
      unitY: size * 0.46,
      lcdY: size * 0.57,
      thresholdInnerRadius: size * 0.39,
      thresholdOuterRadius: size * 0.445,
      thresholdLineWidth: Math.max(1.5, size * 0.007),
      measuredInnerRadius: size * 0.395,
      measuredOuterRadius: size * 0.44,
      measuredLineWidth: Math.max(1.25, size * 0.006),
      ledX: size * 0.455,
      userLedX: size * 0.545,
      ledY: size * 0.51,
      userLedY: size * 0.51,
      trendX: size * 0.3,
      trendY: size * 0.73364,
      knobCenterY: size * 0.733644,
      pointerImageSize: size,
      pointerShadow: true
    }
  }

  const ledY = size * 0.4
  const userLedX = size * 0.4
  const userLedY = ledY

  return {
    frameCenterY: size * 0.5,
    gaugeCenterY: size * 0.5,
    radius: size * 0.48,
    areaInnerRadius: 0,
    areaOuterRadius: size * 0.33,
    segmentInnerRadius: size * 0.34,
    segmentOuterRadius: size * 0.385,
    majorTickInnerRadius: size * 0.32,
    majorTickOuterRadius: size * 0.39,
    minorTickInnerRadius: size * 0.34,
    minorTickOuterRadius: size * 0.385,
    labelRadius: size * 0.27,
    titleY: size * 0.3 + TITLE_Y_NUDGE_PX,
    unitY: size * 0.38,
    lcdY: size * 0.57,
    thresholdInnerRadius: size * 0.34,
    thresholdOuterRadius: size * 0.425,
    thresholdLineWidth: Math.max(1.5, size * 0.006),
    measuredInnerRadius: size * 0.35,
    measuredOuterRadius: size * 0.405,
    measuredLineWidth: Math.max(1.25, size * 0.005),
    ledX: size * 0.6,
    userLedX,
    ledY,
    userLedY,
    trendX: size * 0.3,
    trendY: size * 0.45 - TREND_Y_NUDGE_PX,
    knobCenterY: size * 0.5,
    pointerImageSize: size,
    pointerShadow: false
  }
}

const withOrientationTransform = (
  context: RadialDrawContext,
  orientation: RadialOrientation,
  size: number,
  render: () => void
): void => {
  const rotation = ORIENTATION_ROTATION[orientation]
  if (!rotation) {
    render()
    return
  }

  context.save()
  context.translate(size * 0.5, size * 0.5)
  context.rotate(rotation)
  context.translate(-size * 0.5, -size * 0.5)
  render()
  context.restore()
}

const resolveGeometry = (config: RadialGaugeConfig): RadialGeometry => {
  const hasCustomScale =
    Math.abs(config.scale.startAngle - DEFAULT_START_ANGLE) > DEFAULT_ANGLE_EPSILON ||
    Math.abs(config.scale.endAngle - DEFAULT_END_ANGLE) > DEFAULT_ANGLE_EPSILON

  let startAngle = config.scale.startAngle
  let endAngle = config.scale.endAngle

  if (!hasCustomScale) {
    switch (config.style.gaugeType) {
      case 'quarter':
        startAngle = PI
        endAngle = PI + HALF_PI
        break
      case 'half':
        startAngle = PI
        endAngle = TWO_PI
        break
      case 'three-quarter':
        startAngle = HALF_PI
        endAngle = TWO_PI
        break
      case 'full-gap':
      default: {
        const freeAreaAngle = (60 * PI) / 180
        startAngle = HALF_PI + freeAreaAngle * 0.5
        endAngle = startAngle + (TWO_PI - freeAreaAngle)
        break
      }
      case 'quarter-offset':
        startAngle = TYPE5_START_ANGLE
        endAngle = startAngle + HALF_PI
        break
    }
  }

  const angleRange = Math.max(1e-9, endAngle - startAngle)
  return {
    startAngle,
    endAngle: startAngle + angleRange,
    angleRange,
    degAngleRange: angleRange * DEG_FACTOR
  }
}

const resolveValueFraction = (value: number, minValue: number, range: number): number => {
  return clamp((value - minValue) / Math.max(range, 1e-9), 0, 1)
}

const resolveValueAngle = (
  value: number,
  geometry: RadialGeometry,
  minValue: number,
  maxValue: number
): number => {
  const fraction = resolveValueFraction(value, minValue, maxValue - minValue)
  return geometry.startAngle + fraction * geometry.angleRange
}

const drawFrameBackground = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
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

const drawSegments = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  geometry: RadialGeometry,
  minValue: number,
  maxValue: number,
  layout: RadialLayout,
  centerX: number,
  centerY: number
): void => {
  if (config.segments.length === 0) {
    return
  }

  const arcs = resolveGaugeValueSectionArcs(
    config.segments,
    minValue,
    maxValue,
    geometry.degAngleRange
  )

  drawGaugeSectionArcs(context, arcs, {
    centerX,
    centerY,
    innerRadius: layout.segmentInnerRadius,
    outerRadius: layout.segmentOuterRadius,
    filled: true,
    fillAlpha: 1,
    lineWidth: Math.max(1, layout.radius * 0.01),
    angleOffsetDeg: geometry.startAngle * DEG_FACTOR
  })
}

const drawAreas = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  geometry: RadialGeometry,
  minValue: number,
  maxValue: number,
  layout: RadialLayout,
  centerX: number,
  centerY: number
): void => {
  if (config.areas.length === 0) {
    return
  }

  const arcs = resolveGaugeValueSectionArcs(
    config.areas,
    minValue,
    maxValue,
    geometry.degAngleRange
  )

  drawGaugeSectionArcs(context, arcs, {
    centerX,
    centerY,
    innerRadius: layout.areaInnerRadius,
    outerRadius: layout.areaOuterRadius,
    filled: true,
    fillAlpha: 1,
    lineWidth: 0,
    angleOffsetDeg: geometry.startAngle * DEG_FACTOR
  })
}

const formatTickValue = (value: number, majorStep: number): string => {
  if (Math.abs(majorStep) < 1) {
    return value.toFixed(1)
  }
  return value.toFixed(0)
}

const drawTicks = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  geometry: RadialGeometry,
  minValue: number,
  maxValue: number,
  size: number,
  layout: RadialLayout,
  centerX: number,
  centerY: number
): void => {
  const textColor = getGaugeBackgroundTextColor(config.style.backgroundColor)
  const range = Math.max(maxValue - minValue, 1e-9)
  const majorCount = Math.max(2, config.scale.majorTickCount)
  const majorStep = range / (majorCount - 1)
  const majorAngleStep = geometry.angleRange / (majorCount - 1)
  const minorPerMajor = Math.max(0, config.scale.minorTicksPerMajor)
  const minorAngleStep = majorAngleStep / Math.max(1, minorPerMajor + 1)
  const majorTickInnerRadius = layout.majorTickInnerRadius
  const majorTickOuterRadius = layout.majorTickOuterRadius
  const minorTickInnerRadius = layout.minorTickInnerRadius
  const minorTickOuterRadius = layout.minorTickOuterRadius
  const labelRadius = layout.labelRadius

  context.save()
  context.strokeStyle = textColor
  context.fillStyle = textColor
  context.lineCap = 'round'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = buildGaugeFont(Math.max(11, Math.round(size * 0.045)), STD_FONT_NAME)
  const orientation =
    config.style.gaugeType === 'quarter-offset' ? config.style.orientation : 'north'
  const labelRotation = -ORIENTATION_ROTATION[orientation]

  for (let majorIndex = 0; majorIndex < majorCount; majorIndex += 1) {
    const majorAngle = geometry.startAngle + majorIndex * majorAngleStep
    const majorCos = Math.cos(majorAngle)
    const majorSin = Math.sin(majorAngle)

    context.beginPath()
    context.lineWidth = Math.max(1.5, size * 0.007)
    context.moveTo(
      centerX + majorCos * majorTickInnerRadius,
      centerY + majorSin * majorTickInnerRadius
    )
    context.lineTo(
      centerX + majorCos * majorTickOuterRadius,
      centerY + majorSin * majorTickOuterRadius
    )
    context.stroke()

    const labelValue = minValue + majorIndex * majorStep
    const label = formatTickValue(labelValue, majorStep)
    const labelX = centerX + majorCos * labelRadius
    const labelY = centerY + majorSin * labelRadius

    if (labelRotation === 0) {
      context.fillText(label, labelX, labelY)
    } else {
      context.save()
      context.translate(labelX, labelY)
      context.rotate(labelRotation)
      context.fillText(label, 0, 0)
      context.restore()
    }

    if (majorIndex === majorCount - 1 || minorPerMajor === 0) {
      continue
    }

    for (let minorIndex = 1; minorIndex <= minorPerMajor; minorIndex += 1) {
      const minorAngle = majorAngle + minorIndex * minorAngleStep
      const minorCos = Math.cos(minorAngle)
      const minorSin = Math.sin(minorAngle)
      context.beginPath()
      context.lineWidth = Math.max(1, size * 0.004)
      context.moveTo(
        centerX + minorCos * minorTickInnerRadius,
        centerY + minorSin * minorTickInnerRadius
      )
      context.lineTo(
        centerX + minorCos * minorTickOuterRadius,
        centerY + minorSin * minorTickOuterRadius
      )
      context.stroke()
    }
  }

  context.restore()
}

const drawTitleAndUnit = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  size: number,
  centerX: number,
  layout: RadialLayout
): void => {
  const textColor = getGaugeBackgroundTextColor(config.style.backgroundColor)
  configureGaugeTextLayout(context, {
    color: textColor,
    align: 'center',
    baseline: 'middle'
  })

  if (config.text.title) {
    configureGaugeTextLayout(context, {
      font: buildGaugeFont(Math.max(12, Math.round(size * 0.046728)), STD_FONT_NAME)
    })
    drawGaugeText(context, config.text.title, centerX, layout.titleY)
  }

  if (config.text.unit) {
    configureGaugeTextLayout(context, {
      font: buildGaugeFont(Math.max(12, Math.round(size * 0.046728)), STD_FONT_NAME)
    })
    drawGaugeText(context, config.text.unit, centerX, layout.unitY)
  }
}

const drawLcd = (
  context: RadialDrawContext,
  value: number,
  size: number,
  paint: ThemePaint,
  layout: RadialLayout
): void => {
  drawRadialLcd(context, 'standard', true, 2, value, size, paint, {
    y: layout.lcdY
  })
}

const drawPointer = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  angle: number,
  size: number,
  centerX: number,
  centerY: number,
  layout: RadialLayout
): void => {
  const pointerOriginX = centerX - layout.pointerImageSize * 0.5
  const pointerOriginY = centerY - layout.pointerImageSize * 0.5

  context.save()
  context.translate(centerX, centerY)
  context.rotate(angle + HALF_PI)
  context.translate(-centerX, -centerY)

  if (layout.pointerShadow) {
    context.shadowColor = 'rgba(0, 0, 0, 0.35)'
    context.shadowOffsetX = size * 0.006
    context.shadowOffsetY = size * 0.006
    context.shadowBlur = size * 0.012
  }

  context.translate(pointerOriginX, pointerOriginY)

  drawGaugePointer({
    context,
    pointerType: config.style.pointerType,
    pointerColor: resolveGaugePointerColor(config.style.pointerColor),
    imageWidth: layout.pointerImageSize,
    family: gaugePointerFamily.compass
  })
  context.restore()
}

const drawThreshold = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  geometry: RadialGeometry,
  minValue: number,
  maxValue: number,
  layout: RadialLayout,
  centerX: number,
  centerY: number
): void => {
  if (!config.indicators.threshold?.show) {
    return
  }

  const thresholdValue = clamp(config.indicators.threshold.value, minValue, maxValue)
  drawGaugeRadialThreshold(context, {
    centerX,
    centerY,
    angleRadians: resolveValueAngle(thresholdValue, geometry, minValue, maxValue),
    innerRadius: layout.thresholdInnerRadius,
    outerRadius: layout.thresholdOuterRadius,
    color: '#ff3b30',
    lineWidth: layout.thresholdLineWidth,
    direction: 'inward'
  })
}

const drawMeasuredIndicators = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  geometry: RadialGeometry,
  minValue: number,
  maxValue: number,
  layout: RadialLayout,
  centerX: number,
  centerY: number
): void => {
  if (
    config.indicators.minMeasuredValueVisible &&
    config.indicators.minMeasuredValue !== undefined
  ) {
    const minMeasured = clamp(config.indicators.minMeasuredValue, minValue, maxValue)
    drawGaugeRadialThreshold(context, {
      centerX,
      centerY,
      angleRadians: resolveValueAngle(minMeasured, geometry, minValue, maxValue),
      innerRadius: layout.measuredInnerRadius,
      outerRadius: layout.measuredOuterRadius,
      color: '#1f7de0',
      lineWidth: layout.measuredLineWidth,
      direction: 'inward'
    })
  }

  if (
    config.indicators.maxMeasuredValueVisible &&
    config.indicators.maxMeasuredValue !== undefined
  ) {
    const maxMeasured = clamp(config.indicators.maxMeasuredValue, minValue, maxValue)
    drawGaugeRadialThreshold(context, {
      centerX,
      centerY,
      angleRadians: resolveValueAngle(maxMeasured, geometry, minValue, maxValue),
      innerRadius: layout.measuredInnerRadius,
      outerRadius: layout.measuredOuterRadius,
      color: '#f97316',
      lineWidth: layout.measuredLineWidth,
      direction: 'inward'
    })
  }
}

const drawForeground = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  centerX: number,
  size: number,
  layout: RadialLayout
): void => {
  if (config.visibility.showForeground) {
    drawGaugeRadialForegroundByType(
      context,
      config.style.foregroundType,
      centerX,
      layout.frameCenterY,
      layout.radius
    )
  }

  if (
    !['ornate-ring-base-needle', 'ring-base-bar-tail-needle'].includes(config.style.pointerType)
  ) {
    context.save()
    context.translate(0, layout.knobCenterY - size * 0.5)
    drawGaugeCenterKnob(context, size, 'standardKnob', 'silver')
    context.restore()
  }
}

const radialStaticLayerCaches = new WeakMap<RadialDrawContext, StaticLayerCache>()
const radialStaticLayerUnavailable = new WeakSet<RadialDrawContext>()

const getRadialStaticLayerCache = (
  context: RadialDrawContext,
  width: number,
  height: number
): StaticLayerCache | null => {
  if (radialStaticLayerUnavailable.has(context)) {
    return null
  }

  const existing = radialStaticLayerCaches.get(context)
  if (existing !== undefined) {
    resizeStaticLayerCache(existing, width, height)
    return existing
  }

  const created = createStaticLayerCache(width, height)
  if (created === null) {
    radialStaticLayerUnavailable.add(context)
    return null
  }

  radialStaticLayerCaches.set(context, created)
  return created
}

const resolveStaticLayerSignature = (config: RadialGaugeConfig, paint: ThemePaint): string => {
  return JSON.stringify({
    size: config.size,
    style: {
      gaugeType: config.style.gaugeType,
      orientation: config.style.orientation,
      frameDesign: config.style.frameDesign,
      backgroundColor: config.style.backgroundColor,
      foregroundType: config.style.foregroundType,
      pointerType: config.style.pointerType
    },
    visibility: {
      showFrame: config.visibility.showFrame,
      showBackground: config.visibility.showBackground,
      showForeground: config.visibility.showForeground
    },
    value: {
      min: config.value.min,
      max: config.value.max
    },
    scale: config.scale,
    text: config.text,
    segments: config.segments,
    areas: config.areas,
    indicators: {
      threshold: config.indicators.threshold,
      minMeasuredValueVisible: config.indicators.minMeasuredValueVisible,
      minMeasuredValue: config.indicators.minMeasuredValue,
      maxMeasuredValueVisible: config.indicators.maxMeasuredValueVisible,
      maxMeasuredValue: config.indicators.maxMeasuredValue
    },
    paint
  })
}

const drawStaticLayer = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  geometry: RadialGeometry,
  minValue: number,
  maxValue: number,
  size: number,
  centerX: number,
  layout: RadialLayout,
  paint: ThemePaint,
  orientation: RadialOrientation
): void => {
  context.clearRect(0, 0, config.size.width, config.size.height)

  drawFrameBackground(context, config, size, centerX, layout.frameCenterY, layout.radius, paint)

  const drawOrientedStaticContents = (): void => {
    drawSegments(
      context,
      config,
      geometry,
      minValue,
      maxValue,
      layout,
      centerX,
      layout.gaugeCenterY
    )
    drawAreas(context, config, geometry, minValue, maxValue, layout, centerX, layout.gaugeCenterY)
    drawTicks(
      context,
      config,
      geometry,
      minValue,
      maxValue,
      size,
      layout,
      centerX,
      layout.gaugeCenterY
    )
    drawThreshold(
      context,
      config,
      geometry,
      minValue,
      maxValue,
      layout,
      centerX,
      layout.gaugeCenterY
    )
    drawMeasuredIndicators(
      context,
      config,
      geometry,
      minValue,
      maxValue,
      layout,
      centerX,
      layout.gaugeCenterY
    )
    drawForeground(context, config, centerX, size, layout)
  }

  withOrientationTransform(context, orientation, size, drawOrientedStaticContents)
  drawTitleAndUnit(context, config, size, centerX, layout)
}

const drawDynamicLayer = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  geometry: RadialGeometry,
  clampedValue: number,
  minValue: number,
  maxValue: number,
  size: number,
  centerX: number,
  layout: RadialLayout,
  paint: ThemePaint,
  trendPalette: ReturnType<typeof resolveRadialTrendPalette>,
  orientation: RadialOrientation
): void => {
  const drawOrientedDynamicContents = (): void => {
    drawPointer(
      context,
      config,
      resolveValueAngle(clampedValue, geometry, minValue, maxValue),
      size,
      centerX,
      layout.gaugeCenterY,
      layout
    )

    const ledSize = Math.ceil(size * V2_LED_SIZE_FACTOR)
    drawRadialSimpleLed(
      context,
      layout.ledX,
      layout.ledY,
      ledSize,
      '#ff2a2a',
      config.indicators.ledVisible
    )

    drawRadialSimpleLed(
      context,
      layout.userLedX,
      layout.userLedY,
      ledSize,
      '#00c74a',
      config.indicators.userLedVisible
    )

    drawRadialTrendIndicator(
      context,
      config.indicators.trendVisible,
      config.indicators.trendState,
      size,
      layout.trendX,
      layout.trendY,
      trendPalette
    )
  }

  withOrientationTransform(context, orientation, size, drawOrientedDynamicContents)

  if (config.visibility.showLcd) {
    drawLcd(context, clampedValue, size, paint, layout)
  }
}

export const renderRadialGauge = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  options: RadialRenderOptions = {}
): RadialRenderResult => {
  const paint = mergePaint(options.paint)
  const minValue = config.value.min
  const maxValue = config.value.max
  const clampedValue = clamp(options.value ?? config.value.current, minValue, maxValue)
  const geometry = resolveGeometry(config)

  const activeAlerts = resolveGaugeValueAlerts(clampedValue, config.indicators.alerts)
  const thresholdBreached =
    config.indicators.threshold !== undefined &&
    config.indicators.threshold.show &&
    clampedValue >= config.indicators.threshold.value
  const tone = resolveGaugeToneFromAlerts(activeAlerts, thresholdBreached)

  const size = Math.min(config.size.width, config.size.height)
  const centerX = size * 0.5
  const layout = resolveLayout(size, config.style.gaugeType)
  const trendPalette = resolveRadialTrendPalette(paint)
  const orientation =
    config.style.gaugeType === 'quarter-offset' ? config.style.orientation : ('north' as const)
  const staticLayerSignature = resolveStaticLayerSignature(config, paint)

  context.clearRect(0, 0, config.size.width, config.size.height)

  const staticLayerCache = getRadialStaticLayerCache(context, config.size.width, config.size.height)
  if (staticLayerCache !== null) {
    if (staticLayerCache.signature !== staticLayerSignature) {
      drawStaticLayer(
        staticLayerCache.context,
        config,
        geometry,
        minValue,
        maxValue,
        size,
        centerX,
        layout,
        paint,
        orientation
      )
      staticLayerCache.signature = staticLayerSignature
    }

    context.drawImage(staticLayerCache.canvas, 0, 0)
  } else {
    drawStaticLayer(
      context,
      config,
      geometry,
      minValue,
      maxValue,
      size,
      centerX,
      layout,
      paint,
      orientation
    )
  }

  drawDynamicLayer(
    context,
    config,
    geometry,
    clampedValue,
    minValue,
    maxValue,
    size,
    centerX,
    layout,
    paint,
    trendPalette,
    orientation
  )

  return {
    reading: clampedValue,
    value: clampedValue,
    tone,
    activeAlerts
  }
}

export const animateRadialGauge = (options: RadialAnimationOptions): AnimationRunHandle => {
  const scheduler = createAnimationScheduler()

  const renderWithValue = (value: number): RadialRenderResult => {
    return renderRadialGauge(
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
