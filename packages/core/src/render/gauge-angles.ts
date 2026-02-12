export const normalizeAngle360 = (angle: number): number => {
  return ((angle % 360) + 360) % 360
}

export const normalizeAngleInRange = (angle: number, min: number, max: number): number => {
  const span = max - min
  if (span <= 0) {
    return angle
  }

  const normalized = (((angle - min) % span) + span) % span
  return min + normalized
}
