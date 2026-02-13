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
} from '@bradsjm/steelseries-v3-core'
import { html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { sharedStyles } from '../shared/shared-styles.js'
import { booleanAttributeConverter, readCssCustomPropertyColor } from '../shared/css-utils.js'
import { SteelseriesGaugeElement } from '../shared/gauge-base-element.js'
import {
  isPresetTrendEnabled,
  resolveEffectivePresetUnit,
  resolvePresetRange,
  resolvePresetSections,
  resolvePresetTitle,
  type MeasurementPreset
} from '../shared/measurement-presets.js'

@customElement('steelseries-radial-bargraph-v3')
export class SteelseriesRadialBargraphV3Element extends SteelseriesGaugeElement {
  @query('canvas')
  private canvasElement?: HTMLCanvasElement

  private currentValue = 0
  static override styles = sharedStyles

  @property({ type: Number })
  value = 0

  @property({ type: Number, attribute: 'min-value' })
  minValue = 0

  @property({ type: Number, attribute: 'max-value' })
  maxValue = 100

  @property({ type: Number })
  size = 220

  @property({ type: String })
  override title = 'Radial Bargraph'

  @property({ type: String })
  unit = ''

  @property({ type: Number })
  threshold = 80

  @property({ type: String })
  preset: MeasurementPreset = ''

  @property({ type: Boolean, attribute: 'show-threshold', converter: booleanAttributeConverter })
  showThreshold = false

  @property({ type: Boolean, attribute: 'alerts-enabled', converter: booleanAttributeConverter })
  alertsEnabled = false

  @property({ type: Number, attribute: 'warning-alert-value' })
  warningAlertValue = 80

  @property({ type: Number, attribute: 'critical-alert-value' })
  criticalAlertValue = 95

  @property({ type: Number, attribute: 'lcd-decimals' })
  lcdDecimals = 2

  @property({ type: String, attribute: 'frame-design' })
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

  @property({ type: String, attribute: 'background-color' })
  backgroundColor:
    | 'DARK_GRAY'
    | 'SATIN_GRAY'
    | 'LIGHT_GRAY'
    | 'WHITE'
    | 'BLACK'
    | 'BEIGE'
    | 'BROWN'
    | 'RED'
    | 'GREEN'
    | 'BLUE'
    | 'ANTHRACITE'
    | 'MUD'
    | 'PUNCHED_SHEET'
    | 'CARBON'
    | 'STAINLESS'
    | 'BRUSHED_METAL'
    | 'BRUSHED_STAINLESS'
    | 'TURNED' = 'DARK_GRAY'

  @property({ type: String, attribute: 'foreground-type' })
  foregroundType: 'type1' | 'type2' | 'type3' | 'type4' | 'type5' = 'type1'

  @property({ type: String, attribute: 'gauge-type' })
  gaugeType: 'type1' | 'type2' | 'type3' | 'type4' = 'type4'

  @property({ type: String, attribute: 'value-color' })
  valueColor:
    | 'RED'
    | 'GREEN'
    | 'BLUE'
    | 'ORANGE'
    | 'YELLOW'
    | 'CYAN'
    | 'MAGENTA'
    | 'WHITE'
    | 'GRAY'
    | 'BLACK'
    | 'RAITH'
    | 'GREEN_LCD'
    | 'JUG_GREEN' = 'RED'

  @property({ type: String, attribute: 'lcd-color' })
  lcdColor:
    | 'STANDARD'
    | 'STANDARD_GREEN'
    | 'BLUE'
    | 'ORANGE'
    | 'RED'
    | 'YELLOW'
    | 'WHITE'
    | 'GRAY'
    | 'BLACK' = 'STANDARD'

  @property({ type: String, attribute: 'label-number-format' })
  labelNumberFormat: 'standard' | 'fractional' | 'scientific' = 'standard'

  @property({ type: String, attribute: 'tick-label-orientation' })
  tickLabelOrientation?: 'horizontal' | 'tangent' | 'normal'

  @property({ type: Number, attribute: 'fractional-scale-decimals' })
  fractionalScaleDecimals = 1

  @property({ attribute: false })
  sections: RadialBargraphSection[] = []

  @property({ attribute: false })
  valueGradientStops: RadialBargraphValueGradientStop[] = []

  @property({ type: Boolean, attribute: 'show-frame', converter: booleanAttributeConverter })
  showFrame = true

  @property({ type: Boolean, attribute: 'show-background', converter: booleanAttributeConverter })
  showBackground = true

  @property({ type: Boolean, attribute: 'show-foreground', converter: booleanAttributeConverter })
  showForeground = true

  @property({ type: Boolean, attribute: 'show-lcd', converter: booleanAttributeConverter })
  showLcd = true

  @property({ type: Boolean, attribute: 'led-visible', converter: booleanAttributeConverter })
  ledVisible = false

  @property({ type: Boolean, attribute: 'user-led-visible', converter: booleanAttributeConverter })
  userLedVisible = false

  @property({ type: Boolean, attribute: 'trend-visible', converter: booleanAttributeConverter })
  trendVisible = false

  @property({ type: String, attribute: 'trend-state' })
  trendState: 'up' | 'steady' | 'down' | 'off' = 'off'

  @property({ type: Boolean, attribute: 'digital-font', converter: booleanAttributeConverter })
  digitalFont = false

  @property({
    type: Boolean,
    attribute: 'use-section-colors',
    converter: booleanAttributeConverter
  })
  useSectionColors = false

  @property({
    type: Boolean,
    attribute: 'use-value-gradient',
    converter: booleanAttributeConverter
  })
  useValueGradient = false

  @property({
    type: Boolean,
    attribute: 'animate-value',
    converter: booleanAttributeConverter
  })
  animateValue = true

  override firstUpdated() {
    this.currentValue = this.value
    this.renderGauge(false)
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.size === 0) {
      return
    }

    const valueChanged = changedProperties.has('value')
    const onlyValueChanged = valueChanged && changedProperties.size === 1
    this.renderGauge(onlyValueChanged && this.animateValue)
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
    const hasExplicitMin = this.hasAttribute('min-value') || this.minValue !== 0
    const hasExplicitMax = this.hasAttribute('max-value') || this.maxValue !== 100
    const minValue = hasExplicitMin ? this.minValue : (presetRange?.min ?? this.minValue)
    const maxValue = hasExplicitMax ? this.maxValue : (presetRange?.max ?? this.maxValue)
    const range = this.normalizedRange(minValue, maxValue)
    const thresholdValue = this.normalizeInRange(this.threshold, range.min, range.max, range.max)
    const accentColor = readCssCustomPropertyColor(this, '--ss3-accent-color', '#d97706')
    const warningColor = readCssCustomPropertyColor(this, '--ss3-warning-color', '#c5162e')
    const dangerColor = readCssCustomPropertyColor(this, '--ss3-danger-color', '#ef4444')

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
    const sections =
      this.sections.length > 0
        ? this.sections
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

    const defaultTickLabelOrientation = this.gaugeType === 'type1' ? 'tangent' : 'normal'
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
      this.hasAttribute('title') || this.title !== 'Radial Bargraph'
        ? this.title
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
        ...(effectiveUnit ? { unit: effectiveUnit } : {})
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
    const hasExplicitMin = this.hasAttribute('min-value') || this.minValue !== 0
    const hasExplicitMax = this.hasAttribute('max-value') || this.maxValue !== 100
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
          },
          onComplete: (frame) => {
            this.currentValue = frame.value
            this.emitValueChange(frame)
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
        aria-label="${this.title || 'Radial Bargraph Gauge'}"
      ></canvas>
    `
  }
}
