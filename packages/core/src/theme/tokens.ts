export const themeTokenDefaults = {
  '--wx-font-family': 'system-ui, sans-serif',
  '--wx-font-family-lcd':
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  '--wx-text-color': '#1f2937',
  '--wx-background-color': '#f8fafc',
  '--wx-frame-color': '#dbe4ee',
  '--wx-accent-color': '#0f766e',
  '--wx-warning-color': '#b45309',
  '--wx-danger-color': '#b91c1c',
  '--wx-trend-up-inner-1': '#FF9A89',
  '--wx-trend-up-inner-2': '#FF9A89',
  '--wx-trend-up-outer': '#FF3300',
  '--wx-trend-up-corona': '#FF8D70',
  '--wx-trend-steady-inner-1': '#9AFF89',
  '--wx-trend-steady-inner-2': '#9AFF89',
  '--wx-trend-steady-outer': '#59FF2A',
  '--wx-trend-steady-corona': '#A5FF00',
  '--wx-trend-down-inner-1': '#00FFFF',
  '--wx-trend-down-inner-2': '#00FFFF',
  '--wx-trend-down-outer': '#1BC3C3',
  '--wx-trend-down-corona': '#00FFFF',
  '--wx-trend-disabled-from': '#323232',
  '--wx-trend-disabled-to': '#5C5C5C',
  '--wx-trend-shadow': 'rgba(0, 0, 0, 0.4)',
  '--wx-trend-highlight': 'rgba(255, 255, 255, 0.3)'
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
    fontFamily: tokens['--wx-font-family'],
    fontFamilyLcd: tokens['--wx-font-family-lcd'],
    textColor: tokens['--wx-text-color'],
    backgroundColor: tokens['--wx-background-color'],
    frameColor: tokens['--wx-frame-color'],
    accentColor: tokens['--wx-accent-color'],
    warningColor: tokens['--wx-warning-color'],
    dangerColor: tokens['--wx-danger-color'],
    trendUpInner1: tokens['--wx-trend-up-inner-1'],
    trendUpInner2: tokens['--wx-trend-up-inner-2'],
    trendUpOuter: tokens['--wx-trend-up-outer'],
    trendUpCorona: tokens['--wx-trend-up-corona'],
    trendSteadyInner1: tokens['--wx-trend-steady-inner-1'],
    trendSteadyInner2: tokens['--wx-trend-steady-inner-2'],
    trendSteadyOuter: tokens['--wx-trend-steady-outer'],
    trendSteadyCorona: tokens['--wx-trend-steady-corona'],
    trendDownInner1: tokens['--wx-trend-down-inner-1'],
    trendDownInner2: tokens['--wx-trend-down-inner-2'],
    trendDownOuter: tokens['--wx-trend-down-outer'],
    trendDownCorona: tokens['--wx-trend-down-corona'],
    trendDisabledFrom: tokens['--wx-trend-disabled-from'],
    trendDisabledTo: tokens['--wx-trend-disabled-to'],
    trendShadow: tokens['--wx-trend-shadow'],
    trendHighlight: tokens['--wx-trend-highlight']
  }
}

export const createStyleTokenSource = (style: {
  getPropertyValue: (token: string) => string
}): ThemeTokenSource => {
  return (token) => style.getPropertyValue(token)
}
