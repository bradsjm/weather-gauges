import {
  animateRadialGauge,
  radialGaugeConfigSchema,
  renderRadialGauge,
  toGaugeContractState,
  type RadialDrawContext,
  type RadialArea,
  type RadialGaugeConfig,
  type RadialSegment,
  type RadialRenderResult
} from '@bradsjm/weather-gauges-core'
import { html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { booleanAttributeConverter } from '../shared/css-utils.js'
import { WeatherGaugeElement } from '../shared/gauge-base-element.js'
import {
  isPresetTrendEnabled,
  resolveEffectivePresetUnit,
  resolvePresetRange,
  resolvePresetSections,
  resolvePresetTitle,
  type MeasurementPreset
} from '../shared/measurement-presets.js'
import { sharedStyles } from '../shared/shared-styles.js'

@customElement('wx-gauge')
export class WxGaugeElement extends WeatherGaugeElement {
  @query('canvas')
  private canvasElement?: HTMLCanvasElement

  private currentValue = 0
  static override styles = sharedStyles

  @property({ type: Number })
  value = 0

  @property({ type: Number, attribute: 'gauge-min' })
  minValue = 0

  @property({ type: Number, attribute: 'gauge-max' })
  maxValue = 100

  @property({ type: Number })
  size = 220

  @property({ type: String, attribute: 'label' })
  label = 'Radial'

  @property({ type: String })
  unit = ''

  @property({ type: Number })
  threshold = 80

  @property({ type: String, attribute: 'threshold-label' })
  thresholdLabel = ''

  @property({ type: String })
  preset: MeasurementPreset = ''

  @property({ type: Boolean, attribute: false, converter: booleanAttributeConverter })
  showThreshold = false

  @property({ type: Boolean, attribute: false, converter: booleanAttributeConverter })
  alertsEnabled = false

  @property({ type: Number, attribute: false })
  warningAlertValue = 80

  @property({ type: Number, attribute: false })
  criticalAlertValue = 95

  @property({ type: Number, attribute: false })
  majorTickCount = 9

  @property({ type: Number, attribute: false })
  minorTicksPerMajor = 4

  @property({ type: Number, attribute: false })
  startAngle = (-3 * Math.PI) / 4

  @property({ type: Number, attribute: false })
  endAngle = (3 * Math.PI) / 4

  @property({ type: String, attribute: false })
  frameDesign:
    | 'blackMetal'
    | 'metal'
    | 'shinyMetal'
    | 'brass'
    | 'steel'
    | 'chrome'
    | 'gold'
    | 'anthracite'
    | 'tiltedGray'
    | 'tiltedBlack'
    | 'glossyMetal' = 'metal'

  @property({ type: String, attribute: false })
  backgroundColor:
    | 'dark-gray'
    | 'satin-gray'
    | 'light-gray'
    | 'white'
    | 'black'
    | 'beige'
    | 'brown'
    | 'red'
    | 'green'
    | 'blue'
    | 'anthracite'
    | 'mud'
    | 'punched-sheet'
    | 'carbon'
    | 'stainless'
    | 'brushed-metal'
    | 'brushed-stainless'
    | 'turned' = 'dark-gray'

  @property({ type: String, attribute: false })
  foregroundType:
    | 'top-arc-glass'
    | 'side-reflection-glass'
    | 'dome-glass'
    | 'center-glow-glass'
    | 'sweep-glass' = 'top-arc-glass'

  @property({ type: String, attribute: false })
  gaugeType: 'quarter' | 'half' | 'three-quarter' | 'full-gap' | 'quarter-offset' = 'full-gap'

  @property({ type: String, attribute: false })
  orientation: 'north' | 'east' | 'west' = 'north'

  @property({ type: String, attribute: false })
  pointerType:
    | 'classic-compass-needle'
    | 'slim-angular-needle'
    | 'thin-bar-needle'
    | 'diamond-spear-needle'
    | 'triangular-split-needle'
    | 'forked-center-needle'
    | 'simple-triangular-needle'
    | 'curved-classic-needle'
    | 'heavy-metallic-needle'
    | 'teardrop-bulb-needle'
    | 'curved-tail-needle'
    | 'narrow-spike-needle'
    | 'label-tip-marker-needle'
    | 'metallic-marker-needle'
    | 'ornate-ring-base-needle'
    | 'ring-base-bar-tail-needle' = 'classic-compass-needle'

  @property({ type: String, attribute: false })
  pointerColor:
    | 'red'
    | 'green'
    | 'blue'
    | 'orange'
    | 'yellow'
    | 'cyan'
    | 'magenta'
    | 'white'
    | 'gray'
    | 'black'
    | 'raith'
    | 'green-lcd'
    | 'jug-green' = 'red'

  @property({ attribute: false })
  segments: RadialSegment[] = []

  @property({ attribute: false })
  areas: RadialArea[] = []

  @property({ type: Boolean, attribute: false, converter: booleanAttributeConverter })
  showFrame = true

  @property({ type: Boolean, attribute: false, converter: booleanAttributeConverter })
  showBackground = true

  @property({ type: Boolean, attribute: false, converter: booleanAttributeConverter })
  showForeground = true

  @property({ type: Boolean, attribute: false, converter: booleanAttributeConverter })
  showLcd = true

  @property({ type: Boolean, attribute: false, converter: booleanAttributeConverter })
  ledVisible = false

  @property({ type: Boolean, attribute: false, converter: booleanAttributeConverter })
  userLedVisible = false

  @property({ type: Boolean, attribute: false, converter: booleanAttributeConverter })
  trendVisible = false

  @property({ type: String, attribute: false })
  trendState: 'up' | 'steady' | 'down' = 'down'

  @property({
    type: Boolean,
    attribute: false,
    converter: booleanAttributeConverter
  })
  minMeasuredValueVisible = false

  @property({
    type: Boolean,
    attribute: false,
    converter: booleanAttributeConverter
  })
  maxMeasuredValueVisible = false

  @property({ type: Number, attribute: false })
  minMeasuredValue = 0

  @property({ type: Number, attribute: false })
  maxMeasuredValue = 100

  @property({
    type: Boolean,
    attribute: 'animated',
    converter: booleanAttributeConverter
  })
  animated = true

  @property({ type: Number })
  duration = 500

  override firstUpdated() {
    this.currentValue = this.value
    this.renderGauge(false)
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.size === 0) {
      return
    }

    const valueChanged = changedProperties.has('value')
    this.renderGauge(valueChanged && this.animated)
  }

  private getDrawContext(): RadialDrawContext | undefined {
    return this.getCanvasContext<RadialDrawContext>(this.canvasElement)
  }

  private parseSectionChildren(range: { min: number; max: number }): RadialSegment[] {
    return this.getChildElements('wx-section')
      .map((element) => {
        const fromInput = this.readNumericAttribute(element, ['start', 'from'])
        const toInput = this.readNumericAttribute(element, ['end', 'to'])
        const color = this.readStringAttribute(element, ['color'])
        if (fromInput === undefined || toInput === undefined || !color) {
          return undefined
        }

        const from = this.normalizeInRange(fromInput, range.min, range.max, range.min)
        const to = this.normalizeInRange(toInput, range.min, range.max, range.max)
        if (to <= from) {
          return undefined
        }

        return { from, to, color }
      })
      .filter((segment): segment is RadialSegment => segment !== undefined)
  }

  private parseAlertChildren(range: { min: number; max: number }) {
    return this.getChildElements('wx-alert')
      .map((element, index) => {
        const thresholdInput = this.readNumericAttribute(element, ['threshold', 'value'])
        if (thresholdInput === undefined) {
          return undefined
        }

        const value = this.normalizeInRange(thresholdInput, range.min, range.max, range.max)
        const severityRaw = this.readStringAttribute(element, ['severity'])
        const severity =
          severityRaw === 'info' || severityRaw === 'warning' || severityRaw === 'critical'
            ? severityRaw
            : 'warning'
        const message =
          this.readStringAttribute(element, ['message']) ?? `${severity} at ${value.toFixed(0)}`
        const id = this.readStringAttribute(element, ['id']) ?? `child-alert-${index}`

        return { id, value, message, severity }
      })
      .filter(
        (
          alert
        ): alert is {
          id: string
          value: number
          message: string
          severity: 'info' | 'warning' | 'critical'
        } => alert !== undefined
      )
  }

  private buildConfig(current: number): RadialGaugeConfig {
    const unit = this.unit.trim()
    const preset = this.preset
    const normalizedCurrent = this.normalizeNonNegative(current, 1000)
    const effectiveUnit = resolveEffectivePresetUnit(preset, unit, normalizedCurrent)
    const presetRange = resolvePresetRange(preset, effectiveUnit)
    const hasExplicitMin = this.hasAttribute('gauge-min') || this.minValue !== 0
    const hasExplicitMax = this.hasAttribute('gauge-max') || this.maxValue !== 100
    const minValue = hasExplicitMin ? this.minValue : (presetRange?.min ?? this.minValue)
    const maxValue = hasExplicitMax ? this.maxValue : (presetRange?.max ?? this.maxValue)
    const range = this.normalizedRange(minValue, maxValue)
    const warningAlertValue = this.normalizeInRange(
      this.warningAlertValue,
      range.min,
      range.max,
      range.max
    )
    const criticalAlertValue = this.normalizeInRange(
      this.criticalAlertValue,
      range.min,
      range.max,
      range.max
    )
    const warningValue = Math.min(warningAlertValue, criticalAlertValue)
    const criticalValue = Math.max(warningAlertValue, criticalAlertValue)
    const minMeasuredValue = this.normalizeInRange(
      this.minMeasuredValue,
      range.min,
      range.max,
      range.min
    )
    const maxMeasuredValue = this.normalizeInRange(
      this.maxMeasuredValue,
      range.min,
      range.max,
      range.max
    )
    const thresholdValue = this.normalizeInRange(this.threshold, range.min, range.max, range.max)
    const childAlerts = this.parseAlertChildren(range)
    const alerts = this.alertsEnabled
      ? [
          {
            id: 'warning',
            value: warningValue,
            message: `warning at ${warningValue}`,
            severity: 'warning' as const
          },
          {
            id: 'critical',
            value: criticalValue,
            message: `critical at ${criticalValue}`,
            severity: 'critical' as const
          }
        ]
      : childAlerts
    const childSections = this.parseSectionChildren(range)
    const presetSegments = resolvePresetSections(preset, range, effectiveUnit)
    const normalizedSegments = this.segments
      .map((segment) => {
        const from = this.normalizeInRange(segment.from, range.min, range.max, range.min)
        const to = this.normalizeInRange(segment.to, range.min, range.max, range.max)
        if (to <= from) {
          return undefined
        }

        return { ...segment, from, to }
      })
      .filter((segment): segment is RadialSegment => segment !== undefined)
    const segments =
      normalizedSegments.length > 0
        ? normalizedSegments
        : childSections.length > 0
          ? childSections
          : presetSegments
    const areas = this.areas
      .map((area) => {
        const from = this.normalizeInRange(area.from, range.min, range.max, range.min)
        const to = this.normalizeInRange(area.to, range.min, range.max, range.max)
        if (to <= from) {
          return undefined
        }

        return { ...area, from, to }
      })
      .filter((area): area is RadialArea => area !== undefined)
    const trendVisible = this.hasAttribute('trend-visible')
      ? this.trendVisible
      : isPresetTrendEnabled(preset)
    const title =
      this.hasAttribute('label') || this.label !== 'Radial'
        ? this.label
        : resolvePresetTitle(preset)

    return radialGaugeConfigSchema.parse({
      value: {
        min: range.min,
        max: range.max,
        current
      },
      size: {
        width: this.size,
        height: this.size
      },
      text: {
        ...(title ? { title } : {}),
        ...(effectiveUnit ? { unit: effectiveUnit } : {}),
        ...(this.thresholdLabel ? { thresholdLabel: this.thresholdLabel } : {})
      },
      visibility: {
        showFrame: this.showFrame,
        showBackground: this.showBackground,
        showForeground: this.showForeground,
        showLcd: this.showLcd
      },
      scale: {
        startAngle: this.startAngle,
        endAngle: this.endAngle,
        majorTickCount: this.majorTickCount,
        minorTicksPerMajor: this.minorTicksPerMajor
      },
      animation: {
        enabled: this.animated,
        durationMs: this.normalizeNonNegative(this.duration, 500)
      },
      style: {
        frameDesign: this.frameDesign,
        backgroundColor: this.backgroundColor,
        foregroundType: this.foregroundType,
        pointerType: this.pointerType,
        gaugeType: this.gaugeType,
        orientation: this.orientation,
        pointerColor: this.pointerColor
      },
      segments,
      areas,
      indicators: {
        threshold: {
          value: thresholdValue,
          show: this.showThreshold
        },
        alerts,
        ledVisible: this.ledVisible,
        userLedVisible: this.userLedVisible,
        trendVisible,
        trendState: this.trendState,
        minMeasuredValueVisible: this.minMeasuredValueVisible,
        maxMeasuredValueVisible: this.maxMeasuredValueVisible,
        minMeasuredValue,
        maxMeasuredValue
      }
    })
  }

  private emitValueChange(result: RadialRenderResult): void {
    this.emitGaugeValueChange(toGaugeContractState('radial', result))
  }

  private emitError(error: unknown): void {
    this.emitGaugeError('radial', error, 'Unknown radial rendering error')
  }

  private updateAccessibility(config: RadialGaugeConfig, value: number): void {
    if (!this.canvasElement) {
      return
    }

    const title = config.text.title ?? 'Radial Gauge'
    const unit = config.text.unit ?? ''
    const label = `${title}: ${value}${unit ? ` ${unit}` : ''}`
    this.setCanvasAccessibility(this.canvasElement, {
      label,
      valueNow: value,
      valueMin: config.value.min,
      valueMax: config.value.max
    })
  }

  private readonly onSrContentSlotChange = (): void => {
    const range = this.normalizedRange(this.minValue, this.maxValue)
    const value = this.normalizeInRange(this.currentValue, range.min, range.max, this.currentValue)
    const config = this.buildConfig(value)
    this.updateAccessibility(config, value)
  }

  private renderGauge(animateValue: boolean): void {
    const drawContext = this.getDrawContext()
    if (!drawContext || !this.canvasElement) {
      return
    }

    this.canvasElement.width = this.size
    this.canvasElement.height = this.size

    const paint = this.getThemePaint()
    const unit = this.unit.trim()
    const preset = this.preset
    const effectiveUnit = resolveEffectivePresetUnit(
      preset,
      unit,
      this.normalizeNonNegative(this.value, 1000)
    )
    const presetRange = resolvePresetRange(preset, effectiveUnit)
    const hasExplicitMin = this.hasAttribute('gauge-min') || this.minValue !== 0
    const hasExplicitMax = this.hasAttribute('gauge-max') || this.maxValue !== 100
    const minValue = hasExplicitMin ? this.minValue : (presetRange?.min ?? this.minValue)
    const maxValue = hasExplicitMax ? this.maxValue : (presetRange?.max ?? this.maxValue)
    const range = this.normalizedRange(minValue, maxValue)
    const nextValue = this.normalizeInRange(this.value, range.min, range.max, this.currentValue)
    this.animationHandle?.cancel()

    try {
      if (animateValue && this.currentValue !== nextValue) {
        const animationConfig = this.buildConfig(nextValue)
        this.animationHandle = animateRadialGauge({
          context: drawContext,
          config: animationConfig,
          from: this.currentValue,
          to: nextValue,
          paint,
          onFrame: (frame) => {
            this.currentValue = frame.value
            this.emitValueChange(frame)
            this.updateAccessibility(animationConfig, frame.value)
          },
          onComplete: (frame) => {
            this.currentValue = frame.value
            this.emitValueChange(frame)
            this.updateAccessibility(animationConfig, frame.value)
          }
        })
        return
      }

      const renderConfig = this.buildConfig(nextValue)
      const result = renderRadialGauge(drawContext, renderConfig, {
        value: nextValue,
        paint
      })
      this.currentValue = nextValue
      this.emitValueChange(result)
      this.updateAccessibility(renderConfig, result.value)
    } catch (error) {
      this.emitError(error)
    }
  }

  override render() {
    return html`
      <canvas
        width=${this.size}
        height=${this.size}
        role="img"
        aria-label="${this.label || 'Radial Gauge'}"
      ></canvas>
      <span class="sr-only"
        ><slot name="sr-content" @slotchange=${this.onSrContentSlotChange}></slot
      ></span>
    `
  }
}
