import type { HomeAssistant } from './value-resolution.js'

export type WindRosePetal = {
  direction: number
  value: number
  color?: string
}

export type WindRoseBinCount = 8 | 16 | 32

export type WindRoseHistoryRequest = {
  entityId: string
  historyHours: number
  binCount: WindRoseBinCount
  maxValueOverride?: number
}

export type WindRoseHistoryData = {
  petals: WindRosePetal[]
  maxValue: number
  sampleCount: number
  from: string
  to: string
}

type WindRoseHistoryResult =
  | {
      ok: true
      data: WindRoseHistoryData
    }
  | {
      ok: false
      message: string
    }

type HistoryStateEntry = {
  s?: unknown
  state?: unknown
}

const MAX_LOOKBACK_HOURS = 24
const ALLOWED_BIN_COUNTS = [8, 16, 32] as const

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const normalizeDirection = (value: number): number => {
  const wrapped = value % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

const toDirection = (value: unknown): number | undefined => {
  if (isFiniteNumber(value)) {
    return normalizeDirection(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return undefined
    }

    const parsed = Number(trimmed)
    if (Number.isFinite(parsed)) {
      return normalizeDirection(parsed)
    }
  }

  return undefined
}

const resolveEntriesForEntity = (response: unknown, entityId: string): HistoryStateEntry[] => {
  if (typeof response === 'object' && response !== null && !Array.isArray(response)) {
    const byEntity = (response as Record<string, unknown>)[entityId]
    if (Array.isArray(byEntity)) {
      return byEntity.filter(
        (entry): entry is HistoryStateEntry => typeof entry === 'object' && entry !== null
      )
    }
  }

  if (Array.isArray(response) && response.length > 0) {
    const firstEntitySet = response[0]
    if (Array.isArray(firstEntitySet)) {
      return firstEntitySet.filter(
        (entry): entry is HistoryStateEntry => typeof entry === 'object' && entry !== null
      )
    }
  }

  return []
}

export const countDirectionSamplesByBin = (
  directions: number[],
  binCount: WindRoseBinCount
): WindRosePetal[] => {
  const step = 360 / binCount
  const counts = Array.from({ length: binCount }, () => 0)

  for (const direction of directions) {
    const normalizedDirection = normalizeDirection(direction)
    const index = Math.floor(normalizedDirection / step) % binCount
    const currentCount = counts[index] ?? 0
    counts[index] = currentCount + 1
  }

  return counts.map((value, index) => ({
    direction: index * step,
    value
  }))
}

export const fetchWindRoseHistoryData = async (
  hass: HomeAssistant | undefined,
  request: WindRoseHistoryRequest,
  now = new Date()
): Promise<WindRoseHistoryResult> => {
  if (!hass) {
    return { ok: false, message: 'Waiting for Home Assistant state updates.' }
  }

  if (!hass.callWS) {
    return {
      ok: false,
      message: 'Home Assistant websocket API is unavailable in this client context.'
    }
  }

  if (!ALLOWED_BIN_COUNTS.includes(request.binCount)) {
    return { ok: false, message: 'Wind rose `bin_count` must be one of 8, 16, or 32.' }
  }

  if (request.historyHours <= 0) {
    return { ok: false, message: '`history_hours` must be greater than 0.' }
  }

  if (request.historyHours > MAX_LOOKBACK_HOURS) {
    return { ok: false, message: '`history_hours` cannot exceed 24.' }
  }

  if (request.maxValueOverride !== undefined && request.maxValueOverride <= 0) {
    return { ok: false, message: '`gauge_max` must be greater than 0 when provided.' }
  }

  const endTime = now
  const startTime = new Date(endTime.getTime() - request.historyHours * 60 * 60 * 1000)

  let response: unknown
  try {
    response = await hass.callWS({
      type: 'history/history_during_period',
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      entity_ids: [request.entityId],
      include_start_time_state: true,
      significant_changes_only: false,
      minimal_response: true,
      no_attributes: true
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown history fetch error'
    return {
      ok: false,
      message: `Unable to load wind history: ${message}`
    }
  }

  const entries = resolveEntriesForEntity(response, request.entityId)
  const directions = entries
    .map((entry) => toDirection(entry.s ?? entry.state))
    .filter((value): value is number => value !== undefined)

  const petals = countDirectionSamplesByBin(directions, request.binCount)
  const maxFromBuckets = petals.reduce((max, petal) => Math.max(max, petal.value), 0)
  const maxValue = request.maxValueOverride ?? Math.max(1, maxFromBuckets)

  return {
    ok: true,
    data: {
      petals,
      maxValue,
      sampleCount: directions.length,
      from: startTime.toISOString(),
      to: endTime.toISOString()
    }
  }
}
