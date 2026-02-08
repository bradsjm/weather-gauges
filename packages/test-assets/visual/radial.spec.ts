import { expect, test } from '@playwright/test'

import { radialFixtures } from '../src/index'

for (const fixture of radialFixtures) {
  test(`radial fixture ${fixture.id}`, async ({ page }) => {
    const params = new URLSearchParams({
      view: 'visual',
      id: fixture.id,
      label: fixture.label,
      value: String(fixture.value),
      min: String(fixture.min),
      max: String(fixture.max)
    })

    await page.goto(`/?${params.toString()}`)

    const fixtureCard = page.getByTestId('radial-fixture')
    await expect(fixtureCard).toBeVisible()
    await expect(fixtureCard).toHaveScreenshot(`${fixture.id}.png`, {
      animations: 'disabled'
    })
  })
}
