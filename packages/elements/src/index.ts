import {
  animateCompassGauge,
  animateLinearGauge,
  animateRadialGauge,
  compassGaugeConfigSchema,
  createStyleTokenSource,
  linearGaugeConfigSchema,
  renderCompassGauge,
  renderLinearGauge,
  radialGaugeConfigSchema,
  renderRadialGauge,
  resolveThemePaint,
  type AnimationRunHandle,
  type CompassDrawContext,
  type CompassGaugeConfig,
  type LinearDrawContext,
  type LinearGaugeConfig,
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

    .wrapper {
      display: grid;
      justify-items: center;
      gap: 0.35rem;
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

    .meta {
      display: grid;
      justify-items: center;
      gap: 0.1rem;
      color: var(--ss3-text-color);
    }

    .meta .title {
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 600;
    }

    .meta .unit {
      font-size: 0.68rem;
      opacity: 0.82;
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
      <div class="wrapper">
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
        <div class="meta">
          <span class="title">${this.title}</span>
          <span class="unit">${this.unit || 'value'}</span>
        </div>
      </div>
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
      border-radius: 14px;
      background: var(--ss3-frame-color);
      padding: 0.5rem;
      display: grid;
      place-items: center;
      box-sizing: border-box;
    }

    .wrapper {
      display: grid;
      justify-items: center;
      gap: 0.35rem;
    }

    .dial {
      border-radius: 10px;
      background: var(--ss3-background-color);
      box-sizing: border-box;
      display: grid;
      place-items: center;
    }

    canvas {
      display: block;
      border-radius: inherit;
    }

    .meta {
      display: grid;
      justify-items: center;
      gap: 0.1rem;
      color: var(--ss3-text-color);
    }

    .meta .title {
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 600;
    }

    .meta .unit {
      font-size: 0.68rem;
      opacity: 0.82;
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

  private getDrawContext(): LinearDrawContext | undefined {
    if (!this.canvasElement) {
      return undefined
    }

    const drawContext = this.canvasElement.getContext('2d')
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
        title: this.title,
        unit: this.unit
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

    this.canvasElement.width = this.width
    this.canvasElement.height = this.height

    const paint = this.getThemePaint()
    const nextValue = this.value
    this.animationHandle?.cancel()

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
        },
        onComplete: (frame) => {
          this.currentValue = frame.value
        }
      })
      return
    }

    const renderConfig = this.buildConfig(nextValue)
    renderLinearGauge(drawContext, renderConfig, { value: nextValue, paint })
    this.currentValue = nextValue
  }

  override render() {
    return html`
      <div class="wrapper">
        <div class="frame">
          <div class="dial">
            <canvas
              width=${this.width}
              height=${this.height}
              role="img"
              aria-label="${this.title || 'Linear Gauge'}"
            ></canvas>
          </div>
        </div>
        <div class="meta">
          <span class="title">${this.title}</span>
          <span class="unit">${this.unit || 'value'}</span>
        </div>
      </div>
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

    .wrapper {
      display: grid;
      justify-items: center;
      gap: 0.35rem;
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

    .meta {
      display: grid;
      justify-items: center;
      gap: 0.1rem;
      color: var(--ss3-text-color);
    }

    .meta .title {
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 600;
    }

    .meta .unit {
      font-size: 0.68rem;
      opacity: 0.82;
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

  @property({ type: Boolean, attribute: 'animate-value' })
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
        title: this.title,
        unit: this.unit
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

    if (animateValue && this.currentHeading !== nextHeading) {
      const animationConfig = this.buildConfig(nextHeading)
      this.animationHandle = animateCompassGauge({
        context: drawContext,
        config: animationConfig,
        from: this.currentHeading,
        to: nextHeading,
        paint,
        onFrame: (frame) => {
          this.currentHeading = frame.heading
        },
        onComplete: (frame) => {
          this.currentHeading = frame.heading
        }
      })
      return
    }

    const renderConfig = this.buildConfig(nextHeading)
    renderCompassGauge(drawContext, renderConfig, { heading: nextHeading, paint })
    this.currentHeading = nextHeading
  }

  override render() {
    return html`
      <div class="wrapper">
        <div class="frame">
          <div class="dial">
            <canvas
              width=${this.size}
              height=${this.size}
              role="img"
              aria-label="${this.title || 'Compass Gauge'}"
            ></canvas>
          </div>
        </div>
        <div class="meta">
          <span class="title">${this.title}</span>
          <span class="unit">${this.unit || 'deg'}</span>
        </div>
      </div>
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
