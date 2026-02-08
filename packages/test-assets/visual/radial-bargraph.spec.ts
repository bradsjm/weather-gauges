import { expect, test } from '@playwright/test'

import { radialBargraphFixtures } from '../src/index'

for (const fixture of radialBargraphFixtures) {
  test(`radial bargraph fixture ${fixture.id}`, async ({ page }) => {
    const params = new URLSearchParams({
      view: 'visual',
      kind: fixture.kind,
      id: fixture.id,
      label: fixture.label,
      title: fixture.title,
      unit: fixture.unit,
      value: String(fixture.value),
      min: String(fixture.min ?? 0),
      max: String(fixture.max ?? 100),
      threshold: String(fixture.threshold ?? 70),
      size: String(fixture.size)
    })

    if (fixture.frameDesign) {
      params.set('frameDesign', fixture.frameDesign)
    }

    if (fixture.radialBackgroundColor) {
      params.set('radialBackgroundColor', fixture.radialBackgroundColor)
    }

    if (fixture.radialGaugeType) {
      params.set('radialGaugeType', fixture.radialGaugeType)
    }

    if (fixture.valueColor) {
      params.set('radialBargraphValueColor', fixture.valueColor)
    }

    if (fixture.foregroundType) {
      params.set('radialBargraphForegroundType', fixture.foregroundType)
    }

    if (fixture.lcdColor) {
      params.set('radialBargraphLcdColor', fixture.lcdColor)
    }

    if (fixture.tickLabelOrientation) {
      params.set('tickLabelOrientation', fixture.tickLabelOrientation)
    }

    if (fixture.labelNumberFormat) {
      params.set('labelNumberFormat', fixture.labelNumberFormat)
    }

    if (fixture.useSectionColors !== undefined) {
      params.set('useSectionColors', String(fixture.useSectionColors))
    }

    if (fixture.useValueGradient !== undefined) {
      params.set('useValueGradient', String(fixture.useValueGradient))
    }

    if (fixture.showLcd !== undefined) {
      params.set('showLcd', String(fixture.showLcd))
    }

    if (fixture.digitalFont !== undefined) {
      params.set('digitalFont', String(fixture.digitalFont))
    }

    if (fixture.ledVisible !== undefined) {
      params.set('ledVisible', String(fixture.ledVisible))
    }

    if (fixture.userLedVisible !== undefined) {
      params.set('userLedVisible', String(fixture.userLedVisible))
    }

    if (fixture.trendVisible !== undefined) {
      params.set('trendVisible', String(fixture.trendVisible))
    }

    if (fixture.trendState) {
      params.set('trendState', fixture.trendState)
    }

    if (fixture.tokenOverrides) {
      for (const [key, value] of Object.entries(fixture.tokenOverrides)) {
        if (value) {
          params.set(key, value)
        }
      }
    }

    await page.goto(`/?${params.toString()}`)

    const fixtureCard = page.getByTestId('radial-bargraph-fixture')
    await expect(fixtureCard).toBeVisible()
    await expect(fixtureCard).toHaveScreenshot(`${fixture.id}.png`, {
      animations: 'disabled'
    })
  })
}
