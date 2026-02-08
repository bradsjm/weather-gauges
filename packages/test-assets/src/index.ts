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
