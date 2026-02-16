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
import {
  fetchWindRoseHistoryData,
  type WindRoseBinCount,
  type WindRoseHistoryData
} from './wind-rose-history.js'

export const WEATHER_GAUGES_RADIAL_CARD_TAG = 'weather-gauges-radial-card'
export const WEATHER_GAUGES_RADIAL_CARD_TYPE = `custom:${WEATHER_GAUGES_RADIAL_CARD_TAG}`
export const WEATHER_GAUGES_RADIAL_BARGRAPH_CARD_TAG = 'weather-gauges-radial-bargraph-card'
export const WEATHER_GAUGES_RADIAL_BARGRAPH_CARD_TYPE = `custom:${WEATHER_GAUGES_RADIAL_BARGRAPH_CARD_TAG}`
export const WEATHER_GAUGES_COMPASS_CARD_TAG = 'weather-gauges-compass-card'
export const WEATHER_GAUGES_COMPASS_CARD_TYPE = `custom:${WEATHER_GAUGES_COMPASS_CARD_TAG}`
export const WEATHER_GAUGES_WIND_DIRECTION_CARD_TAG = 'weather-gauges-wind-direction-card'
export const WEATHER_GAUGES_WIND_DIRECTION_CARD_TYPE = `custom:${WEATHER_GAUGES_WIND_DIRECTION_CARD_TAG}`
export const WEATHER_GAUGES_WIND_ROSE_CARD_TAG = 'weather-gauges-wind-rose-card'
export const WEATHER_GAUGES_WIND_ROSE_CARD_TYPE = `custom:${WEATHER_GAUGES_WIND_ROSE_CARD_TAG}`

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

export type WeatherGaugesWindRoseCardConfig = {
  type: string
  entity?: string
  title?: string
  label?: string
  history_hours?: number
  bin_count?: WindRoseBinCount
  refresh_interval_seconds?: number
  gauge_max?: number
  unit?: string
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

type NormalizedWindRoseCardConfig = {
  type: string
  entity: string
  title: string | undefined
  label: string | undefined
  historyHours: number
  binCount: WindRoseBinCount
  refreshIntervalSeconds: number
  gaugeMax: number | undefined
  unit: string | undefined
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
const MAX_HISTORY_LOOKBACK_HOURS = 24
const MIN_REFRESH_INTERVAL_SECONDS = 60
const DEFAULT_WIND_ROSE_HISTORY_HOURS = 24
const DEFAULT_WIND_ROSE_BIN_COUNT: WindRoseBinCount = 16
const DEFAULT_WIND_ROSE_REFRESH_SECONDS = 300

const GAUGE_TYPES: GaugeType[] = ['radial', 'radial-bargraph', 'compass', 'wind-direction']

const CARD_TYPE_TO_GAUGE_TYPE: Record<string, GaugeType> = {
  [WEATHER_GAUGES_RADIAL_CARD_TYPE]: 'radial',
  [WEATHER_GAUGES_RADIAL_BARGRAPH_CARD_TYPE]: 'radial-bargraph',
  [WEATHER_GAUGES_COMPASS_CARD_TYPE]: 'compass',
  [WEATHER_GAUGES_WIND_DIRECTION_CARD_TYPE]: 'wind-direction'
}

const isGaugeType = (value: string): value is GaugeType => GAUGE_TYPES.includes(value as GaugeType)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const normalizeConfig = (
  config: WeatherGaugesCardConfig,
  defaultGaugeType: GaugeType
): NormalizedCardConfig => {
  const entity = config.entity?.trim()
  if (!entity) {
    throw new Error('Weather gauge cards require an `entity` field.')
  }

  const inferredGaugeType = CARD_TYPE_TO_GAUGE_TYPE[config.type] ?? defaultGaugeType
  if (
    config.type in CARD_TYPE_TO_GAUGE_TYPE &&
    config.gauge_type &&
    config.gauge_type !== inferredGaugeType
  ) {
    throw new Error(`Card type "${config.type}" only supports gauge_type "${inferredGaugeType}".`)
  }

  const gaugeType = config.gauge_type ?? inferredGaugeType
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

const isWindRoseBinCount = (value: number): value is WindRoseBinCount =>
  value === 8 || value === 16 || value === 32

const normalizeWindRoseConfig = (
  config: WeatherGaugesWindRoseCardConfig
): NormalizedWindRoseCardConfig => {
  const entity = config.entity?.trim()
  if (!entity) {
    throw new Error('Weather wind rose cards require an `entity` field.')
  }

  const historyHours = config.history_hours ?? DEFAULT_WIND_ROSE_HISTORY_HOURS
  if (!isFiniteNumber(historyHours) || historyHours <= 0) {
    throw new Error('`history_hours` must be a positive number.')
  }

  if (historyHours > MAX_HISTORY_LOOKBACK_HOURS) {
    throw new Error('`history_hours` cannot exceed 24 hours.')
  }

  const binCount = config.bin_count ?? DEFAULT_WIND_ROSE_BIN_COUNT
  if (!isWindRoseBinCount(binCount)) {
    throw new Error('`bin_count` must be one of: 8, 16, 32.')
  }

  const refreshIntervalSeconds =
    config.refresh_interval_seconds ?? DEFAULT_WIND_ROSE_REFRESH_SECONDS
  if (
    !isFiniteNumber(refreshIntervalSeconds) ||
    refreshIntervalSeconds < MIN_REFRESH_INTERVAL_SECONDS
  ) {
    throw new Error(
      `\`refresh_interval_seconds\` must be at least ${MIN_REFRESH_INTERVAL_SECONDS} seconds.`
    )
  }

  if (isFiniteNumber(config.size) && config.size <= 0) {
    throw new Error('`size` must be greater than 0 when provided.')
  }

  if (isFiniteNumber(config.gauge_max) && config.gauge_max <= 0) {
    throw new Error('`gauge_max` must be greater than 0 when provided.')
  }

  return {
    type: config.type,
    entity,
    title: config.title,
    label: config.label,
    historyHours,
    binCount,
    refreshIntervalSeconds,
    gaugeMax: config.gauge_max,
    unit: config.unit,
    size: config.size,
    animated: config.animated ?? true,
    duration: config.duration ?? 500,
    validation: config.validation ?? 'clamp',
    theme: config.theme ?? 'classic'
  }
}

export class WeatherGaugesCard extends LitElement {
  static cardType = WEATHER_GAUGES_RADIAL_CARD_TYPE
  static defaultGaugeType: GaugeType = 'radial'

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
    const cardClass = this as typeof WeatherGaugesCard
    return {
      type: cardClass.cardType,
      entity: 'sensor.outdoor_temperature',
      title: 'Outdoor Temperature',
      gauge_type: cardClass.defaultGaugeType,
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
    const cardClass = this.constructor as typeof WeatherGaugesCard
    this._config = normalizeConfig(config, cardClass.defaultGaugeType)
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

export class WeatherGaugesRadialCard extends WeatherGaugesCard {
  static override cardType = WEATHER_GAUGES_RADIAL_CARD_TYPE
  static override defaultGaugeType: GaugeType = 'radial'
}

export class WeatherGaugesRadialBargraphCard extends WeatherGaugesCard {
  static override cardType = WEATHER_GAUGES_RADIAL_BARGRAPH_CARD_TYPE
  static override defaultGaugeType: GaugeType = 'radial-bargraph'
}

export class WeatherGaugesCompassCard extends WeatherGaugesCard {
  static override cardType = WEATHER_GAUGES_COMPASS_CARD_TYPE
  static override defaultGaugeType: GaugeType = 'compass'
}

export class WeatherGaugesWindDirectionCard extends WeatherGaugesCard {
  static override cardType = WEATHER_GAUGES_WIND_DIRECTION_CARD_TYPE
  static override defaultGaugeType: GaugeType = 'wind-direction'
}

export class WeatherGaugesWindRoseCard extends LitElement {
  static cardType = WEATHER_GAUGES_WIND_ROSE_CARD_TYPE

  static override styles = css`
    :host {
      display: block;
    }

    .card-content {
      min-height: 176px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
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

    .meta {
      color: var(--secondary-text-color);
      font-size: 0.8rem;
      line-height: 1.2;
    }

    .empty-state {
      padding: 16px;
      color: var(--secondary-text-color);
      text-align: center;
      font-size: 0.95rem;
      line-height: 1.4;
    }
  `

  private _config: NormalizedWindRoseCardConfig | undefined
  private _hass: HomeAssistant | undefined
  private _historyData: WindRoseHistoryData | undefined
  private _errorMessage: string | undefined
  private _isLoading = false
  private _autoSize = DEFAULT_SIZE
  private _resizeObserver: ResizeObserver | undefined
  private _refreshHandle: number | undefined
  private _requestVersion = 0

  static getStubConfig(): WeatherGaugesWindRoseCardConfig {
    return {
      type: WEATHER_GAUGES_WIND_ROSE_CARD_TYPE,
      entity: 'sensor.wind_direction',
      title: 'Wind Rose',
      history_hours: DEFAULT_WIND_ROSE_HISTORY_HOURS,
      bin_count: DEFAULT_WIND_ROSE_BIN_COUNT
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
          name: 'label',
          selector: { text: {} }
        },
        {
          type: 'expandable',
          title: 'History & Buckets',
          schema: [
            {
              name: 'history_hours',
              selector: {
                number: {
                  mode: 'box',
                  min: 1,
                  max: 24,
                  step: 1
                }
              }
            },
            {
              name: 'bin_count',
              selector: {
                select: {
                  mode: 'dropdown',
                  options: [
                    { value: 8, label: '8 bins' },
                    { value: 16, label: '16 bins' },
                    { value: 32, label: '32 bins' }
                  ]
                }
              }
            },
            {
              name: 'refresh_interval_seconds',
              selector: {
                number: {
                  mode: 'box',
                  min: MIN_REFRESH_INTERVAL_SECONDS,
                  max: 3600,
                  step: 10
                }
              }
            }
          ]
        },
        {
          type: 'expandable',
          title: 'Range & Display',
          schema: [
            {
              name: 'gauge_max',
              selector: { number: { mode: 'box', min: 1 } }
            },
            {
              name: 'unit',
              selector: { text: {} }
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
    const hadHass = this._hass !== undefined
    this._hass = hass
    if (!hadHass && this._config) {
      void this.requestHistoryUpdate()
    }
    this.requestUpdate()
  }

  setConfig(config: WeatherGaugesWindRoseCardConfig): void {
    this._config = normalizeWindRoseConfig(config)
    this._errorMessage = undefined
    this._historyData = undefined
    this.stopRefreshTimer()

    if (this.isConnected) {
      this.startRefreshTimer()
      void this.requestHistoryUpdate()
    }
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

    if (this._config) {
      this.startRefreshTimer()
      void this.requestHistoryUpdate()
    }
  }

  override disconnectedCallback(): void {
    this.stopRefreshTimer()
    this._resizeObserver?.disconnect()
    this._resizeObserver = undefined
    super.disconnectedCallback()
  }

  override render(): TemplateResult {
    if (!this._config) {
      return this.renderMessage('Card is not configured yet.')
    }

    if (this._errorMessage && !this._historyData) {
      return this.renderMessage(this._errorMessage, this._config.title)
    }

    if (!this._historyData) {
      return this.renderMessage('Loading wind history...', this._config.title)
    }

    if (this._historyData.sampleCount === 0) {
      return this.renderMessage(
        `No wind direction samples found in the last ${this._config.historyHours} hours.`,
        this._config.title
      )
    }

    const size = this._config.size ?? this._autoSize
    const label = this._config.label ?? this._config.title ?? 'Wind Rose'
    const unit = this._config.unit ?? 'samples'

    return html`
      <ha-card header=${ifDefined(this._config.title)}>
        <div class="card-content" @click=${this.openMoreInfo}>
          <div class="gauge-shell">
            <wx-wind-rose
              .petals=${this._historyData.petals}
              .maxValue=${this._historyData.maxValue}
              .size=${size}
              .label=${label}
              .unit=${unit}
              .animated=${this._config.animated}
              .duration=${this._config.duration}
              .validation=${this._config.validation}
              .theme=${this._config.theme}
            ></wx-wind-rose>
          </div>
          <div class="meta">
            ${this._historyData.sampleCount} samples over
            ${this._config.historyHours}h${this._isLoading ? ' - refreshing' : ''}
          </div>
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

  private startRefreshTimer(): void {
    this.stopRefreshTimer()
    if (!this._config) {
      return
    }

    this._refreshHandle = window.setInterval(() => {
      void this.requestHistoryUpdate()
    }, this._config.refreshIntervalSeconds * 1000)
  }

  private stopRefreshTimer(): void {
    if (this._refreshHandle !== undefined) {
      window.clearInterval(this._refreshHandle)
      this._refreshHandle = undefined
    }
  }

  private async requestHistoryUpdate(): Promise<void> {
    if (!this._config || !this._hass) {
      return
    }

    const requestVersion = ++this._requestVersion
    this._isLoading = true
    this.requestUpdate()

    const result = await fetchWindRoseHistoryData(this._hass, {
      entityId: this._config.entity,
      historyHours: this._config.historyHours,
      binCount: this._config.binCount,
      ...(this._config.gaugeMax !== undefined ? { maxValueOverride: this._config.gaugeMax } : {})
    })

    if (requestVersion !== this._requestVersion) {
      return
    }

    this._isLoading = false
    if (!result.ok) {
      this._errorMessage = result.message
      this.requestUpdate()
      return
    }

    this._errorMessage = undefined
    this._historyData = result.data
    this.requestUpdate()
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

const CARD_DEFINITIONS = [
  {
    tag: WEATHER_GAUGES_RADIAL_CARD_TAG,
    name: 'Weather Gauge - Radial',
    description: 'Single weather gauge card specialized for radial gauge',
    elementClass: WeatherGaugesRadialCard
  },
  {
    tag: WEATHER_GAUGES_RADIAL_BARGRAPH_CARD_TAG,
    name: 'Weather Gauge - Radial Bargraph',
    description: 'Single weather gauge card specialized for radial bargraph',
    elementClass: WeatherGaugesRadialBargraphCard
  },
  {
    tag: WEATHER_GAUGES_COMPASS_CARD_TAG,
    name: 'Weather Gauge - Compass',
    description: 'Single weather gauge card specialized for compass heading',
    elementClass: WeatherGaugesCompassCard
  },
  {
    tag: WEATHER_GAUGES_WIND_DIRECTION_CARD_TAG,
    name: 'Weather Gauge - Wind Direction',
    description: 'Single weather gauge card specialized for wind direction with optional average',
    elementClass: WeatherGaugesWindDirectionCard
  },
  {
    tag: WEATHER_GAUGES_WIND_ROSE_CARD_TAG,
    name: 'Weather Gauge - Wind Rose',
    description: 'History-driven wind rose card with frequency buckets',
    elementClass: WeatherGaugesWindRoseCard
  }
] as const

for (const cardDefinition of CARD_DEFINITIONS) {
  if (!customElements.get(cardDefinition.tag)) {
    customElements.define(cardDefinition.tag, cardDefinition.elementClass)
  }
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
    'weather-gauges-radial-card': WeatherGaugesRadialCard
    'weather-gauges-radial-bargraph-card': WeatherGaugesRadialBargraphCard
    'weather-gauges-compass-card': WeatherGaugesCompassCard
    'weather-gauges-wind-direction-card': WeatherGaugesWindDirectionCard
    'weather-gauges-wind-rose-card': WeatherGaugesWindRoseCard
  }
}

window.customCards = window.customCards || []

for (const cardDefinition of CARD_DEFINITIONS) {
  if (!window.customCards.some((card) => card.type === cardDefinition.tag)) {
    window.customCards.push({
      type: cardDefinition.tag,
      name: cardDefinition.name,
      description: cardDefinition.description,
      preview: true,
      documentationURL: 'https://github.com/bradsjm/weather-gauges/tree/main/packages/ha-cards'
    })
  }
}
