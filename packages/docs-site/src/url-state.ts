import type { PlaygroundState } from './types'

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

const toBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

const fromBase64 = (base64: string): Uint8Array => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

const toBase64Url = (base64: string): string =>
  base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

const fromBase64Url = (base64Url: string): string => {
  const padded = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const padLength = (4 - (padded.length % 4)) % 4
  return `${padded}${'='.repeat(padLength)}`
}

const isJsonValue = (value: unknown): value is JsonValue => {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return true
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue)
  }

  if (typeof value === 'object') {
    if (!value) {
      return false
    }
    return Object.values(value as Record<string, unknown>).every(isJsonValue)
  }

  return false
}

export const encodeStateToParam = (state: PlaygroundState): string => {
  const json = JSON.stringify(state)
  const bytes = new TextEncoder().encode(json)
  return toBase64Url(toBase64(bytes))
}

export const decodeStateFromParam = (param: string): PlaygroundState | null => {
  try {
    const base64 = fromBase64Url(param)
    const bytes = fromBase64(base64)
    const json = new TextDecoder().decode(bytes)
    const parsed: unknown = JSON.parse(json)
    if (!isJsonValue(parsed)) {
      return null
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null
    }
    return parsed as PlaygroundState
  } catch {
    return null
  }
}
