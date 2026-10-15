import { test, expect } from '@playwright/test'
import { createJiti } from 'jiti'
import { encode } from './kingdom-progression-fixture.mjs'
const j = createJiti(import.meta.url)
const { newKingdom, ECONOMY_BUILDINGS } = await j.import(
  '../../src/apps/gry/games/little-kingdom/engine.ts',
)
const key = 'zgrana:gry:male-krolestwo:v11',
  previous = 'zgrana:gry:male-krolestwo:v9'
for (const width of [360, 1440])
  test(`full catalog stays available across turns and v9 migration ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const state = newKingdom(42, 1)
    state.resources = { wood: 100, stone: 100, food: 80, gold: 80 }
    const raw = encode(state, 9)
    await page.route('**/*googletagmanager.com/**', (r) => r.abort())
    await page.addInitScript(
      ({ raw, previous }) => {
        localStorage.setItem('josefine:cookie-notice:dismissed:gry', '1')
        if (!sessionStorage.getItem('catalog-fixture')) {
          localStorage.setItem(previous, raw)
          sessionStorage.setItem('catalog-fixture', '1')
        }
      },
      { raw, previous },
    )
    await page.goto('/gry/male-krolestwo')
    const catalog = page.locator('[data-building-card]')
    await expect(catalog).toHaveCount(ECONOMY_BUILDINGS.length)
    // Neither forester nor market belonged to this save's former three cards.
    for (const [kind, plot] of [
      ['forester', '0,1'],
      ['market', '1,1'],
    ]) {
      await page.locator(`[data-building-card="${kind}"]`).click()
      await page.locator(`[data-tile="${plot}"]`).click()
      await expect(page.getByRole('button', { name: 'Zatwierdź turę' })).toBeEnabled()
      await page.getByRole('button', { name: 'Zatwierdź turę' }).click()
      await expect(catalog).toHaveCount(ECONOMY_BUILDINGS.length)
    }
    await page.reload()
    await expect(catalog).toHaveCount(ECONOMY_BUILDINGS.length)
    await expect(page.getByTestId('kingdom-turn')).toHaveText('3')
    const restored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).state, key)
    expect(restored).not.toHaveProperty('offer')
    expect(restored).not.toHaveProperty('rng')
    expect(await page.evaluate((k) => localStorage.getItem(k), previous)).toBe(raw)
    await page.getByRole('button', { name: 'Obrona', exact: true }).click()
    await expect(catalog).toHaveCount(0)
    await expect(page.locator('.offer-panel')).toContainText(
      'Obrona odblokuje się na randze Wioska',
    )
    await page.getByRole('button', { name: 'Gospodarka', exact: true }).click()
    await expect(catalog).toHaveCount(ECONOMY_BUILDINGS.length)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy()
  })
