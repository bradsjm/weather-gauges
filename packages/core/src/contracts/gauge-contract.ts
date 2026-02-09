import type { z } from 'zod'

import { compassGaugeConfigSchema, type CompassRenderResult } from '../compass/index.js'
import {
  radialBargraphGaugeConfigSchema,
  type RadialBargraphRenderResult
} from '../radial-bargraph/index.js'
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

export type GaugeContractKind = 'compass' | 'radial-bargraph'

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

export const validateCompassConfig = (
  input: unknown
): ValidationResult<z.infer<typeof compassGaugeConfigSchema>> => {
  return validateWithSchema(compassGaugeConfigSchema, input)
}

export const validateRadialBargraphConfig = (
  input: unknown
): ValidationResult<z.infer<typeof radialBargraphGaugeConfigSchema>> => {
  return validateWithSchema(radialBargraphGaugeConfigSchema, input)
}

export const toGaugeContractState = (
  kind: GaugeContractKind,
  result: CompassRenderResult | RadialBargraphRenderResult
): GaugeContractState => {
  const reading = 'heading' in result ? result.heading : result.value

  return {
    kind,
    reading,
    tone: result.tone,
    alerts: result.activeAlerts.map(
      (alert: { id: string; message: string; severity: 'info' | 'warning' | 'critical' }) => ({
        id: alert.id,
        message: alert.message,
        severity: alert.severity
      })
    )
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
