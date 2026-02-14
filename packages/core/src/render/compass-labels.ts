import type { CompassGaugeConfig } from '../compass/schema.js'
import type { ThemePaint } from '../theme/tokens.js'
import { getGaugeBackgroundTextColor } from './gauge-color-palettes.js'
import { normalizeCompassHeadingForScale } from './compass-scales.js'
import { buildGaugeFont, configureGaugeTextLayout, drawGaugeText } from './gauge-text-primitives.js'
import { drawRadialLcd } from './radial-lcd.js'

export const drawCompassLabels = (
  context: CanvasRenderingContext2D,
  config: CompassGaugeConfig,
  paint: ThemePaint,
  heading: number,
  showHeadingReadout: boolean,
  centerX: number,
  imageWidth: number
): void => {
  if (!showHeadingReadout) {
    return
  }

  const headingValue = normalizeCompassHeadingForScale(
    Math.round(heading),
    config.scale.degreeScaleHalf
  )
  const textColor = getGaugeBackgroundTextColor(config.style.backgroundColor)

  configureGaugeTextLayout(context, {
    color: textColor,
    align: 'center',
    baseline: 'middle'
  })

  if (config.text.title) {
    configureGaugeTextLayout(context, {
      font: buildGaugeFont(Math.max(12, Math.round(imageWidth * 0.046728)), paint.fontFamily)
    })
    drawGaugeText(context, config.text.title, centerX, imageWidth * 0.3 + 3)
  }

  if (config.text.unit) {
    configureGaugeTextLayout(context, {
      font: buildGaugeFont(Math.max(12, Math.round(imageWidth * 0.046728)), paint.fontFamily)
    })
    drawGaugeText(context, config.text.unit, centerX, imageWidth * 0.38)
  }

  const canDrawLcd = typeof context.quadraticCurveTo === 'function'
  if (config.visibility.showLcd && canDrawLcd) {
    drawRadialLcd(
      context,
      config.style.lcdColor,
      config.style.digitalFont,
      0,
      headingValue,
      imageWidth,
      paint,
      {
        text: `${headingValue}°`,
        align: 'center'
      }
    )
    return
  }

  configureGaugeTextLayout(context, {
    font: buildGaugeFont(
      Math.max(12, Math.round(imageWidth * 0.046728)),
      config.style.digitalFont ? paint.fontFamilyLcd : paint.fontFamily
    )
  })
  drawGaugeText(context, `${headingValue}°`, centerX, imageWidth * 0.625)
}
