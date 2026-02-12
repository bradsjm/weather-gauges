import { createAnimationScheduler, type AnimationRunHandle } from '../animation/scheduler.js'
import { clamp } from '../math/range.js'
import {
  drawGaugeRadialBackgroundByStyle,
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
import {
  drawRadialLcdBox,
  drawRadialLcdValueText,
  resolveRadialLcdPalette
} from '../render/radial-lcd.js'
import { drawRadialSimpleLed } from '../render/radial-led.js'
import { drawRadialTrendIndicator } from '../render/radial-trend.js'
import { resolveGaugeToneFromAlerts, resolveGaugeValueAlerts } from '../render/gauge-alerts.js'
import { resolveThemePaint, type ThemePaint } from '../theme/tokens.js'
import type { RadialAlert, RadialGaugeConfig } from './schema.js'

export type RadialDrawContext = CanvasRenderingContext2D

export type RadialRenderResult = {
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

const PI = Math.PI
const TWO_PI = PI * 2
const DEG_FACTOR = 180 / PI
const HALF_PI = PI * 0.5
const DEFAULT_START_ANGLE = (-3 * PI) / 4
const DEFAULT_END_ANGLE = (3 * PI) / 4
const DEFAULT_ANGLE_EPSILON = 1e-6
const STD_FONT_NAME = 'Arial,Verdana,sans-serif'

const mergePaint = (paint?: Partial<ThemePaint>): ThemePaint => {
  return {
    ...resolveThemePaint(),
    ...paint
  }
}

const resolveGeometry = (config: RadialGaugeConfig): RadialGeometry => {
  const hasCustomScale =
    Math.abs(config.scale.startAngle - DEFAULT_START_ANGLE) > DEFAULT_ANGLE_EPSILON ||
    Math.abs(config.scale.endAngle - DEFAULT_END_ANGLE) > DEFAULT_ANGLE_EPSILON

  let startAngle = config.scale.startAngle
  let endAngle = config.scale.endAngle

  if (!hasCustomScale) {
    switch (config.style.gaugeType) {
      case 'type1':
        startAngle = PI
        endAngle = PI + HALF_PI
        break
      case 'type2':
        startAngle = PI
        endAngle = TWO_PI
        break
      case 'type3':
        startAngle = HALF_PI
        endAngle = TWO_PI
        break
      case 'type4':
      default: {
        const freeAreaAngle = (60 * PI) / 180
        startAngle = HALF_PI + freeAreaAngle * 0.5
        endAngle = startAngle + (TWO_PI - freeAreaAngle)
        break
      }
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

  drawGaugeRadialBackgroundByStyle(
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
  size: number,
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
    innerRadius: 0.355 * size,
    outerRadius: 0.425 * size,
    filled: true,
    fillAlpha: 0.2,
    lineWidth: Math.max(1, size * 0.0045),
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
  const majorTickInnerRadius = 0.32 * size
  const majorTickOuterRadius = 0.39 * size
  const minorTickInnerRadius = 0.34 * size
  const minorTickOuterRadius = 0.385 * size
  const labelRadius = 0.27 * size

  context.save()
  context.strokeStyle = textColor
  context.fillStyle = textColor
  context.lineCap = 'round'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = buildGaugeFont(Math.max(11, Math.round(size * 0.045)), STD_FONT_NAME)

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
    context.fillText(label, centerX + majorCos * labelRadius, centerY + majorSin * labelRadius)

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
      font: buildGaugeFont(Math.max(12, Math.round(size * 0.048)), STD_FONT_NAME)
    })
    drawGaugeText(context, config.text.title, centerX, size * 0.57)
  }

  if (config.text.unit) {
    configureGaugeTextLayout(context, {
      font: buildGaugeFont(Math.max(10, Math.round(size * 0.036)), STD_FONT_NAME)
    })
    drawGaugeText(context, config.text.unit, centerX, size * 0.79)
  }
}

const drawLcd = (
  context: RadialDrawContext,
  value: number,
  size: number,
  paint: ThemePaint
): void => {
  const lcdPalette = resolveRadialLcdPalette('STANDARD')
  const lcdWidth = size * 0.21
  const lcdHeight = size * 0.07
  const lcdX = (size - lcdWidth) * 0.5
  const lcdY = size * 0.62

  drawRadialLcdBox(context, lcdX, lcdY, lcdWidth, lcdHeight, lcdPalette)
  drawRadialLcdValueText({
    context,
    text: value.toFixed(2),
    x: lcdX,
    y: lcdY,
    width: lcdWidth,
    height: lcdHeight,
    fontSize: Math.max(7, Math.round(size * 0.055)),
    fontFamily: paint.fontFamilyLcd,
    textColor: lcdPalette.text,
    align: 'right',
    baseline: 'middle',
    shadow: {
      color: 'rgba(0, 0, 0, 0.25)',
      blur: Math.max(1, size * 0.004),
      offsetX: 0,
      offsetY: Math.max(1, size * 0.003)
    }
  })
}

const drawPointer = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  angle: number,
  size: number,
  centerX: number,
  centerY: number
): void => {
  context.save()
  context.translate(centerX, centerY)
  context.rotate(angle + HALF_PI)
  context.translate(-centerX, -centerY)
  drawGaugePointer({
    context,
    pointerType: config.style.pointerType,
    pointerColor: resolveGaugePointerColor(config.style.pointerColor),
    imageWidth: size,
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
  size: number,
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
    innerRadius: 0.34 * size,
    outerRadius: 0.425 * size,
    color: '#ff3b30',
    lineWidth: Math.max(1.5, size * 0.006),
    direction: 'inward'
  })
}

const drawMeasuredIndicators = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  geometry: RadialGeometry,
  minValue: number,
  maxValue: number,
  size: number,
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
      innerRadius: 0.35 * size,
      outerRadius: 0.405 * size,
      color: '#1f7de0',
      lineWidth: Math.max(1.25, size * 0.005),
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
      innerRadius: 0.35 * size,
      outerRadius: 0.405 * size,
      color: '#f97316',
      lineWidth: Math.max(1.25, size * 0.005),
      direction: 'inward'
    })
  }
}

const drawForeground = (
  context: RadialDrawContext,
  config: RadialGaugeConfig,
  centerX: number,
  centerY: number,
  radius: number,
  size: number
): void => {
  if (config.visibility.showForeground) {
    drawGaugeRadialForegroundByType(context, config.style.foregroundType, centerX, centerY, radius)
  }

  if (!['type15', 'type16'].includes(config.style.pointerType)) {
    drawGaugeCenterKnob(context, size, 'standardKnob', 'silver')
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
  const centerY = size * 0.5
  const radius = size * 0.48

  context.clearRect(0, 0, config.size.width, config.size.height)

  drawFrameBackground(context, config, size, centerX, centerY, radius, paint)
  drawSegments(context, config, geometry, minValue, maxValue, size, centerX, centerY)
  drawTicks(context, config, geometry, minValue, maxValue, size, centerX, centerY)
  drawTitleAndUnit(context, config, size, centerX)
  drawThreshold(context, config, geometry, minValue, maxValue, size, centerX, centerY)
  drawMeasuredIndicators(context, config, geometry, minValue, maxValue, size, centerX, centerY)

  drawPointer(
    context,
    config,
    resolveValueAngle(clampedValue, geometry, minValue, maxValue),
    size,
    centerX,
    centerY
  )

  if (config.visibility.showLcd) {
    drawLcd(context, clampedValue, size, paint)
  }

  const ledSize = Math.ceil(size * 0.093457)
  drawRadialSimpleLed(
    context,
    0.6 * size,
    0.38 * size,
    ledSize,
    '#ff2a2a',
    config.indicators.ledVisible
  )

  drawRadialSimpleLed(
    context,
    0.4 * size,
    0.38 * size,
    ledSize,
    '#00c74a',
    config.indicators.userLedVisible
  )

  context.save()
  context.translate(-0.12 * size, -0.12 * size)
  drawRadialTrendIndicator(
    context,
    config.indicators.trendVisible,
    config.indicators.trendState,
    size
  )
  context.restore()

  drawForeground(context, config, centerX, centerY, radius, size)

  return {
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
