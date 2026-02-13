import { asFiniteNumber, clampNumber } from '../gauge-utils'
import { backgroundOptions, foregroundTypeOptions, frameOptions } from '../options'
import { renderPlaygroundPage } from '../playground'
import type { ControlDef, PlaygroundState } from '../types'

type RosePetal = {
  direction: number
  value: number
  color?: string
}

const circularDistance = (left: number, right: number): number => {
  const delta = Math.abs(left - right)
  return Math.min(delta, 360 - delta)
}

const asBinCount = (value: unknown): 8 | 16 | 32 => {
  const numeric = Math.round(asFiniteNumber(value, 16))
  if (numeric === 8 || numeric === 16 || numeric === 32) {
    return numeric
  }

  return 16
}

const buildRosePetals = (state: PlaygroundState): RosePetal[] => {
  const binCount = asBinCount(state.binCount)
  const maxValue = clampNumber(asFiniteNumber(state.maxValue, 100), 1, 500)
  const baseValue = clampNumber(asFiniteNumber(state.baseValue, 6), 0, maxValue)
  const primaryDirection = clampNumber(asFiniteNumber(state.primaryDirection, 250), 0, 359)
  const primaryStrength = clampNumber(asFiniteNumber(state.primaryStrength, 70), 0, maxValue)
  const primarySpread = clampNumber(asFiniteNumber(state.primarySpread, 36), 8, 120)
  const secondaryDirection = clampNumber(asFiniteNumber(state.secondaryDirection, 305), 0, 359)
  const secondaryStrength = clampNumber(asFiniteNumber(state.secondaryStrength, 28), 0, maxValue)
  const secondarySpread = clampNumber(asFiniteNumber(state.secondarySpread, 48), 8, 140)

  const binStep = 360 / binCount
  const petals: RosePetal[] = []

  for (let index = 0; index < binCount; index += 1) {
    const direction = index * binStep
    const primaryDistance = circularDistance(direction, primaryDirection)
    const secondaryDistance = circularDistance(direction, secondaryDirection)

    const primaryContribution =
      primaryStrength *
      Math.exp(-(primaryDistance * primaryDistance) / (2 * primarySpread * primarySpread))
    const secondaryContribution =
      secondaryStrength *
      Math.exp(-(secondaryDistance * secondaryDistance) / (2 * secondarySpread * secondarySpread))

    const value = clampNumber(baseValue + primaryContribution + secondaryContribution, 0, maxValue)
    petals.push({
      direction,
      value: Number(value.toFixed(1))
    })
  }

  const accentIndex = Math.round(270 / binStep) % binCount
  const accentPetal = petals[accentIndex]
  if (accentPetal) {
    accentPetal.color = '#4f8cff'
  }

  return petals
}

export const renderWindRosePage = (root: HTMLElement): void => {
  const defaults: PlaygroundState = {
    title: 'Wind Rose',
    unit: 'miles',
    binCount: 16,
    maxValue: 100,
    baseValue: 6,
    primaryDirection: 252,
    primaryStrength: 72,
    primarySpread: 32,
    secondaryDirection: 300,
    secondaryStrength: 24,
    secondarySpread: 46,
    frameDesign: 'metal',
    backgroundColor: 'BEIGE',
    foregroundType: 'type1',
    roseCenterColor: '#f5a68a',
    roseEdgeColor: '#d6452f',
    showOutline: true,
    roseLineColor: '#8d2f1f',
    roseCenterAlpha: 0.25,
    roseEdgeAlpha: 0.7,
    showFrame: true,
    showBackground: true,
    showForeground: true,
    showPointSymbols: true,
    showTickmarks: true,
    showDegreeScale: false,
    animateValue: true,
    petals: []
  }

  const controls: ControlDef[] = [
    {
      key: 'binCount',
      label: 'Direction Bins',
      description: 'Discrete pre-binned direction count.',
      type: 'select',
      options: [
        { value: '8', label: '8 bins (45°)' },
        { value: '16', label: '16 bins (22.5°)' },
        { value: '32', label: '32 bins (11.25°)' }
      ]
    },
    {
      key: 'maxValue',
      label: 'Max Value',
      description: 'Upper bound for all rose petal magnitudes.',
      type: 'number',
      min: 1,
      max: 500,
      step: 1
    },
    {
      key: 'baseValue',
      label: 'Base Value',
      description: 'Baseline value added to every direction bin.',
      type: 'range',
      min: 0,
      max: 120,
      step: 1
    },
    {
      key: 'primaryDirection',
      label: 'Primary Direction',
      description: 'Center direction of the dominant wind cluster.',
      type: 'range',
      min: 0,
      max: 359,
      step: 1
    },
    {
      key: 'primaryStrength',
      label: 'Primary Strength',
      description: 'Peak magnitude of the dominant cluster.',
      type: 'range',
      min: 0,
      max: 200,
      step: 1
    },
    {
      key: 'primarySpread',
      label: 'Primary Spread',
      description: 'Angular width of the dominant cluster.',
      type: 'range',
      min: 8,
      max: 120,
      step: 1
    },
    {
      key: 'secondaryDirection',
      label: 'Secondary Direction',
      description: 'Center direction of a secondary cluster.',
      type: 'range',
      min: 0,
      max: 359,
      step: 1
    },
    {
      key: 'secondaryStrength',
      label: 'Secondary Strength',
      description: 'Peak magnitude of the secondary cluster.',
      type: 'range',
      min: 0,
      max: 200,
      step: 1
    },
    {
      key: 'secondarySpread',
      label: 'Secondary Spread',
      description: 'Angular width of the secondary cluster.',
      type: 'range',
      min: 8,
      max: 140,
      step: 1
    },
    { key: 'title', label: 'Title', description: 'Gauge title text.', type: 'text' },
    { key: 'unit', label: 'Unit', description: 'Gauge unit label.', type: 'text' },
    {
      key: 'frameDesign',
      label: 'Frame Design',
      description: 'Outer bezel material.',
      type: 'select',
      options: frameOptions
    },
    {
      key: 'backgroundColor',
      label: 'Background',
      description: 'Dial background material/palette.',
      type: 'select',
      options: backgroundOptions
    },
    {
      key: 'foregroundType',
      label: 'Foreground',
      description: 'Glass overlay highlight style.',
      type: 'select',
      options: foregroundTypeOptions
    },
    {
      key: 'roseCenterColor',
      label: 'Center Gradient Color',
      description: 'Center color for the radial rose gradient.',
      type: 'text'
    },
    {
      key: 'roseEdgeColor',
      label: 'Edge Gradient Color',
      description: 'Outer color for the radial rose gradient.',
      type: 'text'
    },
    {
      key: 'roseLineColor',
      label: 'Outline Color',
      description: 'Stroke color for rose polygon outline.',
      type: 'text'
    },
    {
      key: 'showOutline',
      label: 'Show Outline',
      description: 'Enable or disable rose polygon outline stroke.',
      type: 'checkbox'
    },
    {
      key: 'roseCenterAlpha',
      label: 'Center Alpha',
      description: 'Opacity at center of radial gradient.',
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      key: 'roseEdgeAlpha',
      label: 'Edge Alpha',
      description: 'Opacity at edge of radial gradient.',
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      key: 'showFrame',
      label: 'Show Frame',
      description: 'Toggle frame visibility.',
      type: 'checkbox'
    },
    {
      key: 'showBackground',
      label: 'Show Background',
      description: 'Toggle background visibility.',
      type: 'checkbox'
    },
    {
      key: 'showForeground',
      label: 'Show Foreground',
      description: 'Toggle foreground visibility.',
      type: 'checkbox'
    },
    {
      key: 'showPointSymbols',
      label: 'Show Point Symbols',
      description: 'Show N/NE/E/S labels on the compass scale.',
      type: 'checkbox'
    },
    {
      key: 'showTickmarks',
      label: 'Show Tick Marks',
      description: 'Toggle compass tick mark lines while keeping labels.',
      type: 'checkbox'
    },
    {
      key: 'showDegreeScale',
      label: 'Show Degree Scale',
      description: 'Show degree labels like wind-direction gauge.',
      type: 'checkbox'
    },
    {
      key: 'animateValue',
      label: 'Animate Value',
      description: 'Animate petal transitions on updates.',
      type: 'checkbox'
    }
  ]

  renderPlaygroundPage(
    root,
    'Wind Rose Playground',
    'Wind Rose reuses the wind-direction base while plotting pre-binned directional petals with a center-outward gradient. Each petal object may include an optional color field.',
    'steelseries-wind-rose-v3',
    controls,
    defaults,
    (state) => {
      state.binCount = asBinCount(state.binCount)
      state.maxValue = clampNumber(asFiniteNumber(state.maxValue, 100), 1, 500)
      state.baseValue = clampNumber(asFiniteNumber(state.baseValue, 6), 0, 500)
      state.primaryDirection = clampNumber(asFiniteNumber(state.primaryDirection, 252), 0, 359)
      state.primaryStrength = clampNumber(asFiniteNumber(state.primaryStrength, 72), 0, 500)
      state.primarySpread = clampNumber(asFiniteNumber(state.primarySpread, 32), 8, 120)
      state.secondaryDirection = clampNumber(asFiniteNumber(state.secondaryDirection, 300), 0, 359)
      state.secondaryStrength = clampNumber(asFiniteNumber(state.secondaryStrength, 24), 0, 500)
      state.secondarySpread = clampNumber(asFiniteNumber(state.secondarySpread, 46), 8, 140)
      state.roseCenterAlpha = clampNumber(asFiniteNumber(state.roseCenterAlpha, 0.25), 0, 1)
      state.roseEdgeAlpha = clampNumber(asFiniteNumber(state.roseEdgeAlpha, 0.7), 0, 1)
      state.petals = buildRosePetals(state)
    }
  )
}
