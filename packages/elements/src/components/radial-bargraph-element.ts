import {
  animateRadialBargraphGauge,
  radialBargraphGaugeConfigSchema,
  renderRadialBargraphGauge,
  toGaugeContractState,
  type RadialBargraphDrawContext,
  type RadialBargraphGaugeConfig,
  type RadialBargraphSection,
  type RadialBargraphValueGradientStop,
  type RadialBargraphRenderResult
} from '@bradsjm/weather-gauges-core'
import { html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { sharedStyles } from '../shared/shared-styles.js'
import { booleanAttributeConverter, readCssCustomPropertyColor } from '../shared/css-utils.js'
import { WeatherGaugeElement } from '../shared/gauge-base-element.js'
import {
  isPresetTrendEnabled,
  resolveEffectivePresetUnit,
  resolvePresetRange,
  resolvePresetSections,
  resolvePresetTitle,
  type MeasurementPreset
} from '../shared/measurement-presets.js'

@customElement('wx-bargraph')
export class WxBargraphElement extends WeatherGaugeElement {
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
  label = 'Radial Bargraph'

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

  @property({ type: Number, attribute: 'decimals' })
  lcdDecimals = 2

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
  gaugeType: 'quarter' | 'half' | 'three-quarter' | 'full-gap' = 'full-gap'

  @property({ type: String, attribute: false })
  valueColor:
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

  @property({ type: String, attribute: false })
  lcdColor:
    | 'standard'
    | 'standard-green'
    | 'blue'
    | 'orange'
    | 'red'
    | 'yellow'
    | 'white'
    | 'gray'
    | 'black' = 'standard'

  @property({ type: String, attribute: false })
  labelNumberFormat: 'standard' | 'fractional' | 'scientific' = 'standard'

  @property({ type: String, attribute: false })
  tickLabelOrientation?: 'horizontal' | 'tangent' | 'normal'

  @property({ type: Number, attribute: false })
  fractionalScaleDecimals = 1

  @property({ attribute: false })
  sections: RadialBargraphSection[] = []

  @property({ attribute: false })
  valueGradientStops: RadialBargraphValueGradientStop[] = []

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
  trendState: 'up' | 'steady' | 'down' | 'off' = 'off'

  @property({ type: Boolean, attribute: false, converter: booleanAttributeConverter })
  digitalFont = false

  @property({
    type: Boolean,
    attribute: false,
    converter: booleanAttributeConverter
  })
  useSectionColors = false

  @property({
    type: Boolean,
    attribute: false,
    converter: booleanAttributeConverter
  })
  useValueGradient = false

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

  private getDrawContext(): RadialBargraphDrawContext | undefined {
    return this.getCanvasContext<RadialBargraphDrawContext>(this.canvasElement)
  }

  private parseSectionChildren(range: { min: number; max: number }): RadialBargraphSection[] {
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
      .filter((section): section is RadialBargraphSection => section !== undefined)
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

  private buildConfig(current: number): RadialBargraphGaugeConfig {
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
    const thresholdValue = this.normalizeInRange(this.threshold, range.min, range.max, range.max)
    const accentColor = readCssCustomPropertyColor(this, '--wx-accent-color', '#d97706')
    const warningColor = readCssCustomPropertyColor(this, '--wx-warning-color', '#c5162e')
    const dangerColor = readCssCustomPropertyColor(this, '--wx-danger-color', '#ef4444')

    const fallbackSections = this.useSectionColors
      ? [
          {
            from: range.min,
            to: thresholdValue,
            color: accentColor
          },
          {
            from: thresholdValue,
            to: range.max,
            color: warningColor
          }
        ]
      : []

    const childSections = this.parseSectionChildren(range)
    const presetSections = resolvePresetSections(preset, range, effectiveUnit)
    const normalizedSections = this.sections
      .map((section) => {
        const from = this.normalizeInRange(section.from, range.min, range.max, range.min)
        const to = this.normalizeInRange(section.to, range.min, range.max, range.max)
        if (to <= from) {
          return undefined
        }

        return { ...section, from, to }
      })
      .filter((section): section is RadialBargraphSection => section !== undefined)
    const sections =
      normalizedSections.length > 0
        ? normalizedSections
        : childSections.length > 0
          ? childSections
          : presetSections.length > 0
            ? presetSections
            : fallbackSections

    const fallbackValueGradientStops = this.useValueGradient
      ? [
          { fraction: 0, color: accentColor },
          { fraction: 0.75, color: warningColor },
          { fraction: 1, color: dangerColor }
        ]
      : []

    const valueGradientStops =
      this.valueGradientStops.length > 0 ? this.valueGradientStops : fallbackValueGradientStops

    const defaultTickLabelOrientation = this.gaugeType === 'quarter' ? 'tangent' : 'normal'
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
    const trendVisible = this.hasAttribute('trend-visible')
      ? this.trendVisible
      : isPresetTrendEnabled(preset)
    const title =
      this.hasAttribute('label') || this.label !== 'Radial Bargraph'
        ? this.label
        : resolvePresetTitle(preset)

    return radialBargraphGaugeConfigSchema.parse({
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
        niceScale: true,
        maxNoOfMajorTicks: 10,
        maxNoOfMinorTicks: 10,
        fractionalScaleDecimals: this.fractionalScaleDecimals
      },
      animation: {
        enabled: this.animated,
        durationMs: this.normalizeNonNegative(this.duration, 500)
      },
      style: {
        frameDesign: this.frameDesign,
        backgroundColor: this.backgroundColor,
        foregroundType: this.foregroundType,
        gaugeType: this.gaugeType,
        valueColor: this.valueColor,
        lcdColor: this.lcdColor,
        digitalFont: this.digitalFont,
        labelNumberFormat: this.labelNumberFormat,
        tickLabelOrientation: this.tickLabelOrientation ?? defaultTickLabelOrientation,
        useSectionColors: this.useSectionColors,
        useValueGradient: this.useValueGradient
      },
      sections,
      valueGradientStops,
      lcdDecimals: this.lcdDecimals,
      indicators: {
        threshold: {
          value: thresholdValue,
          show: this.showThreshold
        },
        alerts,
        ledVisible: this.ledVisible,
        userLedVisible: this.userLedVisible,
        trendVisible,
        trendState: this.trendState
      }
    })
  }

  private emitValueChange(result: RadialBargraphRenderResult): void {
    this.emitGaugeValueChange(toGaugeContractState('radial-bargraph', result))
  }

  private emitError(error: unknown): void {
    this.emitGaugeError('radial-bargraph', error, 'Unknown radial bargraph rendering error')
  }

  private updateAccessibility(config: RadialBargraphGaugeConfig, value: number): void {
    if (!this.canvasElement) {
      return
    }

    const title = config.text.title ?? 'Radial Bargraph Gauge'
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
        this.animationHandle = animateRadialBargraphGauge({
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
      const result = renderRadialBargraphGauge(drawContext, renderConfig, {
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
        aria-label="${this.label || 'Radial Bargraph Gauge'}"
      ></canvas>
      <span class="sr-only"
        ><slot name="sr-content" @slotchange=${this.onSrContentSlotChange}></slot
      ></span>
    `
  }
}
