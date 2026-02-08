import { expect, test } from '@playwright/test'

import { compassFixtures } from '../src/index'

for (const fixture of compassFixtures) {
  test(`compass fixture ${fixture.id}`, async ({ page }) => {
    const params = new URLSearchParams({
      view: 'visual',
      kind: fixture.kind,
      id: fixture.id,
      label: fixture.label,
      title: fixture.title,
      unit: fixture.unit,
      heading: String(fixture.heading),
      size: String(fixture.size)
    })

    if (fixture.tokenOverrides) {
      for (const [key, value] of Object.entries(fixture.tokenOverrides)) {
        if (value) {
          params.set(key, value)
        }
      }
    }

    await page.goto(`/?${params.toString()}`)

    const fixtureCard = page.getByTestId('compass-fixture')
    await expect(fixtureCard).toBeVisible()
    await expect(fixtureCard).toHaveScreenshot(`${fixture.id}.png`, {
      animations: 'disabled'
    })
  })
}
