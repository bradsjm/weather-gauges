export const themeTokenDefaults = {
  '--ss3-font-family': 'system-ui, sans-serif',
  '--ss3-font-family-lcd':
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  '--ss3-text-color': '#1f2937',
  '--ss3-background-color': '#f8fafc',
  '--ss3-frame-color': '#dbe4ee',
  '--ss3-accent-color': '#0f766e',
  '--ss3-warning-color': '#b45309',
  '--ss3-danger-color': '#b91c1c',
  '--ss3-trend-up-inner-1': '#FF9A89',
  '--ss3-trend-up-inner-2': '#FF9A89',
  '--ss3-trend-up-outer': '#FF3300',
  '--ss3-trend-up-corona': '#FF8D70',
  '--ss3-trend-steady-inner-1': '#9AFF89',
  '--ss3-trend-steady-inner-2': '#9AFF89',
  '--ss3-trend-steady-outer': '#59FF2A',
  '--ss3-trend-steady-corona': '#A5FF00',
  '--ss3-trend-down-inner-1': '#00FFFF',
  '--ss3-trend-down-inner-2': '#00FFFF',
  '--ss3-trend-down-outer': '#1BC3C3',
  '--ss3-trend-down-corona': '#00FFFF',
  '--ss3-trend-disabled-from': '#323232',
  '--ss3-trend-disabled-to': '#5C5C5C',
  '--ss3-trend-shadow': 'rgba(0, 0, 0, 0.4)',
  '--ss3-trend-highlight': 'rgba(255, 255, 255, 0.3)'
} as const

export type ThemeTokenName = keyof typeof themeTokenDefaults

export type ThemeTokenMap = Record<ThemeTokenName, string>

export type ThemePaint = {
  fontFamily: string
  fontFamilyLcd: string
  textColor: string
  backgroundColor: string
  frameColor: string
  accentColor: string
  warningColor: string
  dangerColor: string
  trendUpInner1: string
  trendUpInner2: string
  trendUpOuter: string
  trendUpCorona: string
  trendSteadyInner1: string
  trendSteadyInner2: string
  trendSteadyOuter: string
  trendSteadyCorona: string
  trendDownInner1: string
  trendDownInner2: string
  trendDownOuter: string
  trendDownCorona: string
  trendDisabledFrom: string
  trendDisabledTo: string
  trendShadow: string
  trendHighlight: string
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
    fontFamilyLcd: tokens['--ss3-font-family-lcd'],
    textColor: tokens['--ss3-text-color'],
    backgroundColor: tokens['--ss3-background-color'],
    frameColor: tokens['--ss3-frame-color'],
    accentColor: tokens['--ss3-accent-color'],
    warningColor: tokens['--ss3-warning-color'],
    dangerColor: tokens['--ss3-danger-color'],
    trendUpInner1: tokens['--ss3-trend-up-inner-1'],
    trendUpInner2: tokens['--ss3-trend-up-inner-2'],
    trendUpOuter: tokens['--ss3-trend-up-outer'],
    trendUpCorona: tokens['--ss3-trend-up-corona'],
    trendSteadyInner1: tokens['--ss3-trend-steady-inner-1'],
    trendSteadyInner2: tokens['--ss3-trend-steady-inner-2'],
    trendSteadyOuter: tokens['--ss3-trend-steady-outer'],
    trendSteadyCorona: tokens['--ss3-trend-steady-corona'],
    trendDownInner1: tokens['--ss3-trend-down-inner-1'],
    trendDownInner2: tokens['--ss3-trend-down-inner-2'],
    trendDownOuter: tokens['--ss3-trend-down-outer'],
    trendDownCorona: tokens['--ss3-trend-down-corona'],
    trendDisabledFrom: tokens['--ss3-trend-disabled-from'],
    trendDisabledTo: tokens['--ss3-trend-disabled-to'],
    trendShadow: tokens['--ss3-trend-shadow'],
    trendHighlight: tokens['--ss3-trend-highlight']
  }
}

export const createStyleTokenSource = (style: {
  getPropertyValue: (token: string) => string
}): ThemeTokenSource => {
  return (token) => style.getPropertyValue(token)
}
