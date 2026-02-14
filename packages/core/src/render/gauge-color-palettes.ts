import type { CompassBackgroundColorName, CompassPointerColorName } from '../compass/schema.js'

export type Rgb = readonly [number, number, number]

export type GaugeBackgroundPalette = {
  gradientStart: Rgb
  gradientFraction: Rgb
  gradientStop: Rgb
  labelColor: Rgb
  symbolColor: Rgb
}

export type GaugePointerPalette = {
  light: Rgb
  medium: Rgb
  dark: Rgb
  veryDark: Rgb
}

export const rgbTupleToCss = (value: Rgb): string => `rgb(${value[0]}, ${value[1]}, ${value[2]})`

const GAUGE_BACKGROUND_COLORS: Record<CompassBackgroundColorName, GaugeBackgroundPalette> = {
  'dark-gray': {
    gradientStart: [0, 0, 0],
    gradientFraction: [51, 51, 51],
    gradientStop: [153, 153, 153],
    labelColor: [255, 255, 255],
    symbolColor: [180, 180, 180]
  },
  'satin-gray': {
    gradientStart: [45, 57, 57],
    gradientFraction: [45, 57, 57],
    gradientStop: [45, 57, 57],
    labelColor: [167, 184, 180],
    symbolColor: [137, 154, 150]
  },
  'light-gray': {
    gradientStart: [130, 130, 130],
    gradientFraction: [181, 181, 181],
    gradientStop: [253, 253, 253],
    labelColor: [0, 0, 0],
    symbolColor: [80, 80, 80]
  },
  white: {
    gradientStart: [255, 255, 255],
    gradientFraction: [255, 255, 255],
    gradientStop: [255, 255, 255],
    labelColor: [0, 0, 0],
    symbolColor: [80, 80, 80]
  },
  black: {
    gradientStart: [0, 0, 0],
    gradientFraction: [0, 0, 0],
    gradientStop: [0, 0, 0],
    labelColor: [255, 255, 255],
    symbolColor: [150, 150, 150]
  },
  beige: {
    gradientStart: [178, 172, 150],
    gradientFraction: [204, 205, 184],
    gradientStop: [231, 231, 214],
    labelColor: [0, 0, 0],
    symbolColor: [80, 80, 80]
  },
  brown: {
    gradientStart: [245, 225, 193],
    gradientFraction: [245, 225, 193],
    gradientStop: [255, 250, 240],
    labelColor: [109, 73, 47],
    symbolColor: [89, 53, 27]
  },
  red: {
    gradientStart: [198, 93, 95],
    gradientFraction: [212, 132, 134],
    gradientStop: [242, 218, 218],
    labelColor: [0, 0, 0],
    symbolColor: [90, 0, 0]
  },
  green: {
    gradientStart: [65, 120, 40],
    gradientFraction: [129, 171, 95],
    gradientStop: [218, 237, 202],
    labelColor: [0, 0, 0],
    symbolColor: [0, 90, 0]
  },
  blue: {
    gradientStart: [45, 83, 122],
    gradientFraction: [115, 144, 170],
    gradientStop: [227, 234, 238],
    labelColor: [0, 0, 0],
    symbolColor: [0, 0, 90]
  },
  anthracite: {
    gradientStart: [50, 50, 54],
    gradientFraction: [47, 47, 51],
    gradientStop: [69, 69, 74],
    labelColor: [250, 250, 250],
    symbolColor: [180, 180, 180]
  },
  mud: {
    gradientStart: [80, 86, 82],
    gradientFraction: [70, 76, 72],
    gradientStop: [57, 62, 58],
    labelColor: [255, 255, 240],
    symbolColor: [225, 225, 210]
  },
  'punched-sheet': {
    gradientStart: [50, 50, 54],
    gradientFraction: [47, 47, 51],
    gradientStop: [69, 69, 74],
    labelColor: [255, 255, 255],
    symbolColor: [180, 180, 180]
  },
  carbon: {
    gradientStart: [50, 50, 54],
    gradientFraction: [47, 47, 51],
    gradientStop: [69, 69, 74],
    labelColor: [255, 255, 255],
    symbolColor: [180, 180, 180]
  },
  stainless: {
    gradientStart: [130, 130, 130],
    gradientFraction: [181, 181, 181],
    gradientStop: [253, 253, 253],
    labelColor: [0, 0, 0],
    symbolColor: [80, 80, 80]
  },
  'brushed-metal': {
    gradientStart: [50, 50, 54],
    gradientFraction: [47, 47, 51],
    gradientStop: [69, 69, 74],
    labelColor: [0, 0, 0],
    symbolColor: [80, 80, 80]
  },
  'brushed-stainless': {
    gradientStart: [50, 50, 54],
    gradientFraction: [47, 47, 51],
    gradientStop: [110, 110, 112],
    labelColor: [0, 0, 0],
    symbolColor: [80, 80, 80]
  },
  turned: {
    gradientStart: [130, 130, 130],
    gradientFraction: [181, 181, 181],
    gradientStop: [253, 253, 253],
    labelColor: [0, 0, 0],
    symbolColor: [80, 80, 80]
  }
}

const GAUGE_POINTER_COLORS: Record<CompassPointerColorName, GaugePointerPalette> = {
  red: { dark: [82, 0, 0], medium: [213, 0, 25], light: [255, 171, 173], veryDark: [82, 0, 0] },
  green: {
    dark: [8, 54, 4],
    medium: [15, 148, 0],
    light: [190, 231, 141],
    veryDark: [8, 54, 4]
  },
  blue: {
    dark: [0, 11, 68],
    medium: [0, 108, 201],
    light: [122, 200, 255],
    veryDark: [0, 11, 68]
  },
  orange: {
    dark: [118, 83, 30],
    medium: [240, 117, 0],
    light: [255, 255, 128],
    veryDark: [118, 83, 30]
  },
  yellow: {
    dark: [41, 41, 0],
    medium: [177, 165, 0],
    light: [255, 250, 153],
    veryDark: [41, 41, 0]
  },
  cyan: {
    dark: [15, 109, 109],
    medium: [0, 144, 191],
    light: [153, 223, 249],
    veryDark: [15, 109, 109]
  },
  magenta: {
    dark: [98, 0, 114],
    medium: [191, 36, 107],
    light: [255, 172, 210],
    veryDark: [98, 0, 114]
  },
  white: {
    dark: [210, 210, 210],
    medium: [235, 235, 235],
    light: [255, 255, 255],
    veryDark: [180, 180, 180]
  },
  gray: {
    dark: [25, 25, 25],
    medium: [76, 76, 76],
    light: [204, 204, 204],
    veryDark: [10, 10, 10]
  },
  black: { dark: [0, 0, 0], medium: [10, 10, 10], light: [20, 20, 20], veryDark: [0, 0, 0] },
  raith: {
    dark: [0, 32, 65],
    medium: [0, 106, 172],
    light: [148, 203, 242],
    veryDark: [0, 16, 32]
  },
  'green-lcd': {
    dark: [0, 55, 45],
    medium: [0, 185, 165],
    light: [153, 255, 227],
    veryDark: [0, 32, 24]
  },
  'jug-green': {
    dark: [0, 56, 0],
    medium: [50, 161, 0],
    light: [190, 231, 141],
    veryDark: [0, 34, 0]
  }
}

export const getGaugeBackgroundPalette = (
  name: CompassBackgroundColorName
): GaugeBackgroundPalette => {
  return GAUGE_BACKGROUND_COLORS[name]
}

export const getGaugeBackgroundTextColor = (name: CompassBackgroundColorName): string => {
  return rgbTupleToCss(getGaugeBackgroundPalette(name).labelColor)
}

export const resolveGaugePointerPalette = (name: CompassPointerColorName): GaugePointerPalette => {
  return GAUGE_POINTER_COLORS[name]
}
