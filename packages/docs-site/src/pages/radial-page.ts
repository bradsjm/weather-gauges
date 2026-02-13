import { asFiniteNumber, clampNumber } from '../gauge-utils'
import {
  backgroundOptions,
  foregroundTypeOptions,
  frameOptions,
  minMaxAreaColor,
  orientationOptions,
  pointerColorOptions,
  pointerTypeOptions,
  radialGaugeTypeOptions,
  temperatureSections
} from '../options'
import { renderPlaygroundPage } from '../playground'
import type { ControlDef, PlaygroundState } from '../types'

export const renderRadialPage = (root: HTMLElement): void => {
  const defaults: PlaygroundState = {
    value: 45.1,
    minValue: 0,
    maxValue: 100,
    threshold: 72,
    showThreshold: false,
    alertsEnabled: false,
    warningAlertValue: 72,
    criticalAlertValue: 88,
    title: 'Temperature',
    unit: '°F',
    frameDesign: 'tiltedGray',
    backgroundColor: 'BEIGE',
    foregroundType: 'type1',
    gaugeType: 'type4',
    orientation: 'north',
    pointerType: 'type8',
    pointerColor: 'RED',
    majorTickCount: 11,
    minorTicksPerMajor: 5,
    startAngle: (-3 * Math.PI) / 4,
    endAngle: (3 * Math.PI) / 4,
    showFrame: true,
    showBackground: true,
    showForeground: true,
    showLcd: true,
    animateValue: false,
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
      label: 'Type5 Orientation',
      description: 'Orientation for gauge type5 (ignored by type1-type4).',
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

  renderPlaygroundPage(
    root,
    'Radial Gauge Playground',
    'Adjust radial-gauge settings live, including new type5 radial-vertical orientation options, pointer style, threshold, and measured min/max markers.',
    'steelseries-radial-v3',
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
