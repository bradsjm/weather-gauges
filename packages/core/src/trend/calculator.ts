export type TrendState = 'up' | 'down' | 'steady' | null

export type TrendSample = {
  timestamp: number
  value: number
}

export type TrendCalculatorOptions = {
  threshold?: number
  windowMs?: number
}

const DEFAULT_THRESHOLD = 0.5
const DEFAULT_WINDOW_MS = 600000

const assertFiniteNumber = (value: number, name: string): void => {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`)
  }
}

const validateOptions = ({
  threshold,
  windowMs
}: TrendCalculatorOptions): Required<TrendCalculatorOptions> => {
  const resolvedThreshold = threshold ?? DEFAULT_THRESHOLD
  const resolvedWindowMs = windowMs ?? DEFAULT_WINDOW_MS

  assertFiniteNumber(resolvedThreshold, 'threshold')
  assertFiniteNumber(resolvedWindowMs, 'windowMs')

  if (resolvedThreshold < 0) {
    throw new Error('threshold must be greater than or equal to 0')
  }

  if (resolvedWindowMs <= 0) {
    throw new Error('windowMs must be greater than 0')
  }

  return {
    threshold: resolvedThreshold,
    windowMs: resolvedWindowMs
  }
}

const normalizeSamples = (values: TrendSample[]): TrendSample[] => {
  return [...values]
    .filter((sample) => Number.isFinite(sample.timestamp) && Number.isFinite(sample.value))
    .sort((a, b) => a.timestamp - b.timestamp)
}

export const calculateTrend = (
  values: TrendSample[],
  options: TrendCalculatorOptions = {}
): TrendState => {
  if (values.length < 2) {
    return null
  }

  const { threshold, windowMs } = validateOptions(options)
  const samples = normalizeSamples(values)

  if (samples.length < 2) {
    return null
  }

  const latestTimestamp = samples[samples.length - 1]?.timestamp
  if (latestTimestamp === undefined) {
    return null
  }

  const windowStart = latestTimestamp - windowMs
  const inWindow = samples.filter((sample) => sample.timestamp >= windowStart)

  if (inWindow.length < 2) {
    return null
  }

  const first = inWindow[0]
  const last = inWindow[inWindow.length - 1]
  if (!first || !last) {
    return null
  }

  const delta = last.value - first.value
  if (Math.abs(delta) < threshold) {
    return 'steady'
  }

  return delta > 0 ? 'up' : 'down'
}

export const TrendCalculator = {
  calculate: calculateTrend
}
