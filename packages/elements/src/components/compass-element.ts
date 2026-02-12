import {
  animateCompassGauge,
  gaugeContract,
  compassGaugeConfigSchema,
  renderCompassGauge,
  resolveThemePaint,
  createStyleTokenSource,
  toGaugeContractState,
  type AnimationRunHandle,
  type CompassDrawContext,
  type CompassGaugeConfig,
  type CompassRenderResult,
  type ThemePaint
} from '@bradsjm/steelseries-v3-core'
import { LitElement, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { sharedStyles } from '../shared/shared-styles.js'
import { booleanAttributeConverter } from '../shared/css-utils.js'

@customElement('steelseries-compass-v3')
export class SteelseriesCompassV3Element extends LitElement {
  @query('canvas')
  private canvasElement?: HTMLCanvasElement

  private currentHeading = 0
  private animationHandle: AnimationRunHandle | undefined

  static override styles = sharedStyles

  @property({ type: Number })
  heading = 0

  @property({ type: Number })
  size = 220

  @property({ type: String })
  override title = 'Compass'

  @property({ type: String })
  unit = 'deg'

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

  @property({ type: String, attribute: 'pointer-type' })
  pointerType = 'type2'

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

  @property({ type: String, attribute: 'knob-type' })
  knobType: 'standardKnob' | 'metalKnob' = 'standardKnob'

  @property({ type: String, attribute: 'knob-style' })
  knobStyle: 'black' | 'brass' | 'silver' = 'silver'

  @property({ type: String, attribute: 'foreground-type' })
  foregroundType: 'type1' | 'type2' | 'type3' | 'type4' | 'type5' = 'type1'

  @property({ type: Boolean, attribute: 'degree-scale' })
  degreeScale = false

  @property({ type: Boolean, attribute: 'rose-visible' })
  roseVisible = true

  @property({ type: Boolean, attribute: 'rotate-face' })
  rotateFace = false

  @property({ type: Boolean, attribute: 'point-symbols-visible' })
  pointSymbolsVisible = true

  @property({ type: String, attribute: 'point-symbol-n' })
  pointSymbolN = 'N'

  @property({ type: String, attribute: 'point-symbol-ne' })
  pointSymbolNE = 'NE'

  @property({ type: String, attribute: 'point-symbol-e' })
  pointSymbolE = 'E'

  @property({ type: String, attribute: 'point-symbol-se' })
  pointSymbolSE = 'SE'

  @property({ type: String, attribute: 'point-symbol-s' })
  pointSymbolS = 'S'

  @property({ type: String, attribute: 'point-symbol-sw' })
  pointSymbolSW = 'SW'

  @property({ type: String, attribute: 'point-symbol-w' })
  pointSymbolW = 'W'

  @property({ type: String, attribute: 'point-symbol-nw' })
  pointSymbolNW = 'NW'

  @property({ attribute: false })
  customLayer: CanvasImageSource | null = null

  @property({ type: Boolean, attribute: 'show-heading-readout' })
  showHeadingReadout = false

  @property({
    type: Boolean,
    attribute: 'animate-value',
    converter: booleanAttributeConverter
  })
  animateValue = true

  override firstUpdated() {
    this.currentHeading = this.heading
    this.renderGauge(false)
  }

  override disconnectedCallback() {
    this.animationHandle?.cancel()
    this.animationHandle = undefined
    super.disconnectedCallback()
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.size === 0) {
      return
    }

    const valueChanged = changedProperties.has('heading')
    const onlyValueChanged = valueChanged && changedProperties.size === 1
    this.renderGauge(onlyValueChanged && this.animateValue)
  }

  private getThemePaint(): ThemePaint {
    const computedStyle = getComputedStyle(this)
    return resolveThemePaint({
      source: createStyleTokenSource(computedStyle)
    })
  }

  private getDrawContext(): CompassDrawContext | undefined {
    if (!this.canvasElement) {
      return undefined
    }

    const drawContext = this.canvasElement.getContext('2d')
    if (!drawContext) {
      return undefined
    }

    return drawContext as CompassDrawContext
  }

  private buildConfig(current: number): CompassGaugeConfig {
    const title = this.title.trim()
    const unit = this.unit.trim()

    return compassGaugeConfigSchema.parse({
      heading: {
        min: 0,
        max: 360,
        current
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
      style: {
        frameDesign: this.frameDesign,
        backgroundColor: this.backgroundColor,
        pointerType: this.pointerType,
        pointerColor: this.pointerColor,
        knobType: this.knobType,
        knobStyle: this.knobStyle,
        foregroundType: this.foregroundType,
        pointSymbols: [
          this.pointSymbolN,
          this.pointSymbolNE,
          this.pointSymbolE,
          this.pointSymbolSE,
          this.pointSymbolS,
          this.pointSymbolSW,
          this.pointSymbolW,
          this.pointSymbolNW
        ],
        pointSymbolsVisible: this.pointSymbolsVisible,
        degreeScale: this.degreeScale,
        roseVisible: this.roseVisible,
        rotateFace: this.rotateFace,
        customLayer: this.customLayer
      },
      indicators: {
        alerts: [
          {
            id: 'east-wind',
            heading: 90,
            message: 'east wind',
            severity: 'warning'
          },
          {
            id: 'south-storm',
            heading: 180,
            message: 'storm',
            severity: 'critical'
          }
        ]
      }
    })
  }

  private emitValueChange(result: CompassRenderResult): void {
    this.dispatchEvent(
      new CustomEvent(gaugeContract.valueChangeEvent, {
        detail: toGaugeContractState('compass', result),
        bubbles: true,
        composed: true
      })
    )
  }

  private emitError(error: unknown): void {
    this.dispatchEvent(
      new CustomEvent(gaugeContract.errorEvent, {
        detail: {
          kind: 'compass',
          message: error instanceof Error ? error.message : 'Unknown compass rendering error'
        },
        bubbles: true,
        composed: true
      })
    )
  }

  private renderGauge(animateValue: boolean): void {
    const drawContext = this.getDrawContext()
    if (!drawContext || !this.canvasElement) {
      return
    }

    this.canvasElement.width = this.size
    this.canvasElement.height = this.size

    const paint = this.getThemePaint()
    const nextHeading = this.heading
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
          },
          onComplete: (frame) => {
            this.currentHeading = frame.heading
            this.emitValueChange(frame)
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
        aria-label="${this.title || 'Compass Gauge'}"
      ></canvas>
    `
  }
}
