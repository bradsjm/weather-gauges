import { asFiniteNumber, clampNumber } from '../gauge-utils'
import {
  backgroundOptions,
  foregroundTypeOptions,
  frameOptions,
  measurementPresetOptions,
  minMaxAreaColor,
  orientationOptions,
  pointerColorOptions,
  pointerTypeOptions,
  radialGaugeTypeOptions,
  temperatureSections
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

const radialPresetExamples: Record<PresetKey, Partial<PlaygroundState>> = {
  '': {
    title: 'Temperature',
    unit: '°F',
    minValue: 0,
    maxValue: 100,
    value: 45,
    threshold: 72,
    warningAlertValue: 72,
    criticalAlertValue: 88,
    trendVisible: true,
    segments: temperatureSections
  },
  temperature: {
    title: 'Temperature',
    unit: '°C',
    minValue: -20,
    maxValue: 40,
    value: 18,
    threshold: 30,
    warningAlertValue: 30,
    criticalAlertValue: 35,
    trendVisible: true,
    segments: []
  },
  humidity: {
    title: 'Humidity',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    value: 62,
    threshold: 80,
    warningAlertValue: 70,
    criticalAlertValue: 85,
    trendVisible: false,
    segments: []
  },
  pressure: {
    title: 'Pressure',
    unit: 'hPa',
    minValue: 990,
    maxValue: 1030,
    value: 1013,
    threshold: 1022,
    warningAlertValue: 1018,
    criticalAlertValue: 1025,
    trendVisible: true,
    segments: []
  },
  'wind-speed': {
    title: 'Wind Speed',
    unit: 'km/h',
    minValue: 0,
    maxValue: 30,
    value: 14,
    threshold: 20,
    warningAlertValue: 18,
    criticalAlertValue: 24,
    trendVisible: true,
    segments: []
  },
  rainfall: {
    title: 'Rainfall',
    unit: 'mm',
    minValue: 0,
    maxValue: 10,
    value: 2.4,
    threshold: 6,
    warningAlertValue: 5,
    criticalAlertValue: 8,
    trendVisible: false,
    segments: []
  },
  'rain-rate': {
    title: 'Rain Rate',
    unit: 'mm/h',
    minValue: 0,
    maxValue: 10,
    value: 3.1,
    threshold: 6,
    warningAlertValue: 5,
    criticalAlertValue: 8,
    trendVisible: false,
    segments: []
  },
  solar: {
    title: 'Solar',
    unit: 'W/m²',
    minValue: 0,
    maxValue: 1000,
    value: 640,
    threshold: 800,
    warningAlertValue: 700,
    criticalAlertValue: 900,
    trendVisible: false,
    segments: []
  },
  'uv-index': {
    title: 'UV Index',
    unit: '',
    minValue: 0,
    maxValue: 10,
    value: 6,
    threshold: 7,
    warningAlertValue: 6,
    criticalAlertValue: 8,
    trendVisible: false,
    segments: []
  },
  'cloud-base': {
    title: 'Cloud Base',
    unit: 'm',
    minValue: 0,
    maxValue: 1000,
    value: 420,
    threshold: 700,
    warningAlertValue: 500,
    criticalAlertValue: 300,
    trendVisible: false,
    segments: []
  }
}

export const renderRadialPage = (root: HTMLElement): void => {
  const defaults: PlaygroundState = {
    value: 45.1,
    minValue: 0,
    maxValue: 100,
    threshold: 72,
    preset: '',
    showThreshold: false,
    alertsEnabled: false,
    warningAlertValue: 72,
    criticalAlertValue: 88,
    title: 'Temperature',
    unit: '°F',
    frameDesign: 'tiltedGray',
    backgroundColor: 'beige',
    foregroundType: 'top-arc-glass',
    gaugeType: 'full-gap',
    orientation: 'north',
    pointerType: 'curved-classic-needle',
    pointerColor: 'red',
    majorTickCount: 11,
    minorTicksPerMajor: 5,
    startAngle: (-3 * Math.PI) / 4,
    endAngle: (3 * Math.PI) / 4,
    showFrame: true,
    showBackground: true,
    showForeground: true,
    showLcd: true,
    animateValue: true,
    ledVisible: false,
    userLedVisible: true,
    trendVisible: true,
    trendState: 'down',
    minMeasuredValueVisible: false,
    maxMeasuredValueVisible: false,
    minMeasuredValue: 30,
    maxMeasuredValue: 76,
    segments: temperatureSections,
    areas: [{ from: 30, to: 76, color: minMaxAreaColor }]
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
      key: 'showThreshold',
      label: 'Show Threshold',
      description: 'Toggle threshold marker visibility.',
      type: 'checkbox'
    },
    {
      key: 'threshold',
      label: 'Threshold',
      description: 'Threshold marker value.',
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
      options: radialGaugeTypeOptions
    },
    {
      key: 'orientation',
      label: 'Quarter-Offset Orientation',
      description: 'Orientation for gauge type quarter-offset (ignored by other gauge types).',
      type: 'select',
      options: orientationOptions
    },
    {
      key: 'pointerType',
      label: 'Pointer Type',
      description: 'Needle geometry style.',
      type: 'select',
      options: pointerTypeOptions
    },
    {
      key: 'pointerColor',
      label: 'Pointer Color',
      description: 'Needle color family.',
      type: 'select',
      options: pointerColorOptions
    },
    {
      key: 'majorTickCount',
      label: 'Major Tick Count',
      description: 'Number of major ticks on the scale.',
      type: 'number',
      min: 2,
      max: 20,
      step: 1
    },
    {
      key: 'minorTicksPerMajor',
      label: 'Minor Ticks Per Major',
      description: 'Minor tick count between major ticks.',
      type: 'number',
      min: 0,
      max: 10,
      step: 1
    },
    {
      key: 'startAngle',
      label: 'Start Angle (rad)',
      description: 'Scale arc start angle in radians.',
      type: 'number',
      min: -6.3,
      max: 6.3,
      step: 0.1
    },
    {
      key: 'endAngle',
      label: 'End Angle (rad)',
      description: 'Scale arc end angle in radians.',
      type: 'number',
      min: -6.3,
      max: 6.3,
      step: 0.1
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
      description: 'Toggle alert LED visibility.',
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
      options: ['up', 'steady', 'down'].map((value) => ({ value, label: value }))
    },
    {
      key: 'minMeasuredValueVisible',
      label: 'Show Min Marker',
      description: 'Toggle minimum measured marker.',
      type: 'checkbox'
    },
    {
      key: 'minMeasuredValue',
      label: 'Min Measured Value',
      description: 'Position for minimum measured marker.',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    },
    {
      key: 'maxMeasuredValueVisible',
      label: 'Show Max Marker',
      description: 'Toggle maximum measured marker.',
      type: 'checkbox'
    },
    {
      key: 'maxMeasuredValue',
      label: 'Max Measured Value',
      description: 'Position for maximum measured marker.',
      type: 'range',
      min: 0,
      max: 100,
      step: 1
    }
  ]

  let previousPreset: PresetKey = ''

  renderPlaygroundPage(
    root,
    'Radial Gauge Playground',
    'Adjust radial-gauge settings live. Preset precedence: property > child > preset > default. Example: <code>&lt;wx-gauge preset="temperature" gauge-min="-30"&gt;&lt;/wx-gauge&gt;</code>.',
    'wx-gauge',
    controls,
    defaults,
    (state, controlDefs) => {
      const preset =
        typeof state.preset === 'string' && state.preset in radialPresetExamples
          ? (state.preset as PresetKey)
          : ''
      if (preset !== previousPreset) {
        const example = radialPresetExamples[preset]
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
      state.minMeasuredValue = clampNumber(
        asFiniteNumber(state.minMeasuredValue, minValue),
        minValue,
        maxValue
      )
      state.maxMeasuredValue = clampNumber(
        asFiniteNumber(state.maxMeasuredValue, maxValue),
        minValue,
        maxValue
      )
      const minMeasuredValue = asFiniteNumber(state.minMeasuredValue, minValue)
      const maxMeasuredValue = asFiniteNumber(state.maxMeasuredValue, maxValue)
      const measuredLow = Math.min(minMeasuredValue, maxMeasuredValue)
      const measuredHigh = Math.max(minMeasuredValue, maxMeasuredValue)
      state.minMeasuredValue = measuredLow
      state.maxMeasuredValue = measuredHigh
      state.areas = [{ from: measuredLow, to: measuredHigh, color: minMaxAreaColor }]

      const warningAlertValue = asFiniteNumber(state.warningAlertValue, minValue)
      const criticalAlertValue = asFiniteNumber(state.criticalAlertValue, maxValue)
      state.warningAlertValue = Math.min(warningAlertValue, criticalAlertValue)
      state.criticalAlertValue = Math.max(warningAlertValue, criticalAlertValue)

      const startAngle = asFiniteNumber(state.startAngle, (-3 * Math.PI) / 4)
      const endAngle = asFiniteNumber(state.endAngle, (3 * Math.PI) / 4)
      if (Math.abs(endAngle - startAngle) < 0.001) {
        state.endAngle = startAngle + 0.1
      }

      state.majorTickCount = Math.round(clampNumber(asFiniteNumber(state.majorTickCount, 9), 2, 20))
      state.minorTicksPerMajor = Math.round(
        clampNumber(asFiniteNumber(state.minorTicksPerMajor, 4), 0, 10)
      )

      for (const key of [
        'value',
        'threshold',
        'warningAlertValue',
        'criticalAlertValue',
        'minMeasuredValue',
        'maxMeasuredValue'
      ]) {
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
