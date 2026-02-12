import type { CompassPointerColorName, CompassPointerType } from '../compass/schema.js'
import type { GaugePointerPalette } from './gauge-color-palettes.js'
import { drawGaugePointer, gaugePointerFamily, resolveGaugePointerColor } from './gauge-pointer.js'

type PointerColor = GaugePointerPalette

export const resolveCompassPointerColor = (name: CompassPointerColorName): PointerColor => {
  return resolveGaugePointerColor(name)
}

export const drawCompassPointer = (
  context: CanvasRenderingContext2D,
  pointerType: CompassPointerType,
  pointerColor: PointerColor,
  imageWidth: number
): void => {
  drawGaugePointer({
    context,
    pointerType,
    pointerColor,
    imageWidth,
    family: gaugePointerFamily.compass
  })
}
