/**
 * @module
 *
 * Pointer schema validation.
 *
 * This module provides Zod schemas for validating pointer type
 * configurations used in gauge styling.
 */

import { z } from 'zod'

import { pointerTypes } from './types.js'

/**
 * Schema for validating pointer type names.
 *
 * @remarks
 * Validates that the value is one of the supported pointer types
 * from the {@link pointerTypes} array.
 *
 * @example
 * ```typescript
 * import { pointerTypeSchema } from '@bradsjm/weather-gauges-core'
 *
 * const type = pointerTypeSchema.parse('slim-angular-needle')
 * // OK
 *
 * const invalid = pointerTypeSchema.parse('invalid-needle')
 * // Error: Invalid enum value
 * ```
 */
export const pointerTypeSchema = z.enum(pointerTypes)
