import {
  animateWindRoseGauge,
  renderWindRoseGauge,
  toGaugeContractState,
  windRoseGaugeConfigSchema,
  type WindRoseCustomLayer,
  type WindRoseDrawContext,
  type WindRoseGaugeConfig,
  type WindRosePetal,
  type WindRoseRenderResult,
  type WindRoseValue
} from '@bradsjm/steelseries-v3-core'
import { html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'

import { booleanAttributeConverter } from '../shared/css-utils.js'
import { SteelseriesGaugeElement } from '../shared/gauge-base-element.js'
import { sharedStyles } from '../shared/shared-styles.js'

const buildDefaultPetals = (binCount: 8 | 16 | 32 = 16): WindRosePetal[] => {
  const binStep = 360 / binCount
  return Array.from({ length: binCount }, (_, index) => ({
    direction: index * binStep,
    value: 0
  }))
}

@customElement('steelseries-wind-rose-v3')
export class SteelseriesWindRoseV3Element extends SteelseriesGaugeElement {
  @query('canvas')
  private canvasElement?: HTMLCanvasElement

  private currentValue: WindRoseValue = {
    petals: buildDefaultPetals(),
    maxValue: 100
  }

  static override styles = sharedStyles

  @property({ attribute: false })
  petals: WindRosePetal[] = buildDefaultPetals()

  @property({ type: Number, attribute: 'max-value' })
  maxValue = 100

  @property({ type: Number })
  size = 220

  @property({ type: String })
  override title = 'Wind Rose'

  @property({ type: String })
  unit = ''

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

  @property({ type: String, attribute: 'knob-type' })
  knobType: 'standardKnob' | 'metalKnob' = 'standardKnob'

  @property({ type: String, attribute: 'knob-style' })
  knobStyle: 'black' | 'brass' | 'silver' = 'silver'

  @property({ type: String, attribute: 'foreground-type' })
  foregroundType: 'type1' | 'type2' | 'type3' | 'type4' | 'type5' = 'type1'

  @property({ type: String, attribute: 'rose-center-color' })
  roseCenterColor = '#f5a68a'

  @property({ type: String, attribute: 'rose-edge-color' })
  roseEdgeColor = '#d6452f'

  @property({ type: String, attribute: 'rose-line-color' })
  roseLineColor = '#8d2f1f'

  @property({ type: Boolean, attribute: 'show-outline', converter: booleanAttributeConverter })
  showOutline = true

  @property({ type: Number, attribute: 'rose-center-alpha' })
  roseCenterAlpha = 0.25

  @property({ type: Number, attribute: 'rose-edge-alpha' })
  roseEdgeAlpha = 0.7

  @property({ attribute: false })
  customLayer: WindRoseCustomLayer | null = null

  @property({ type: Boolean, attribute: 'show-frame', converter: booleanAttributeConverter })
  showFrame = true

  @property({ type: Boolean, attribute: 'show-background', converter: booleanAttributeConverter })
  showBackground = true

  @property({ type: Boolean, attribute: 'show-foreground', converter: booleanAttributeConverter })
  showForeground = true

  @property({
    type: Boolean,
    attribute: 'show-point-symbols',
    converter: booleanAttributeConverter
  })
  showPointSymbols = true

  @property({ type: Boolean, attribute: 'show-degree-scale', converter: booleanAttributeConverter })
  showDegreeScale = false

  @property({ type: Boolean, attribute: 'show-tickmarks', converter: booleanAttributeConverter })
  showTickmarks = true

  @property({ type: Boolean, attribute: 'animate-value', converter: booleanAttributeConverter })
  animateValue = true

  override firstUpdated(): void {
    this.currentValue = this.buildConfig().value
    this.renderGauge(false)
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.size === 0) {
      return
    }

    const valueChanged = changedProperties.has('petals') || changedProperties.has('maxValue')
    const onlyValueChanged = valueChanged && changedProperties.size <= 2
    this.renderGauge(onlyValueChanged && this.animateValue)
  }

  private getDrawContext(): WindRoseDrawContext | undefined {
    return this.getCanvasContext<WindRoseDrawContext>(this.canvasElement)
  }

  private buildConfig(): WindRoseGaugeConfig {
    const maxFromPetals = this.petals.reduce((max, petal) => Math.max(max, petal.value), 0)
    const maxValue = this.maxValue > 0 ? this.maxValue : Math.max(1, maxFromPetals)

    return windRoseGaugeConfigSchema.parse({
      value: {
        petals: this.petals,
        maxValue
      },
      size: {
        width: this.size,
        height: this.size
      },
      text: {
        ...(this.title.trim() ? { title: this.title } : {}),
        ...(this.unit.trim() ? { unit: this.unit } : {})
      },
      visibility: {
        showFrame: this.showFrame,
        showBackground: this.showBackground,
        showForeground: this.showForeground,
        showLcd: false,
        showPointSymbols: this.showPointSymbols,
        showTickmarks: this.showTickmarks,
        showDegreeScale: this.showDegreeScale
      },
      style: {
        frameDesign: this.frameDesign,
        backgroundColor: this.backgroundColor,
        foregroundType: this.foregroundType,
        knobType: this.knobType,
        knobStyle: this.knobStyle,
        roseGradient: {
          centerColor: this.roseCenterColor,
          edgeColor: this.roseEdgeColor,
          centerAlpha: this.roseCenterAlpha,
          edgeAlpha: this.roseEdgeAlpha
        },
        showOutline: this.showOutline,
        roseLineColor: this.roseLineColor,
        ...(this.customLayer ? { customLayer: this.customLayer } : {})
      }
    })
  }

  private emitValueChange(result: WindRoseRenderResult): void {
    this.emitGaugeValueChange(toGaugeContractState('wind-rose', result))
  }

  private emitError(error: unknown): void {
    this.emitGaugeError('wind-rose', error, 'Unknown wind rose rendering error')
  }

  private renderGauge(animateValue: boolean): void {
    const drawContext = this.getDrawContext()
    if (!drawContext || !this.canvasElement) {
      return
    }

    this.canvasElement.width = this.size
    this.canvasElement.height = this.size

    const paint = this.getThemePaint()
    this.animationHandle?.cancel()

    try {
      const config = this.buildConfig()
      const nextValue = config.value

      if (animateValue) {
        this.animationHandle = animateWindRoseGauge({
          context: drawContext,
          config,
          fromValue: this.currentValue,
          toValue: nextValue,
          paint,
          onFrame: (frame) => {
            this.currentValue = frame.valueData
            this.emitValueChange(frame)
          },
          onComplete: (frame) => {
            this.currentValue = frame.valueData
            this.emitValueChange(frame)
          }
        })
        return
      }

      const result = renderWindRoseGauge(drawContext, config, {
        value: nextValue,
        paint
      })
      this.currentValue = result.valueData
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
        aria-label="${this.title || 'Wind Rose Gauge'}"
      ></canvas>
    `
  }
}
