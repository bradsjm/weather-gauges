export const applyGaugeProps = (element: Element | null, props: Record<string, unknown>): void => {
  if (!element) {
    return
  }

  const target = element as unknown as Record<string, unknown>
  const aliases: Record<string, string> = {
    title: 'label',
    animateValue: 'animated',
    heading: 'value',
    valueLatest: 'value',
    valueAverage: 'average'
  }

  for (const [key, value] of Object.entries(props)) {
    target[aliases[key] ?? key] = value
  }
}

export const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

export const asFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
