import type { CompassGaugeConfig } from '../compass/schema.js'
import type { RadialDrawContext } from '../radial/renderer.js'
import type { ThemePaint } from '../theme/tokens.js'
import { normalizeCompassHeadingForScale } from './compass-scales.js'
import { buildGaugeFont, configureGaugeTextLayout, drawGaugeText } from './gauge-text-primitives.js'

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

  configureGaugeTextLayout(context, {
    color: paint.textColor,
    align: 'center',
    baseline: 'middle'
  })

  if (config.text.title) {
    configureGaugeTextLayout(context, {
      font: buildGaugeFont(Math.max(12, Math.round(radius * 0.12)), paint.fontFamily, 600)
    })
    drawGaugeText(context, config.text.title, centerX, centerY + radius * 0.44)
  }

  configureGaugeTextLayout(context, {
    font: buildGaugeFont(Math.max(15, Math.round(radius * 0.16)), paint.fontFamily, 700)
  })
  const headingValue = normalizeCompassHeadingForScale(
    Math.round(heading),
    config.scale.degreeScaleHalf
  )
  drawGaugeText(context, `${headingValue}°`, centerX, centerY + radius * 0.3)

  if (config.text.unit) {
    configureGaugeTextLayout(context, {
      font: buildGaugeFont(Math.max(9, Math.round(radius * 0.075)), paint.fontFamily, 500)
    })
    drawGaugeText(context, config.text.unit, centerX, centerY + radius * 0.4)
  }
}
