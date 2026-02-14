import { asFiniteNumber, clampNumber } from '../gauge-utils'
import {
  backgroundOptions,
  foregroundTypeOptions,
  frameOptions,
  gaugeTypeOptions,
  lcdColorOptions,
  measurementPresetOptions,
  pointerColorOptions
} from '../options'
import { renderPlaygroundPage } from '../playground'
import type { ControlDef, PlaygroundState } from '../types'

type PresetKey =
  | ''
  | 'temperature'
  | 'humidity'
  | 'pressure'
  | 'wind-speed'
  | 'rainfall'
  | 'rain-rate'
  | 'solar'
  | 'uv-index'
  | 'cloud-base'

const radialBargraphPresetExamples: Record<PresetKey, Partial<PlaygroundState>> = {
  '': {
    title: 'Pressure',
    unit: 'psi',
    minValue: 0,
    maxValue: 100,
    value: 72,
    threshold: 80,
    warningAlertValue: 80,
    criticalAlertValue: 95,
    trendVisible: false
  },
  temperature: {
    title: 'Temperature',
    unit: '°C',
    minValue: -20,
    maxValue: 40,
    value: 21,
    threshold: 30,
    warningAlertValue: 30,
    criticalAlertValue: 35,
    trendVisible: true
  },
  humidity: {
    title: 'Humidity',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    value: 58,
    threshold: 80,
    warningAlertValue: 70,
    criticalAlertValue: 85,
    trendVisible: false
  },
  pressure: {
    title: 'Pressure',
    unit: 'hPa',
    minValue: 990,
    maxValue: 1030,
    value: 1012,
    threshold: 1022,
    warningAlertValue: 1018,
    criticalAlertValue: 1025,
    trendVisible: true
  },
  'wind-speed': {
    title: 'Wind Speed',
    unit: 'km/h',
    minValue: 0,
    maxValue: 30,
    value: 16,
    threshold: 20,
    warningAlertValue: 18,
    criticalAlertValue: 24,
    trendVisible: true
  },
  rainfall: {
    title: 'Rainfall',
    unit: 'mm',
    minValue: 0,
    maxValue: 10,
    value: 2,
    threshold: 6,
    warningAlertValue: 5,
    criticalAlertValue: 8,
    trendVisible: false
  },
  'rain-rate': {
    title: 'Rain Rate',
    unit: 'mm/h',
    minValue: 0,
    maxValue: 10,
    value: 3,
    threshold: 6,
    warningAlertValue: 5,
    criticalAlertValue: 8,
    trendVisible: false
  },
  solar: {
    title: 'Solar',
    unit: 'W/m²',
    minValue: 0,
    maxValue: 1000,
    value: 560,
    threshold: 800,
    warningAlertValue: 700,
    criticalAlertValue: 900,
    trendVisible: false
  },
  'uv-index': {
    title: 'UV Index',
    unit: '',
    minValue: 0,
    maxValue: 10,
    value: 5,
    threshold: 7,
    warningAlertValue: 6,
    criticalAlertValue: 8,
    trendVisible: false
  },
  'cloud-base': {
    title: 'Cloud Base',
    unit: 'm',
    minValue: 0,
    maxValue: 1000,
    value: 480,
    threshold: 700,
    warningAlertValue: 500,
    criticalAlertValue: 300,
    trendVisible: false
  }
}

export const renderRadialBargraphPage = (root: HTMLElement): void => {
  const defaults: PlaygroundState = {
    value: 72,
    minValue: 0,
    maxValue: 100,
    threshold: 80,
    preset: '',
    alertsEnabled: false,
    warningAlertValue: 80,
    criticalAlertValue: 95,
    title: 'Pressure',
    unit: 'psi',
    frameDesign: 'metal',
    backgroundColor: 'dark-gray',
    foregroundType: 'top-arc-glass',
    gaugeType: 'full-gap',
    valueColor: 'red',
    lcdColor: 'standard',
    lcdDecimals: 2,
    labelNumberFormat: 'standard',
    tickLabelOrientation: 'normal',
    fractionalScaleDecimals: 1,
    digitalFont: false,
    showFrame: true,
    showBackground: true,
    showForeground: true,
    showLcd: true,
    animateValue: true,
    ledVisible: false,
    userLedVisible: false,
    trendVisible: false,
    trendState: 'off',
    useSectionColors: false,
    useValueGradient: false
  }

  const controls: ControlDef[] = [
    {
      key: 'preset',
      label: 'Measurement Preset',
      description: 'Applies weather-specific defaults and example values when enabled.',
      type: 'select',
      options: measurementPresetOptions,
      documentation:
        'Includes temperature, humidity, pressure, wind, rain, solar, UV, and cloud-base.'
    },
    {
      key: 'minValue',
      label: 'Min Value',
      description: 'Lower bound for gauge range.',
      type: 'number',
      min: -999,
      max: 999,
      step: 1
    },
    {
      key: 'maxValue',
      label: 'Max Value',
      description: 'Upper bound for gauge range.',
      type: 'number',
      min: -999,
      max: 999,
      step: 1
    },
    {
      key: 'value',
      label: 'Value',
      description: 'Primary gauge value (constrained to Min/Max range).',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    },
    {
      key: 'threshold',
      label: 'Threshold',
      description: 'Warning threshold marker (constrained to Min/Max range).',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    },
    {
      key: 'alertsEnabled',
      label: 'Enable Alerts',
      description: 'Enable warning/critical alert-based tone changes.',
      type: 'checkbox'
    },
    {
      key: 'warningAlertValue',
      label: 'Warning Alert Value',
      description: 'Value where warning alert starts.',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    },
    {
      key: 'criticalAlertValue',
      label: 'Critical Alert Value',
      description: 'Value where critical alert starts.',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    },
    { key: 'title', label: 'Title', description: 'Displayed title text.', type: 'text' },
    { key: 'unit', label: 'Unit', description: 'Displayed unit text.', type: 'text' },
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
      key: 'foregroundType',
      label: 'Foreground',
      description: 'Glass overlay type.',
      type: 'select',
      options: foregroundTypeOptions
    },
    {
      key: 'gaugeType',
      label: 'Gauge Type',
      description: 'Arc geometry variant.',
      type: 'select',
      options: gaugeTypeOptions
    },
    {
      key: 'valueColor',
      label: 'Value Color',
      description: 'LED/pointer color family.',
      type: 'select',
      options: pointerColorOptions
    },
    {
      key: 'lcdColor',
      label: 'LCD Color',
      description: 'LCD panel palette.',
      type: 'select',
      options: lcdColorOptions
    },
    {
      key: 'lcdDecimals',
      label: 'LCD Decimals',
      description: 'Decimals shown in LCD readout.',
      type: 'number',
      min: 0,
      max: 6,
      step: 1
    },
    {
      key: 'labelNumberFormat',
      label: 'Label Format',
      description: 'Tick label number format.',
      type: 'select',
      options: ['standard', 'fractional', 'scientific'].map((value) => ({ value, label: value }))
    },
    {
      key: 'tickLabelOrientation',
      label: 'Tick Label Orientation',
      description: 'How labels orient around arc.',
      type: 'select',
      options: ['normal', 'horizontal', 'tangent'].map((value) => ({ value, label: value }))
    },
    {
      key: 'fractionalScaleDecimals',
      label: 'Fractional Decimals',
      description: 'Decimals used when label format is fractional.',
      type: 'number',
      min: 0,
      max: 4,
      step: 1
    },
    {
      key: 'digitalFont',
      label: 'Digital Font',
      description: 'Use digital LCD font.',
      type: 'checkbox'
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
      description: 'Animate value transitions when reading changes.',
      type: 'checkbox'
    },
    {
      key: 'ledVisible',
      label: 'Show Alert LED',
      description: 'Toggle threshold LED.',
      type: 'checkbox'
    },
    {
      key: 'userLedVisible',
      label: 'Show User LED',
      description: 'Toggle secondary LED indicator.',
      type: 'checkbox'
    },
    {
      key: 'trendVisible',
      label: 'Show Trend',
      description: 'Toggle trend indicator.',
      type: 'checkbox'
    },
    {
      key: 'trendState',
      label: 'Trend State',
      description: 'Current trend arrow state.',
      type: 'select',
      options: ['off', 'up', 'steady', 'down'].map((value) => ({ value, label: value }))
    },
    {
      key: 'useSectionColors',
      label: 'Use Section Colors',
      description: 'Colorize active segments based on threshold (overrides gradient).',
      type: 'checkbox'
    },
    {
      key: 'useValueGradient',
      label: 'Use Value Gradient',
      description: 'Blend bar colors from low to high range (disabled when section colors are on).',
      type: 'checkbox'
    }
  ]

  let previousPreset: PresetKey = ''

  renderPlaygroundPage(
    root,
    'Radial Bargraph Playground',
    'Adjust radial-bargraph settings live. Preset precedence: property > child > preset > default. Example: <code>&lt;wx-bargraph preset="rain-rate" gauge-max="20"&gt;&lt;/wx-bargraph&gt;</code>.',
    'wx-bargraph',
    controls,
    defaults,
    (state, controlDefs) => {
      const preset =
        typeof state.preset === 'string' && state.preset in radialBargraphPresetExamples
          ? (state.preset as PresetKey)
          : ''
      if (preset !== previousPreset) {
        const example = radialBargraphPresetExamples[preset]
        Object.assign(state, example)
        previousPreset = preset
      }

      const rawMin = asFiniteNumber(state.minValue, 0)
      const rawMax = asFiniteNumber(state.maxValue, 100)
      const minValue = Math.min(rawMin, rawMax)
      const maxValue = Math.max(rawMin, rawMax)

      state.minValue = minValue
      state.maxValue = maxValue
      state.value = clampNumber(asFiniteNumber(state.value, minValue), minValue, maxValue)
      state.threshold = clampNumber(asFiniteNumber(state.threshold, minValue), minValue, maxValue)
      state.warningAlertValue = clampNumber(
        asFiniteNumber(state.warningAlertValue, minValue),
        minValue,
        maxValue
      )
      state.criticalAlertValue = clampNumber(
        asFiniteNumber(state.criticalAlertValue, maxValue),
        minValue,
        maxValue
      )

      const warningAlertValue = asFiniteNumber(state.warningAlertValue, minValue)
      const criticalAlertValue = asFiniteNumber(state.criticalAlertValue, maxValue)
      state.warningAlertValue = Math.min(warningAlertValue, criticalAlertValue)
      state.criticalAlertValue = Math.max(warningAlertValue, criticalAlertValue)

      if (Boolean(state.useSectionColors) && Boolean(state.useValueGradient)) {
        state.useValueGradient = false
      }

      for (const key of ['value', 'threshold', 'warningAlertValue', 'criticalAlertValue']) {
        const control = controlDefs.find((entry) => entry.key === key)
        if (!control) {
          continue
        }
        control.min = minValue
        control.max = maxValue
      }
    }
  )
}
