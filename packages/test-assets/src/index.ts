export type RadialFixture = {
  id: string
  label: string
  title: string
  unit: string
  value: number
  min: number
  max: number
  threshold: number
  tokenOverrides?: Partial<{
    fontFamily: string
    textColor: string
    backgroundColor: string
    frameColor: string
    accentColor: string
    warningColor: string
    dangerColor: string
  }>
}

export const radialFixtures: RadialFixture[] = [
  {
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
