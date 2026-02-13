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
    backgroundColor: 'DARK_GRAY',
    foregroundType: 'type1',
    gaugeType: 'type4',
    valueColor: 'RED',
    lcdColor: 'STANDARD',
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
      description: 'Applies temperature, humidity, or pressure defaults when enabled.',
      type: 'select',
      options: measurementPresetOptions,
      documentation: 'Set to none to use manual min/max and section settings only.'
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

  renderPlaygroundPage(
    root,
    'Radial Bargraph Playground',
    'Adjust radial-bargraph settings live on a single larger gauge. Each control includes behavior notes and defaults.',
    'steelseries-radial-bargraph-v3',
    controls,
    defaults,
    (state, controlDefs) => {
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
