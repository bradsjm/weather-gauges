/**
 * SteelSeries v3 Elements
 *
 * Lit Web Components for SteelSeries v3 gauges
 */

import type { SteelseriesRadialBargraphV3Element as RadialBargraphElement } from './components/radial-bargraph-element.js'
import type { SteelseriesRadialV3Element as RadialElement } from './components/radial-element.js'
import type { SteelseriesCompassV3Element as CompassElement } from './components/compass-element.js'
import type { SteelseriesWindDirectionV3Element as WindDirectionElement } from './components/wind-direction-element.js'

// Export individual element classes
export { SteelseriesRadialBargraphV3Element } from './components/radial-bargraph-element.js'
export { SteelseriesRadialV3Element } from './components/radial-element.js'
export { SteelseriesCompassV3Element } from './components/compass-element.js'
export { SteelseriesWindDirectionV3Element } from './components/wind-direction-element.js'

// Export shared utilities (useful for extending elements)
export { booleanAttributeConverter, readCssCustomPropertyColor } from './shared/css-utils.js'
export { sharedStyles } from './shared/shared-styles.js'
export { SteelseriesGaugeElement } from './shared/gauge-base-element.js'

// Global type augmentation for TypeScript
declare global {
  interface HTMLElementTagNameMap {
    'steelseries-radial-bargraph-v3': RadialBargraphElement
    'steelseries-radial-v3': RadialElement
    'steelseries-compass-v3': CompassElement
    'steelseries-wind-direction-v3': WindDirectionElement
  }
}
