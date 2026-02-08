import { expect, test } from '@playwright/test'

import { radialFixtures } from '../src/index'

for (const fixture of radialFixtures) {
  test(`radial fixture ${fixture.id}`, async ({ page }) => {
    const params = new URLSearchParams({
      view: 'visual',
      id: fixture.id,
      label: fixture.label,
      title: fixture.title,
      unit: fixture.unit,
      value: String(fixture.value),
      min: String(fixture.min),
      max: String(fixture.max),
      threshold: String(fixture.threshold)
    })

    if (fixture.tokenOverrides) {
      if (fixture.tokenOverrides.fontFamily) {
        params.set('fontFamily', fixture.tokenOverrides.fontFamily)
      }
      if (fixture.tokenOverrides.textColor) {
        params.set('textColor', fixture.tokenOverrides.textColor)
      }
      if (fixture.tokenOverrides.backgroundColor) {
        params.set('backgroundColor', fixture.tokenOverrides.backgroundColor)
      }
      if (fixture.tokenOverrides.frameColor) {
        params.set('frameColor', fixture.tokenOverrides.frameColor)
      }
      if (fixture.tokenOverrides.accentColor) {
        params.set('accentColor', fixture.tokenOverrides.accentColor)
      }
      if (fixture.tokenOverrides.warningColor) {
        params.set('warningColor', fixture.tokenOverrides.warningColor)
      }
      if (fixture.tokenOverrides.dangerColor) {
        params.set('dangerColor', fixture.tokenOverrides.dangerColor)
      }
    }

    await page.goto(`/?${params.toString()}`)

    const fixtureCard = page.getByTestId('radial-fixture')
    await expect(fixtureCard).toBeVisible()
    await expect(fixtureCard).toHaveScreenshot(`${fixture.id}.png`, {
      animations: 'disabled'
    })
  })
}
