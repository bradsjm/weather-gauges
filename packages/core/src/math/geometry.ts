import { denormalize, normalize, type NumericRange } from './range.js'

export type Point = {
  x: number
  y: number
}

export const valueToAngle = (
  value: number,
  range: NumericRange,
  startAngle: number,
  endAngle: number,
  options: { clampToRange?: boolean } = {}
): number => {
  const unit = normalize(value, range, { clampToRange: options.clampToRange !== false })
  return denormalize(unit, { min: startAngle, max: endAngle }, { clampToUnit: false })
}

export const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleRadians: number
): Point => {
  if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) {
    throw new Error('center coordinates must be finite numbers')
  }

  if (!Number.isFinite(radius) || radius < 0) {
    throw new Error('radius must be a finite non-negative number')
  }

  if (!Number.isFinite(angleRadians)) {
    throw new Error('angleRadians must be a finite number')
  }

  return {
    x: centerX + Math.cos(angleRadians) * radius,
    y: centerY + Math.sin(angleRadians) * radius
  }
}

export const createTickLine = (
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  angleRadians: number
): { start: Point; end: Point } => {
  if (outerRadius < innerRadius) {
    throw new Error('outerRadius must be greater than or equal to innerRadius')
  }

  return {
    start: polarToCartesian(centerX, centerY, innerRadius, angleRadians),
    end: polarToCartesian(centerX, centerY, outerRadius, angleRadians)
  }
}
