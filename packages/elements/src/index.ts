import {
  animateCompassGauge,
  animateLinearGauge,
  animateRadialGauge,
  compassGaugeConfigSchema,
  createStyleTokenSource,
  gaugeContract,
  linearGaugeConfigSchema,
  renderCompassGauge,
  renderLinearGauge,
  radialGaugeConfigSchema,
  renderRadialGauge,
  resolveThemePaint,
  toGaugeContractState,
  type AnimationRunHandle,
  type CompassDrawContext,
  type CompassGaugeConfig,
  type CompassRenderResult,
  type LinearDrawContext,
  type LinearGaugeConfig,
  type LinearRenderResult,
  type RadialDrawContext,
  type RadialGaugeConfig,
  type RadialRenderResult,
  type ThemePaint
} from '@bradsjm/steelseries-v3-core'
import { LitElement, css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'

@customElement('steelseries-radial-v3')
export class SteelseriesRadialV3Element extends LitElement {
  @query('canvas')
  private canvasElement?: HTMLCanvasElement

  private currentValue = 0
  private animationHandle: AnimationRunHandle | undefined

  static override styles = css`
    :host {
      --ss3-font-family: system-ui, sans-serif;
      --ss3-text-color: #eceff3;
      --ss3-accent-color: #c5162e;
      --ss3-warning-color: #d97706;
      --ss3-danger-color: #ef4444;
      display: inline-block;
      font-family: var(--ss3-font-family);
      color: var(--ss3-text-color);
    }

    canvas {
      display: block;
    }
  `

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

  @property({ type: String, attribute: 'gauge-type' })
  gaugeType: 'type1' | 'type2' | 'type3' | 'type4' = 'type4'

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

  @property({
    type: Boolean,
    attribute: 'animate-value',
    converter: {
      fromAttribute: (value: string | null) => value !== null && value !== 'false'
    }
  })
  animateValue = true

  override firstUpdated() {
    this.currentValue = this.value
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

    const valueChanged = changedProperties.has('value')
    const onlyValueChanged = valueChanged && changedProperties.size === 1
    this.renderGauge(onlyValueChanged && this.animateValue)
  }

  private getThemePaint(): ThemePaint {
    const computedStyle = getComputedStyle(this)
    return resolveThemePaint({
      source: createStyleTokenSource(computedStyle)
    })
  }

  private getDrawContext(): RadialDrawContext | undefined {
    const canvas = this.renderRoot.querySelector('canvas')
    if (!(canvas instanceof HTMLCanvasElement)) {
      return undefined
    }

    const drawContext = canvas.getContext('2d')
    if (!drawContext) {
      return undefined
    }

    return drawContext as RadialDrawContext
  }

  private buildConfig(current: number): RadialGaugeConfig {
    return radialGaugeConfigSchema.parse({
      value: {
        min: this.minValue,
        max: this.maxValue,
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
      scale: {
        majorTickCount: 11,
        minorTicksPerMajor: 4
      },
      style: {
        frameDesign: this.frameDesign,
        backgroundColor: this.backgroundColor,
        foregroundType: this.foregroundType,
        pointerType: this.pointerType,
        gaugeType: this.gaugeType,
        pointerColor: this.pointerColor
      },
      indicators: {
        threshold: {
          value: this.threshold,
          show: true
        },
        alerts: [
          {
            id: 'critical',
            value: this.maxValue * 0.95,
            message: 'critical',
            severity: 'critical'
          },
          {
            id: 'warning',
            value: this.threshold,
            message: 'warning',
            severity: 'warning'
          }
        ]
      },
      segments: [
        {
          from: this.minValue,
          to: this.threshold,
          color: 'var(--ss3-accent-color)'
        },
        {
          from: this.threshold,
          to: this.maxValue,
          color: 'var(--ss3-warning-color)'
        }
      ]
    })
  }

  private emitValueChange(result: RadialRenderResult): void {
    this.dispatchEvent(
      new CustomEvent(gaugeContract.valueChangeEvent, {
        detail: toGaugeContractState('radial', result),
        bubbles: true,
        composed: true
      })
    )
  }

  private emitError(error: unknown): void {
    this.dispatchEvent(
      new CustomEvent(gaugeContract.errorEvent, {
        detail: {
          kind: 'radial',
          message: error instanceof Error ? error.message : 'Unknown radial rendering error'
        },
        bubbles: true,
        composed: true
      })
    )
  }

  private renderGauge(animateValue: boolean): void {
    const drawContext = this.getDrawContext()
    const canvas = this.renderRoot.querySelector('canvas')
    if (!drawContext || !(canvas instanceof HTMLCanvasElement)) {
      return
    }

    canvas.width = this.size
    canvas.height = this.size

    const paint = this.getThemePaint()
    const nextValue = this.value
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
      const result = renderRadialGauge(drawContext, renderConfig, { value: nextValue, paint })
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

@customElement('steelseries-linear-v3')
export class SteelseriesLinearV3Element extends LitElement {
  @query('canvas')
  private canvasElement?: HTMLCanvasElement

  private currentValue = 0
  private animationHandle: AnimationRunHandle | undefined

  static override styles = css`
    :host {
      --ss3-font-family: system-ui, sans-serif;
      --ss3-text-color: #e8ebef;
      --ss3-accent-color: #c5162e;
      --ss3-warning-color: #d97706;
      --ss3-danger-color: #ef4444;
      display: inline-block;
      font-family: var(--ss3-font-family);
      color: var(--ss3-text-color);
    }

    canvas {
      display: block;
    }
  `

  @property({ type: Number })
  value = 0

  @property({ type: Number, attribute: 'min-value' })
  minValue = 0

  @property({ type: Number, attribute: 'max-value' })
  maxValue = 100

  @property({ type: Number })
  width = 130

  @property({ type: Number })
  height = 280

  @property({ type: String })
  override title = 'Linear'

  @property({ type: String })
  unit = ''

  @property({ type: Number })
  threshold = 70

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

  @property({ type: String, attribute: 'gauge-type' })
  gaugeType: 'type1' | 'type2' = 'type1'

  @property({
    type: Boolean,
    attribute: 'animate-value',
    converter: {
      fromAttribute: (value: string | null) => value !== null && value !== 'false'
    }
  })
  animateValue = true

  override firstUpdated() {
    this.currentValue = this.value
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

    const valueChanged = changedProperties.has('value')
    const onlyValueChanged = valueChanged && changedProperties.size === 1
    this.renderGauge(onlyValueChanged && this.animateValue)
  }

  private getThemePaint(): ThemePaint {
    const computedStyle = getComputedStyle(this)
    return resolveThemePaint({
      source: createStyleTokenSource(computedStyle)
    })
  }

  private getDrawContext(): LinearDrawContext | undefined {
    const canvas = this.renderRoot.querySelector('canvas')
    if (!(canvas instanceof HTMLCanvasElement)) {
      return undefined
    }

    const drawContext = canvas.getContext('2d')
    if (!drawContext) {
      return undefined
    }

    return drawContext as LinearDrawContext
  }

  private buildConfig(current: number): LinearGaugeConfig {
    return linearGaugeConfigSchema.parse({
      value: {
        min: this.minValue,
        max: this.maxValue,
        current
      },
      size: {
        width: this.width,
        height: this.height
      },
      text: {
        ...(this.title ? { title: this.title } : {}),
        ...(this.unit ? { unit: this.unit } : {})
      },
      style: {
        gaugeType: this.gaugeType,
        frameDesign: this.frameDesign,
        backgroundColor: this.backgroundColor,
        valueColor: this.valueColor
      },
      indicators: {
        threshold: {
          value: this.threshold,
          show: true
        },
        alerts: [
          {
            id: 'critical',
            value: this.maxValue * 0.95,
            message: 'critical',
            severity: 'critical'
          },
          {
            id: 'warning',
            value: this.threshold,
            message: 'warning',
            severity: 'warning'
          }
        ]
      },
      segments: [
        {
          from: this.minValue,
          to: this.threshold,
          color: 'var(--ss3-accent-color)'
        },
        {
          from: this.threshold,
          to: this.maxValue,
          color: 'var(--ss3-warning-color)'
        }
      ]
    })
  }

  private emitValueChange(result: LinearRenderResult): void {
    this.dispatchEvent(
      new CustomEvent(gaugeContract.valueChangeEvent, {
        detail: toGaugeContractState('linear', result),
        bubbles: true,
        composed: true
      })
    )
  }

  private emitError(error: unknown): void {
    this.dispatchEvent(
      new CustomEvent(gaugeContract.errorEvent, {
        detail: {
          kind: 'linear',
          message: error instanceof Error ? error.message : 'Unknown linear rendering error'
        },
        bubbles: true,
        composed: true
      })
    )
  }

  private renderGauge(animateValue: boolean): void {
    const drawContext = this.getDrawContext()
    const canvas = this.renderRoot.querySelector('canvas')
    if (!drawContext || !(canvas instanceof HTMLCanvasElement)) {
      return
    }

    canvas.width = this.width
    canvas.height = this.height

    const paint = this.getThemePaint()
    const nextValue = this.value
    this.animationHandle?.cancel()

    try {
      if (animateValue && this.currentValue !== nextValue) {
        const animationConfig = this.buildConfig(nextValue)
        this.animationHandle = animateLinearGauge({
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
      const result = renderLinearGauge(drawContext, renderConfig, { value: nextValue, paint })
      this.currentValue = nextValue
      this.emitValueChange(result)
    } catch (error) {
      this.emitError(error)
    }
  }

  override render() {
    return html`
      <canvas
        width=${this.width}
        height=${this.height}
        role="img"
        aria-label="${this.title || 'Linear Gauge'}"
      ></canvas>
    `
  }
}

@customElement('steelseries-compass-v3')
export class SteelseriesCompassV3Element extends LitElement {
  @query('canvas')
  private canvasElement?: HTMLCanvasElement

  private currentHeading = 0
  private animationHandle: AnimationRunHandle | undefined

  static override styles = css`
    :host {
      --ss3-font-family: system-ui, sans-serif;
      --ss3-text-color: #eceff3;
      --ss3-accent-color: #d01e2f;
      --ss3-warning-color: #d97706;
      --ss3-danger-color: #ef4444;
      display: inline-block;
      font-family: var(--ss3-font-family);
      color: var(--ss3-text-color);
    }

    canvas {
      display: block;
    }
  `

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
    converter: {
      fromAttribute: (value: string | null) => value !== null && value !== 'false'
    }
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

declare global {
  interface HTMLElementTagNameMap {
    'steelseries-radial-v3': SteelseriesRadialV3Element
    'steelseries-linear-v3': SteelseriesLinearV3Element
    'steelseries-compass-v3': SteelseriesCompassV3Element
  }
}
