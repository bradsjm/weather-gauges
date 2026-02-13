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
} from '@bradsjm/steelseries-v3-core'
import { html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { booleanAttributeConverter } from '../shared/css-utils.js'
import { SteelseriesGaugeElement } from '../shared/gauge-base-element.js'
import { sharedStyles } from '../shared/shared-styles.js'

@customElement('steelseries-radial-v3')
export class SteelseriesRadialV3Element extends SteelseriesGaugeElement {
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
  override title = 'Radial'

  @property({ type: String })
  unit = ''

  @property({ type: Number })
  threshold = 80

  @property({ type: Boolean, attribute: 'show-threshold', converter: booleanAttributeConverter })
  showThreshold = false

  @property({ type: Boolean, attribute: 'alerts-enabled', converter: booleanAttributeConverter })
  alertsEnabled = false

  @property({ type: Number, attribute: 'warning-alert-value' })
  warningAlertValue = 80

  @property({ type: Number, attribute: 'critical-alert-value' })
  criticalAlertValue = 95

  @property({ type: Number, attribute: 'major-tick-count' })
  majorTickCount = 9

  @property({ type: Number, attribute: 'minor-ticks-per-major' })
  minorTicksPerMajor = 4

  @property({ type: Number, attribute: 'start-angle' })
  startAngle = (-3 * Math.PI) / 4

  @property({ type: Number, attribute: 'end-angle' })
  endAngle = (3 * Math.PI) / 4

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
  gaugeType: 'type1' | 'type2' | 'type3' | 'type4' | 'type5' = 'type4'

  @property({ type: String })
  orientation: 'north' | 'east' | 'west' = 'north'

  @property({ type: String, attribute: 'pointer-type' })
  pointerType:
    | 'type1'
    | 'type2'
    | 'type3'
    | 'type4'
    | 'type5'
    | 'type6'
    | 'type7'
    | 'type8'
    | 'type9'
    | 'type10'
    | 'type11'
    | 'type12'
    | 'type13'
    | 'type14'
    | 'type15'
    | 'type16' = 'type1'

  @property({ type: String, attribute: 'pointer-color' })
  pointerColor:
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

  @property({ attribute: false })
  segments: RadialSegment[] = []

  @property({ attribute: false })
  areas: RadialArea[] = []

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
  trendState: 'up' | 'steady' | 'down' = 'down'

  @property({
    type: Boolean,
    attribute: 'min-measured-value-visible',
    converter: booleanAttributeConverter
  })
  minMeasuredValueVisible = false

  @property({
    type: Boolean,
    attribute: 'max-measured-value-visible',
    converter: booleanAttributeConverter
  })
  maxMeasuredValueVisible = false

  @property({ type: Number, attribute: 'min-measured-value' })
  minMeasuredValue = 0

  @property({ type: Number, attribute: 'max-measured-value' })
  maxMeasuredValue = 100

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
    const range = this.normalizedRange(this.minValue, this.maxValue)
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
    const segments = this.segments.length > 0 ? this.segments : childSections
    const areas = this.areas.length > 0 ? this.areas : []

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
        ...(this.title ? { title: this.title } : {}),
        ...(this.unit ? { unit: this.unit } : {})
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
        trendVisible: this.trendVisible,
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

  private renderGauge(animateValue: boolean): void {
    const drawContext = this.getDrawContext()
    if (!drawContext || !this.canvasElement) {
      return
    }

    this.canvasElement.width = this.size
    this.canvasElement.height = this.size

    const paint = this.getThemePaint()
    const range = this.normalizedRange(this.minValue, this.maxValue)
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
          },
          onComplete: (frame) => {
            this.currentValue = frame.value
            this.emitValueChange(frame)
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
        aria-label="${this.title || 'Radial Gauge'}"
      ></canvas>
    `
  }
}
