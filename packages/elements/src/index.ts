import {
  animateRadialGauge,
  createStyleTokenSource,
  radialGaugeConfigSchema,
  renderRadialGauge,
  resolveThemePaint,
  type AnimationRunHandle,
  type RadialDrawContext,
  type RadialGaugeConfig,
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
      --ss3-text-color: #1f2937;
      --ss3-background-color: #f8fafc;
      --ss3-frame-color: #dbe4ee;
      --ss3-accent-color: #0f766e;
      --ss3-warning-color: #b45309;
      --ss3-danger-color: #b91c1c;
      display: inline-grid;
      font-family: var(--ss3-font-family);
      color: var(--ss3-text-color);
    }

    .frame {
      border-radius: 9999px;
      background: var(--ss3-frame-color);
      padding: 0.5rem;
      display: grid;
      place-items: center;
      box-sizing: border-box;
    }

    .dial {
      border-radius: inherit;
      background: var(--ss3-background-color);
      box-sizing: border-box;
      display: grid;
      place-items: center;
    }

    canvas {
      display: block;
      border-radius: inherit;
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

  @property({ type: Boolean, attribute: 'animate-value' })
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
    if (!this.canvasElement) {
      return undefined
    }

    const drawContext = this.canvasElement.getContext('2d')
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
        title: this.title,
        unit: this.unit
      },
      scale: {
        majorTickCount: 9,
        minorTicksPerMajor: 4
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

  private renderGauge(animateValue: boolean): void {
    const drawContext = this.getDrawContext()
    if (!drawContext || !this.canvasElement) {
      return
    }

    this.canvasElement.width = this.size
    this.canvasElement.height = this.size

    const paint = this.getThemePaint()
    const nextValue = this.value
    this.animationHandle?.cancel()

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
        },
        onComplete: (frame) => {
          this.currentValue = frame.value
        }
      })
      return
    }

    const renderConfig = this.buildConfig(nextValue)
    renderRadialGauge(drawContext, renderConfig, { value: nextValue, paint })
    this.currentValue = nextValue
  }

  override render() {
    return html`
      <div class="frame">
        <div class="dial">
          <canvas
            width=${this.size}
            height=${this.size}
            role="img"
            aria-label="${this.title || 'Radial Gauge'}"
          ></canvas>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'steelseries-radial-v3': SteelseriesRadialV3Element
  }
}
