import { asFiniteNumber, clampNumber } from '../gauge-utils'
import {
  backgroundOptions,
  foregroundTypeOptions,
  frameOptions,
  knobStyleOptions,
  knobTypeOptions,
  pointerColorOptions,
  pointerTypeOptions
} from '../options'
import { renderPlaygroundPage } from '../playground'
import type { ControlDef, PlaygroundState } from '../types'

export const renderCompassPage = (root: HTMLElement): void => {
  const defaults: PlaygroundState = {
    heading: 125,
    title: 'Heading',
    unit: 'deg',
    frameDesign: 'metal',
    backgroundColor: 'DARK_GRAY',
    pointerType: 'type2',
    pointerColor: 'RED',
    knobType: 'standardKnob',
    knobStyle: 'silver',
    foregroundType: 'type1',
    degreeScale: false,
    degreeScaleHalf: false,
    roseVisible: true,
    rotateFace: false,
    animateValue: true,
    pointSymbolsVisible: true,
    showTickmarks: true,
    showHeadingReadout: true,
    alertsEnabled: false,
    warningAlertHeading: 90,
    criticalAlertHeading: 180,
    pointSymbolN: 'N',
    pointSymbolNE: 'NE',
    pointSymbolE: 'E',
    pointSymbolSE: 'SE',
    pointSymbolS: 'S',
    pointSymbolSW: 'SW',
    pointSymbolW: 'W',
    pointSymbolNW: 'NW'
  }

  const controls: ControlDef[] = [
    {
      key: 'heading',
      label: 'Heading',
      description: 'Current compass heading in degrees.',
      type: 'range',
      min: 0,
      max: 359,
      step: 1
    },
    {
      key: 'alertsEnabled',
      label: 'Enable Alerts',
      description: 'Enable warning/critical heading alerts that adjust pointer tone.',
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
    { key: 'title', label: 'Title', description: 'Displayed heading label.', type: 'text' },
    { key: 'unit', label: 'Unit', description: 'Displayed heading unit.', type: 'text' },
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
      key: 'knobType',
      label: 'Knob Type',
      description: 'Hub type used at center.',
      type: 'select',
      options: knobTypeOptions
    },
    {
      key: 'knobStyle',
      label: 'Knob Style',
      description: 'Hub surface finish.',
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
      key: 'degreeScale',
      label: 'Show Degree Scale',
      description: 'Switch to degree labels instead of cardinal-only emphasis.',
      type: 'checkbox'
    },
    {
      key: 'degreeScaleHalf',
      label: 'Half Heading Scale',
      description: 'Show degree labels as -180 to 180 instead of 0 to 360.',
      type: 'checkbox'
    },
    {
      key: 'pointSymbolsVisible',
      label: 'Show Point Symbols',
      description: 'Show N/NE/E... labels.',
      type: 'checkbox'
    },
    {
      key: 'showTickmarks',
      label: 'Show Tick Marks',
      description: 'Toggle compass tick mark lines while keeping labels.',
      type: 'checkbox'
    },
    {
      key: 'roseVisible',
      label: 'Show Rose',
      description: 'Toggle rose rays and inner ring.',
      type: 'checkbox'
    },
    {
      key: 'rotateFace',
      label: 'Rotate Face',
      description: 'Rotate face opposite heading instead of pointer-only movement.',
      type: 'checkbox'
    },
    {
      key: 'showHeadingReadout',
      label: 'Show Heading Readout',
      description: 'Show text readout under center.',
      type: 'checkbox'
    },
    {
      key: 'animateValue',
      label: 'Animate Value',
      description: 'Animate heading transitions when heading changes.',
      type: 'checkbox'
    },
    {
      key: 'pointSymbolN',
      label: 'North Symbol',
      description: 'Text used for north point marker.',
      type: 'text'
    },
    {
      key: 'pointSymbolNE',
      label: 'North-East Symbol',
      description: 'Text used for north-east marker.',
      type: 'text'
    },
    {
      key: 'pointSymbolE',
      label: 'East Symbol',
      description: 'Text used for east marker.',
      type: 'text'
    },
    {
      key: 'pointSymbolSE',
      label: 'South-East Symbol',
      description: 'Text used for south-east marker.',
      type: 'text'
    },
    {
      key: 'pointSymbolS',
      label: 'South Symbol',
      description: 'Text used for south marker.',
      type: 'text'
    },
    {
      key: 'pointSymbolSW',
      label: 'South-West Symbol',
      description: 'Text used for south-west marker.',
      type: 'text'
    },
    {
      key: 'pointSymbolW',
      label: 'West Symbol',
      description: 'Text used for west marker.',
      type: 'text'
    },
    {
      key: 'pointSymbolNW',
      label: 'North-West Symbol',
      description: 'Text used for north-west marker.',
      type: 'text'
    }
  ]

  renderPlaygroundPage(
    root,
    'Compass Playground',
    'Live tune compass styling and behavior. Use pointer, rose, and foreground controls to compare variants.',
    'steelseries-compass-v3',
    controls,
    defaults,
    (state) => {
      state.heading = clampNumber(asFiniteNumber(state.heading, 0), 0, 359)
      state.warningAlertHeading = clampNumber(asFiniteNumber(state.warningAlertHeading, 90), 0, 359)
      state.criticalAlertHeading = clampNumber(
        asFiniteNumber(state.criticalAlertHeading, 180),
        0,
        359
      )
    }
  )
}
