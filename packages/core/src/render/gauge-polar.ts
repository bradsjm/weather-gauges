export const PI = Math.PI
export const HALF_PI = PI * 0.5
export const TWO_PI = PI * 2
export const RAD_FACTOR = PI / 180
export const DEG_FACTOR = 180 / PI

export const normalizeCircularValue = (value: number, min: number, max: number): number => {
  const span = max - min
  if (span <= 0) {
    return value
  }

  const normalized = (((value - min) % span) + span) % span
  return min + normalized
}
