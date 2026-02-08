import type { z } from 'zod'

import { compassGaugeConfigSchema, type CompassRenderResult } from '../compass/index.js'
import { linearGaugeConfigSchema, type LinearRenderResult } from '../linear/index.js'
import { radialGaugeConfigSchema, type RadialRenderResult } from '../radial/index.js'
import {
  formatZodError,
  type ValidationIssue,
  type ValidationResult
} from '../schemas/validation.js'

export const gaugeContract = {
  valueChangeEvent: 'ss3-value-change',
  errorEvent: 'ss3-error',
  defaultAnimationDurationMs: 500,
  tones: ['accent', 'warning', 'danger'] as const
} as const

export type GaugeContractKind = 'radial' | 'linear' | 'compass'

export type GaugeTone = (typeof gaugeContract.tones)[number]

export type GaugeContractAlert = {
  id: string
  message: string
  severity: 'info' | 'warning' | 'critical'
}

export type GaugeContractState = {
  kind: GaugeContractKind
  reading: number
  tone: GaugeTone
  alerts: GaugeContractAlert[]
}

export type GaugeContractError = {
  kind: GaugeContractKind
  errors: ValidationIssue[]
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

export const validateRadialConfig = (
  input: unknown
): ValidationResult<z.infer<typeof radialGaugeConfigSchema>> => {
  return validateWithSchema(radialGaugeConfigSchema, input)
}

export const validateLinearConfig = (
  input: unknown
): ValidationResult<z.infer<typeof linearGaugeConfigSchema>> => {
  return validateWithSchema(linearGaugeConfigSchema, input)
}

export const validateCompassConfig = (
  input: unknown
): ValidationResult<z.infer<typeof compassGaugeConfigSchema>> => {
  return validateWithSchema(compassGaugeConfigSchema, input)
}

export const toGaugeContractState = (
  kind: GaugeContractKind,
  result: RadialRenderResult | LinearRenderResult | CompassRenderResult
): GaugeContractState => {
  const reading = 'heading' in result ? result.heading : result.value

  return {
    kind,
    reading,
    tone: result.tone,
    alerts: result.activeAlerts.map((alert) => ({
      id: alert.id,
      message: alert.message,
      severity: alert.severity
    }))
  }
}

export const toGaugeContractError = (
  kind: GaugeContractKind,
  errors: ValidationIssue[]
): GaugeContractError => {
  return {
    kind,
    errors
  }
}
