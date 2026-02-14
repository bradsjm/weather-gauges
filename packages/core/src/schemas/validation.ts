import type { z, ZodError, ZodIssue } from 'zod'

import { gaugeRangeSchema, gaugeValueSchema, sharedGaugeConfigSchema } from './shared.js'

/**
 * @module
 *
 * Validation utilities for gauge configurations.
 *
 * This module provides runtime validation functions for gauge configurations using Zod schemas.
 * All functions return a {@link ValidationResult} with either success data or error details.
 */

/**
 * Represents a single validation error issue.
 *
 * @remarks
 * Contains the error code, path to the invalid field, and error message.
 */
export type ValidationIssue = {
  /** Zod error code (e.g., 'too_small', 'invalid_type', 'custom') */
  code: string
  /** Dot-notation path to the invalid field (e.g., 'config.value.current') */
  path: string
  /** Human-readable error message */
  message: string
}

/**
 * Result of a validation operation.
 *
 * @remarks
 * Discriminated union type where success status determines available properties.
 * Use `success` property to check validation result.
 *
 * @typeParam T - The type of data if validation succeeds
 *
 * @example
 * ```typescript
 * import type { ValidationResult } from '@bradsjm/weather-gauges-core'
 *
 * function handleResult<T>(result: ValidationResult<T>) {
 *   if (result.success) {
 *     console.log('Valid:', result.data)
 *   } else {
 *     console.error('Invalid:', result.errors)
 *   }
 * }
 * ```
 */
export type ValidationResult<T> =
  | {
      /** Indicates validation succeeded */
      success: true
      /** The validated and parsed data */
      data: T
    }
  | {
      /** Indicates validation failed */
      success: false
      /** Array of validation errors */
      errors: ValidationIssue[]
    }

const formatIssuePath = (path: PropertyKey[]): string => {
  if (path.length === 0) {
    return 'root'
  }

  return path
    .map((segment) => {
      if (typeof segment === 'number') {
        return `[${segment}]`
      }

      return String(segment)
    })
    .join('.')
}

const toValidationIssue = (issue: ZodIssue): ValidationIssue => {
  return {
    code: issue.code,
    path: formatIssuePath(issue.path),
    message: issue.message
  }
}

/**
 * Formats a Zod error into an array of validation issues.
 *
 * @param error - The Zod error to format
 * @returns Array of validation issues with formatted paths
 *
 * @example
 * ```typescript
 * import { formatZodError } from '@bradsjm/weather-gauges-core'
 *
 * try {
 *   schema.parse(invalidData)
 * } catch (error) {
 *   const issues = formatZodError(error as ZodError)
 *   issues.forEach(issue => console.error(`${issue.path}: ${issue.message}`))
 * }
 * ```
 */
export const formatZodError = (error: ZodError): ValidationIssue[] => {
  return error.issues.map(toValidationIssue)
}

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
 * Validates an unknown value as a gauge range configuration.
 *
 * @param input - The value to validate (e.g., from user input)
 * @returns Validation result with either the parsed range or errors
 *
 * @example
 * ```typescript
 * import { validateGaugeRange } from '@bradsjm/weather-gauges-core'
 *
 * const result = validateGaugeRange({ min: 0, max: 100 })
 * if (result.success) {
 *   console.log('Range:', result.data) // { min: 0, max: 100 }
 * } else {
 *   console.error('Errors:', result.errors)
 * }
 * ```
 */
export const validateGaugeRange = (
  input: unknown
): ValidationResult<z.infer<typeof gaugeRangeSchema>> => {
  return validateWithSchema(gaugeRangeSchema, input)
}

/**
 * Validates an unknown value as a gauge value configuration.
 *
 * @param input - The value to validate (e.g., from user input)
 * @returns Validation result with either the parsed value or errors
 *
 * @remarks
 * Validates that current value is within the specified [min, max] range.
 *
 * @example
 * ```typescript
 * import { validateGaugeValue } from '@bradsjm/weather-gauges-core'
 *
 * const result = validateGaugeValue({ current: 75, min: 0, max: 100 })
 * if (result.success) {
 *   console.log('Value:', result.data) // { current: 75, min: 0, max: 100 }
 * } else {
 *   console.error('Errors:', result.errors)
 * }
 * ```
 */
export const validateGaugeValue = (
  input: unknown
): ValidationResult<z.infer<typeof gaugeValueSchema>> => {
  return validateWithSchema(gaugeValueSchema, input)
}

/**
 * Validates an unknown value as a shared gauge configuration.
 *
 * @param input - The value to validate (e.g., from user input)
 * @returns Validation result with either the parsed configuration or errors
 *
 * @remarks
 * Validates the base configuration shared across all gauge types, including:
 * - value (current, min, max)
 * - size (width, height)
 * - animation settings
 * - visibility settings
 * - text labels
 *
 * @example
 * ```typescript
 * import { validateSharedGaugeConfig } from '@bradsjm/weather-gauges-core'
 *
 * const result = validateSharedGaugeConfig({
 *   value: { current: 50, min: 0, max: 100 },
 *   size: { width: 300, height: 300 },
 *   text: { title: 'Pressure', unit: 'hPa' }
 * })
 * if (result.success) {
 *   console.log('Config:', result.data)
 * } else {
 *   console.error('Errors:', result.errors)
 * }
 * ```
 */
export const validateSharedGaugeConfig = (
  input: unknown
): ValidationResult<z.infer<typeof sharedGaugeConfigSchema>> => {
  return validateWithSchema(sharedGaugeConfigSchema, input)
}
