import {
  animateCompassGauge,
  compassGaugeConfigSchema,
  renderCompassGauge,
  toGaugeContractState,
  type CompassDrawContext,
  type CompassGaugeConfig,
  type CompassRenderResult
} from '@bradsjm/weather-gauges-core'
import { html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { sharedStyles } from '../shared/shared-styles.js'
import { booleanAttributeConverter } from '../shared/css-utils.js'
import { WeatherGaugeElement } from '../shared/gauge-base-element.js'

type CompassOverlay = Exclude<CompassGaugeConfig['style']['customLayer'], undefined>

@customElement('wx-compass')
export class WxCompassElement extends WeatherGaugeElement {
  @query('canvas')
  private canvasElement?: HTMLCanvasElement

  private currentHeading = 0
  static override styles = sharedStyles

  @property({ type: Number })
  value = 0

  @property({ type: Number })
  size = 220

  @property({ type: String, attribute: 'label' })
  label = 'Compass'

  @property({ type: String })
  unit = 'deg'

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
  pointerType = 'slim-angular-needle'

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

  @property({ type: String, attribute: false })
  knobType: 'standardKnob' | 'metalKnob' = 'standardKnob'

  @property({ type: String, attribute: false })
  knobStyle: 'black' | 'brass' | 'silver' = 'silver'

  @property({ type: String, attribute: false })
  foregroundType:
    | 'top-arc-glass'
    | 'side-reflection-glass'
    | 'dome-glass'
    | 'center-glow-glass'
    | 'sweep-glass' = 'top-arc-glass'

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

  @property({ type: Boolean, attribute: false, converter: booleanAttributeConverter })
  digitalFont = false

  @property({ type: Boolean, attribute: 'show-degrees' })
  degreeScale = false

  @property({ type: Boolean, attribute: false })
  degreeScaleHalf = false

  @property({ type: Boolean, attribute: false })
  roseVisible = true

  @property({ type: Boolean, attribute: 'face-rotates' })
  rotateFace = false

  @property({ type: Boolean, attribute: 'show-labels' })
  pointSymbolsVisible = true

  @property({ type: Boolean, attribute: false, converter: booleanAttributeConverter })
  showTickmarks = true

  @property({ attribute: false })
  customLayer: CanvasImageSource | null = null

  @property({ attribute: false })
  overlay: CompassOverlay | null = null

  @property({ type: Boolean, attribute: false })
  showHeadingReadout = false

  @property({ type: Boolean, attribute: false, converter: booleanAttributeConverter })
  alertsEnabled = false

  @property({ type: Number, attribute: false })
  warningAlertHeading = 90

  @property({ type: Number, attribute: false })
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
    this.currentHeading = this.value
    this.renderGauge(false)
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.size === 0) {
      return
    }

    const valueChanged = changedProperties.has('value')
    this.renderGauge(valueChanged && this.animated)
  }

  private getDrawContext(): CompassDrawContext | undefined {
    return this.getCanvasContext<CompassDrawContext>(this.canvasElement)
  }

  private buildConfig(current: number): CompassGaugeConfig {
    const title = this.label.trim()
    const unit = this.unit.trim()
    const heading = this.normalizeInRange(current, 0, 360, 0)
    const warningHeading = this.normalizeInRange(this.warningAlertHeading, 0, 360, 90)
    const criticalHeading = this.normalizeInRange(this.criticalAlertHeading, 0, 360, 180)
    const overlayLayer =
      this.overlay ??
      (this.customLayer
        ? {
            image: this.customLayer,
            visible: true,
            opacity: 1,
            position: 'center' as const,
            scale: 1
          }
        : null)
    const alerts = this.alertsEnabled
      ? [
          {
            id: 'warning',
            heading: warningHeading,
            message: `warning at ${warningHeading} deg`,
            severity: 'warning' as const
          },
          {
            id: 'critical',
            heading: criticalHeading,
            message: `critical at ${criticalHeading} deg`,
            severity: 'critical' as const
          }
        ]
      : []

    return compassGaugeConfigSchema.parse({
      heading: {
        min: 0,
        max: 360,
        current: heading
      },
      size: {
        width: this.size,
        height: this.size
      },
      text: {
        ...(title ? { title } : {}),
        ...(unit ? { unit } : {})
      },
      rose: {
        showDegreeLabels: this.degreeScale,
        showOrdinalMarkers: this.pointSymbolsVisible
      },
      scale: {
        degreeScaleHalf: this.degreeScaleHalf
      },
      animation: {
        enabled: this.animated,
        durationMs: this.normalizeNonNegative(this.duration, 500)
      },
      style: {
        frameDesign: this.frameDesign,
        backgroundColor: this.backgroundColor,
        pointerType: this.pointerType,
        pointerColor: this.pointerColor,
        knobType: this.knobType,
        knobStyle: this.knobStyle,
        foregroundType: this.foregroundType,
        lcdColor: this.lcdColor,
        digitalFont: this.digitalFont,
        pointSymbols: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
        pointSymbolsVisible: this.pointSymbolsVisible,
        showTickmarks: this.showTickmarks,
        degreeScale: this.degreeScale,
        roseVisible: this.roseVisible,
        rotateFace: this.rotateFace,
        ...(overlayLayer ? { customLayer: overlayLayer } : {})
      },
      indicators: {
        alerts
      }
    })
  }

  private emitValueChange(result: CompassRenderResult): void {
    this.emitGaugeValueChange(toGaugeContractState('compass', result))
  }

  private emitError(error: unknown): void {
    this.emitGaugeError('compass', error, 'Unknown compass rendering error')
  }

  private updateAccessibility(config: CompassGaugeConfig, heading: number): void {
    if (!this.canvasElement) {
      return
    }

    const title = config.text.title ?? 'Compass Gauge'
    const unit = config.text.unit ?? ''
    const label = `${title}: ${heading}${unit ? ` ${unit}` : ''}`
    this.setCanvasAccessibility(this.canvasElement, {
      label,
      valueNow: heading,
      valueMin: config.heading.min,
      valueMax: config.heading.max
    })
  }

  private readonly onSrContentSlotChange = (): void => {
    const heading = this.normalizeInRange(this.currentHeading, 0, 360, this.currentHeading)
    const config = this.buildConfig(heading)
    this.updateAccessibility(config, heading)
  }

  private renderGauge(animateValue: boolean): void {
    const drawContext = this.getDrawContext()
    if (!drawContext || !this.canvasElement) {
      return
    }

    this.canvasElement.width = this.size
    this.canvasElement.height = this.size

    const paint = this.getThemePaint()
    const nextHeading = this.value
    this.animationHandle?.cancel()

    try {
      if (animateValue && this.currentHeading !== nextHeading) {
        const animationConfig = this.buildConfig(nextHeading)
        this.animationHandle = animateCompassGauge({
          context: drawContext,
          config: animationConfig,
          from: this.currentHeading,
          to: nextHeading,
          paint,
          showHeadingReadout: this.showHeadingReadout,
          onFrame: (frame) => {
            this.currentHeading = frame.heading
            this.emitValueChange(frame)
            this.updateAccessibility(animationConfig, frame.heading)
          },
          onComplete: (frame) => {
            this.currentHeading = frame.heading
            this.emitValueChange(frame)
            this.updateAccessibility(animationConfig, frame.heading)
          }
        })
        return
      }

      const renderConfig = this.buildConfig(nextHeading)
      const result = renderCompassGauge(drawContext, renderConfig, {
        heading: nextHeading,
        paint,
        showHeadingReadout: this.showHeadingReadout
      })
      this.currentHeading = nextHeading
      this.emitValueChange(result)
      this.updateAccessibility(renderConfig, result.heading)
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
        aria-label="${this.label || 'Compass Gauge'}"
      ></canvas>
      <span class="sr-only"
        ><slot name="sr-content" @slotchange=${this.onSrContentSlotChange}></slot
      ></span>
    `
  }
}
