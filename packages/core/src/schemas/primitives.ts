import { z } from 'zod'

export const finiteNumberSchema = z.number().finite({ message: 'must be a finite number' })

export const positiveIntegerSchema = z
  .number()
  .int({ message: 'must be an integer' })
  .gt(0, { message: 'must be greater than 0' })

export const nonNegativeIntegerSchema = z
  .number()
  .int({ message: 'must be an integer' })
  .min(0, { message: 'must be greater than or equal to 0' })

export const nonEmptyStringSchema = z.string().trim().min(1, { message: 'must not be empty' })

export const easingSchema = z.enum(['linear', 'easeInOutCubic'])
