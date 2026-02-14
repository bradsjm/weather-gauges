import type { z } from 'zod'

import { compassGaugeConfigSchema, type CompassRenderResult } from '../compass/index.js'
import {
  radialBargraphGaugeConfigSchema,
  type RadialBargraphRenderResult
} from '../radial-bargraph/index.js'
import { type RadialRenderResult } from '../radial/index.js'
import { type WindDirectionRenderResult } from '../wind-direction/index.js'
import { type WindRoseRenderResult } from '../wind-rose/index.js'
import { formatZodError, type ValidationResult } from '../schemas/validation.js'

/**
 * Standard gauge contract constants and event names.
 *
 * @remarks
 * Provides standard event names and default values used across
 * all gauge types for consistent behavior.
 *
 * @property valueChangeEvent - Event name dispatched when gauge value changes
 * @property errorEvent - Event name dispatched when gauge encounters an error
 * @property defaultAnimationDurationMs - Default animation duration in milliseconds
 * @property tones - Available gauge tone values for styling
 *
 * @example
 * ```typescript
 * import { gaugeContract } from '@bradsjm/weather-gauges-core'
 *
 * console.log(gaugeContract.valueChangeEvent) // 'wx-state-change'
 * console.log(gaugeContract.tones) // ['accent', 'warning', 'danger']
 * ```
 */
export const gaugeContract = {
  valueChangeEvent: 'wx-state-change',
  errorEvent: 'wx-error',
  defaultAnimationDurationMs: 500,
  tones: ['accent', 'warning', 'danger'] as const
} as const

/**
 * Supported gauge contract types.
 *
 * @remarks
 * Identifies which type of gauge is being referenced in contract
 * events and error handling.
 */
export type GaugeContractKind =
  | 'compass'
  | 'radial'
  | 'radial-bargraph'
  | 'wind-direction'
  | 'wind-rose'

/**
 * Gauge tone for visual styling.
 *
 * @remarks
 * Tone affects coloring based on gauge state:
 * - accent: Normal state
 * - warning: Caution state
 * - danger: Critical state
 */
export type GaugeTone = (typeof gaugeContract.tones)[number]

/**
 * Alert in gauge contract state.
 *
 * @remarks
 * Represents an alert condition triggered by gauge configuration.
 *
 * @property id - Unique identifier for the alert
 * @property message - Human-readable alert message
 * @property severity - Alert severity level: 'info', 'warning', or 'critical'
 */
export type GaugeContractAlert = {
  id: string
  message: string
  severity: 'info' | 'warning' | 'critical'
}

/**
 * Current state of a gauge in the contract system.
 *
 * @remarks
 * Emitted when gauge value changes. Contains reading,
 * tone based on alerts, and list of active alerts.
 *
 * @property kind - The type of gauge
 * @property reading - The current numeric reading value
 * @property tone - The gauge tone based on active alerts
 * @property alerts - Array of alerts currently triggered
 * @property timestampMs - Timestamp when state was captured
 */
export type GaugeContractState = {
  kind: GaugeContractKind
  reading: number
  tone: GaugeTone
  alerts: GaugeContractAlert[]
  timestampMs: number
}

/**
 * Error code types for gauge contract errors.
 *
 * @remarks
 * - invalid_config: Configuration validation failed
 * - invalid_value: Value provided to gauge is invalid
 * - render_error: Rendering operation failed
 */
export type GaugeContractErrorCode = 'invalid_config' | 'invalid_value' | 'render_error'

/**
 * Individual issue detail in a gauge contract error.
 *
 * @remarks
 * Provides path to invalid field and error message.
 *
 * @property path - Dot-notation path to invalid field (e.g., 'config.value.current')
 * @property message - Human-readable error message
 */
export type GaugeContractErrorIssue = {
  path: string
  message: string
}

/**
 * Error object in gauge contract system.
 *
 * @remarks
 * Emitted when gauge encounters an error. Contains error code,
 * message, and optional list of validation issues.
 *
 * @property kind - The type of gauge that encountered error
 * @property code - The error code categorizing the failure
 * @property message - Human-readable error description
 * @property issues - Optional array of specific validation issues
 */
export type GaugeContractError = {
  kind: GaugeContractKind
  code: GaugeContractErrorCode
  message: string
  issues?: GaugeContractErrorIssue[]
}

/**
 * Validates input using a Zod schema.
 *
 * @param schema - The Zod schema to validate against
 * @param input - The value to validate
 * @returns Validation result with success status and either data or errors
 *
 * @remarks
 * Internal utility for consistent validation behavior across all gauge types.
 */
const validateWithSchema = <T>(schema: z.ZodType<T>, input: unknown): ValidationResult<T> => {
  const result = schema.safeParse(input)
  if (result.success) {
    return {
      success: true,
      data: result.data
    }
  }

  return {
    success: false,
    errors: formatZodError(result.error)
  }
}

/**
 * Validates an unknown value as a compass gauge configuration.
 *
 * @param input - The value to validate (e.g., from user input)
 * @returns Validation result with either parsed config or errors
 *
 * @example
 * ```typescript
 * import { validateCompassConfig } from '@bradsjm/weather-gauges-core'
 *
 * const result = validateCompassConfig({
 *   heading: { current: 45, min: 0, max: 360 },
 *   size: { width: 300, height: 300 }
 * })
 * if (result.success) {
 *   console.log('Valid config:', result.data)
 * } else {
 *   console.error('Validation errors:', result.errors)
 * }
 * ```
 */
export const validateCompassConfig = (
  input: unknown
): ValidationResult<z.infer<typeof compassGaugeConfigSchema>> => {
  return validateWithSchema(compassGaugeConfigSchema, input)
}

/**
 * Validates an unknown value as a radial bargraph gauge configuration.
 *
 * @param input - The value to validate (e.g., from user input)
 * @returns Validation result with either parsed config or errors
 *
 * @example
 * ```typescript
 * import { validateRadialBargraphConfig } from '@bradsjm/weather-gauges-core'
 *
 * const result = validateRadialBargraphConfig({
 *   value: { current: 75, min: 0, max: 100 },
 *   size: { width: 300, height: 300 },
 *   style: { valueColor: 'red', gaugeType: 'full-gap' }
 * })
 * if (result.success) {
 *   console.log('Valid config:', result.data)
 * } else {
 *   console.error('Validation errors:', result.errors)
 * }
 * ```
 */
export const validateRadialBargraphConfig = (
  input: unknown
): ValidationResult<z.infer<typeof radialBargraphGaugeConfigSchema>> => {
  return validateWithSchema(radialBargraphGaugeConfigSchema, input)
}

/**
 * Converts a gauge render result to a contract state object.
 *
 * @param kind - The type of gauge
 * @param result - The render result from the gauge
 * @returns A contract state object ready for dispatch
 *
 * @remarks
 * Standardizes render results from different gauge types into
 * a uniform contract state for consistent event handling.
 *
 * @example
 * ```typescript
 * import { toGaugeContractState } from '@bradsjm/weather-gauges-core'
 * import type { RadialRenderResult } from '@bradsjm/weather-gauges-core'
 *
 * const renderResult: RadialRenderResult = { ... }
 * const state = toGaugeContractState('radial', renderResult)
 * dispatchEvent('wx-state-change', { detail: state })
 * ```
 */
export const toGaugeContractState = (
  kind: GaugeContractKind,
  result:
    | CompassRenderResult
    | RadialRenderResult
    | RadialBargraphRenderResult
    | WindDirectionRenderResult
    | WindRoseRenderResult
): GaugeContractState => {
  return {
    kind,
    reading: result.reading,
    tone: result.tone,
    timestampMs: Date.now(),
    alerts: result.activeAlerts.map(
      (alert: { id: string; message: string; severity: 'info' | 'warning' | 'critical' }) => ({
        id: alert.id,
        message: alert.message,
        severity: alert.severity
      })
    )
  }
}

/**
 * Converts validation errors to a gauge contract error object.
 *
 * @param kind - The type of gauge
 * @param errors - Array of validation error issues
 * @param message - Optional custom error message (default: 'Invalid gauge configuration')
 * @returns A contract error object ready for dispatch
 *
 * @remarks
 * Standardizes validation errors into a uniform contract error format.
 *
 * @example
 * ```typescript
 * import { toGaugeContractError } from '@bradsjm/weather-gauges-core'
 *
 * const errors = [
 *   { path: 'config.value.current', message: 'must be within range' }
 * ]
 * const error = toGaugeContractError('radial', errors)
 * dispatchEvent('wx-error', { detail: error })
 * ```
 */
export const toGaugeContractError = (
  kind: GaugeContractKind,
  errors: GaugeContractErrorIssue[],
  message = 'Invalid gauge configuration'
): GaugeContractError => {
  return {
    kind,
    code: 'invalid_config',
    message,
    ...(errors.length > 0 ? { issues: errors } : {})
  }
}
