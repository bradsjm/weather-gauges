export type RadialFixture = {
  id: string
  label: string
  value: number
  min: number
  max: number
}

export const radialFixtures: RadialFixture[] = [
  {
    id: 'baseline-mid',
    label: 'Baseline Mid',
    value: 50,
    min: 0,
    max: 100
  },
  {
    id: 'baseline-low',
    label: 'Baseline Low',
    value: 5,
    min: 0,
    max: 100
  },
  {
    id: 'baseline-high',
    label: 'Baseline High',
    value: 95,
    min: 0,
    max: 100
  }
]
