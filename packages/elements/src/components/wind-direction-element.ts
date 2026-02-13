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
} from '@bradsjm/weather-gauges-core'
import { html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { sharedStyles } from '../shared/shared-styles.js'
import { booleanAttributeConverter } from '../shared/css-utils.js'
import { WeatherGaugeElement } from '../shared/gauge-base-element.js'
import {
  resolveWindDirectionTextDefaults,
  type WindDirectionPreset
} from '../shared/wind-direction-presets.js'

@customElement('wx-wind-direction')
export class WxWindDirectionElement extends WeatherGaugeElement {
  @query('canvas')
  private canvasElement?: HTMLCanvasElement

  private currentLatest = 0
  private currentAverage = 0
  static override styles = sharedStyles

  @property({ type: Number })
  value = 0

  @property({ type: Number, attribute: 'average' })
  average = 0

  @property({ type: Number })
  size = 220

  @property({ type: String, attribute: 'label' })
  label = ''

  @property({ type: String })
  unit = '°'

  @property({ type: String })
  preset: WindDirectionPreset = ''

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

  @property({ type: String, attribute: 'average-label' })
  averageLabel = 'Average'

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

  @property({ type: Boolean, attribute: 'show-tickmarks', converter: booleanAttributeConverter })
  showTickmarks = true

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
    attribute: 'animated',
    converter: booleanAttributeConverter
  })
  animated = true

  @property({ type: Number })
  duration = 500

  override firstUpdated() {
    this.currentLatest = this.value
    this.currentAverage = this.average
    this.renderGauge(false)
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.size === 0) {
      return
    }

    const valueChanged = changedProperties.has('value') || changedProperties.has('average')
    const onlyValueChanged = valueChanged && changedProperties.size <= 2
    this.renderGauge(onlyValueChanged && this.animated)
  }

  private getDrawContext(): WindDirectionDrawContext | undefined {
    return this.getCanvasContext<WindDirectionDrawContext>(this.canvasElement)
  }

  private parseSectionChildren(): WindDirectionSection[] {
    return this.getChildElements('wx-section')
      .map((element) => {
        const startInput = this.readNumericAttribute(element, ['start', 'from'])
        const stopInput = this.readNumericAttribute(element, ['stop', 'end', 'to'])
        const color = this.readStringAttribute(element, ['color'])
        if (startInput === undefined || stopInput === undefined || !color) {
          return undefined
        }

        const start = this.normalizeInRange(startInput, 0, 360, 0)
        const stop = this.normalizeInRange(stopInput, 0, 360, 360)
        if (stop <= start) {
          return undefined
        }

        return { start, stop, color }
      })
      .filter((section): section is WindDirectionSection => section !== undefined)
  }

  private parseAlertChildren() {
    return this.getChildElements('wx-alert')
      .map((element, index) => {
        const headingInput = this.readNumericAttribute(element, ['threshold', 'heading'])
        if (headingInput === undefined) {
          return undefined
        }

        const heading = this.normalizeInRange(headingInput, 0, 360, 0)
        const severityRaw = this.readStringAttribute(element, ['severity'])
        const severity =
          severityRaw === 'info' || severityRaw === 'warning' || severityRaw === 'critical'
            ? severityRaw
            : 'warning'
        const message =
          this.readStringAttribute(element, ['message']) ??
          `${severity} at ${heading.toFixed(0)} deg`
        const id = this.readStringAttribute(element, ['id']) ?? `child-alert-${index}`

        return { id, heading, severity, message }
      })
      .filter(
        (
          alert
        ): alert is {
          id: string
          heading: number
          severity: 'info' | 'warning' | 'critical'
          message: string
        } => alert !== undefined
      )
  }

  private buildConfig(): WindDirectionGaugeConfig {
    const latest = this.normalizeInRange(this.value, 0, 360, this.currentLatest)
    const average = this.normalizeInRange(this.average, 0, 360, this.currentAverage)
    const warningHeading = this.normalizeInRange(this.warningAlertHeading, 0, 360, 90)
    const criticalHeading = this.normalizeInRange(this.criticalAlertHeading, 0, 360, 180)
    const childAlerts = this.parseAlertChildren()
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
      : childAlerts
    const childSections = this.parseSectionChildren()
    const sections = this.sections.length > 0 ? this.sections : childSections
    const areas = this.areas.length > 0 ? this.areas : []
    const textDefaults = resolveWindDirectionTextDefaults({
      preset: this.preset,
      title: this.label,
      unit: this.unit,
      averageLabel: this.averageLabel,
      hasTitleAttr: this.hasAttribute('label'),
      hasUnitAttr: this.hasAttribute('unit'),
      hasAverageLabelAttr: this.hasAttribute('average-label')
    })

    return windDirectionGaugeConfigSchema.parse({
      value: {
        latest,
        average
      },
      size: {
        width: this.size,
        height: this.size
      },
      text: {
        ...(textDefaults.title ? { title: textDefaults.title } : {}),
        ...(textDefaults.unit ? { unit: textDefaults.unit } : {})
      },
      visibility: {
        showFrame: this.showFrame,
        showBackground: this.showBackground,
        showForeground: this.showForeground,
        showLcd: this.showLcd,
        showPointSymbols: this.showPointSymbols,
        showTickmarks: this.showTickmarks,
        showDegreeScale: this.showDegreeScale,
        showRose: this.showRose
      },
      scale: {
        degreeScaleHalf: this.degreeScaleHalf,
        niceScale: true,
        maxNoOfMajorTicks: 12,
        maxNoOfMinorTicks: 10
      },
      animation: {
        enabled: this.animated,
        durationMs: this.normalizeNonNegative(this.duration, 500)
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
        latest: textDefaults.latestLabel,
        average: textDefaults.averageLabel
      },
      indicators: {
        alerts
      },
      sections,
      areas
    })
  }

  private emitValueChange(result: WindDirectionRenderResult): void {
    this.emitGaugeValueChange(toGaugeContractState('wind-direction', result))
  }

  private emitError(error: unknown): void {
    this.emitGaugeError('wind-direction', error, 'Unknown wind direction rendering error')
  }

  private updateAccessibility(
    config: WindDirectionGaugeConfig,
    latest: number,
    average: number
  ): void {
    if (!this.canvasElement) {
      return
    }

    const title = config.text.title ?? 'Wind Direction Gauge'
    const unit = config.text.unit ?? ''
    const reading = Number.isFinite(average) ? average : latest
    const label = `${title}: ${reading}${unit ? ` ${unit}` : ''}`
    this.setCanvasAccessibility(this.canvasElement, {
      label,
      valueNow: reading,
      valueMin: 0,
      valueMax: 360
    })
  }

  private readonly onSrContentSlotChange = (): void => {
    const latest = this.normalizeInRange(this.currentLatest, 0, 360, this.currentLatest)
    const average = this.normalizeInRange(this.currentAverage, 0, 360, this.currentAverage)
    const config = this.buildConfig()
    this.updateAccessibility(config, latest, average)
  }

  private renderGauge(animateValue: boolean): void {
    const drawContext = this.getDrawContext()
    if (!drawContext || !this.canvasElement) {
      return
    }

    this.canvasElement.width = this.size
    this.canvasElement.height = this.size

    const paint = this.getThemePaint()
    const nextLatest = this.normalizeInRange(this.value, 0, 360, this.currentLatest)
    const nextAverage = this.normalizeInRange(this.average, 0, 360, this.currentAverage)

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
            this.updateAccessibility(config, frame.latest, frame.average)
          },
          onComplete: (frame) => {
            this.currentLatest = frame.latest
            this.currentAverage = frame.average
            this.emitValueChange(frame)
            this.updateAccessibility(config, frame.latest, frame.average)
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
      this.updateAccessibility(config, result.latest, result.average)
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
        aria-label="${this.label || 'Wind Direction Gauge'}"
      ></canvas>
      <span class="sr-only"
        ><slot name="sr-content" @slotchange=${this.onSrContentSlotChange}></slot
      ></span>
    `
  }
}
