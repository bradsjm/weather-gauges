import type { SelectOption } from './types'

export const frameOptions: SelectOption[] = [
  'blackMetal',
  'metal',
  'shinyMetal',
  'brass',
  'steel',
  'chrome',
  'gold',
  'anthracite',
  'tiltedGray',
  'tiltedBlack',
  'glossyMetal'
].map((value) => ({ value, label: value }))

export const backgroundOptions: SelectOption[] = [
  'dark-gray',
  'satin-gray',
  'light-gray',
  'white',
  'black',
  'beige',
  'brown',
  'red',
  'green',
  'blue',
  'anthracite',
  'mud',
  'punched-sheet',
  'carbon',
  'stainless',
  'brushed-metal',
  'brushed-stainless',
  'turned'
].map((value) => ({ value, label: value }))

export const pointerTypeOptions: SelectOption[] = [
  { value: 'classic-compass-needle', label: 'Classic compass needle' },
  { value: 'slim-angular-needle', label: 'Slim angular needle' },
  { value: 'thin-bar-needle', label: 'Thin bar needle' },
  { value: 'diamond-spear-needle', label: 'Diamond spear needle' },
  { value: 'triangular-split-needle', label: 'Triangular split needle' },
  { value: 'forked-center-needle', label: 'Forked center needle' },
  { value: 'simple-triangular-needle', label: 'Simple triangular needle' },
  { value: 'curved-classic-needle', label: 'Curved classic needle' },
  { value: 'heavy-metallic-needle', label: 'Heavy metallic needle' },
  { value: 'teardrop-bulb-needle', label: 'Teardrop bulb needle' },
  { value: 'curved-tail-needle', label: 'Curved tail needle' },
  { value: 'narrow-spike-needle', label: 'Narrow spike needle' },
  { value: 'label-tip-marker-needle', label: 'Label-tip marker needle' },
  { value: 'metallic-marker-needle', label: 'Metallic marker needle' },
  { value: 'ornate-ring-base-needle', label: 'Ornate ring-base needle' },
  { value: 'ring-base-bar-tail-needle', label: 'Ring-base bar-tail needle' }
]

export const pointerColorOptions: SelectOption[] = [
  'red',
  'green',
  'blue',
  'orange',
  'yellow',
  'cyan',
  'magenta',
  'white',
  'gray',
  'black',
  'raith',
  'green-lcd',
  'jug-green'
].map((value) => ({ value, label: value }))

export const foregroundTypeOptions: SelectOption[] = [
  { value: 'top-arc-glass', label: 'Top arc glass' },
  { value: 'side-reflection-glass', label: 'Side reflection glass' },
  { value: 'dome-glass', label: 'Dome glass' },
  { value: 'center-glow-glass', label: 'Center glow glass' },
  { value: 'sweep-glass', label: 'Sweep glass' }
]

export const gaugeTypeOptions: SelectOption[] = [
  { value: 'half', label: 'Half arc (180 deg)' },
  { value: 'three-quarter', label: 'Three-quarter arc (270 deg)' },
  { value: 'full-gap', label: 'Full arc with free area' }
]

export const radialGaugeTypeOptions: SelectOption[] = [
  ...gaugeTypeOptions,
  { value: 'quarter-offset', label: 'Quarter arc (orientation-aware)' }
]

export const orientationOptions: SelectOption[] = [
  { value: 'north', label: 'north - Arc at top' },
  { value: 'east', label: 'east - Arc at right' },
  { value: 'west', label: 'west - Arc at left' }
]

export const knobTypeOptions: SelectOption[] = ['standardKnob', 'metalKnob'].map((value) => ({
  value,
  label: value
}))

export const knobStyleOptions: SelectOption[] = ['black', 'brass', 'silver'].map((value) => ({
  value,
  label: value
}))

export const lcdColorOptions: SelectOption[] = [
  'standard',
  'standard-green',
  'blue',
  'orange',
  'red',
  'yellow',
  'white',
  'gray',
  'black'
].map((value) => ({ value, label: value }))

export const minMaxAreaColor = 'rgba(212,132,134,0.6)'

export const measurementPresetOptions: SelectOption[] = [
  { value: '', label: 'none' },
  { value: 'temperature', label: 'temperature' },
  { value: 'humidity', label: 'humidity' },
  { value: 'pressure', label: 'pressure' },
  { value: 'wind-speed', label: 'wind-speed' },
  { value: 'rainfall', label: 'rainfall' },
  { value: 'rain-rate', label: 'rain-rate' },
  { value: 'solar', label: 'solar' },
  { value: 'uv-index', label: 'uv-index' },
  { value: 'cloud-base', label: 'cloud-base' }
]

export const windDirectionPresetOptions: SelectOption[] = [
  { value: '', label: 'none' },
  { value: 'wind-direction', label: 'wind-direction' }
]

export const temperatureSections = [
  { from: -200, to: -30, color: 'rgba(195, 92, 211, 0.4)' },
  { from: -30, to: -25, color: 'rgba(139, 74, 197, 0.4)' },
  { from: -25, to: -15, color: 'rgba(98, 65, 188, 0.4)' },
  { from: -15, to: -5, color: 'rgba(62, 66, 185, 0.4)' },
  { from: -5, to: 5, color: 'rgba(42, 84, 194, 0.4)' },
  { from: 5, to: 15, color: 'rgba(25, 112, 210, 0.4)' },
  { from: 15, to: 25, color: 'rgba(9, 150, 224, 0.4)' },
  { from: 25, to: 32, color: 'rgba(2, 170, 209, 0.4)' },
  { from: 32, to: 40, color: 'rgba(0, 162, 145, 0.4)' },
  { from: 40, to: 50, color: 'rgba(0, 158, 122, 0.4)' },
  { from: 50, to: 60, color: 'rgba(54, 177, 56, 0.4)' },
  { from: 60, to: 70, color: 'rgba(111, 202, 56, 0.4)' },
  { from: 70, to: 80, color: 'rgba(248, 233, 45, 0.4)' },
  { from: 80, to: 90, color: 'rgba(253, 142, 42, 0.4)' },
  { from: 90, to: 110, color: 'rgba(236, 45, 45, 0.4)' },
  { from: 110, to: 200, color: 'rgba(245, 109, 205, 0.4)' }
]
