import { describe, expect, it } from 'vitest'

import {
  createStyleTokenSource,
  resolveThemePaint,
  resolveThemeTokens,
  themeTokenDefaults
} from '../src/index.js'

describe('theme token resolution', () => {
  it('returns defaults when no source or overrides are provided', () => {
    expect(resolveThemeTokens()).toEqual(themeTokenDefaults)
  })

  it('uses source values when provided and falls back when token values are empty', () => {
    const source = createStyleTokenSource({
      getPropertyValue: (token) => {
        const values: Record<string, string> = {
          '--wx-text-color': ' #112233 ',
          '--wx-background-color': ''
        }

        return values[token] ?? ''
      }
    })

    const resolved = resolveThemeTokens({ source })
    expect(resolved['--wx-text-color']).toBe('#112233')
    expect(resolved['--wx-background-color']).toBe(themeTokenDefaults['--wx-background-color'])
  })

  it('applies explicit overrides over source and defaults', () => {
    const resolved = resolveThemeTokens({
      source: (token) => {
        if (token === '--wx-warning-color') {
          return '#a16207'
        }

        return undefined
      },
      overrides: {
        '--wx-warning-color': '#ca8a04',
        '--wx-danger-color': '#dc2626'
      }
    })

    expect(resolved['--wx-warning-color']).toBe('#ca8a04')
    expect(resolved['--wx-danger-color']).toBe('#dc2626')
  })

  it('maps resolved tokens into typed paint output', () => {
    const paint = resolveThemePaint({
      overrides: {
        '--wx-font-family': 'Avenir Next, sans-serif',
        '--wx-accent-color': '#0d9488'
      }
    })

    expect(paint.fontFamily).toBe('Avenir Next, sans-serif')
    expect(paint.accentColor).toBe('#0d9488')
    expect(paint.frameColor).toBe(themeTokenDefaults['--wx-frame-color'])
  })
})
