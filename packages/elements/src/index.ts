import {
  animateCompassGauge,
  animateRadialBargraphGauge,
  animateWindDirectionGauge,
  compassGaugeConfigSchema,
  createStyleTokenSource,
  gaugeContract,
  renderCompassGauge,
  radialBargraphGaugeConfigSchema,
  renderRadialBargraphGauge,
  renderWindDirectionGauge,
  resolveThemePaint,
  toGaugeContractState,
  windDirectionGaugeConfigSchema,
  type AnimationRunHandle,
  type CompassDrawContext,
  type CompassGaugeConfig,
  type CompassRenderResult,
  type RadialBargraphDrawContext,
  type RadialBargraphGaugeConfig,
  type RadialBargraphRenderResult,
  type ThemePaint,
  type WindDirectionDrawContext,
  type WindDirectionGaugeConfig,
  type WindDirectionRenderResult
} from '@bradsjm/steelseries-v3-core'
import { LitElement, css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'

const booleanAttributeConverter = {
  fromAttribute: (value: string | null) => value !== null && value !== 'false'
}

const readCssCustomPropertyColor = (
  element: Element,
  propertyName: string,
  fallback: string
): string => {
  const value = getComputedStyle(element).getPropertyValue(propertyName).trim()
  return value.length > 0 ? value : fallback
}

@customElement('steelseries-radial-bargraph-v3')
export class SteelseriesRadialBargraphV3Element extends LitElement {
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
  override title = 'Radial Bargraph'

  @property({ type: String })
  unit = ''

  @property({ type: Number })
  threshold = 80

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

  private getDrawContext(): RadialBargraphDrawContext | undefined {
    const canvas = this.renderRoot.querySelector('canvas')
    if (!(canvas instanceof HTMLCanvasElement)) {
      return undefined
    }

    const drawContext = canvas.getContext('2d')
    if (!drawContext) {
      return undefined
    }

    return drawContext as RadialBargraphDrawContext
  }

  private buildConfig(current: number): RadialBargraphGaugeConfig {
    const accentColor = readCssCustomPropertyColor(this, '--ss3-accent-color', '#d97706')
    const warningColor = readCssCustomPropertyColor(this, '--ss3-warning-color', '#c5162e')
    const dangerColor = readCssCustomPropertyColor(this, '--ss3-danger-color', '#ef4444')

    const sections = this.useSectionColors
      ? [
          {
            from: this.minValue,
            to: this.threshold,
            color: accentColor
          },
          {
            from: this.threshold,
            to: this.maxValue,
            color: warningColor
          }
        ]
      : []

    const valueGradientStops = this.useValueGradient
      ? [
          { fraction: 0, color: accentColor },
          { fraction: 0.75, color: warningColor },
          { fraction: 1, color: dangerColor }
        ]
      : []

    const defaultTickLabelOrientation = this.gaugeType === 'type1' ? 'tangent' : 'normal'

    return radialBargraphGaugeConfigSchema.parse({
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
        ],
        ledVisible: this.ledVisible,
        userLedVisible: this.userLedVisible,
        trendVisible: this.trendVisible,
        trendState: this.trendState
      }
    })
  }

  private emitValueChange(result: RadialBargraphRenderResult): void {
    this.dispatchEvent(
      new CustomEvent(gaugeContract.valueChangeEvent, {
        detail: toGaugeContractState('radial-bargraph', result),
        bubbles: true,
        composed: true
      })
    )
  }

  private emitError(error: unknown): void {
    this.dispatchEvent(
      new CustomEvent(gaugeContract.errorEvent, {
        detail: {
          kind: 'radial-bargraph',
          message:
            error instanceof Error ? error.message : 'Unknown radial bargraph rendering error'
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

@customElement('steelseries-wind-direction-v3')
export class SteelseriesWindDirectionV3Element extends LitElement {
  @query('canvas')
  private canvasElement?: HTMLCanvasElement

  private currentLatest = 0
  private currentAverage = 0
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

  @property({ type: Number, attribute: 'value-latest' })
  valueLatest = 0

  @property({ type: Number, attribute: 'value-average' })
  valueAverage = 0

  @property({ type: Number })
  size = 200

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

  @property({ type: Boolean, attribute: 'digital-font', converter: booleanAttributeConverter })
  digitalFont = false

  @property({ type: Boolean, attribute: 'use-color-labels', converter: booleanAttributeConverter })
  useColorLabels = false

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

  override disconnectedCallback() {
    this.animationHandle?.cancel()
    this.animationHandle = undefined
    super.disconnectedCallback()
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

  private getThemePaint(): ThemePaint {
    const computedStyle = getComputedStyle(this)
    return resolveThemePaint({
      source: createStyleTokenSource(computedStyle)
    })
  }

  private getDrawContext(): WindDirectionDrawContext | undefined {
    if (!this.canvasElement) {
      return undefined
    }

    const drawContext = this.canvasElement.getContext('2d')
    if (!drawContext) {
      return undefined
    }

    return drawContext as WindDirectionDrawContext
  }

  private buildConfig(): WindDirectionGaugeConfig {
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
        degreeScaleHalf: false,
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
        pointSymbols: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
      },
      lcdTitles: {
        latest: this.lcdTitleLatest,
        average: this.lcdTitleAverage
      },
      sections: [],
      areas: []
    })
  }

  private emitValueChange(result: WindDirectionRenderResult): void {
    this.dispatchEvent(
      new CustomEvent(gaugeContract.valueChangeEvent, {
        detail: toGaugeContractState('wind-direction', result),
        bubbles: true,
        composed: true
      })
    )
  }

  private emitError(error: unknown): void {
    this.dispatchEvent(
      new CustomEvent(gaugeContract.errorEvent, {
        detail: {
          kind: 'wind-direction',
          message: error instanceof Error ? error.message : 'Unknown wind direction rendering error'
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

declare global {
  interface HTMLElementTagNameMap {
    'steelseries-radial-bargraph-v3': SteelseriesRadialBargraphV3Element
    'steelseries-compass-v3': SteelseriesCompassV3Element
    'steelseries-wind-direction-v3': SteelseriesWindDirectionV3Element
  }
}
