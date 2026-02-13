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
  'DARK_GRAY',
  'SATIN_GRAY',
  'LIGHT_GRAY',
  'WHITE',
  'BLACK',
  'BEIGE',
  'BROWN',
  'RED',
  'GREEN',
  'BLUE',
  'ANTHRACITE',
  'MUD',
  'PUNCHED_SHEET',
  'CARBON',
  'STAINLESS',
  'BRUSHED_METAL',
  'BRUSHED_STAINLESS',
  'TURNED'
].map((value) => ({ value, label: value }))

export const pointerTypeOptions: SelectOption[] = [
  { value: 'type1', label: 'type1 - Classic compass needle' },
  { value: 'type2', label: 'type2 - Slim angular needle' },
  { value: 'type3', label: 'type3 - Thin bar needle' },
  { value: 'type4', label: 'type4 - Diamond spear needle' },
  { value: 'type5', label: 'type5 - Triangular split needle' },
  { value: 'type6', label: 'type6 - Forked center needle' },
  { value: 'type7', label: 'type7 - Simple triangular needle' },
  { value: 'type8', label: 'type8 - Curved classic needle' },
  { value: 'type9', label: 'type9 - Heavy metallic needle' },
  { value: 'type10', label: 'type10 - Teardrop bulb needle' },
  { value: 'type11', label: 'type11 - Curved tail needle' },
  { value: 'type12', label: 'type12 - Narrow spike needle' },
  { value: 'type13', label: 'type13 - Label-tip marker needle' },
  { value: 'type14', label: 'type14 - Metallic marker needle' },
  { value: 'type15', label: 'type15 - Ornate ring-base needle' },
  { value: 'type16', label: 'type16 - Ring-base bar-tail needle' }
]

export const pointerColorOptions: SelectOption[] = [
  'RED',
  'GREEN',
  'BLUE',
  'ORANGE',
  'YELLOW',
  'CYAN',
  'MAGENTA',
  'WHITE',
  'GRAY',
  'BLACK',
  'RAITH',
  'GREEN_LCD',
  'JUG_GREEN'
].map((value) => ({ value, label: value }))

export const foregroundTypeOptions: SelectOption[] = [
  { value: 'type1', label: 'type1 - Classic top highlight' },
  { value: 'type2', label: 'type2 - Wide dome highlight' },
  { value: 'type3', label: 'type3 - Deep arc highlight' },
  { value: 'type4', label: 'type4 - Lens + side flare' },
  { value: 'type5', label: 'type5 - Curved sweep highlight' }
]

export const gaugeTypeOptions: SelectOption[] = [
  { value: 'type1', label: 'type1 - Quarter arc (90 deg)' },
  { value: 'type2', label: 'type2 - Half arc (180 deg)' },
  { value: 'type3', label: 'type3 - Three-quarter arc (270 deg)' },
  { value: 'type4', label: 'type4 - Full arc with free area' }
]

export const radialGaugeTypeOptions: SelectOption[] = [
  ...gaugeTypeOptions,
  { value: 'type5', label: 'type5 - Radial vertical style' }
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
  'STANDARD',
  'STANDARD_GREEN',
  'BLUE',
  'ORANGE',
  'RED',
  'YELLOW',
  'WHITE',
  'GRAY',
  'BLACK'
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
