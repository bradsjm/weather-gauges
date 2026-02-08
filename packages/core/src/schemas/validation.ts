import type { z, ZodError, ZodIssue } from 'zod'

import { gaugeRangeSchema, gaugeValueSchema, sharedGaugeConfigSchema } from './shared.js'

export type ValidationIssue = {
  code: string
  path: string
  message: string
}

export type ValidationResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
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

export const validateGaugeRange = (
  input: unknown
): ValidationResult<z.infer<typeof gaugeRangeSchema>> => {
  return validateWithSchema(gaugeRangeSchema, input)
}

export const validateGaugeValue = (
  input: unknown
): ValidationResult<z.infer<typeof gaugeValueSchema>> => {
  return validateWithSchema(gaugeValueSchema, input)
}

export const validateSharedGaugeConfig = (
  input: unknown
): ValidationResult<z.infer<typeof sharedGaugeConfigSchema>> => {
  return validateWithSchema(sharedGaugeConfigSchema, input)
}
