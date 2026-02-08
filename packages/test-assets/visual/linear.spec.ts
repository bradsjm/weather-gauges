import { expect, test } from '@playwright/test'

import { linearFixtures } from '../src/index'

for (const fixture of linearFixtures) {
  test(`linear fixture ${fixture.id}`, async ({ page }) => {
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
      width: String(fixture.width),
      height: String(fixture.height)
    })

    if (fixture.tokenOverrides) {
      for (const [key, value] of Object.entries(fixture.tokenOverrides)) {
        if (value) {
          params.set(key, value)
        }
      }
    }

    await page.goto(`/?${params.toString()}`)

    const fixtureCard = page.getByTestId('linear-fixture')
    await expect(fixtureCard).toBeVisible()
    await expect(fixtureCard).toHaveScreenshot(`${fixture.id}.png`, {
      animations: 'disabled'
    })
  })
}
