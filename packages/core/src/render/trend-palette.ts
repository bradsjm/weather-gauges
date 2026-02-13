import type { ThemePaint } from '../theme/tokens.js'

export type TrendLedColor = {
  innerColor1: string
  innerColor2: string
  outerColor: string
  coronaColor: string
}

export type RadialTrendPalette = {
  up: TrendLedColor
  steady: TrendLedColor
  down: TrendLedColor
  disabledFrom: string
  disabledTo: string
  shadow: string
  highlight: string
}

const defaultPalette: RadialTrendPalette = {
  up: {
    innerColor1: '#FF9A89',
    innerColor2: '#FF9A89',
    outerColor: '#FF3300',
    coronaColor: '#FF8D70'
  },
  steady: {
    innerColor1: '#9AFF89',
    innerColor2: '#9AFF89',
    outerColor: '#59FF2A',
    coronaColor: '#A5FF00'
  },
  down: {
    innerColor1: '#00FFFF',
    innerColor2: '#00FFFF',
    outerColor: '#1BC3C3',
    coronaColor: '#00FFFF'
  },
  disabledFrom: '#323232',
  disabledTo: '#5C5C5C',
  shadow: 'rgba(0, 0, 0, 0.4)',
  highlight: 'rgba(255, 255, 255, 0.3)'
}

export const resolveRadialTrendPalette = (
  paint?: Pick<
    ThemePaint,
    | 'trendUpInner1'
    | 'trendUpInner2'
    | 'trendUpOuter'
    | 'trendUpCorona'
    | 'trendSteadyInner1'
    | 'trendSteadyInner2'
    | 'trendSteadyOuter'
    | 'trendSteadyCorona'
    | 'trendDownInner1'
    | 'trendDownInner2'
    | 'trendDownOuter'
    | 'trendDownCorona'
    | 'trendDisabledFrom'
    | 'trendDisabledTo'
    | 'trendShadow'
    | 'trendHighlight'
  >
): RadialTrendPalette => {
  if (!paint) {
    return defaultPalette
  }

  return {
    up: {
      innerColor1: paint.trendUpInner1,
      innerColor2: paint.trendUpInner2,
      outerColor: paint.trendUpOuter,
      coronaColor: paint.trendUpCorona
    },
    steady: {
      innerColor1: paint.trendSteadyInner1,
      innerColor2: paint.trendSteadyInner2,
      outerColor: paint.trendSteadyOuter,
      coronaColor: paint.trendSteadyCorona
    },
    down: {
      innerColor1: paint.trendDownInner1,
      innerColor2: paint.trendDownInner2,
      outerColor: paint.trendDownOuter,
      coronaColor: paint.trendDownCorona
    },
    disabledFrom: paint.trendDisabledFrom,
    disabledTo: paint.trendDisabledTo,
    shadow: paint.trendShadow,
    highlight: paint.trendHighlight
  }
}
