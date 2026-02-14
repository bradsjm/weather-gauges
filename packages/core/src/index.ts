/**
 * @packageDocumentation
 *
 * # Weather Gauges Core
 *
 * Framework-agnostic rendering engine and configuration schemas for weather gauge visualizations.
 *
 * ## Overview
 *
 * This package provides a complete rendering pipeline for creating animated weather gauges
 * including compass, radial, radial-bargraph, wind-direction, and wind-rose visualizations.
 *
 * ## Key Features
 *
 * - **Multiple Gauge Types**: Compass, radial, radial-bargraph, wind-direction, and wind-rose
 * - **Animation System**: Configurable animations with easing functions and timeline control
 * - **Theme Support**: CSS custom property integration and theme token resolution
 * - **Validation**: Zod schemas for runtime type validation
 * - **Rendering Context**: Canvas-based rendering with caching for performance
 *
 * ## Quick Start
 *
 * ```typescript
 * import { renderCompassGauge, compassGaugeConfigSchema } from '@bradsjm/weather-gauges-core'
 *
 * // Validate and render
 * const config = compassGaugeConfigSchema.parse({
 *   heading: { current: 45, min: 0, max: 360 },
 *   size: { width: 300, height: 300 },
 *   style: { pointerType: 'slim-angular-needle' }
 * })
 *
 * const canvas = document.createElement('canvas')
 * const context = canvas.getContext('2d')
 * const result = renderCompassGauge(context, config, { heading: 45 })
 * ```
 *
 * ## Architecture
 *
 * The package is organized into several modules:
 *
 * - **Schemas**: Configuration validation and type definitions
 * - **Math**: Utility functions for ranges, ticks, and geometry calculations
 * - **Animation**: Easing functions, timelines, and animation schedulers
 * - **Render**: Rendering context, canvas management, and caching
 * - **Theme**: Token resolution and color palette management
 * - **Gauges**: Individual gauge implementations (compass, radial, etc.)
 *
 * ## Rendering Pipeline
 *
 * 1. Create a configuration object (use schemas for validation)
 * 2. Get a 2D canvas rendering context
 * 3. Call the appropriate render function
 * 4. Optionally animate using the animate* functions
 *
 * ## Validation
 *
 * All gauge configurations are validated using Zod schemas. Always validate user input:
 *
 * ```typescript
 * import { validateRadialGaugeConfig } from '@bradsjm/weather-gauges-core'
 *
 * const result = validateRadialGaugeConfig(userInput)
 * if (!result.success) {
 *   console.error('Invalid config:', result.errors)
 * }
 * ```
 *
 * @example Rendering a radial gauge
 * ```typescript
 * import { renderRadialGauge, radialGaugeConfigSchema } from '@bradsjm/weather-gauges-core'
 *
 * const canvas = document.querySelector('canvas')
 * const ctx = canvas.getContext('2d')
 *
 * const config = radialGaugeConfigSchema.parse({
 *   value: { current: 75, min: 0, max: 100 },
 *   size: { width: 400, height: 400 },
 *   scale: { startAngle: -Math.PI * 0.75, endAngle: Math.PI * 0.75 }
 * })
 *
 * renderRadialGauge(ctx, config)
 * ```
 *
 * @example Animating a compass gauge
 * ```typescript
 * import { animateCompassGauge, compassGaugeConfigSchema } from '@bradsjm/weather-gauges-core'
 *
 * const canvas = document.querySelector('canvas')
 * const ctx = canvas.getContext('2d')
 *
 * const config = compassGaugeConfigSchema.parse({
 *   heading: { current: 0, min: 0, max: 360 },
 *   size: { width: 300, height: 300 },
 *   animation: { enabled: true, durationMs: 1000 }
 * })
 *
 * const animation = animateCompassGauge({
 *   context: ctx,
 *   config,
 *   from: 0,
 *   to: 90,
 *   onFrame: (result) => console.log('Current heading:', result.heading),
 *   onComplete: (result) => console.log('Animation complete:', result.heading)
 * })
 *
 * // Later, if needed:
 * // animation.cancel()
 * ```
 */

export * from './schemas/primitives.js'
export * from './schemas/shared.js'
export * from './schemas/validation.js'
export * from './math/range.js'
export * from './math/ticks.js'
export * from './math/geometry.js'
export * from './animation/easing.js'
export * from './animation/timeline.js'
export * from './animation/scheduler.js'
export * from './trend/calculator.js'
export * from './render/context.js'
export * from './theme/tokens.js'
export * from './contracts/gauge-contract.js'
export * from './pointers/types.js'
export * from './pointers/schema.js'
export * from './compass/schema.js'
export * from './compass/renderer.js'
export * from './radial/schema.js'
export * from './radial/renderer.js'
export * from './radial-bargraph/schema.js'
export * from './radial-bargraph/renderer.js'
export * from './wind-direction/schema.js'
export * from './wind-direction/renderer.js'
export * from './wind-rose/schema.js'
export * from './wind-rose/renderer.js'

export type { CompassGaugeConfig } from './compass/schema.js'
export type { RadialGaugeConfig } from './radial/schema.js'
export type { RadialBargraphGaugeConfig } from './radial-bargraph/schema.js'
export type { WindDirectionGaugeConfig } from './wind-direction/schema.js'
export type { WindRoseGaugeConfig } from './wind-rose/schema.js'

export const version = '0.0.0'
