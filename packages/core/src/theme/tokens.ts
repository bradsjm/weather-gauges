export const themeTokenDefaults = {
  '--ss3-font-family': 'system-ui, sans-serif',
  '--ss3-text-color': '#1f2937',
  '--ss3-background-color': '#f8fafc',
  '--ss3-frame-color': '#dbe4ee',
  '--ss3-accent-color': '#0f766e',
  '--ss3-warning-color': '#b45309',
  '--ss3-danger-color': '#b91c1c'
} as const

export type ThemeTokenName = keyof typeof themeTokenDefaults

export type ThemeTokenMap = Record<ThemeTokenName, string>

export type ThemePaint = {
  fontFamily: string
  textColor: string
  backgroundColor: string
  frameColor: string
  accentColor: string
  warningColor: string
  dangerColor: string
}

export type ThemeTokenSource = (token: ThemeTokenName) => string | null | undefined

const normalizeTokenValue = (value: string | null | undefined): string | undefined => {
  if (value === null || value === undefined) {
    return undefined
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return undefined
  }

  return trimmed
}

const mergeToken = (
  base: ThemeTokenMap,
  token: ThemeTokenName,
  value: string | null | undefined
): ThemeTokenMap => {
  const normalized = normalizeTokenValue(value)
  if (normalized === undefined) {
    return base
  }

  return {
    ...base,
    [token]: normalized
  }
}

export const resolveThemeTokens = (
  options: {
    source?: ThemeTokenSource
    overrides?: Partial<ThemeTokenMap>
  } = {}
): ThemeTokenMap => {
  const defaults: ThemeTokenMap = { ...themeTokenDefaults }

  const fromSource = options.source
    ? (Object.keys(themeTokenDefaults) as ThemeTokenName[]).reduce<ThemeTokenMap>((acc, token) => {
        return mergeToken(acc, token, options.source?.(token))
      }, defaults)
    : defaults

  if (!options.overrides) {
    return fromSource
  }

  return (Object.keys(themeTokenDefaults) as ThemeTokenName[]).reduce<ThemeTokenMap>(
    (acc, token) => {
      return mergeToken(acc, token, options.overrides?.[token])
    },
    fromSource
  )
}

export const resolveThemePaint = (
  options: {
    source?: ThemeTokenSource
    overrides?: Partial<ThemeTokenMap>
  } = {}
): ThemePaint => {
  const tokens = resolveThemeTokens(options)

  return {
    fontFamily: tokens['--ss3-font-family'],
    textColor: tokens['--ss3-text-color'],
    backgroundColor: tokens['--ss3-background-color'],
    frameColor: tokens['--ss3-frame-color'],
    accentColor: tokens['--ss3-accent-color'],
    warningColor: tokens['--ss3-warning-color'],
    dangerColor: tokens['--ss3-danger-color']
  }
}

export const createStyleTokenSource = (style: {
  getPropertyValue: (token: string) => string
}): ThemeTokenSource => {
  return (token) => style.getPropertyValue(token)
}
