import type { CompassGaugeConfig } from '../compass/schema.js'
import type { RadialDrawContext } from '../radial/renderer.js'
import type { ThemePaint } from '../theme/tokens.js'

export const drawCompassLabels = (
  context: RadialDrawContext,
  config: CompassGaugeConfig,
  paint: ThemePaint,
  heading: number,
  showHeadingReadout: boolean,
  centerX: number,
  centerY: number,
  radius: number
): void => {
  if (!showHeadingReadout) {
    return
  }

  context.fillStyle = paint.textColor
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  if (config.text.title) {
    context.font = `600 ${Math.max(12, Math.round(radius * 0.12))}px ${paint.fontFamily}`
    context.fillText(config.text.title, centerX, centerY + radius * 0.44)
  }

  context.font = `700 ${Math.max(15, Math.round(radius * 0.16))}px ${paint.fontFamily}`
  context.fillText(`${Math.round(heading)}°`, centerX, centerY + radius * 0.3)

  if (config.text.unit) {
    context.font = `500 ${Math.max(9, Math.round(radius * 0.075))}px ${paint.fontFamily}`
    context.fillText(config.text.unit, centerX, centerY + radius * 0.4)
  }
}
