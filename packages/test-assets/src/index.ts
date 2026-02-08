type TokenOverrides = Partial<{
  fontFamily: string
  textColor: string
  backgroundColor: string
  frameColor: string
  accentColor: string
  warningColor: string
  dangerColor: string
}>

type BaseFixture = {
  id: string
  label: string
  title: string
  unit: string
  min?: number
  max?: number
  threshold?: number
  tokenOverrides?: TokenOverrides
}

export type RadialFixture = BaseFixture & {
  kind: 'radial'
  value: number
}

export type LinearFixture = BaseFixture & {
  kind: 'linear'
  value: number
  width: number
  height: number
}

export type CompassFixture = BaseFixture & {
  kind: 'compass'
  heading: number
  size: number
}

export type RadialBargraphFixture = BaseFixture & {
  kind: 'radial-bargraph'
  value: number
  size: number
  frameDesign?:
    | 'blackMetal'
    | 'metal'
    | 'shinyMetal'
    | 'brass'
    | 'steel'
    | 'chrome'
    | 'gold'
    | 'anthracite'
    | 'tiltedGray'
    | 'tiltedBlack'
    | 'glossyMetal'
  radialBackgroundColor?:
    | 'DARK_GRAY'
    | 'SATIN_GRAY'
    | 'LIGHT_GRAY'
    | 'WHITE'
    | 'BLACK'
    | 'BEIGE'
    | 'BROWN'
    | 'RED'
    | 'GREEN'
    | 'BLUE'
    | 'ANTHRACITE'
    | 'MUD'
    | 'PUNCHED_SHEET'
    | 'CARBON'
    | 'STAINLESS'
    | 'BRUSHED_METAL'
    | 'BRUSHED_STAINLESS'
    | 'TURNED'
  radialGaugeType?: 'type1' | 'type2' | 'type3' | 'type4'
  valueColor?:
    | 'RED'
    | 'GREEN'
    | 'BLUE'
    | 'ORANGE'
    | 'YELLOW'
    | 'CYAN'
    | 'MAGENTA'
    | 'WHITE'
    | 'GRAY'
    | 'BLACK'
    | 'RAITH'
    | 'GREEN_LCD'
    | 'JUG_GREEN'
  foregroundType?: 'type1' | 'type2' | 'type3' | 'type4' | 'type5'
  lcdColor?:
    | 'STANDARD'
    | 'STANDARD_GREEN'
    | 'BLUE'
    | 'ORANGE'
    | 'RED'
    | 'YELLOW'
    | 'WHITE'
    | 'GRAY'
    | 'BLACK'
  tickLabelOrientation?: 'horizontal' | 'tangent' | 'normal'
  labelNumberFormat?: 'standard' | 'fractional' | 'scientific'
  useSectionColors?: boolean
  useValueGradient?: boolean
  showLcd?: boolean
  digitalFont?: boolean
  ledVisible?: boolean
  userLedVisible?: boolean
  trendVisible?: boolean
  trendState?: 'up' | 'steady' | 'down' | 'off'
}

export const radialFixtures: RadialFixture[] = [
  {
    kind: 'radial',
    id: 'baseline-mid',
    label: 'Baseline Mid',
    title: 'Pressure',
    unit: 'psi',
    value: 50,
    min: 0,
    max: 100,
    threshold: 80
  },
  {
    kind: 'radial',
    id: 'baseline-low',
    label: 'Baseline Low',
    title: 'Flow',
    unit: 'gpm',
    value: 5,
    min: 0,
    max: 100,
    threshold: 70
  },
  {
    kind: 'radial',
    id: 'baseline-high',
    label: 'Baseline High',
    title: 'Temperature',
    unit: '°F',
    value: 95,
    min: 0,
    max: 100,
    threshold: 72,
    tokenOverrides: {
      fontFamily: 'IBM Plex Sans, sans-serif',
      backgroundColor: '#e0f2fe',
      frameColor: '#bae6fd',
      textColor: '#0c4a6e',
      accentColor: '#0f766e',
      warningColor: '#ca8a04',
      dangerColor: '#dc2626'
    }
  }
]

export const linearFixtures: LinearFixture[] = [
  {
    kind: 'linear',
    id: 'linear-mid',
    label: 'Linear Mid',
    title: 'Tank',
    unit: '%',
    value: 58,
    min: 0,
    max: 100,
    threshold: 70,
    width: 140,
    height: 300
  },
  {
    kind: 'linear',
    id: 'linear-low',
    label: 'Linear Low',
    title: 'Reservoir',
    unit: '%',
    value: 12,
    min: 0,
    max: 100,
    threshold: 65,
    width: 140,
    height: 300,
    tokenOverrides: {
      backgroundColor: '#ecfeff',
      frameColor: '#a5f3fc',
      textColor: '#164e63'
    }
  }
]

export const compassFixtures: CompassFixture[] = [
  {
    kind: 'compass',
    id: 'compass-east',
    label: 'Compass East',
    title: 'Heading',
    unit: 'deg',
    heading: 92,
    size: 240
  },
  {
    kind: 'compass',
    id: 'compass-south',
    label: 'Compass South',
    title: 'Bearing',
    unit: 'deg',
    heading: 184,
    size: 240,
    tokenOverrides: {
      backgroundColor: '#1e293b',
      frameColor: '#334155',
      textColor: '#e2e8f0',
      accentColor: '#38bdf8',
      warningColor: '#f59e0b',
      dangerColor: '#ef4444'
    }
  }
]

export const radialBargraphFixtures: RadialBargraphFixture[] = [
  {
    kind: 'radial-bargraph',
    id: 'radial-bargraph-reference',
    label: 'Bargraph Reference',
    title: '',
    unit: '',
    value: 75,
    min: 0,
    max: 100,
    threshold: 75,
    size: 220,
    frameDesign: 'metal',
    radialBackgroundColor: 'DARK_GRAY',
    radialGaugeType: 'type4',
    valueColor: 'RED',
    foregroundType: 'type1',
    lcdColor: 'STANDARD',
    tickLabelOrientation: 'normal',
    labelNumberFormat: 'standard',
    showLcd: true,
    digitalFont: false,
    ledVisible: false,
    userLedVisible: false,
    trendVisible: false,
    trendState: 'off'
  },
  {
    kind: 'radial-bargraph',
    id: 'radial-bargraph-type1',
    label: 'Bargraph Type1',
    title: 'Load',
    unit: '%',
    value: 42,
    min: 0,
    max: 100,
    threshold: 70,
    size: 240,
    frameDesign: 'metal',
    radialBackgroundColor: 'DARK_GRAY',
    radialGaugeType: 'type1',
    valueColor: 'RED',
    foregroundType: 'type1',
    lcdColor: 'STANDARD',
    tickLabelOrientation: 'tangent',
    labelNumberFormat: 'standard'
  },
  {
    kind: 'radial-bargraph',
    id: 'radial-bargraph-gradient-type3',
    label: 'Bargraph Gradient Type3',
    title: 'Temp',
    unit: 'C',
    value: 76,
    min: 0,
    max: 120,
    threshold: 85,
    size: 240,
    frameDesign: 'brass',
    radialBackgroundColor: 'BEIGE',
    radialGaugeType: 'type3',
    valueColor: 'GREEN',
    foregroundType: 'type3',
    lcdColor: 'BLUE',
    tickLabelOrientation: 'normal',
    labelNumberFormat: 'fractional',
    useValueGradient: true,
    digitalFont: true,
    ledVisible: true,
    userLedVisible: true,
    trendVisible: true,
    trendState: 'up'
  },
  {
    kind: 'radial-bargraph',
    id: 'radial-bargraph-sections-type4',
    label: 'Bargraph Sections Type4',
    title: 'Pressure',
    unit: 'psi',
    value: 90,
    min: 0,
    max: 100,
    threshold: 72,
    size: 240,
    frameDesign: 'chrome',
    radialBackgroundColor: 'ANTHRACITE',
    radialGaugeType: 'type4',
    valueColor: 'ORANGE',
    foregroundType: 'type2',
    lcdColor: 'STANDARD_GREEN',
    tickLabelOrientation: 'horizontal',
    labelNumberFormat: 'scientific',
    useSectionColors: true,
    showLcd: false,
    trendVisible: true,
    trendState: 'steady',
    tokenOverrides: {
      backgroundColor: '#0f172a',
      frameColor: '#334155',
      textColor: '#e2e8f0',
      accentColor: '#22d3ee',
      warningColor: '#f59e0b',
      dangerColor: '#ef4444'
    }
  }
]
