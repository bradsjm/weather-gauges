import {
  animateWindDirectionGauge,
  windDirectionGaugeConfigSchema,
  renderWindDirectionGauge,
  toGaugeContractState,
  type WindDirectionDrawContext,
  type WindDirectionGaugeConfig,
  type WindDirectionCustomLayer,
  type WindDirectionSection,
  type WindDirectionRenderResult
} from '@bradsjm/steelseries-v3-core'
import { html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { sharedStyles } from '../shared/shared-styles.js'
import { booleanAttributeConverter } from '../shared/css-utils.js'
import { SteelseriesGaugeElement } from '../shared/gauge-base-element.js'

@customElement('steelseries-wind-direction-v3')
export class SteelseriesWindDirectionV3Element extends SteelseriesGaugeElement {
  @query('canvas')
  private canvasElement?: HTMLCanvasElement

  private currentLatest = 0
  private currentAverage = 0
  static override styles = sharedStyles

  @property({ type: Number, attribute: 'value-latest' })
  valueLatest = 0

  @property({ type: Number, attribute: 'value-average' })
  valueAverage = 0

  @property({ type: Number })
  size = 220

  @property({ type: String })
  override title = ''

  @property({ type: String })
  unit = '°'

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

  @property({ type: String, attribute: 'pointer-type-latest' })
  pointerTypeLatest:
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

  @property({ type: String, attribute: 'pointer-type-average' })
  pointerTypeAverage:
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
    | 'type16' = 'type8'

  @property({ type: String, attribute: 'pointer-color-latest' })
  pointerColorLatest:
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

  @property({ type: String, attribute: 'pointer-color-average' })
  pointerColorAverage:
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
    | 'JUG_GREEN' = 'BLUE'

  @property({ type: String, attribute: 'knob-type' })
  knobType: 'standardKnob' | 'metalKnob' = 'standardKnob'

  @property({ type: String, attribute: 'knob-style' })
  knobStyle: 'black' | 'brass' | 'silver' = 'silver'

  @property({ type: String, attribute: 'foreground-type' })
  foregroundType: 'type1' | 'type2' | 'type3' | 'type4' | 'type5' = 'type1'

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

  @property({ type: String, attribute: 'lcd-title-latest' })
  lcdTitleLatest = 'Latest'

  @property({ type: String, attribute: 'lcd-title-average' })
  lcdTitleAverage = 'Average'

  @property({ attribute: false })
  sections: WindDirectionSection[] = []

  @property({ attribute: false })
  areas: WindDirectionSection[] = []

  @property({ attribute: false })
  customLayer: WindDirectionCustomLayer | null = null

  @property({ type: Boolean, attribute: 'show-frame', converter: booleanAttributeConverter })
  showFrame = true

  @property({ type: Boolean, attribute: 'show-background', converter: booleanAttributeConverter })
  showBackground = true

  @property({ type: Boolean, attribute: 'show-foreground', converter: booleanAttributeConverter })
  showForeground = true

  @property({ type: Boolean, attribute: 'show-lcd', converter: booleanAttributeConverter })
  showLcd = true

  @property({
    type: Boolean,
    attribute: 'show-point-symbols',
    converter: booleanAttributeConverter
  })
  showPointSymbols = true

  @property({ type: Boolean, attribute: 'show-degree-scale', converter: booleanAttributeConverter })
  showDegreeScale = false

  @property({ type: Boolean, attribute: 'show-rose', converter: booleanAttributeConverter })
  showRose = false

  @property({ type: Boolean, attribute: 'degree-scale-half', converter: booleanAttributeConverter })
  degreeScaleHalf = false

  @property({ type: Boolean, attribute: 'digital-font', converter: booleanAttributeConverter })
  digitalFont = false

  @property({ type: Boolean, attribute: 'use-color-labels', converter: booleanAttributeConverter })
  useColorLabels = false

  @property({ type: Boolean, attribute: 'alerts-enabled', converter: booleanAttributeConverter })
  alertsEnabled = false

  @property({ type: Number, attribute: 'warning-alert-heading' })
  warningAlertHeading = 90

  @property({ type: Number, attribute: 'critical-alert-heading' })
  criticalAlertHeading = 180

  @property({
    type: Boolean,
    attribute: 'animate-value',
    converter: booleanAttributeConverter
  })
  animateValue = true

  override firstUpdated() {
    this.currentLatest = this.valueLatest
    this.currentAverage = this.valueAverage
    this.renderGauge(false)
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.size === 0) {
      return
    }

    const valueChanged =
      changedProperties.has('valueLatest') || changedProperties.has('valueAverage')
    const onlyValueChanged = valueChanged && changedProperties.size <= 2
    this.renderGauge(onlyValueChanged && this.animateValue)
  }

  private getDrawContext(): WindDirectionDrawContext | undefined {
    return this.getCanvasContext<WindDirectionDrawContext>(this.canvasElement)
  }

  private buildConfig(): WindDirectionGaugeConfig {
    const clampHeading = (value: number): number => Math.min(360, Math.max(0, value))
    const warningHeading = clampHeading(this.warningAlertHeading)
    const criticalHeading = clampHeading(this.criticalAlertHeading)
    const alerts = this.alertsEnabled
      ? [
          {
            id: 'warning',
            heading: warningHeading,
            severity: 'warning' as const,
            message: `warning at ${warningHeading} deg`
          },
          {
            id: 'critical',
            heading: criticalHeading,
            severity: 'critical' as const,
            message: `critical at ${criticalHeading} deg`
          }
        ]
      : []

    return windDirectionGaugeConfigSchema.parse({
      value: {
        latest: this.valueLatest,
        average: this.valueAverage
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
        showLcd: this.showLcd,
        showPointSymbols: this.showPointSymbols,
        showDegreeScale: this.showDegreeScale,
        showRose: this.showRose
      },
      scale: {
        degreeScaleHalf: this.degreeScaleHalf,
        niceScale: true,
        maxNoOfMajorTicks: 12,
        maxNoOfMinorTicks: 10
      },
      style: {
        frameDesign: this.frameDesign,
        backgroundColor: this.backgroundColor,
        foregroundType: this.foregroundType,
        pointerLatest: {
          type: this.pointerTypeLatest,
          color: this.pointerColorLatest
        },
        pointerAverage: {
          type: this.pointerTypeAverage,
          color: this.pointerColorAverage
        },
        knobType: this.knobType,
        knobStyle: this.knobStyle,
        lcdColor: this.lcdColor,
        digitalFont: this.digitalFont,
        useColorLabels: this.useColorLabels,
        ...(this.customLayer ? { customLayer: this.customLayer } : {}),
        pointSymbols: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
      },
      lcdTitles: {
        latest: this.lcdTitleLatest,
        average: this.lcdTitleAverage
      },
      indicators: {
        alerts
      },
      sections: this.sections,
      areas: this.areas
    })
  }

  private emitValueChange(result: WindDirectionRenderResult): void {
    this.emitGaugeValueChange(toGaugeContractState('wind-direction', result))
  }

  private emitError(error: unknown): void {
    this.emitGaugeError('wind-direction', error, 'Unknown wind direction rendering error')
  }

  private renderGauge(animateValue: boolean): void {
    const drawContext = this.getDrawContext()
    if (!drawContext || !this.canvasElement) {
      return
    }

    this.canvasElement.width = this.size
    this.canvasElement.height = this.size

    const paint = this.getThemePaint()
    const nextLatest = this.valueLatest
    const nextAverage = this.valueAverage

    this.animationHandle?.cancel()

    try {
      if (
        animateValue &&
        (this.currentLatest !== nextLatest || this.currentAverage !== nextAverage)
      ) {
        const config = this.buildConfig()
        this.animationHandle = animateWindDirectionGauge({
          context: drawContext,
          config,
          fromLatest: this.currentLatest,
          toLatest: nextLatest,
          fromAverage: this.currentAverage,
          toAverage: nextAverage,
          paint,
          onFrame: (frame) => {
            this.currentLatest = frame.latest
            this.currentAverage = frame.average
            this.emitValueChange(frame)
          },
          onComplete: (frame) => {
            this.currentLatest = frame.latest
            this.currentAverage = frame.average
            this.emitValueChange(frame)
          }
        })
        return
      }

      const config = this.buildConfig()
      const result = renderWindDirectionGauge(drawContext, config, {
        latest: nextLatest,
        average: nextAverage,
        paint
      })
      this.currentLatest = result.latest
      this.currentAverage = result.average
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
        aria-label="${this.title || 'Wind Direction Gauge'}"
      ></canvas>
    `
  }
}
