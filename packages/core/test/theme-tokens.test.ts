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
          '--ss3-text-color': ' #112233 ',
          '--ss3-background-color': ''
        }

        return values[token] ?? ''
      }
    })

    const resolved = resolveThemeTokens({ source })
    expect(resolved['--ss3-text-color']).toBe('#112233')
    expect(resolved['--ss3-background-color']).toBe(themeTokenDefaults['--ss3-background-color'])
  })

  it('applies explicit overrides over source and defaults', () => {
    const resolved = resolveThemeTokens({
      source: (token) => {
        if (token === '--ss3-warning-color') {
          return '#a16207'
        }

        return undefined
      },
      overrides: {
        '--ss3-warning-color': '#ca8a04',
        '--ss3-danger-color': '#dc2626'
      }
    })

    expect(resolved['--ss3-warning-color']).toBe('#ca8a04')
    expect(resolved['--ss3-danger-color']).toBe('#dc2626')
  })

  it('maps resolved tokens into typed paint output', () => {
    const paint = resolveThemePaint({
      overrides: {
        '--ss3-font-family': 'Avenir Next, sans-serif',
        '--ss3-accent-color': '#0d9488'
      }
    })

    expect(paint.fontFamily).toBe('Avenir Next, sans-serif')
    expect(paint.accentColor).toBe('#0d9488')
    expect(paint.frameColor).toBe(themeTokenDefaults['--ss3-frame-color'])
  })
})
