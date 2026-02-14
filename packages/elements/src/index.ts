/**
 * Weather Gauges Elements
 *
 * @packageDocumentation
 *
 * Lit Web Components for weather gauges. This package provides ready-to-use custom elements
 * for rendering various weather gauge types including radial gauges, compasses, bar graphs,
 * and wind roses.
 *
 * @remarks
 * All elements extend {@link WeatherGaugeElement} which provides common functionality for
 * gauge rendering, animations, and theming through CSS custom properties.
 *
 * @example
 * ```html
 * <wx-gauge
 *   value="75"
 *   min="0"
 *   max="100"
 *   unit="%"
 *   --wx-frame-color="var(--primary-color)">
 * </wx-gauge>
 * ```
 */

import type { WxBargraphElement as BargraphElement } from './components/radial-bargraph-element.js'
import type { WxGaugeElement as GaugeElement } from './components/radial-element.js'
import type { WxCompassElement as CompassElement } from './components/compass-element.js'
import type { WxWindDirectionElement as WindDirectionElement } from './components/wind-direction-element.js'
import type { WxWindRoseElement as WindRoseElement } from './components/wind-rose-element.js'

// Export individual element classes
export { WxBargraphElement } from './components/radial-bargraph-element.js'
export { WxGaugeElement } from './components/radial-element.js'
export { WxCompassElement } from './components/compass-element.js'
export { WxWindDirectionElement } from './components/wind-direction-element.js'
export { WxWindRoseElement } from './components/wind-rose-element.js'

// Export shared utilities (useful for extending elements)
export { booleanAttributeConverter, readCssCustomPropertyColor } from './shared/css-utils.js'
export { sharedStyles } from './shared/shared-styles.js'
export { WeatherGaugeElement } from './shared/gauge-base-element.js'

// Global type augmentation for TypeScript
declare global {
  interface HTMLElementTagNameMap {
    'wx-bargraph': BargraphElement
    'wx-gauge': GaugeElement
    'wx-compass': CompassElement
    'wx-wind-direction': WindDirectionElement
    'wx-wind-rose': WindRoseElement
  }
}
