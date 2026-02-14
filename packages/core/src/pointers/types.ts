/**
 * @module
 *
 * Pointer type definitions and descriptions for gauges.
 *
 * This module provides the available pointer types that can be used
 * across different gauge types, along with their descriptions.
 */

/**
 * Available pointer types for gauge indicators.
 *
 * @remarks
 * This const array defines all supported pointer styles that can be
 * configured on gauges. Each pointer type has a unique identifier
 * and visual representation suitable for specific gauge types (compass,
 * radial, wind, etc.).
 *
 * @example
 * ```typescript
 * import { pointerTypes, type PointerType } from '@bradsjm/weather-gauges-core'
 *
 * const needle: PointerType = 'slim-angular-needle'
 * console.log(pointerTypes.includes(needle)) // true
 * ```
 */
export const pointerTypes = [
  'classic-compass-needle',
  'slim-angular-needle',
  'thin-bar-needle',
  'diamond-spear-needle',
  'triangular-split-needle',
  'forked-center-needle',
  'simple-triangular-needle',
  'curved-classic-needle',
  'heavy-metallic-needle',
  'teardrop-bulb-needle',
  'curved-tail-needle',
  'narrow-spike-needle',
  'label-tip-marker-needle',
  'metallic-marker-needle',
  'ornate-ring-base-needle',
  'ring-base-bar-tail-needle'
] as const

/**
 * Pointer type identifier.
 *
 * @remarks
 * Represents one of the available pointer types from {@link pointerTypes}.
 * Used throughout gauge configurations to specify the visual style
 * of the value indicator.
 *
 * @example
 * ```typescript
 * import type { PointerType } from '@bradsjm/weather-gauges-core'
 *
 * const needle: PointerType = 'slim-angular-needle'
 * const config = {
 *   style: { pointerType: needle }
 * }
 * ```
 */
export type PointerType = (typeof pointerTypes)[number]

/**
 * Human-readable descriptions for each pointer type.
 *
 * @remarks
 * Maps each pointer type identifier to a descriptive string.
 * Useful for displaying pointer options in UI or for documentation.
 *
 * @example
 * ```typescript
 * import { pointerTypeDescriptions, type PointerType } from '@bradsjm/weather-gauges-core'
 *
 * const needle: PointerType = 'slim-angular-needle'
 * const description = pointerTypeDescriptions[needle]
 * console.log(description) // 'Slim angular needle'
 * ```
 */
export const pointerTypeDescriptions: Record<PointerType, string> = {
  'classic-compass-needle': 'Classic compass needle',
  'slim-angular-needle': 'Slim angular needle',
  'thin-bar-needle': 'Thin bar needle',
  'diamond-spear-needle': 'Diamond spear needle',
  'triangular-split-needle': 'Triangular split needle',
  'forked-center-needle': 'Forked center needle',
  'simple-triangular-needle': 'Simple triangular needle',
  'curved-classic-needle': 'Curved classic needle',
  'heavy-metallic-needle': 'Heavy metallic needle',
  'teardrop-bulb-needle': 'Teardrop bulb needle',
  'curved-tail-needle': 'Curved tail needle',
  'narrow-spike-needle': 'Narrow spike needle',
  'label-tip-marker-needle': 'Label-tip marker needle',
  'metallic-marker-needle': 'Metallic marker needle',
  'ornate-ring-base-needle': 'Ornate ring-base needle',
  'ring-base-bar-tail-needle': 'Ring-base bar-tail needle'
}
