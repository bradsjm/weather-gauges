import { describe, expect, it, vi } from 'vitest'

import {
  countDirectionSamplesByBin,
  fetchWindRoseHistoryData,
  type WindRoseHistoryRequest
} from '../src/wind-rose-history.js'

import type { HomeAssistant } from '../src/value-resolution.js'

const buildRequest = (overrides: Partial<WindRoseHistoryRequest> = {}): WindRoseHistoryRequest => ({
  entityId: 'sensor.wind_direction',
  historyHours: 24,
  binCount: 8,
  ...overrides
})

describe('countDirectionSamplesByBin', () => {
  it('normalizes directions and bins samples by frequency', () => {
    const petals = countDirectionSamplesByBin([0, 10, 44.9, 45, 90, 359.9, -10, 370], 8)

    expect(petals).toHaveLength(8)
    expect(petals.map((petal) => petal.direction)).toEqual([0, 45, 90, 135, 180, 225, 270, 315])
    expect(petals.map((petal) => petal.value)).toEqual([4, 1, 1, 0, 0, 0, 0, 2])
  })
})

describe('fetchWindRoseHistoryData', () => {
  it('rejects lookback values over 24 hours', async () => {
    const hass: HomeAssistant = {
      states: {},
      callWS: vi.fn()
    }

    const result = await fetchWindRoseHistoryData(hass, buildRequest({ historyHours: 25 }))

    expect(result).toEqual({ ok: false, message: '`history_hours` cannot exceed 24.' })
  })

  it('returns a clear error when websocket API is unavailable', async () => {
    const hass: HomeAssistant = {
      states: {}
    }

    const result = await fetchWindRoseHistoryData(hass, buildRequest())

    expect(result).toEqual({
      ok: false,
      message: 'Home Assistant websocket API is unavailable in this client context.'
    })
  })

  it('fetches history and aggregates into sample-count buckets', async () => {
    const callWSImpl = vi.fn(async (_message: Record<string, unknown>) => ({
      'sensor.wind_direction': [{ s: '0' }, { s: '45' }, { s: '90' }, { s: '359' }]
    }))

    const hass: HomeAssistant = {
      states: {},
      callWS: callWSImpl
    }

    const now = new Date('2026-02-16T12:00:00.000Z')
    const result = await fetchWindRoseHistoryData(hass, buildRequest(), now)

    expect(callWSImpl).toHaveBeenCalledTimes(1)
    expect(callWSImpl).toHaveBeenCalledWith({
      type: 'history/history_during_period',
      start_time: '2026-02-15T12:00:00.000Z',
      end_time: '2026-02-16T12:00:00.000Z',
      entity_ids: ['sensor.wind_direction'],
      include_start_time_state: true,
      significant_changes_only: false,
      minimal_response: true,
      no_attributes: true
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.sampleCount).toBe(4)
      expect(result.data.maxValue).toBe(1)
      expect(result.data.petals.map((petal) => petal.value)).toEqual([1, 1, 1, 0, 0, 0, 0, 1])
      expect(result.data.from).toBe('2026-02-15T12:00:00.000Z')
      expect(result.data.to).toBe('2026-02-16T12:00:00.000Z')
    }
  })

  it('supports array-shaped history responses and gauge_max override', async () => {
    const callWSImpl = vi.fn(async (_message: Record<string, unknown>) => [
      [{ state: '180' }, { state: '181' }]
    ])

    const hass: HomeAssistant = {
      states: {},
      callWS: callWSImpl
    }

    const result = await fetchWindRoseHistoryData(
      hass,
      buildRequest({ historyHours: 6, maxValueOverride: 10 })
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.sampleCount).toBe(2)
      expect(result.data.maxValue).toBe(10)
    }
  })
})
