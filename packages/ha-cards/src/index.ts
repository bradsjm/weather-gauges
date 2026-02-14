/**
 * Weather Gauges Home Assistant Cards
 *
 * @packageDocumentation
 *
 * Home Assistant Lovelace custom cards that provide convenient wrappers around the
 * weather gauge web components. These cards integrate directly with Home Assistant's
 * card system and provide standard card configuration options.
 *
 * @remarks
 * This package exports a `WeatherGaugesCardConfig` type for defining card configuration.
 * The cards are registered with Home Assistant's custom card system automatically.
 *
 * @example
 * ```typescript
 * const cardConfig: WeatherGaugesCardConfig = {
 *   type: 'custom:weather-gauges-card',
 *   entity: 'sensor.temperature',
 *   title: 'Temperature'
 * }
 * ```
 */
import '@bradsjm/weather-gauges-elements'

/**
 * Configuration for weather gauge cards in Home Assistant.
 *
 * @remarks
 * Defines the interface for configuring weather gauge cards within Home Assistant's
 * Lovelace UI. Cards support entity binding, custom titles, and type specification.
 */
export const WEATHER_GAUGES_CARD_TYPE = 'custom:weather-gauges-card'

export type WeatherGaugesCardConfig = {
  /**
   * Card type identifier.
   *
   * @remarks
   * Typically `custom:weather-gauges-card` for weather gauge cards.
   */
  type: string

  /**
   * Home Assistant entity ID to bind the card to.
   *
   * @example
   * ```typescript
   * entity: 'sensor.temperature'
   * ```
   */
  entity?: string

  /**
   * Optional title displayed above the gauge.
   */
  title?: string
}

declare global {
  interface Window {
    customCards?: Array<{
      type: string
      name: string
      description: string
      preview: boolean
    }>
  }
}

window.customCards = window.customCards || []

if (!window.customCards.some((card) => card.type === WEATHER_GAUGES_CARD_TYPE)) {
  window.customCards.push({
    type: WEATHER_GAUGES_CARD_TYPE,
    name: 'Weather Gauges Card',
    description: 'Weather Gauges card wrapper for weather gauge web components',
    preview: true
  })
}
