import type { CompassPointerColorName, CompassPointerType } from '../compass/schema.js'
import type { RadialDrawContext } from '../radial/renderer.js'
import type { GaugePointerPalette } from './gauge-color-palettes.js'
import { drawGaugePointer, resolveGaugePointerColor } from './gauge-pointer.js'

type PointerColor = Pick<GaugePointerPalette, 'light' | 'medium' | 'dark'>

export const resolveCompassPointerColor = (name: CompassPointerColorName): PointerColor => {
  return resolveGaugePointerColor(name)
}

export const drawCompassPointer = (
  context: RadialDrawContext,
  pointerType: CompassPointerType,
  pointerColor: PointerColor,
  imageWidth: number
): void => {
  drawGaugePointer({
    context,
    pointerType,
    pointerColor,
    imageWidth,
    family: 'compass'
  })
}
