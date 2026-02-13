import { asFiniteNumber, clampNumber } from '../gauge-utils'
import {
  backgroundOptions,
  foregroundTypeOptions,
  frameOptions,
  knobStyleOptions,
  knobTypeOptions,
  lcdColorOptions,
  windDirectionPresetOptions,
  pointerColorOptions,
  pointerTypeOptions
} from '../options'
import { renderPlaygroundPage } from '../playground'
import type { ControlDef, PlaygroundState } from '../types'

type PresetKey = '' | 'wind-direction'

const windDirectionPresetExamples: Record<PresetKey, Partial<PlaygroundState>> = {
  '': {
    title: 'Wind',
    unit: 'deg',
    averageLabel: 'Average',
    valueLatest: 48,
    valueAverage: 63,
    warningAlertHeading: 90,
    criticalAlertHeading: 180
  },
  'wind-direction': {
    title: 'Wind Direction',
    unit: '°',
    averageLabel: 'Average',
    valueLatest: 245,
    valueAverage: 238,
    warningAlertHeading: 260,
    criticalAlertHeading: 290
  }
}

export const renderWindPage = (root: HTMLElement): void => {
  const defaults: PlaygroundState = {
    valueLatest: 48,
    valueAverage: 63,
    preset: '',
    alertsEnabled: false,
    warningAlertHeading: 90,
    criticalAlertHeading: 180,
    title: 'Wind',
    unit: 'deg',
    frameDesign: 'metal',
    backgroundColor: 'DARK_GRAY',
    pointerTypeLatest: 'type1',
    pointerTypeAverage: 'type8',
    pointerColorLatest: 'RED',
    pointerColorAverage: 'BLUE',
    knobType: 'standardKnob',
    knobStyle: 'silver',
    foregroundType: 'type1',
    lcdColor: 'STANDARD',
    averageLabel: 'Average',
    showFrame: true,
    showBackground: true,
    showForeground: true,
    showLcd: true,
    animateValue: true,
    showPointSymbols: true,
    showTickmarks: true,
    showDegreeScale: true,
    showRose: true,
    degreeScaleHalf: false,
    digitalFont: false,
    useColorLabels: false
  }

  const controls: ControlDef[] = [
    {
      key: 'preset',
      label: 'Measurement Preset',
      description: 'Apply wind-direction defaults for title/unit and average label.',
      type: 'select',
      options: windDirectionPresetOptions
    },
    {
      key: 'valueLatest',
      label: 'Latest Value',
      description: 'Latest wind direction value.',
      type: 'range',
      min: 0,
      max: 359,
      step: 1
    },
    {
      key: 'valueAverage',
      label: 'Average Value',
      description: 'Average wind direction value.',
      type: 'range',
      min: 0,
      max: 359,
      step: 1
    },
    {
      key: 'alertsEnabled',
      label: 'Enable Alerts',
      description: 'Enable warning/critical heading alerts for wind pointers.',
      type: 'checkbox'
    },
    {
      key: 'warningAlertHeading',
      label: 'Warning Alert Heading',
      description: 'Heading where warning alert activates.',
      type: 'range',
      min: 0,
      max: 359,
      step: 1
    },
    {
      key: 'criticalAlertHeading',
      label: 'Critical Alert Heading',
      description: 'Heading where critical alert activates.',
      type: 'range',
      min: 0,
      max: 359,
      step: 1
    },
    { key: 'title', label: 'Title', description: 'Gauge title text.', type: 'text' },
    { key: 'unit', label: 'Unit', description: 'Unit text.', type: 'text' },
    {
      key: 'frameDesign',
      label: 'Frame Design',
      description: 'Outer bezel style.',
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
      key: 'pointerTypeLatest',
      label: 'Latest Pointer Type',
      description: 'Pointer style for latest value.',
      type: 'select',
      options: pointerTypeOptions
    },
    {
      key: 'pointerTypeAverage',
      label: 'Average Pointer Type',
      description: 'Pointer style for average value.',
      type: 'select',
      options: pointerTypeOptions
    },
    {
      key: 'pointerColorLatest',
      label: 'Latest Pointer Color',
      description: 'Pointer color family for latest.',
      type: 'select',
      options: pointerColorOptions
    },
    {
      key: 'pointerColorAverage',
      label: 'Average Pointer Color',
      description: 'Pointer color family for average.',
      type: 'select',
      options: pointerColorOptions
    },
    {
      key: 'knobType',
      label: 'Knob Type',
      description: 'Hub type used at center.',
      type: 'select',
      options: knobTypeOptions
    },
    {
      key: 'knobStyle',
      label: 'Knob Style',
      description: 'Hub finish style.',
      type: 'select',
      options: knobStyleOptions
    },
    {
      key: 'foregroundType',
      label: 'Foreground',
      description: 'Glass overlay type.',
      type: 'select',
      options: foregroundTypeOptions
    },
    {
      key: 'lcdColor',
      label: 'LCD Color',
      description: 'LCD panel palette.',
      type: 'select',
      options: lcdColorOptions
    },
    {
      key: 'averageLabel',
      label: 'Average Label',
      description: 'Title above average LCD row.',
      type: 'text'
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
      description: 'Toggle dial background visibility.',
      type: 'checkbox'
    },
    {
      key: 'showForeground',
      label: 'Show Foreground',
      description: 'Toggle glass foreground visibility.',
      type: 'checkbox'
    },
    { key: 'showLcd', label: 'Show LCD', description: 'Toggle LCD visibility.', type: 'checkbox' },
    {
      key: 'animateValue',
      label: 'Animate Value',
      description: 'Animate latest/average pointer transitions when values change.',
      type: 'checkbox'
    },
    {
      key: 'showPointSymbols',
      label: 'Show Point Symbols',
      description: 'Show N/NE/E labels.',
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
      description: 'Show degree scale labels.',
      type: 'checkbox'
    },
    {
      key: 'showRose',
      label: 'Show Rose',
      description: 'Show compass rose overlay.',
      type: 'checkbox'
    },
    {
      key: 'degreeScaleHalf',
      label: 'Half Heading Scale',
      description: 'Show degree labels and LCD values as -180 to 180 instead of 0 to 360.',
      type: 'checkbox'
    },
    {
      key: 'digitalFont',
      label: 'Digital Font',
      description: 'Use digital LCD font style.',
      type: 'checkbox'
    },
    {
      key: 'useColorLabels',
      label: 'Color LCD Labels',
      description: 'Color latest/average labels to match pointer colors.',
      type: 'checkbox'
    }
  ]

  let previousPreset: PresetKey = ''

  renderPlaygroundPage(
    root,
    'Wind Direction Playground',
    'Tune the dual-pointer wind-direction gauge live. Preset precedence: property > child > preset > default. Example: <code>&lt;wx-wind-direction preset="wind-direction" unit="deg"&gt;&lt;/wx-wind-direction&gt;</code>.',
    'wx-wind-direction',
    controls,
    defaults,
    (state) => {
      const preset =
        typeof state.preset === 'string' && state.preset in windDirectionPresetExamples
          ? (state.preset as PresetKey)
          : ''
      if (preset !== previousPreset) {
        const example = windDirectionPresetExamples[preset]
        Object.assign(state, example)
        previousPreset = preset
      }

      state.valueLatest = clampNumber(asFiniteNumber(state.valueLatest, 0), 0, 359)
      state.valueAverage = clampNumber(asFiniteNumber(state.valueAverage, 0), 0, 359)
      state.warningAlertHeading = clampNumber(asFiniteNumber(state.warningAlertHeading, 90), 0, 359)
      state.criticalAlertHeading = clampNumber(
        asFiniteNumber(state.criticalAlertHeading, 180),
        0,
        359
      )
    }
  )
}
