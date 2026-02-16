import '@bradsjm/weather-gauges-elements'
import { LitElement, css, html, type TemplateResult } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'

import {
  type GaugeType,
  resolveGaugeData,
  type HomeAssistant,
  type MeasurementPreset,
  type ResolvedGaugeData,
  type ValidationMode
} from './value-resolution.js'

export const WEATHER_GAUGES_CARD_TAG = 'weather-gauges-card'
export const WEATHER_GAUGES_CARD_TYPE = `custom:${WEATHER_GAUGES_CARD_TAG}`

type WeatherGaugeTheme = 'classic' | 'flat' | 'high-contrast'

export type WeatherGaugesCardConfig = {
  type: string
  entity?: string
  title?: string
  label?: string
  gauge_type?: GaugeType
  attribute?: string
  average_attribute?: string
  preset?: MeasurementPreset
  unit?: string
  gauge_min?: number
  gauge_max?: number
  threshold?: number
  threshold_label?: string
  show_threshold?: boolean
  decimals?: number
  size?: number
  animated?: boolean
  duration?: number
  validation?: ValidationMode
  theme?: WeatherGaugeTheme
}

type NormalizedCardConfig = {
  type: string
  entity: string
  title: string | undefined
  label: string | undefined
  gaugeType: GaugeType
  attribute: string | undefined
  averageAttribute: string | undefined
  preset: MeasurementPreset
  unit: string | undefined
  gaugeMin: number | undefined
  gaugeMax: number | undefined
  threshold: number | undefined
  thresholdLabel: string | undefined
  showThreshold: boolean
  decimals: number | undefined
  size: number | undefined
  animated: boolean
  duration: number
  validation: ValidationMode
  theme: WeatherGaugeTheme
}

const DEFAULT_SIZE = 220
const MIN_AUTO_SIZE = 140
const MAX_AUTO_SIZE = 360
const CARD_PADDING = 24

const GAUGE_TYPES: GaugeType[] = ['radial', 'radial-bargraph', 'compass', 'wind-direction']

const isGaugeType = (value: string): value is GaugeType => GAUGE_TYPES.includes(value as GaugeType)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const normalizeConfig = (config: WeatherGaugesCardConfig): NormalizedCardConfig => {
  const entity = config.entity?.trim()
  if (!entity) {
    throw new Error('weather-gauges-card requires an `entity` field.')
  }

  const gaugeType = config.gauge_type ?? 'radial'
  if (!isGaugeType(gaugeType)) {
    throw new Error(
      `Unsupported gauge_type "${String(config.gauge_type)}". Use one of: ${GAUGE_TYPES.join(', ')}.`
    )
  }

  if (isFiniteNumber(config.gauge_min) && isFiniteNumber(config.gauge_max)) {
    if (config.gauge_min >= config.gauge_max) {
      throw new Error('`gauge_min` must be lower than `gauge_max`.')
    }
  }

  if (isFiniteNumber(config.size) && config.size <= 0) {
    throw new Error('`size` must be greater than 0 when provided.')
  }

  return {
    type: config.type,
    entity,
    title: config.title,
    label: config.label,
    gaugeType,
    attribute: config.attribute,
    averageAttribute: config.average_attribute,
    preset: config.preset ?? '',
    unit: config.unit,
    gaugeMin: config.gauge_min,
    gaugeMax: config.gauge_max,
    threshold: config.threshold,
    thresholdLabel: config.threshold_label,
    showThreshold: config.show_threshold ?? false,
    decimals: config.decimals,
    size: config.size,
    animated: config.animated ?? true,
    duration: config.duration ?? 500,
    validation: config.validation ?? 'clamp',
    theme: config.theme ?? 'classic'
  }
}

export class WeatherGaugesCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .card-content {
      min-height: 176px;
      padding: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .gauge-shell {
      --wx-text-color: var(--primary-text-color);
      --wx-background-color: var(--ha-card-background, var(--card-background-color));
      --wx-frame-color: var(--divider-color);
      --wx-accent-color: var(--primary-color);
      --wx-warning-color: var(--warning-color, #f59e0b);
      --wx-danger-color: var(--error-color, #ef4444);
    }

    .empty-state {
      padding: 16px;
      color: var(--secondary-text-color);
      text-align: center;
      font-size: 0.95rem;
      line-height: 1.4;
    }
  `

  private _config?: NormalizedCardConfig
  private _hass?: HomeAssistant
  private _autoSize = DEFAULT_SIZE
  private _resizeObserver: ResizeObserver | undefined

  static getStubConfig(): WeatherGaugesCardConfig {
    return {
      type: WEATHER_GAUGES_CARD_TYPE,
      entity: 'sensor.outdoor_temperature',
      title: 'Outdoor Temperature',
      gauge_type: 'radial',
      preset: 'temperature'
    }
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: 'entity',
          required: true,
          selector: { entity: {} }
        },
        {
          name: 'title',
          selector: { text: {} }
        },
        {
          name: 'gauge_type',
          selector: {
            select: {
              mode: 'dropdown',
              options: [
                { value: 'radial', label: 'Radial' },
                { value: 'radial-bargraph', label: 'Radial Bargraph' },
                { value: 'compass', label: 'Compass' },
                { value: 'wind-direction', label: 'Wind Direction' }
              ]
            }
          }
        },
        {
          type: 'expandable',
          title: 'Value Source',
          schema: [
            {
              name: 'attribute',
              selector: { text: {} }
            },
            {
              name: 'average_attribute',
              selector: { text: {} }
            },
            {
              name: 'preset',
              selector: {
                select: {
                  mode: 'dropdown',
                  options: [
                    { value: '', label: 'None' },
                    { value: 'temperature', label: 'Temperature' },
                    { value: 'humidity', label: 'Humidity' },
                    { value: 'pressure', label: 'Pressure' },
                    { value: 'wind-speed', label: 'Wind Speed' },
                    { value: 'rainfall', label: 'Rainfall' },
                    { value: 'rain-rate', label: 'Rain Rate' },
                    { value: 'solar', label: 'Solar' },
                    { value: 'uv-index', label: 'UV Index' },
                    { value: 'cloud-base', label: 'Cloud Base' }
                  ]
                }
              }
            },
            {
              name: 'unit',
              selector: { text: {} }
            }
          ]
        },
        {
          type: 'expandable',
          title: 'Range & Display',
          schema: [
            {
              name: 'gauge_min',
              selector: { number: { mode: 'box' } }
            },
            {
              name: 'gauge_max',
              selector: { number: { mode: 'box' } }
            },
            {
              name: 'decimals',
              selector: { number: { mode: 'box', min: 0, max: 4, step: 1 } }
            },
            {
              name: 'size',
              selector: { number: { mode: 'box', min: 120, max: 420, step: 2 } }
            }
          ]
        },
        {
          type: 'expandable',
          title: 'Style & Motion',
          schema: [
            {
              name: 'animated',
              selector: { boolean: {} }
            },
            {
              name: 'duration',
              selector: { number: { mode: 'box', min: 0, max: 5000, step: 50 } }
            },
            {
              name: 'theme',
              selector: {
                select: {
                  mode: 'dropdown',
                  options: [
                    { value: 'classic', label: 'Classic' },
                    { value: 'flat', label: 'Flat' },
                    { value: 'high-contrast', label: 'High Contrast' }
                  ]
                }
              }
            },
            {
              name: 'validation',
              selector: {
                select: {
                  mode: 'dropdown',
                  options: [
                    { value: 'clamp', label: 'Clamp' },
                    { value: 'coerce', label: 'Coerce' },
                    { value: 'strict', label: 'Strict' }
                  ]
                }
              }
            }
          ]
        }
      ]
    }
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass
    this.requestUpdate()
  }

  setConfig(config: WeatherGaugesCardConfig): void {
    this._config = normalizeConfig(config)
  }

  getCardSize(): number {
    return 4
  }

  getGridOptions() {
    return {
      columns: 6,
      min_columns: 4,
      max_columns: 8,
      rows: 4,
      min_rows: 3,
      max_rows: 6
    }
  }

  override connectedCallback(): void {
    super.connectedCallback()
    this._resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      const width = entry?.contentRect.width
      if (!width || width <= 0 || this._config?.size) {
        return
      }

      const nextSize = clamp(Math.round(width - CARD_PADDING), MIN_AUTO_SIZE, MAX_AUTO_SIZE)
      if (nextSize !== this._autoSize) {
        this._autoSize = nextSize
        this.requestUpdate()
      }
    })
    this._resizeObserver.observe(this)
  }

  override disconnectedCallback(): void {
    this._resizeObserver?.disconnect()
    this._resizeObserver = undefined
    super.disconnectedCallback()
  }

  override render(): TemplateResult {
    if (!this._config) {
      return this.renderMessage('Card is not configured yet.')
    }

    const data = resolveGaugeData(this._hass, {
      entity: this._config.entity,
      gaugeType: this._config.gaugeType,
      attribute: this._config.attribute,
      averageAttribute: this._config.averageAttribute,
      preset: this._config.preset,
      title: this._config.title,
      label: this._config.label,
      unitOverride: this._config.unit,
      minOverride: this._config.gaugeMin,
      maxOverride: this._config.gaugeMax
    })

    if (!data.ok) {
      return this.renderMessage(data.message, this._config.title)
    }

    const gaugeSize = this._config.size ?? this._autoSize

    return html`
      <ha-card header=${ifDefined(this._config.title)}>
        <div class="card-content" @click=${this.openMoreInfo}>
          <div class="gauge-shell">${this.renderGauge(data, gaugeSize)}</div>
        </div>
      </ha-card>
    `
  }

  private renderMessage(message: string, header?: string): TemplateResult {
    return html`
      <ha-card header=${ifDefined(header)}>
        <div class="empty-state">${message}</div>
      </ha-card>
    `
  }

  private renderGauge(data: ResolvedGaugeData, size: number): TemplateResult {
    const min = data.min ?? 0
    const max = data.max ?? 100

    if (this._config?.gaugeType === 'radial-bargraph') {
      return html`
        <wx-bargraph
          .value=${data.value}
          .size=${size}
          .label=${data.label}
          .unit=${data.unit}
          .preset=${data.preset}
          .minValue=${min}
          .maxValue=${max}
          .threshold=${this._config.threshold ?? 0}
          .thresholdLabel=${this._config.thresholdLabel ?? ''}
          .showThreshold=${this._config.showThreshold}
          .lcdDecimals=${this._config.decimals}
          .animated=${this._config.animated}
          .duration=${this._config.duration}
          .validation=${this._config.validation}
          .theme=${this._config.theme}
        ></wx-bargraph>
      `
    }

    if (this._config?.gaugeType === 'compass') {
      return html`
        <wx-compass
          .value=${data.value}
          .size=${size}
          .label=${data.label}
          .unit=${data.unit}
          .animated=${this._config.animated}
          .duration=${this._config.duration}
          .validation=${this._config.validation}
          .theme=${this._config.theme}
        ></wx-compass>
      `
    }

    if (this._config?.gaugeType === 'wind-direction') {
      return html`
        <wx-wind-direction
          .value=${data.value}
          .average=${data.average}
          .size=${size}
          .label=${data.label}
          .unit=${data.unit}
          .animated=${this._config.animated}
          .duration=${this._config.duration}
          .validation=${this._config.validation}
          .theme=${this._config.theme}
        ></wx-wind-direction>
      `
    }

    return html`
      <wx-gauge
        .value=${data.value}
        .size=${size}
        .label=${data.label}
        .unit=${data.unit}
        .preset=${data.preset}
        .minValue=${min}
        .maxValue=${max}
        .threshold=${this._config?.threshold ?? 0}
        .thresholdLabel=${this._config?.thresholdLabel ?? ''}
        .showThreshold=${this._config?.showThreshold ?? false}
        .animated=${this._config?.animated ?? true}
        .duration=${this._config?.duration ?? 500}
        .validation=${this._config?.validation ?? 'clamp'}
        .theme=${this._config?.theme ?? 'classic'}
      ></wx-gauge>
    `
  }

  private openMoreInfo = (): void => {
    if (!this._config?.entity) {
      return
    }

    this.dispatchEvent(
      new CustomEvent('hass-more-info', {
        bubbles: true,
        composed: true,
        detail: { entityId: this._config.entity }
      })
    )
  }
}

if (!customElements.get(WEATHER_GAUGES_CARD_TAG)) {
  customElements.define(WEATHER_GAUGES_CARD_TAG, WeatherGaugesCard)
}

declare global {
  interface Window {
    customCards?: Array<{
      type: string
      name: string
      description: string
      preview?: boolean
      documentationURL?: string
    }>
  }

  interface HTMLElementTagNameMap {
    'weather-gauges-card': WeatherGaugesCard
  }
}

window.customCards = window.customCards || []

if (
  !window.customCards.some(
    (card) => card.type === WEATHER_GAUGES_CARD_TAG || card.type === WEATHER_GAUGES_CARD_TYPE
  )
) {
  window.customCards.push({
    type: WEATHER_GAUGES_CARD_TAG,
    name: 'Weather Gauges Card',
    description: 'Single-gauge Home Assistant card for weather-gauges web components',
    preview: true,
    documentationURL: 'https://github.com/bradsjm/weather-gauges/tree/main/packages/ha-cards'
  })
}
